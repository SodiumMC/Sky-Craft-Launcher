import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'
import os from 'node:os'
import { Account, LauncherConfig, VersionSummary } from '../../shared/types'
import { defaultGameDir, exists, offlineUuid, readJson, suggestedMemoryMb, writeJsonAtomic } from './util'
import { classifyLoader, guessGameVersion, readVersionJson, requiredJavaMajor, scanVersionDir } from './version'

export interface StoreData {
  config: LauncherConfig
  accounts: Account[]
  currentAccountId: string
}

const CONFIG_FILE = 'settings.json'

export async function detectGameDir(): Promise<string> {
  const candidates = [
    path.join(os.homedir(), '.minecraft'),
    defaultGameDir(),
    path.join(os.homedir(), 'Library', 'Application Support', 'minecraft')
  ]
  for (const dir of candidates) {
    if (await exists(path.join(dir, 'versions'))) return dir
  }
  return candidates[0]
}

export async function defaultStore(): Promise<StoreData> {
  const config: LauncherConfig = {
    gameDir: await detectGameDir(),
    javaPath: '',
    maxMemory: suggestedMemoryMb(),
    minMemory: 512,
    jvmArgs: '',
    width: 854,
    height: 480,
    customResolution: false,
    fullscreen: false,
    mirror: 'bmclapi',
    selectedVersion: '',
    closeOnLaunch: false,
    lastPlayed: {},
    memoryOverrides: {},
    javaOverrides: {},
    msClientId: '',
    language: 'zh-CN',
    dynamicWindow: true,
    isolatedVersions: {},
    autoDownloadJava: true,
    theme: 'system',
    updateUrl: '',
    tiltStrength: 100,
    gameLanguage: 'zh_cn'
  }
  const account: Account = {
    id: 'offline-default',
    username: 'Player',
    uuid: offlineUuid('Player'),
    type: 'offline',
    createdAt: Date.now()
  }
  return { config, accounts: [account], currentAccountId: account.id }
}

/** 用户可能选中 ModrinthApp 或其 profiles；SCL 需要的是带 versions/libraries/assets 的 meta。 */
function normalizeGameDir(gameDir: string): string {
  const name = path.basename(gameDir)
  if (name === 'profiles') {
    const base = path.dirname(gameDir)
    if (existsSync(path.join(base, 'app.db')) && existsSync(path.join(base, 'meta', 'versions'))) {
      return path.join(base, 'meta')
    }
  }
  if (existsSync(path.join(gameDir, 'meta', 'versions')) && !existsSync(path.join(gameDir, 'versions'))) {
    return path.join(gameDir, 'meta')
  }
  return gameDir
}

export class Store {
  private data: StoreData | null = null

  constructor(private readonly dir: string) {}

  get file(): string {
    return path.join(this.dir, CONFIG_FILE)
  }

  async load(): Promise<StoreData> {
    if (this.data) return this.data
    const base = await defaultStore()
    const saved = await readJson<Partial<StoreData>>(this.file, {})
    const merged: StoreData = {
      config: { ...base.config, ...(saved.config ?? {}) },
      accounts: saved.accounts?.length ? saved.accounts : base.accounts,
      currentAccountId: saved.currentAccountId ?? base.currentAccountId
    }
    if (!merged.accounts.some((a) => a.id === merged.currentAccountId)) {
      merged.currentAccountId = merged.accounts[0].id
    }
    merged.config.gameDir = normalizeGameDir(merged.config.gameDir)
    this.data = merged
    await writeJsonAtomic(this.file, merged).catch(() => {})
    return merged
  }

  async save(patch: { config?: Partial<LauncherConfig>; accounts?: Account[]; currentAccountId?: string }): Promise<StoreData> {
    const current = await this.load()
    this.data = {
      config: { ...current.config, ...(patch.config ?? {}) },
      accounts: patch.accounts ?? current.accounts,
      currentAccountId: patch.currentAccountId ?? current.currentAccountId
    }
    await writeJsonAtomic(this.file, this.data)
    return this.data
  }

  async saveConfig(patch: Partial<LauncherConfig>): Promise<StoreData> {
    return this.save({ config: patch })
  }
}

export async function listVersions(gameDir: string, lastPlayed: Record<string, number>): Promise<VersionSummary[]> {
  const scanned = await scanVersionDir(gameDir)
  const out: VersionSummary[] = []
  for (const item of scanned) {
    const id = item.id
    const json = item.json
    let loader: VersionSummary['loader'] = 'unknown'
    let loaderVersion: string | undefined
    let broken = item.broken
    try {
      const classified = classifyLoader(json)
      loader = classified.loader
      loaderVersion = classified.loaderVersion
    } catch {
      /* ignore */
    }
    const gameVersion = json.inheritsFrom ?? guessGameVersion(id)
    let javaMajor = json.javaVersion?.majorVersion
    if (!javaMajor && json.inheritsFrom) {
      const parent = await readVersionJson(gameDir, json.inheritsFrom)
      javaMajor = parent.javaVersion?.majorVersion
    }
    const ownJar = path.join(gameDir, 'versions', id, `${id}.jar`)
    let hasJar = await exists(ownJar)
    if (!hasJar && json.inheritsFrom) {
      hasJar = await exists(path.join(gameDir, 'versions', json.inheritsFrom, `${json.inheritsFrom}.jar`))
    }
    if (!hasJar && !json.inheritsFrom) {
      // 合并版（HMCL 等）通常 jar 与 json 同名，已在上面检查；这里再兜底扫描目录内任意 jar
      try {
        const files = await fs.readdir(path.join(gameDir, 'versions', id))
        hasJar = files.some((f) => f.endsWith('.jar'))
      } catch {
        hasJar = false
      }
    }
    out.push({
      id,
      type: json.type ?? 'release',
      loader,
      loaderVersion,
      gameVersion,
      installed: Boolean(hasJar) && !broken,
      javaMajor: javaMajor ? requiredJavaMajor(gameVersion, javaMajor) : requiredJavaMajor(gameVersion),
      lastPlayed: lastPlayed[id],
      path: path.join(gameDir, 'versions', id),
      hasJar,
      broken
    })
  }
  out.sort((a, b) => {
    const la = a.lastPlayed ?? 0
    const lb = b.lastPlayed ?? 0
    if (la !== lb) return lb - la
    return b.id.localeCompare(a.id, undefined, { numeric: true })
  })
  return out
}
