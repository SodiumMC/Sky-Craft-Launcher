import { app, BrowserWindow, dialog, ipcMain, Menu, screen, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import AdmZip from 'adm-zip'
import os from 'node:os'
import https from 'node:https'
import { Store, listVersions } from './core/config'
import { clearJavaCache, detectJavas } from './core/java'
import { fetchFabricLoaders, fetchRemoteVersions, resolveRemoteVersion } from './core/manifest'
import { installFabric, installQuilt, installVersion } from './core/installer'
import { fetchForgeVersions, fetchNeoForgeVersions, installForge, installNeoForge } from './core/forge'
import { readServers, writeServers } from './core/servers'
import { findModrinthInstance, readModrinthInstances } from './core/modrinth'
import { importMrpack } from './core/modpack'
import { downloadJre, findBundledJava } from './core/javaDownload'
import { analyzeCrash } from './core/crashAnalyzer'
import { exportBugReport, latestLogFromDisk, submitBugReport, systemInfo } from './core/bugReport'
import { installContentFile, installMod, searchMods, searchProjects } from './core/mods'
import { DEFAULT_MS_CLIENT_ID, DEFAULT_UPDATE_URL } from '../shared/constants'
import {
  ensureFreshAccount,
  ensureFreshLive,
  exchangeLiveCode,
  LIVE_AUTH_URL,
  LIVE_REDIRECT,
  loginWithMsa,
  loginWithTicket,
  pollDeviceCode,
  startDeviceCode
} from './core/microsoft'
import { buildClasspath, launchGame } from './core/launcher'
import { DEFAULT_FEATURES, resolveVersion } from './core/version'
import { LogLine, RunningState } from '../shared/types'
import { ensureDir, exists, isAbortError, offlineUuid } from './core/util'

const isDev = !app.isPackaged && Boolean(process.env.VITE_DEV_SERVER_URL)

app.setName('SCL')
if (process.platform === 'darwin' && !app.isPackaged) {
  const devIcon = path.join(__dirname, '../../build/icon.png')
  app.whenReady().then(() => {
    try {
      app.dock?.setIcon(devIcon)
    } catch {
      /* ignore */
    }
  })
}
app.setPath('userData', path.join(app.getPath('appData'), 'SCL'))

let mainWindow: BrowserWindow | null = null
let store: Store
let running: RunningState | null = null
let installController: AbortController | null = null
let killCurrent: (() => void) | null = null
let killing = false
let currentLogFile = ''
const logBuffer: LogLine[] = []

function send(channel: string, payload?: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }
}

function pushLog(line: LogLine): void {
  logBuffer.push(line)
  if (logBuffer.length > 2000) logBuffer.shift()
  send('log:line', line)
}

async function buildState() {
  const data = await store.load()
  const [versions, javas] = await Promise.all([
    listVersions(data.config.gameDir, data.config.lastPlayed),
    detectJavas(data.config.javaPath)
  ])
  const profiles: typeof versions = readModrinthInstances(data.config.gameDir).map((p) => ({
    id: p.id,
    displayName: p.name,
    type: 'release',
    loader: p.loader,
    loaderVersion: p.loaderVersion,
    gameVersion: p.gameVersion,
    installed: p.installed,
    javaMajor: undefined,
    lastPlayed: p.lastPlayed,
    path: p.dir,
    hasJar: p.installed,
    profile: true,
    baseVersion: p.baseVersion
  }))
  versions.unshift(...profiles)
  return {
    config: data.config,
    accounts: data.accounts,
    currentAccountId: data.currentAccountId,
    versions,
    javas,
    running,
    appVersion: app.getVersion(),
    platform: process.platform,
    totalMemMb: Math.floor(os.totalmem() / 1024 / 1024)
  }
}

function loadRenderer(win: BrowserWindow, query: Record<string, string> = {}): void {
  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (isDev && devUrl) {
    const qs = new URLSearchParams(query).toString()
    win.loadURL(`${devUrl}${qs ? `?${qs}` : ''}`).catch(() => {})
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'), { query }).catch(() => {})
  }
}

const webPrefs = {
  preload: path.join(__dirname, '../preload/index.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,
  spellcheck: false,
  webviewTag: true
}

async function collectBugContext(): Promise<import('../shared/types').BugContext> {
  const data = await store.load()
  const cfg = data.config
  const javas = await detectJavas(cfg.javaPath).catch(() => [])
  const versions = (await listVersions(cfg.gameDir, cfg.lastPlayed).catch(() => [])).map((v) => v.id)
  const selected = cfg.selectedVersion
  let mods: string[] = []
  if (selected) {
    try {
      const dir = path.join(contentRoot(cfg, selected), 'mods')
      mods = (await fs.readdir(dir)).filter((f) => f.endsWith('.jar')).sort()
    } catch {
      mods = []
    }
  }
  const sys = systemInfo()
  const recent = logBuffer.slice(-400).map((l) => `[${l.source}/${l.level}] ${l.text}`)
  const disk = latestLogFromDisk(path.join(app.getPath('userData'), 'logs'))
  const chosenJava = cfg.javaPath ? javas.find((j) => j.path === cfg.javaPath) : undefined
  return {
    appVersion: app.getVersion(),
    os: sys.os,
    arch: sys.arch,
    locale: app.getLocale() || sys.locale,
    totalMem: sys.totalMem,
    gameDir: cfg.gameDir,
    selectedVersion: selected,
    java: cfg.javaPath || chosenJava?.path,
    javaMajor: chosenJava?.major,
    versions,
    mods,
    logs: [...recent, ...(disk.length ? ['--- 最近启动日志文件 ---', ...disk] : [])]
  }
}

async function ensureJavaRuntime(major: number): Promise<string> {
  const runtimeDir = path.join(app.getPath('userData'), 'runtime')
  // 老版本用 LWJGL2，macOS ARM 上的 natives 只有 x86_64，必须配 x64 Java 8（走 Rosetta）
  const needX64 = process.platform === 'darwin' && process.arch === 'arm64' && major <= 8
  const arch: 'x64' | undefined = needX64 ? 'x64' : undefined
  const bundled = findBundledJava(runtimeDir, major, arch)
  if (bundled) return bundled
  return downloadJre(
    major,
    runtimeDir,
    (text) => pushLog({ source: 'launcher', level: 'info', text, time: Date.now() }),
    arch
  )
}

let eggFallWindow: BrowserWindow | null = null

/** 彩蛋：截取主窗口画面，用全屏透明叠层让它掉到屏幕底部，并一直停在那里。 */
let eggSoundDataUrl = ''

/** 桌面上的音频（用户自己放的“钢管落地”），取最新一个。 */
function loadEggSound(): string {
  try {
    const bundled = path.join(app.getAppPath(), 'resources', 'pipe-fall.mp3')
    if (fsSync.existsSync(bundled)) {
      return pathToFileURL(bundled).toString()
    }
  } catch {
    /* 继续找桌面 */
  }
  try {
    const dir = app.getPath('desktop')
    const files = fsSync
      .readdirSync(dir)
      .filter((f) => /\.(mp3|wav|m4a|aiff?|ogg)$/i.test(f))
      .sort((a, b) => fsSync.statSync(path.join(dir, b)).mtimeMs - fsSync.statSync(path.join(dir, a)).mtimeMs)
    if (!files.length) return ''
    return pathToFileURL(path.join(dir, files[0])).toString()
  } catch {
    return ''
  }
}

async function showEggFall(): Promise<void> {
  eggSoundDataUrl = loadEggSound()
  if (eggFallWindow && !eggFallWindow.isDestroyed()) return
  const win = mainWindow
  if (!win || win.isDestroyed()) return
  const bounds = win.getBounds()
  const display = screen.getDisplayMatching(bounds)

  const overlay = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: { ...webPrefs, autoplayPolicy: 'no-user-gesture-required' }
  })
  eggFallWindow = overlay
  const overlayBounds = overlay.getBounds()

  const rects = (await win.webContents.executeJavaScript(`(() => {
    const scope = document.querySelector('.view.on') || document.body
    const sels = ['.lc-head','.lc-title','.lc-meta','.lc-stats','.lb-actions','.home-dock','.dock-item','.card-avatar','.home-win','.card-bar','.statusbar','.page-head','.toolbar','.panel','.vtable','.sgroup','.settings-col']
    const out = []
    const seen = new Set()
    for (const sel of sels) {
      for (const el of scope.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        if (r.width < 6 || r.height < 6) continue
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue
        const key = Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.width) + ',' + Math.round(r.height)
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ x: r.x, y: r.y, w: r.width, h: r.height })
        if (out.length >= 14) return out
      }
    }
    return out
  })()`)) as Array<{ x: number; y: number; w: number; h: number }>

  const items: Array<{ dataUrl: string; x: number; y: number; w: number; h: number }> = []
  for (const r of rects) {
    try {
      const image = await win.webContents.capturePage({ x: r.x, y: r.y, width: r.w, height: r.h })
      items.push({
        dataUrl: image.toDataURL(),
        x: Math.round(bounds.x - overlayBounds.x + r.x),
        y: Math.round(bounds.y - overlayBounds.y + r.y),
        w: Math.round(r.w),
        h: Math.round(r.h)
      })
    } catch {
      /* 单个元素截图失败就跳过 */
    }
  }

  loadRenderer(overlay, { view: 'eggFall' })
  overlay.setAlwaysOnTop(true, 'screen-saver')
  overlay.webContents.once('did-finish-load', () => {
    overlay.webContents.send('eggFall:image', { items, audio: eggSoundDataUrl })
    win.setOpacity(0)
  })
  overlay.on('closed', () => {
    eggFallWindow = null
  })
}

/** 彩蛋：窗口像电视无信号图标一样在屏幕内乱撞，直到重启。 */
function startWindowBounce(): void {
  const win = mainWindow
  if (!win || win.isDestroyed()) return
  const display = screen.getDisplayMatching(win.getBounds())
  const area = display.workArea
  const bounds = win.getBounds()
  const width = bounds.width
  const height = bounds.height
  let x = bounds.x
  let y = bounds.y
  let vx = (Math.random() < 0.5 ? -1 : 1) * (520 + Math.random() * 380)
  let vy = (Math.random() < 0.5 ? -1 : 1) * (420 + Math.random() * 320)
  const timer = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      clearInterval(timer)
      return
    }
    const dt = 0.016
    x += vx * dt
    y += vy * dt
    if (x <= area.x) {
      x = area.x
      vx = Math.abs(vx)
    }
    if (x + width >= area.x + area.width) {
      x = area.x + area.width - width
      vx = -Math.abs(vx)
    }
    if (y <= area.y) {
      y = area.y
      vy = Math.abs(vy)
    }
    if (y + height >= area.y + area.height) {
      y = area.y + area.height - height
      vy = -Math.abs(vy)
    }
    win.setBounds({ x: Math.round(x), y: Math.round(y), width, height })
  }, 16)
}

function logApp(message: string): void {
  try {
    fsSync.appendFileSync(
      path.join(app.getPath('userData'), 'app.log'),
      `${new Date().toISOString()} ${message}\n`
    )
  } catch {
    /* 日志失败不影响启动 */
  }
}

function parseVersion(v: string): { nums: number[]; pre: string[] } {
  const m = v.replace(/^v/i, '').trim().match(/^(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?/)
  return {
    nums: (m?.[1] ?? '0').split('.').map((n) => Number(n) || 0),
    pre: m?.[2] ? m[2].split('.') : []
  }
}

/** 语义化版本比较，支持 -beta.3 这类预发布段。 */
function compareVersions(a: string, b: string): number {
  const A = parseVersion(a)
  const B = parseVersion(b)
  const len = Math.max(A.nums.length, B.nums.length)
  for (let i = 0; i < len; i++) {
    const d = (A.nums[i] ?? 0) - (B.nums[i] ?? 0)
    if (d) return d
  }
  if (!A.pre.length && !B.pre.length) return 0
  if (!A.pre.length) return 1
  if (!B.pre.length) return -1
  const plen = Math.max(A.pre.length, B.pre.length)
  for (let i = 0; i < plen; i++) {
    const x = A.pre[i]
    const y = B.pre[i]
    if (x === undefined) return -1
    if (y === undefined) return 1
    const nx = Number(x)
    const ny = Number(y)
    if (!Number.isNaN(nx) && !Number.isNaN(ny)) {
      if (nx !== ny) return nx - ny
    } else if (x !== y) {
      return x < y ? -1 : 1
    }
  }
  return 0
}

/** 更新源使用自签名证书，只对更新检查放宽校验。 */
function fetchJsonInsecure(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { rejectUnauthorized: false, headers: { 'User-Agent': `SCL/${app.getVersion()}` } }, (res) => {
      if (!res.statusCode || res.statusCode >= 400) {
        res.resume()
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (err) {
          reject(err)
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(10_000, () => req.destroy(new Error('更新检查超时')))
  })
}

async function checkForUpdate(_silent = false): Promise<{ available: boolean; current: string; info?: any; error?: string }> {
  const current = app.getVersion()
  const data = await store.load()
  const url = process.env.SCL_UPDATE_URL?.trim() || data.config.updateUrl?.trim() || DEFAULT_UPDATE_URL
  try {
    const info = await fetchJsonInsecure(url) as { version?: string; notes?: string; urls?: Record<string, string> }
    if (!info.version) throw new Error('更新源缺少 version 字段')
    if (compareVersions(info.version, current) > 0) {
      send('update:available', info)
      return { available: true, current, info }
    }
    return { available: false, current }
  } catch (err) {
    return { available: false, current, error: err instanceof Error ? err.message : String(err) }
  }
}

function createHomeWindow(): void {
  logApp('createHomeWindow')
  mainWindow = new BrowserWindow({
    width: dynamicWindow ? 640 : 880,
    height: dynamicWindow ? 480 : 620,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    show: false,
    backgroundColor: '#00000000',
    title: 'SCL',
    webPreferences: webPrefs
  })
  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url).catch(() => {})
    return { action: 'deny' }
  })
  loadRenderer(mainWindow, { view: 'home' })
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

let animating = false

/** 读取 mod jar 内的元数据（Fabric / Forge / NeoForge / 旧版 mcmod.info）。 */
function readModMeta(file: string): { title?: string; version?: string } {
  try {
    const zip = new AdmZip(file)
    const read = (name: string) => {
      const entry = zip.getEntry(name)
      return entry ? entry.getData().toString('utf8') : ''
    }
    const fabric = read('fabric.mod.json')
    if (fabric) {
      const json = JSON.parse(fabric) as { name?: string; version?: string }
      return { title: json.name, version: json.version }
    }
    const toml = read('META-INF/neoforge.mods.toml') || read('META-INF/mods.toml')
    if (toml) {
      const title = toml.match(/^\s*displayName\s*=\s*"([^"]+)"/m)?.[1]
      const version = toml.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1]
      return { title, version }
    }
    const legacy = read('mcmod.info')
    if (legacy) {
      const json = JSON.parse(legacy) as Array<{ name?: string; version?: string }> | { modList?: Array<{ name?: string; version?: string }> }
      const first = Array.isArray(json) ? json[0] : json.modList?.[0]
      return { title: first?.name, version: first?.version }
    }
  } catch {
    /* 不是可读 jar 或没有元数据 */
  }
  return {}
}

/** 版本隔离开启时，模组/存档/资源/光影都放到实例目录。 */
function contentRoot(config: { gameDir: string; isolatedVersions?: Record<string, boolean> }, versionId?: string): string {
  if (versionId?.startsWith('modrinth:')) {
    const profile = findModrinthInstance(config.gameDir, versionId)
    if (profile) return profile.dir
  }
  const isolated = versionId ? config.isolatedVersions?.[versionId] === true : false
  return isolated
    ? path.join(config.gameDir, 'versions', versionId!, 'game')
    : config.gameDir
}
let dynamicWindow = true
let loginWindow: BrowserWindow | null = null
interface NotificationEntry {
  win: BrowserWindow
  timer: ReturnType<typeof setTimeout> | null
  closing: boolean
}
let notifications: NotificationEntry[] = []
const NOTIF_W = 350
const NOTIF_H = 74
const NOTIF_GAP = 8
const tweenTokens = new WeakMap<BrowserWindow, number>()

/** 轻微回弹（节奏医生那种收尾），回弹幅度约 4%。 */
function easeOutBackSmall(t: number): number {
  const c1 = 0.9
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function tweenBounds(
  win: BrowserWindow,
  to: Electron.Rectangle,
  duration: number,
  ease: (t: number) => number,
  done?: () => void,
  fade = false
): void {
  const from = win.getBounds()
  const t0 = Date.now()
  const token = (tweenTokens.get(win) ?? 0) + 1
  tweenTokens.set(win, token)
  const isMain = win === mainWindow
  if (isMain) {
    animating = true
    try {
      win.webContents.send('window:animating', true)
    } catch {
      /* ignore */
    }
  }
  const step = () => {
    if (win.isDestroyed() || tweenTokens.get(win) !== token) return
    const t = Math.min(1, (Date.now() - t0) / duration)
    const e = ease(t)
    win.setBounds({
      x: Math.round(from.x + (to.x - from.x) * e),
      y: Math.round(from.y + (to.y - from.y) * e),
      width: Math.round(from.width + (to.width - from.width) * e),
      height: Math.round(from.height + (to.height - from.height) * e)
    })
    if (fade && t > 0.8) {
      try {
        win.setOpacity(Math.max(0, 1 - (t - 0.8) / 0.2))
      } catch {
        /* ignore */
      }
    }
    if (t < 1) setTimeout(step, 15)
    else {
      if (isMain && tweenTokens.get(win) === token) {
        animating = false
        try {
          win.webContents.send('window:animating', false)
        } catch {
          /* ignore */
        }
      }
      done?.()
    }
  }
  step()
}

/**
 * 窗口尺寸动画：保持窗口中心不动，逐帧 setBounds。
 * 通知层、登录层等独立窗口不走这里。
 */
function animateWindowSize(width: number, height: number): void {
  const win = mainWindow
  if (!win || win.isDestroyed()) return
  const start = win.getBounds()
  // 保持窗口中心不动：内容卡片在屏幕上大致留在原位，只有边缘向外扩/收
  const target = {
    x: Math.round(start.x + start.width / 2 - width / 2),
    y: Math.round(start.y + start.height / 2 - height / 2),
    width,
    height
  }
  tweenBounds(win, target, 280, easeOutBackSmall)
}

function notificationAnchor(): { targetX: number; topY: number; area: Electron.Rectangle; mainRight: number } {
  const mainBounds = mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : null
  const display = mainBounds ? screen.getDisplayMatching(mainBounds) : screen.getPrimaryDisplay()
  const area = display.workArea
  const targetX = mainBounds ? mainBounds.x + mainBounds.width - NOTIF_W + 8 : area.x + area.width - NOTIF_W - 10
  const topY = mainBounds ? mainBounds.y + 42 : area.y + 12
  return {
    targetX,
    topY,
    area,
    mainRight: mainBounds ? mainBounds.x + mainBounds.width : area.x + area.width
  }
}

function reflowNotifications(): void {
  notifications.forEach((entry, index) => {
    if (entry.closing || entry.win.isDestroyed()) return
    const { targetX, topY } = notificationAnchor()
    const y = topY + index * (NOTIF_H + NOTIF_GAP)
    const bounds = entry.win.getBounds()
    if (bounds.x === targetX && Math.abs(bounds.y - y) < 1) return
    tweenBounds(entry.win, { x: targetX, y, width: NOTIF_W, height: NOTIF_H }, 180, (t) => 1 - Math.pow(1 - t, 3))
  })
}

function dismissNotification(entry: NotificationEntry, mode: 'back' | 'drop'): void {
  if (entry.closing) return
  entry.closing = true
  if (entry.timer) {
    clearTimeout(entry.timer)
    entry.timer = null
  }
  const index = notifications.indexOf(entry)
  if (index >= 0) notifications.splice(index, 1)
  reflowNotifications()
  if (entry.win.isDestroyed()) return

  const display = screen.getDisplayMatching(entry.win.getBounds())
  const area = display.bounds
  const bounds = entry.win.getBounds()
  const { mainRight } = notificationAnchor()
  if (mode === 'drop') {
    const angle = Math.round((Math.random() * 2 - 1) * 15)
    const drift = 70 + Math.random() * 110
    const duration = 330 + Math.random() * 150
    entry.win.webContents.send('notif:fall', { angle })
    tweenBounds(
      entry.win,
      { x: bounds.x - drift, y: area.y + area.height + bounds.height, width: bounds.width, height: bounds.height },
      duration,
      (t) => Math.pow(t, 1.35),
      () => {
        if (!entry.win.isDestroyed()) entry.win.close()
      },
      true
    )
  } else {
    tweenBounds(
      entry.win,
      { x: mainRight + 20, y: bounds.y, width: bounds.width, height: bounds.height },
      280,
      (t) => 1 - Math.pow(1 - t, 3),
      () => {
        if (!entry.win.isDestroyed()) entry.win.close()
      }
    )
  }
}


/**
 * 通知是独立的透明置顶窗口，锚定主窗口右上角，不占用主窗口布局。
 * 超时滑回主窗口右侧；手动关闭则整窗下坠出屏幕。
 */
function showNotification(kind: string, text: string): void {
  const { targetX, topY, area, mainRight } = notificationAnchor()
  const maxVisible = Math.max(1, Math.floor((area.y + area.height - topY - 12) / (NOTIF_H + NOTIF_GAP)))
  while (notifications.length >= maxVisible) {
    const oldest = notifications.shift()
    if (!oldest) break
    oldest.closing = true
    if (oldest.timer) clearTimeout(oldest.timer)
    if (!oldest.win.isDestroyed()) oldest.win.destroy()
  }
  const index = notifications.length
  const y = topY + index * (NOTIF_H + NOTIF_GAP)
  const win = new BrowserWindow({
    width: NOTIF_W,
    height: NOTIF_H,
    x: mainRight + 16,
    y,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: webPrefs
  })
  const entry: NotificationEntry = { win, timer: null, closing: false }
  notifications.push(entry)
  loadRenderer(win, { view: 'notification', kind, text })
  win.showInactive()
  win.on('closed', () => {
    const i = notifications.indexOf(entry)
    if (i >= 0) {
      notifications.splice(i, 1)
      reflowNotifications()
    }
  })
  tweenBounds(win, { x: targetX, y, width: NOTIF_W, height: NOTIF_H }, 320, (t) => 1 - Math.pow(1 - t, 3))
  entry.timer = setTimeout(() => dismissNotification(entry, 'back'), 3900)
}


function openManager(view: string): void {
  if (!mainWindow) createHomeWindow()
  if (dynamicWindow) animateWindowSize(880, 620)
  send('manager:navigate', view)
  send('view:change', 'manager')
}

function focusHome(): void {
  if (!mainWindow) createHomeWindow()
  mainWindow!.show()
  mainWindow!.focus()
  if (dynamicWindow) animateWindowSize(640, 480)
  send('view:change', 'home')
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: 'SCL',
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: '编辑',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const }
      ]
    },
    { label: '视图', submenu: [{ role: 'reload' as const }, { role: 'toggleDevTools' as const }, { type: 'separator' as const }, { role: 'togglefullscreen' as const }] },
    { label: '窗口', submenu: [{ role: 'minimize' as const }, { role: 'zoom' as const }, { role: 'close' as const }] }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function registerIpc(): void {
  ipcMain.handle('app:state', async () => buildState())

  ipcMain.handle('app:refresh', async () => {
    clearJavaCache()
    return buildState()
  })

  ipcMain.handle('versions:remote', async () => {
    const data = await store.load()
    return fetchRemoteVersions(data.config.mirror)
  })

  ipcMain.handle('fabric:loaders', async (_e, gameVersion: string) => fetchFabricLoaders(gameVersion))

  ipcMain.handle('install:start', async (_e, versionId: string) => {
    if (installController) return { ok: false, error: '已有安装任务正在进行' }
    installController = new AbortController()
    const data = await store.load()
    try {
      let officialUrl: string | undefined
      try {
        officialUrl = (await resolveRemoteVersion(versionId, data.config.mirror)).url
      } catch {
        officialUrl = undefined
      }
      await installVersion({
        gameDir: data.config.gameDir,
        mirror: data.config.mirror,
        signal: installController.signal,
        versionId,
        officialUrl,
        onProgress: (p) => send('install:progress', p),
        onLog: (text, level = 'info') => pushLog({ source: 'launcher', level, text, time: Date.now() })
      })
      await store.saveConfig({ selectedVersion: versionId })
      send('state:changed')
      return { ok: true, versionId }
    } catch (err) {
      if (isAbortError(err)) return { ok: true, versionId }
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    } finally {
      installController = null
    }
  })

  ipcMain.handle('install:fabric', async (_e, req: { gameVersion: string; loaderVersion?: string }) => {
    if (installController) return { ok: false, error: '已有安装任务正在进行' }
    installController = new AbortController()
    const data = await store.load()
    try {
      const id = await installFabric({
        gameDir: data.config.gameDir,
        mirror: data.config.mirror,
        signal: installController.signal,
        versionId: req.gameVersion,
        loaderVersion: req.loaderVersion,
        onProgress: (p) => send('install:progress', p),
        onLog: (text, level = 'info') => pushLog({ source: 'launcher', level, text, time: Date.now() })
      })
      if (id) await store.saveConfig({ selectedVersion: id })
      send('state:changed')
      return { ok: Boolean(id), versionId: id }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    } finally {
      installController = null
    }
  })

  ipcMain.handle('install:abort', async () => {
    installController?.abort(new Error('用户取消'))
  })

  ipcMain.handle('launch:start', async (_e, versionId: string, server?: string) => {
    if (running) return { ok: false, error: '游戏已经在运行中' }
    const data = await store.load()
    let account = data.accounts.find((a) => a.id === data.currentAccountId) ?? data.accounts[0]
    if (!account) return { ok: false, error: '请先创建一个账户' }
    if (account.type === 'microsoft') {
      try {
        if (!account.expiresAt || account.expiresAt < Date.now() + 60_000) {
          account = account.live
            ? await ensureFreshLive(account)
            : await ensureFreshAccount(account, data.config.msClientId || DEFAULT_MS_CLIENT_ID)
          const accounts = data.accounts.map((a) => (a.id === account.id ? account : a))
          await store.save({ accounts })
        }
      } catch (err) {
        return { ok: false, error: `微软账户凭证无效，请重新登录：${err instanceof Error ? err.message : String(err)}` }
      }
    }
    const javas = await detectJavas(data.config.javaPath)
    try {
      const profile = versionId.startsWith('modrinth:')
        ? findModrinthInstance(data.config.gameDir, versionId)
        : null
      if (versionId.startsWith('modrinth:') && !profile) {
        return { ok: false, error: 'Modrinth 实例不存在或已被移动' }
      }
      const launchVersionId = profile?.baseVersion ?? versionId
      const instanceDir = profile
        ? profile.dir
        : data.config.isolatedVersions?.[versionId] === true
          ? path.join(data.config.gameDir, 'versions', versionId, 'game')
          : undefined
      if (instanceDir) await fs.mkdir(instanceDir, { recursive: true })
      const ensureJava = (major: number) => ensureJavaRuntime(major)
      const result = await launchGame({
        gameDir: data.config.gameDir,
        dataDir: instanceDir,
        ensureJava: data.config.autoDownloadJava === false ? undefined : ensureJava,
        versionId: launchVersionId,
        config: data.config,
        account,
        javas,
        logDir: path.join(app.getPath('userData'), 'logs'),
        server,
        onLog: pushLog,
        onExit: (code) => {
          const wasKilling = killing
          killing = false
          running = null
          killCurrent = null
          if (code !== 0 && !wasKilling) {
            const report = analyzeCrash(
              logBuffer.slice(-300).map((l) => l.text),
              code ?? 0,
              versionId,
              currentLogFile
            )
            send('crash:report', report)
          }
          send('launch:exit', { code })
          send('state:changed')
        }
      })
      running = { versionId, pid: result.pid, startedAt: Date.now() }
      currentLogFile = result.logFile
      killCurrent = result.kill
      await store.saveConfig({
        selectedVersion: versionId,
        lastPlayed: { ...data.config.lastPlayed, [versionId]: Date.now() }
      })
      send('state:changed')
      if (data.config.closeOnLaunch) mainWindow?.hide()
      return { ok: true, pid: result.pid, logFile: result.logFile }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('launch:kill', async () => {
    killing = true
    killCurrent?.()
    return true
  })

  ipcMain.handle('config:save', async (_e, patch) => {
    if (typeof patch.dynamicWindow === 'boolean') {
      dynamicWindow = patch.dynamicWindow
      if (!dynamicWindow) animateWindowSize(880, 620)
    }
    await store.saveConfig(patch)
    if (typeof patch.tiltStrength === 'number') send('config:changed', { tiltStrength: patch.tiltStrength })
    if (patch.theme) send('config:changed', { theme: patch.theme })
    send('state:changed')
    return buildState()
  })

  ipcMain.handle('account:save', async (_e, username: string) => {
    const name = String(username ?? '').trim()
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) {
      throw new Error('用户名需为 3-16 位字母、数字或下划线')
    }
    const data = await store.load()
    const idx = data.accounts.findIndex((a) => a.id === data.currentAccountId)
    const accounts = [...data.accounts]
    const pos = idx >= 0 ? idx : 0
    const base = accounts[pos] ?? { id: 'offline-default', username: name, uuid: offlineUuid(name), type: 'offline' as const, createdAt: Date.now() }
    accounts[pos] = { ...base, id: 'offline-default', username: name, uuid: offlineUuid(name), type: 'offline', createdAt: Date.now() }
    await store.save({ accounts, currentAccountId: 'offline-default' })
    send('state:changed')
    return buildState()
  })

  ipcMain.handle('account:open', async () => {
    send('view:change', 'manager')
    send('account:open', { returnHome: true })
  })

  ipcMain.handle('account:add', async (_e, username: string) => {
    const name = String(username ?? '').trim()
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) throw new Error('用户名需为 3-16 位字母、数字或下划线')
    const data = await store.load()
    if (data.accounts.some((a) => a.username.toLowerCase() === name.toLowerCase())) throw new Error('账户已存在')
    const accounts = [...data.accounts, { id: randomUUID(), username: name, uuid: offlineUuid(name), type: 'offline' as const, createdAt: Date.now() }]
    await store.save({ accounts, currentAccountId: accounts[accounts.length - 1].id })
    send('state:changed')
    return buildState()
  })

  ipcMain.handle('account:switch', async (_e, id: string) => {
    const data = await store.load()
    if (!data.accounts.some((a) => a.id === id)) throw new Error('账户不存在')
    await store.save({ currentAccountId: id })
    send('state:changed')
    return buildState()
  })

  ipcMain.handle('account:delete', async (_e, id: string) => {
    const data = await store.load()
    if (data.accounts.length <= 1) throw new Error('至少保留一个账户')
    const accounts = data.accounts.filter((a) => a.id !== id)
    const currentAccountId = data.currentAccountId === id ? accounts[0].id : data.currentAccountId
    await store.save({ accounts, currentAccountId })
    send('state:changed')
    return buildState()
  })

  ipcMain.handle('dialog:java', async () => {
    const options: Electron.OpenDialogOptions = { title: '选择 Java 可执行文件', properties: ['openFile'] }
    const result = mainWindow ? await dialog.showOpenDialog(mainWindow, options) : await dialog.showOpenDialog(options)
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:modpack', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择整合包',
      filters: [{ name: '整合包', extensions: ['mrpack', 'zip'] }],
      properties: ['openFile']
    })
    return result.canceled ? '' : (result.filePaths[0] ?? '')
  })

  ipcMain.handle('modpack:import', async (_e, file: string) => {
    const data = await store.load()
    try {
      const res = await importMrpack(file, data.config.gameDir, {
        mirror: data.config.mirror,
        javas: await detectJavas(data.config.javaPath),
        onLog: (text, level) => pushLog({ source: 'launcher', level: level ?? 'info', text, time: Date.now() }),
        onProgress: (p) => send('install:progress', p)
      })
      const isolated = { ...(data.config.isolatedVersions ?? {}), [res.instanceId]: true }
      await store.saveConfig({ isolatedVersions: isolated })
      send('state:changed')
      return { ok: true, ...res }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('dialog:dir', async () => {
    const options: Electron.OpenDialogOptions = { title: '选择文件夹', properties: ['openDirectory', 'createDirectory'] }
    const result = mainWindow ? await dialog.showOpenDialog(mainWindow, options) : await dialog.showOpenDialog(options)
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle('shell:open', async (_e, target: string) => {
    await shell.openPath(target)
  })

  ipcMain.handle('bug:context', async () => collectBugContext())

  ipcMain.handle('bug:submit', async (_e, submit: import('../shared/types').BugSubmit) => {
    if (!submit.title?.trim()) return { ok: false, error: '请填写标题' }
    if (!submit.description?.trim()) return { ok: false, error: '请填写描述' }
    const data = await store.load()
    const context = await collectBugContext()
    return submitBugReport(submit, context, {
      updateUrl: data.config.updateUrl || DEFAULT_UPDATE_URL,
      reportDir: path.join(app.getPath('userData'), 'bug-reports')
    })
  })

  ipcMain.handle('bug:export', async (_e, submit: import('../shared/types').BugSubmit) => {
    try {
      const context = await collectBugContext()
      const target = await exportBugReport(submit, context, app.getPath('desktop'))
      return { ok: true, path: target }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('bug:screenshot', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg'] }]
    })
    const file = result.filePaths[0]
    if (result.canceled || !file) return null
    const stat = await fs.stat(file)
    if (stat.size > 4 * 1024 * 1024) return null
    const buf = await fs.readFile(file)
    const ext = path.extname(file).slice(1).toLowerCase()
    return { name: path.basename(file), dataUrl: `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}` }
  })

  ipcMain.handle('java:download', async (_e, major: number) => {
    try {
      const path = await ensureJavaRuntime(major)
      return { ok: true, path }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('easterEgg:bounce', async () => {
    startWindowBounce()
  })

  ipcMain.handle('easterEgg:fall', async () => {
    await showEggFall()
  })

  ipcMain.handle('easterEgg:clang', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('egg:clang', { audio: eggSoundDataUrl })
  })

  ipcMain.handle('shell:open-external', async (_e, url: string) => {
    if (/^https?:\/\//i.test(url)) await shell.openExternal(url)
  })

  ipcMain.handle('update:check', async () => checkForUpdate(false))

  ipcMain.handle('update:download', async (_e, url: string) => {
    if (!/^https:\/\//i.test(url)) return { ok: false, error: '只支持 HTTPS 下载' }
    try {
      const base = path.basename(new URL(url).pathname) || 'SCL-update'
      const dest = path.join(app.getPath('downloads'), base)
      await new Promise<void>((resolve, reject) => {
        const get = (target: string, depth = 0) => {
          https
            .get(target, { rejectUnauthorized: false }, (res) => {
              if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && depth < 3) {
                res.resume()
                get(new URL(res.headers.location, target).toString(), depth + 1)
                return
              }
              if (res.statusCode !== 200) {
                res.resume()
                reject(new Error(`HTTP ${res.statusCode}`))
                return
              }
              const total = Number(res.headers['content-length'] || 0)
              let received = 0
              let last = 0
              res.on('data', (chunk: Buffer) => {
                received += chunk.length
                const now = Date.now()
                if (now - last > 120) {
                  last = now
                  send('update:download-progress', { received, total })
                }
              })
              const out = fsSync.createWriteStream(dest)
              res.pipe(out)
              out.on('finish', () => {
                send('update:download-progress', { received, total })
                out.close(() => resolve())
              })
              out.on('error', reject)
            })
            .on('error', reject)
        }
        get(url)
      })
      shell.showItemInFolder(dest)
      return { ok: true, path: dest }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('shell:open-logs', async () => {
    const dir = path.join(app.getPath('userData'), 'logs')
    await ensureDir(dir)
    await shell.openPath(dir)
  })

  ipcMain.handle('logs:recent', async () => logBuffer.slice(-500))

  ipcMain.handle('mods:list', async (_e, versionId?: string) => {
    const data = await store.load()
    const dir = path.join(contentRoot(data.config, versionId), 'mods')
    try {
      const files = await fs.readdir(dir)
      const out = []
      for (const name of files) {
        if (!/\.jar(\.disabled)?$/i.test(name)) continue
        const st = await fs.stat(path.join(dir, name)).catch(() => null)
        if (!st || !st.isFile()) continue
        out.push({
          name,
          size: st.size,
          mtime: st.mtimeMs,
          enabled: /\.jar$/i.test(name),
          ...readModMeta(path.join(dir, name))
        })
      }
      return out.sort((a, b) => b.mtime - a.mtime)
    } catch {
      return []
    }
  })

  ipcMain.handle('mods:toggle', async (_e, name: string, versionId?: string) => {
    const data = await store.load()
    const dir = path.join(contentRoot(data.config, versionId), 'mods')
    if (path.basename(name) !== name) return false
    const enabled = /\.jar$/i.test(name)
    const from = path.join(dir, name)
    const to = path.join(dir, enabled ? `${name}.disabled` : name.replace(/\.disabled$/i, ''))
    try {
      await fs.rename(from, to)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('mods:delete', async (_e, name: string, versionId?: string) => {
    const data = await store.load()
    const dir = path.join(contentRoot(data.config, versionId), 'mods')
    if (path.basename(name) !== name) return false
    const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
    const options: Electron.MessageBoxOptions = {
      type: 'warning',
      buttons: ['删除', '取消'],
      defaultId: 1,
      cancelId: 1,
      message: `删除模组 ${name}？`,
      detail: '文件会从 mods 目录中永久移除。'
    }
    const res = parent ? await dialog.showMessageBox(parent, options) : await dialog.showMessageBox(options)
    if (res.response !== 0) return false
    try {
      await fs.rm(path.join(dir, name), { force: true })
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('ms:start', async () => {
    const data = await store.load()
    const clientId = data.config.msClientId || DEFAULT_MS_CLIENT_ID
    if (!clientId) throw new Error('启动器未内置 Client ID，请先在设置中填写 Azure 应用 Client ID')
    const info = await startDeviceCode(clientId)
    return {
      deviceCode: info.deviceCode,
      userCode: info.userCode,
      verificationUri: info.verificationUri,
      interval: info.interval
    }
  })

  ipcMain.handle('login-window:open', async (_e, info: { userCode: string; verificationUri: string }) => {
    if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close()
    const win = new BrowserWindow({
      width: 440,
      height: 320,
      parent: mainWindow ?? undefined,
      transparent: true,
      frame: false,
      hasShadow: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      show: false,
      backgroundColor: '#00000000',
      title: '微软登录',
      webPreferences: webPrefs
    })
    loginWindow = win
    win.once('ready-to-show', () => win.show())
    win.on('closed', () => {
      if (loginWindow === win) loginWindow = null
    })
    loadRenderer(win, { view: 'login', userCode: info.userCode, url: info.verificationUri })
  })

  ipcMain.handle('login-window:close', async () => {
    if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close()
  })

  ipcMain.handle('ms:complete', async (_e, code: string) => {
    const data = await store.load()
    try {
      const tokens = await exchangeLiveCode(code, LIVE_REDIRECT)
      const profile = await loginWithTicket(tokens.accessToken, 't')
      const accounts = data.accounts.filter((a) => a.uuid !== profile.id)
      accounts.push({
        id: randomUUID(),
        username: profile.name,
        uuid: profile.id,
        type: 'microsoft' as const,
        accessToken: profile.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + tokens.expiresIn * 1000,
        live: true,
        createdAt: Date.now()
      })
      await store.save({ accounts, currentAccountId: accounts[accounts.length - 1].id })
      send('state:changed')
      return { ok: true, state: await buildState() }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('ms:web-login', async () => {
    if (!mainWindow) return { ok: false, error: '窗口未就绪' }
    const data = await store.load()
    const authWin = new BrowserWindow({
      width: 520,
      height: 720,
      parent: mainWindow,
      modal: true,
      hasShadow: false,
      title: '微软登录',
      webPreferences: { partition: 'persist:mslogin', nodeIntegration: false, contextIsolation: true }
    })
    return new Promise<{ ok: boolean; state?: unknown; error?: string }>((resolve) => {
      let settled = false
      const finish = async (url?: string) => {
        if (settled) return
        settled = true
        try {
          if (!url) throw new Error('登录窗口已关闭')
          const code = new URL(url).searchParams.get('code')
          if (!code) throw new Error('未拿到授权码')
          const tokens = await exchangeLiveCode(code, LIVE_REDIRECT)
          const profile = await loginWithTicket(tokens.accessToken, 't')
          const accounts = data.accounts.filter((a) => a.uuid !== profile.id)
          accounts.push({
            id: randomUUID(),
            username: profile.name,
            uuid: profile.id,
            type: 'microsoft' as const,
            accessToken: profile.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: Date.now() + tokens.expiresIn * 1000,
            live: true,
            createdAt: Date.now()
          })
          await store.save({ accounts, currentAccountId: accounts[accounts.length - 1].id })
          send('state:changed')
          resolve({ ok: true, state: await buildState() })
        } catch (err) {
          resolve({ ok: false, error: err instanceof Error ? err.message : String(err) })
        } finally {
          if (!authWin.isDestroyed()) authWin.close()
        }
      }
      const check = (url: string) => {
        if (url.startsWith(LIVE_REDIRECT)) void finish(url)
      }
      authWin.webContents.on('will-redirect', (_e, url) => check(url))
      authWin.webContents.on('did-navigate', (_e, url) => check(url))
      authWin.on('closed', () => void finish(undefined))
      setTimeout(() => void finish(undefined), 300000)
      authWin.loadURL(LIVE_AUTH_URL).catch(() => void finish(undefined))
    })
  })

  ipcMain.handle('ms:poll', async (_e, deviceCode: string) => {
    const data = await store.load()
    try {
      const tokens = await pollDeviceCode(data.config.msClientId || DEFAULT_MS_CLIENT_ID, deviceCode)
      if (tokens === 'pending') return { status: 'pending' as const }
      const profile = await loginWithMsa(tokens.accessToken)
      const accounts = data.accounts.filter((a) => a.uuid !== profile.id)
      accounts.push({
        id: randomUUID(),
        username: profile.name,
        uuid: profile.id,
        type: 'microsoft' as const,
        accessToken: profile.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + tokens.expiresIn * 1000,
        live: true,
        createdAt: Date.now()
      })
      await store.save({ accounts, currentAccountId: accounts[accounts.length - 1].id })
      send('state:changed')
      return { status: 'done' as const, state: await buildState() }
    } catch (err) {
      return { status: 'error' as const, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('neo:versions', async (_e, mc: string) => fetchNeoForgeVersions(mc))

  ipcMain.handle('neo:install', async (_e, mc: string, version: string) => {
    if (installController) return { ok: false, error: '已有安装任务正在进行' }
    installController = new AbortController()
    const data = await store.load()
    try {
      const idi = await installNeoForge({
        gameDir: data.config.gameDir,
        mcVersion: mc,
        forgeVersion: version,
        javas: await detectJavas(data.config.javaPath),
        signal: installController.signal,
        onLog: (text, level = 'info') => pushLog({ source: 'launcher', level, text, time: Date.now() })
      })
      await store.saveConfig({ selectedVersion: idi })
      send('state:changed')
      return { ok: true, versionId: idi }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    } finally {
      installController = null
    }
  })

  ipcMain.handle('mods:search', async (_e, req: { query: string; loader?: string; gameVersion?: string; sort?: 'relevance' | 'downloads' | 'newest' }) => {
    return searchMods(req)
  })

  ipcMain.handle('mods:install', async (_e, req: { id: string; loader?: string; gameVersion?: string; versionId?: string }) => {
    const data = await store.load()
    try {
      const result = await installMod({
        ...req,
        modsDir: path.join(contentRoot(data.config, req.versionId), 'mods')
      })
      return { ok: true, file: result.primary, files: result.installed }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('servers:list', async (_e, versionId?: string) => {
    const data = await store.load()
    return readServers(contentRoot(data.config, versionId))
  })

  ipcMain.handle('servers:save', async (_e, entries: { name: string; ip: string }[], versionId?: string) => {
    const data = await store.load()
    try {
      await writeServers(contentRoot(data.config, versionId), entries)
      return true
    } catch (err) {
      console.error('servers:save', err)
      return false
    }
  })

  ipcMain.handle('quilt:loaders', async (_e, mc: string) => {
    const res = await fetch(`https://meta.quiltmc.org/v3/versions/loader/${encodeURIComponent(mc)}`, {
      headers: { 'User-Agent': 'SCL/1.0.0' }
    })
    if (!res.ok) return []
    const list = (await res.json()) as { loader: { version: string } }[]
    const score = (v: string) => {
      const [base, pre] = v.split('-')
      const nums = base.split('.').map((n) => Number(n) || 0)
      return { nums, stable: pre ? 0 : 1 }
    }
    return list
      .map((x) => ({ version: x.loader.version }))
      .sort((a, b) => {
        const sa = score(a.version)
        const sb = score(b.version)
        if (sa.stable !== sb.stable) return sb.stable - sa.stable
        for (let i = 0; i < Math.max(sa.nums.length, sb.nums.length); i++) {
          const d = (sb.nums[i] ?? 0) - (sa.nums[i] ?? 0)
          if (d) return d
        }
        return sb.stable - sa.stable
      })
  })

  ipcMain.handle('quilt:install', async (_e, mc: string, loader: string) => {
    if (installController) return { ok: false, error: '已有安装任务正在进行' }
    installController = new AbortController()
    const data = await store.load()
    try {
      const id = await installQuilt({
        gameDir: data.config.gameDir,
        mirror: data.config.mirror,
        versionId: mc,
        loaderVersion: loader,
        signal: installController.signal,
        onProgress: (p) => send('install:progress', p),
        onLog: (text, level = 'info') => pushLog({ source: 'launcher', level, text, time: Date.now() })
      })
      if (id) await store.saveConfig({ selectedVersion: id })
      send('state:changed')
      return { ok: Boolean(id), versionId: id }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    } finally {
      installController = null
    }
  })

  ipcMain.handle('forge:versions', async (_e, mc: string) => fetchForgeVersions(mc))

  ipcMain.handle('forge:install', async (_e, mc: string, forge: string) => {
    if (installController) return { ok: false, error: '已有安装任务正在进行' }
    installController = new AbortController()
    const data = await store.load()
    const log = (text: string, level: 'info' | 'warn' | 'error' = 'info') =>
      pushLog({ source: 'launcher', level, text, time: Date.now() })
    try {
      const vanillaJson = path.join(data.config.gameDir, 'versions', mc, `${mc}.json`)
      if (!(await exists(vanillaJson))) {
        log(`先安装原版 ${mc}`)
        const remote = await resolveRemoteVersion(mc, data.config.mirror)
        await installVersion({
          gameDir: data.config.gameDir,
          mirror: data.config.mirror,
          versionId: mc,
          officialUrl: remote.url,
          signal: installController.signal,
          onProgress: (p) => send('install:progress', p),
          onLog: log
        })
      }
      send('install:progress', {
        id: `forge-${mc}`, phase: 'prepare', label: '运行 Forge 安装器', current: 0, total: 0, bytes: 0, totalBytes: 0, speed: 0
      })
      const javas = await detectJavas(data.config.javaPath)
      const id = await installForge({
        gameDir: data.config.gameDir,
        mcVersion: mc,
        forgeVersion: forge,
        javas,
        onLog: log
      })
      await store.saveConfig({ selectedVersion: id })
      send('install:progress', {
        id: `forge-${mc}`, phase: 'done', label: 'Forge 安装完成', current: 1, total: 1, bytes: 1, totalBytes: 1, speed: 0
      })
      send('state:changed')
      return { ok: true, versionId: id }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    } finally {
      installController = null
    }
  })

  ipcMain.handle('content:search', async (_e, type: 'resourcepack' | 'shader', query: string, gameVersion?: string) => {
    return searchProjects({ type, query, gameVersion })
  })

  ipcMain.handle('content:install', async (_e, type: 'resourcepack' | 'shader', id: string, gameVersion: string | undefined, versionId?: string) => {
    const data = await store.load()
    try {
      const dir = type === 'shader' ? 'shaderpacks' : 'resourcepacks'
      const file = await installContentFile({
        id,
        gameVersion,
        targetDir: path.join(contentRoot(data.config, versionId), dir)
      })
      return { ok: true, file }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('content:list', async (_e, kind: string, versionId?: string) => {
    if (kind !== 'resourcepacks' && kind !== 'shaderpacks') return []
    const data = await store.load()
    const dir = path.join(contentRoot(data.config, versionId), kind)
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      const out = []
      for (const entry of entries) {
        const st = await fs.stat(path.join(dir, entry.name)).catch(() => null)
        if (!st) continue
        if (entry.isFile() && !/\.(zip|jar)$/i.test(entry.name)) continue
        out.push({ name: entry.name, size: st.isDirectory() ? 0 : st.size, mtime: st.mtimeMs })
      }
      return out.sort((a, b) => b.mtime - a.mtime)
    } catch {
      return []
    }
  })

  ipcMain.handle('content:delete', async (_e, kind: string, name: string, versionId?: string) => {
    if ((kind !== 'resourcepacks' && kind !== 'shaderpacks') || path.basename(name) !== name) return false
    const data = await store.load()
    const target = path.join(contentRoot(data.config, versionId), kind, name)
    const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
    const options: Electron.MessageBoxOptions = {
      type: 'warning',
      buttons: ['删除', '取消'],
      defaultId: 1,
      cancelId: 1,
      message: `删除 ${name}？`,
      detail: '文件会被永久删除。'
    }
    const res = parent ? await dialog.showMessageBox(parent, options) : await dialog.showMessageBox(options)
    if (res.response !== 0) return false
    try {
      await fs.rm(target, { recursive: true, force: true })
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('saves:list', async (_e, versionId?: string) => {
    const data = await store.load()
    const dir = path.join(contentRoot(data.config, versionId), 'saves')
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      const out = []
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const st = await fs.stat(path.join(dir, entry.name)).catch(() => null)
        if (st) out.push({ name: entry.name, mtime: st.mtimeMs })
      }
      return out.sort((a, b) => b.mtime - a.mtime)
    } catch {
      return []
    }
  })

  ipcMain.handle('saves:delete', async (_e, name: string) => {
    const data = await store.load()
    const dir = path.join(data.config.gameDir, 'saves')
    if (path.basename(name) !== name) return false
    const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
    const options: Electron.MessageBoxOptions = {
      type: 'warning',
      buttons: ['删除', '取消'],
      defaultId: 1,
      cancelId: 1,
      message: `删除存档 ${name}？`,
      detail: '该存档文件夹会被永久删除，无法恢复。'
    }
    const res = parent ? await dialog.showMessageBox(parent, options) : await dialog.showMessageBox(options)
    if (res.response !== 0) return false
    try {
      await fs.rm(path.join(dir, name), { recursive: true, force: true })
      return true
    } catch {
      return false
    }
  })

  /**
   * 版本完整性校验：对比 classpath 实际文件与资源索引。
   * 缺失时按版本类型调用对应的安装器修复（原版/Fabric/Quilt/Forge/NeoForge）。
   */
  ipcMain.handle('version:check', async (_e, id: string) => {
    const data = await store.load()
    if (id.startsWith('modrinth:')) {
      const profile = findModrinthInstance(data.config.gameDir, id)
      if (!profile) return { ok: false, error: 'Modrinth 实例不存在' }
      return { ok: true, missing: profile.installed ? 0 : 1 }
    }
    try {
      const resolved = await resolveVersion(data.config.gameDir, id)
      const { missing } = buildClasspath(
        resolved,
        data.config.gameDir,
        { ...DEFAULT_FEATURES, has_custom_resolution: false }
      )
      const index = path.join(data.config.gameDir, 'assets', 'indexes', `${resolved.assets}.json`)
      try {
        await fs.access(index)
      } catch {
        missing.push('assets/index.json')
      }
      if (!missing.length) return { ok: true, missing: 0 }
      const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
      const options: Electron.MessageBoxOptions = {
        type: 'question',
        buttons: ['下载修复', '取消'],
        defaultId: 0,
        cancelId: 1,
        message: `检测到 ${missing.length} 个文件缺失`,
        detail: `例如：${missing[0]}\n\n修复会重新下载缺失的依赖库与资源索引。`
      }
      const res = parent ? await dialog.showMessageBox(parent, options) : await dialog.showMessageBox(options)
      if (res.response !== 0) return { ok: false, missing: missing.length, cancelled: true }
      const onProgress = (p: Parameters<typeof send>[1]) => send('install:progress', p)
      const onLog = (text: string, level: 'info' | 'warn' | 'error' = 'info') =>
        pushLog({ source: 'launcher', level, text, time: Date.now() })
      const neo = resolved.libraries.find((l) => l.name.startsWith('net.neoforged:neoforge:'))
      const forge = resolved.libraries.find((l) => l.name.startsWith('net.minecraftforge:forge:'))
      const quilt = resolved.libraries.find((l) => l.name.startsWith('org.quiltmc:quilt-loader:'))
      const fabric = resolved.libraries.find((l) => l.name.startsWith('net.fabricmc:fabric-loader:'))
      if (neo) {
        const version = neo.name.split(':')[2]
        await installNeoForge({
          gameDir: data.config.gameDir,
          mcVersion: resolved.gameVersion,
          forgeVersion: version,
          javas: await detectJavas(data.config.javaPath),
          onLog
        })
      } else if (forge) {
        const version = id.split('-forge-')[1]
        const javas = await detectJavas(data.config.javaPath)
        await installForge({
          gameDir: data.config.gameDir,
          mcVersion: resolved.gameVersion,
          forgeVersion: version,
          javas,
          onLog
        })
      } else if (quilt) {
        await installQuilt({
          gameDir: data.config.gameDir,
          mirror: data.config.mirror,
          versionId: resolved.gameVersion,
          loaderVersion: quilt.name.split(':')[2],
          onProgress,
          onLog
        })
      } else if (fabric) {
        await installFabric({
          gameDir: data.config.gameDir,
          mirror: data.config.mirror,
          versionId: resolved.gameVersion,
          loaderVersion: fabric.name.split(':')[2],
          onProgress,
          onLog
        })
      } else {
        const remote = await resolveRemoteVersion(id, data.config.mirror)
        await installVersion({
          gameDir: data.config.gameDir,
          mirror: data.config.mirror,
          versionId: id,
          officialUrl: remote.url,
          onProgress,
          onLog
        })
      }
      send('state:changed')
      return { ok: true, missing: missing.length, repaired: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('version:delete', async (_e, id: string) => {
    if (id.startsWith('modrinth:')) return { ok: false, error: 'Modrinth 实例请到 Modrinth App 内删除' }
    const data = await store.load()
    if (running?.versionId === id) return { ok: false, error: '游戏运行中，无法删除' }
    const root = path.resolve(data.config.gameDir, 'versions')
    const dir = path.resolve(root, id)
    if (dir !== path.join(root, path.basename(dir)) || !dir.startsWith(root + path.sep)) {
      return { ok: false, error: '非法版本路径' }
    }
    const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
    const options: Electron.MessageBoxOptions = {
      type: 'warning',
      buttons: ['删除', '取消'],
      defaultId: 1,
      cancelId: 1,
      message: `删除版本 ${id}？`,
      detail: '只会删除该版本的文件夹，存档、模组与其他版本不受影响。'
    }
    const res = parent ? await dialog.showMessageBox(parent, options) : await dialog.showMessageBox(options)
    if (res.response !== 0) return { ok: false }
    await fs.rm(dir, { recursive: true, force: true })
    const lastPlayed = { ...data.config.lastPlayed }
    delete lastPlayed[id]
    await store.saveConfig({
      lastPlayed,
      selectedVersion: data.config.selectedVersion === id ? '' : data.config.selectedVersion
    })
    send('state:changed')
    return { ok: true }
  })

  ipcMain.handle('window:open-manager', async (_e, view: string) => openManager(view))
  ipcMain.handle('window:focus-home', async () => focusHome())
  ipcMain.handle('notify:show', async (_e, payload: { kind: string; text: string }) => showNotification(payload.kind, payload.text))
  ipcMain.handle('notify:dismiss', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const entry = notifications.find((n) => n.win === win)
    if (entry) dismissNotification(entry, 'drop')
  })
  ipcMain.handle('window:resize', async (_e, width: number, height: number) => {
    animateWindowSize(Math.max(360, Math.round(width)), Math.max(320, Math.round(height)))
  })

  ipcMain.handle('window:fit-height', async (e, height: number) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win || win.isDestroyed() || animating) return
    const display = screen.getDisplayMatching(win.getBounds())
    const maxH = Math.min(720, display.workAreaSize.height - 40)
    const target = Math.max(560, Math.min(Math.round(height), maxH))
    const bounds = win.getBounds()
    if (Math.abs(bounds.height - target) < 12) return
    animating = true
    tweenBounds(
      win,
      { x: bounds.x, y: bounds.y, width: bounds.width, height: target },
      220,
      (t) => 1 - Math.pow(1 - t, 3),
      () => {
        animating = false
      }
    )
  })
  ipcMain.handle('window:minimize', async (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })
  ipcMain.handle('window:close', async (e) => {
    BrowserWindow.fromWebContents(e.sender)?.hide()
  })
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  // LaunchServices 启动时偶尔会误判单实例锁，直接退出会表现为“双击没反应”
  logApp('single-instance-lock-failed, continue')
} else {
  app.on('second-instance', () => {
    logApp('second-instance')
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(async () => {
    logApp(`ready pid=${process.pid}`)
    store = new Store(app.getPath('userData'))
    const initial = await store.load()
    dynamicWindow = initial.config.dynamicWindow !== false
    registerIpc()
    buildMenu()
    createHomeWindow()
    setTimeout(() => {
      void checkForUpdate(true)
    }, 5000)
    const cursorTimer = setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible() || animating) return
      const point = screen.getCursorScreenPoint()
      const bounds = mainWindow.getBounds()
      mainWindow.webContents.send('cursor:move', {
        x: point.x - bounds.x,
        y: point.y - bounds.y,
        w: bounds.width,
        h: bounds.height
      })
    }, 33)
    app.on('before-quit', () => clearInterval(cursorTimer))
    app.on('activate', () => {
      if (!mainWindow) createHomeWindow()
      else {
        mainWindow.show()
        mainWindow.focus()
      }
    })
  })

app.on('before-quit', () => logApp('before-quit'))
app.on('render-process-gone', (_e, _wc, details) => logApp(`render-process-gone ${details.reason}`))
app.on('child-process-gone', (_e, details) => logApp(`child-process-gone ${details.type} ${details.reason}`))
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  killing = true
  killCurrent?.()
})
