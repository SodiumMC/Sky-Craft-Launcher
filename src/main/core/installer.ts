/**
 * 安装器：Mojang 版本 JSON → 客户端/依赖库/资源索引/资源对象。
 * 所有下载都走 Downloader（带镜像回退与 SHA1 校验），
 * 通过 Meter 上报进度，支持 AbortSignal 取消。
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { InstallProgress } from '../../shared/types'
import { candidates, Mirror } from './mirror'
import { ensureFile } from './downloader'
import { ensureDir, isAbortError, mapLimit, writeJsonAtomic } from './util'
import {
  collectNatives,
  DEFAULT_FEATURES,
  isNativeLib,
  mavenPath,
  resolveVersion,
  rulesAllow,
  VersionJson
} from './version'
import { fetchFabricLoaders, fetchFabricProfile, fetchVersionJson, resolveRemoteVersion } from './manifest'
import { fetchJson } from './util'
import { writeLoaderMeta } from './loaderMeta'

/** Puzzle（Beta）目前只支持 1.21.1。 */
export const PUZZLE_GAME_VERSION = '1.21.1'

export interface InstallOptions {
  gameDir: string
  mirror: Mirror
  signal?: AbortSignal
  onProgress: (p: InstallProgress) => void
  onLog?: (message: string, level?: 'info' | 'warn' | 'error') => void
  versionId: string
  /** 输出目录/版本 id，默认与 versionId 相同 */
  targetId?: string
  officialUrl?: string
}

interface QueueItem {
  dest: string
  urls: string[]
  sha1?: string
  size?: number
  verifyHash?: boolean
  label: string
  optional?: boolean
}

class Meter {
  private totalFiles = 0
  private doneFiles = 0
  private totalBytes = 0
  private doneBytes = 0
  private phase: InstallProgress['phase'] = 'prepare'
  private label = '准备中'
  private lastAt = Date.now()
  private lastBytes = 0
  private speed = 0
  private timer: NodeJS.Timeout | null = null
  private finished = false

  constructor(
    private readonly id: string,
    private readonly emit: (p: InstallProgress) => void
  ) {}

  setPhase(phase: InstallProgress['phase'], label: string): void {
    this.phase = phase
    this.label = label
    this.flush(true)
  }

  addTotal(bytes: number): void {
    this.totalBytes += Math.max(0, bytes || 0)
    this.totalFiles += 1
  }

  addDone(bytes: number): void {
    this.doneBytes += Math.max(0, bytes || 0)
    this.doneFiles += 1
    this.flush()
  }

  get bytesDone(): number {
    return this.doneBytes
  }

  get bytesTotal(): number {
    return this.totalBytes
  }

  private snapshot(): InstallProgress {
    return {
      id: this.id,
      phase: this.phase,
      label: this.label,
      current: this.doneFiles,
      total: this.totalFiles,
      bytes: this.doneBytes,
      totalBytes: this.totalBytes,
      speed: this.speed
    }
  }

  flush(force = false): void {
    if (this.finished) return
    const now = Date.now()
    const dt = now - this.lastAt
    if (dt > 250) {
      const instant = ((this.doneBytes - this.lastBytes) * 1000) / dt
      this.speed = this.speed ? this.speed * 0.6 + instant * 0.4 : instant
      this.lastAt = now
      this.lastBytes = this.doneBytes
    }
    if (force) {
      this.emit(this.snapshot())
      return
    }
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.emit(this.snapshot())
    }, 150)
  }

  finish(phase: InstallProgress['phase'], label: string, error?: string): void {
    this.phase = phase
    this.label = label
    this.finished = true
    if (this.timer) clearTimeout(this.timer)
    this.emit({ ...this.snapshot(), speed: 0, error })
  }
}

async function runQueue(items: QueueItem[], meter: Meter, signal: AbortSignal | undefined, concurrency: number): Promise<void> {
  const seen = new Set<string>()
  const unique = items.filter((item) => {
    if (seen.has(item.dest)) return false
    seen.add(item.dest)
    return true
  })
  await mapLimit(
    unique,
    concurrency,
    async (item) => {
      if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError')
      const expected = item.size ?? 0
      let downloaded = 0
      try {
        await ensureFile(
          { urls: item.urls, dest: item.dest, sha1: item.sha1, size: item.size, verifyHash: item.verifyHash, label: item.label },
          signal,
          (n) => {
            downloaded += n
            meter.addDone(n)
          }
        )
      } catch (err) {
        if (item.optional) return
        throw err
      }
      if (downloaded === 0) meter.addDone(expected)
    },
    signal
  )
}

function libUrls(url: string, mirror: Mirror): string[] {
  return candidates(url, mirror)
}

export async function installVersion(opts: InstallOptions): Promise<void> {
  const { gameDir, mirror, signal, onProgress, onLog, versionId, officialUrl } = opts
  const meter = new Meter(versionId, onProgress)
  const log = (m: string, level: 'info' | 'warn' | 'error' = 'info') => onLog?.(m, level)
  try {
    meter.setPhase('prepare', '获取版本信息')
    log(`开始安装 ${versionId}`)
    let url = officialUrl
    if (!url) {
      try {
        url = (await resolveRemoteVersion(versionId, mirror, signal)).url
      } catch {
        url = undefined
      }
    }
    const json = await fetchVersionJson(versionId, mirror, url, signal)
    const outId = opts.targetId ?? versionId
    const versionDir = path.join(gameDir, 'versions', outId)
    await ensureDir(versionDir)
    await writeJsonAtomic(path.join(versionDir, `${outId}.json`), { ...json, id: outId })

    // 客户端
    const client = json.downloads?.client
    if (client?.url) {
      meter.setPhase('client', '下载客户端')
      meter.addTotal(client.size ?? 0)
      await runQueue(
        [
          {
            dest: path.join(versionDir, `${outId}.jar`),
            urls: libUrls(client.url, mirror),
            sha1: client.sha1,
            size: client.size,
            verifyHash: true,
            label: `${versionId}.jar`
          }
        ],
        meter,
        signal,
        1
      )
    }

    // 依赖库 + 原生库
    meter.setPhase('libraries', '下载依赖库')
    const libs = json.libraries ?? []
    const features = { ...DEFAULT_FEATURES }
    const queue: QueueItem[] = []
    for (const lib of libs) {
      if (!rulesAllow(lib.rules, features)) continue
      if (isNativeLib(lib)) continue
      const artifact = lib.downloads?.artifact ?? (mavenPath(lib.name) ? {
        path: mavenPath(lib.name)!,
        url: `${(lib.url ?? 'https://libraries.minecraft.net/').replace(/\/+$/, '')}/${mavenPath(lib.name)}`
      } : null)
      if (!artifact?.url) continue
      const rel = artifact.path ?? mavenPath(lib.name) ?? path.basename(artifact.url)
      queue.push({
        dest: path.join(gameDir, 'libraries', rel),
        urls: libUrls(artifact.url, mirror),
        sha1: artifact.sha1,
        size: artifact.size,
        verifyHash: true,
        label: rel,
        // 老版本里 jinput-platform 这类库只有 natives 分类器，没有基础 jar
        optional: Boolean(lib.natives && !lib.downloads?.artifact)
      })
    }
    for (const native of collectNatives(libs, features)) {
      const art = native.artifact
      const rel = art.path ?? mavenPath(native.lib.name) ?? path.basename(art.url)
      queue.push({
        dest: path.join(gameDir, 'libraries', rel),
        urls: libUrls(art.url, mirror),
        sha1: art.sha1,
        size: art.size,
        verifyHash: true,
        label: rel
      })
    }
    for (const item of queue) meter.addTotal(item.size ?? 0)
    await runQueue(queue, meter, signal, 8)

    // 日志配置
    const logFile = json.logging?.client?.file
    if (logFile?.url) {
      meter.setPhase('libraries', '下载日志配置')
      meter.addTotal(logFile.size ?? 0)
      await runQueue(
        [
          {
            dest: path.join(gameDir, 'assets', 'log_configs', logFile.id),
            urls: libUrls(logFile.url, mirror),
            sha1: logFile.sha1,
            size: logFile.size,
            verifyHash: true,
            label: logFile.id
          }
        ],
        meter,
        signal,
        1
      )
    }

    // 资源索引
    const indexInfo = json.assetIndex
    if (!indexInfo?.url) throw new Error('版本 JSON 缺少 assetIndex，无法下载游戏资源')
    meter.setPhase('assets', '下载资源索引')
    meter.addTotal(indexInfo.size ?? 0)
    const indexDest = path.join(gameDir, 'assets', 'indexes', `${indexInfo.id}.json`)
    await runQueue(
      [
        {
          dest: indexDest,
          urls: libUrls(indexInfo.url, mirror),
          sha1: indexInfo.sha1,
          size: indexInfo.size,
          verifyHash: true,
          label: `${indexInfo.id}.json`
        }
      ],
      meter,
      signal,
      1
    )

    // 资源对象
    const indexRaw = JSON.parse(await fs.readFile(indexDest, 'utf8')) as {
      objects: Record<string, { hash: string; size: number }>
      virtual?: boolean
      map_to_resources?: boolean
    }
    const objects = Object.entries(indexRaw.objects ?? {})
    meter.setPhase('assets', `下载游戏资源（${objects.length} 个文件）`)
    const assetQueue: QueueItem[] = objects.map(([name, obj]) => ({
      dest: path.join(gameDir, 'assets', 'objects', obj.hash.slice(0, 2), obj.hash),
      urls: candidates(`https://resources.download.minecraft.net/${obj.hash.slice(0, 2)}/${obj.hash}`, mirror),
      sha1: obj.hash,
      size: obj.size,
      verifyHash: false,
      label: name
    }))
    for (const item of assetQueue) meter.addTotal(item.size ?? 0)
    await runQueue(assetQueue, meter, signal, 16)

    // 1.6 以前的版本需要把散列资源复制成 assets/virtual/<index>/<原路径>
    if (indexRaw.virtual) {
      const virtDir = path.join(gameDir, 'assets', 'virtual', indexInfo.id ?? versionId)
      meter.setPhase('assets', '生成旧版资源目录')
      for (const [name, obj] of objects) {
        const src = path.join(gameDir, 'assets', 'objects', obj.hash.slice(0, 2), obj.hash)
        const dest = path.join(virtDir, name)
        try {
          await fs.mkdir(path.dirname(dest), { recursive: true })
          await fs.copyFile(src, dest)
        } catch {
          /* 单个资源失败忽略 */
        }
      }
      log(`已生成旧版资源目录 ${virtDir}`)
    }

    meter.finish('done', '安装完成')
    log(`版本 ${versionId} 安装完成`)
  } catch (err) {
    if (isAbortError(err)) {
      meter.finish('cancelled', '已取消安装')
      log('安装已取消', 'warn')
      return
    }
    const message = err instanceof Error ? err.message : String(err)
    meter.finish('error', '安装失败', message)
    log(`安装失败：${message}`, 'error')
    throw err
  }
}

export async function installFabric(opts: InstallOptions & { loaderVersion?: string }): Promise<string> {
  const { gameDir, signal, onProgress, onLog, versionId, loaderVersion } = opts
  const log = (m: string, level: 'info' | 'warn' | 'error' = 'info') => onLog?.(m, level)
  const meter = new Meter(`fabric-${versionId}`, onProgress)
  try {
    const vanillaDir = path.join(gameDir, 'versions', versionId)
    const vanillaJson = path.join(vanillaDir, `${versionId}.json`)
    const vanillaJar = path.join(vanillaDir, `${versionId}.jar`)
    let needsVanilla = true
    try {
      await fs.access(vanillaJson)
      await fs.access(vanillaJar)
      needsVanilla = false
    } catch {
      needsVanilla = true
    }
    if (needsVanilla) {
      log(`先安装原版 ${versionId}`)
      await installVersion({ ...opts, versionId, onProgress, onLog })
    }

    meter.setPhase('prepare', '获取 Fabric 加载器')
    const loaders = await fetchFabricLoaders(versionId, signal)
    if (!loaders.length) throw new Error(`Fabric 暂不支持 ${versionId}`)
    const chosen = loaderVersion
      ? loaders.find((l) => l.version === loaderVersion)
      : loaders.find((l) => l.stable) ?? loaders[0]
    if (!chosen) throw new Error(`找不到 Fabric 加载器 ${loaderVersion}`)
    log(`使用 Fabric Loader ${chosen.version}`)

    const profile = await fetchFabricProfile(versionId, chosen.version, signal)
    const id = profile.id
    const dir = path.join(gameDir, 'versions', id)
    await ensureDir(dir)
    await writeJsonAtomic(path.join(dir, `${id}.json`), profile)

    meter.setPhase('libraries', '下载 Fabric 依赖')
    const queue: QueueItem[] = []
    for (const lib of profile.libraries ?? []) {
      const rel = lib.downloads?.artifact?.path ?? mavenPath(lib.name)
      if (!rel) continue
      const url = lib.downloads?.artifact?.url ?? `${(lib.url ?? 'https://maven.fabricmc.net/').replace(/\/+$/, '')}/${rel}`
      queue.push({
        dest: path.join(gameDir, 'libraries', rel),
        urls: [url],
        sha1: lib.downloads?.artifact?.sha1,
        size: lib.downloads?.artifact?.size,
        verifyHash: true,
        label: rel
      })
    }
    for (const item of queue) meter.addTotal(item.size ?? 0)
    await runQueue(queue, meter, signal, 8)

    // 校验继承关系可用
    await resolveVersion(gameDir, id)
    meter.finish('done', `Fabric ${chosen.version} 安装完成`)
    log(`已安装 ${id}`)
    return id
  } catch (err) {
    if (isAbortError(err)) {
      meter.finish('cancelled', '已取消安装')
      return ''
    }
    const message = err instanceof Error ? err.message : String(err)
    meter.finish('error', '安装失败', message)
    log(`Fabric 安装失败：${message}`, 'error')
    throw err
  }
}


export async function installQuilt(opts: InstallOptions & { loaderVersion?: string }): Promise<string> {
  const { gameDir, signal, onProgress, onLog, versionId, loaderVersion } = opts
  const log = (m: string, level: 'info' | 'warn' | 'error' = 'info') => onLog?.(m, level)
  const meter = new Meter(`quilt-${versionId}`, onProgress)
  const meta = 'https://meta.quiltmc.org/v3'
  try {
    const vanillaJson = path.join(gameDir, 'versions', versionId, `${versionId}.json`)
    const vanillaJar = path.join(gameDir, 'versions', versionId, `${versionId}.jar`)
    let needsVanilla = true
    try {
      await fs.access(vanillaJson)
      await fs.access(vanillaJar)
      needsVanilla = false
    } catch {
      needsVanilla = true
    }
    if (needsVanilla) await installVersion({ ...opts, versionId, onProgress, onLog })

    meter.setPhase('prepare', '获取 Quilt 加载器')
    const list = await fetchJson<{ loader: { version: string } }[]>(`${meta}/versions/loader/${versionId}`, signal)
    if (!list.length) throw new Error(`Quilt 暂不支持 ${versionId}`)
    const chosen = loaderVersion ?? list[0].loader.version
    log(`使用 Quilt Loader ${chosen}`)
    const profile = await fetchJson<VersionJson>(`${meta}/versions/loader/${versionId}/${chosen}/profile/json`, signal)
    const id = profile.id
    const dir = path.join(gameDir, 'versions', id)
    await ensureDir(dir)
    await writeJsonAtomic(path.join(dir, `${id}.json`), profile)

    meter.setPhase('libraries', '下载 Quilt 依赖')
    const queue: QueueItem[] = []
    for (const lib of profile.libraries ?? []) {
      const rel = lib.downloads?.artifact?.path ?? mavenPath(lib.name)
      if (!rel) continue
      const url = lib.downloads?.artifact?.url ?? `${(lib.url ?? 'https://maven.quiltmc.org/repository/release/').replace(/\/+$/, '')}/${rel}`
      queue.push({
        dest: path.join(gameDir, 'libraries', rel),
        urls: [url],
        sha1: lib.downloads?.artifact?.sha1,
        size: lib.downloads?.artifact?.size,
        verifyHash: true,
        label: rel
      })
    }
    for (const item of queue) meter.addTotal(item.size ?? 0)
    await runQueue(queue, meter, signal, 8)
    await resolveVersion(gameDir, id)
    meter.finish('done', `Quilt ${chosen} 安装完成`)
    return id
  } catch (err) {
    if (isAbortError(err)) {
      meter.finish('cancelled', '已取消安装')
      return ''
    }
    const message = err instanceof Error ? err.message : String(err)
    meter.finish('error', '安装失败', message)
    log(`Quilt 安装失败：${message}`, 'error')
    throw err
  }
}

export interface PuzzleInstallOptions extends Omit<InstallOptions, 'versionId'> {
  /** 原版游戏版本，目前仅支持 1.21.1 */
  mcVersion: string
}

/**
 * 安装 Puzzle（Beta）：
 * 1. 复用现有流程确保原版 1.21.1 已安装；
 * 2. 把原版 json/jar 复制到 versions/1.21.1-puzzle/，并把 json.id 改成 1.21.1-puzzle；
 * 3. 写入 scl-loader.json，让版本列表和启动逻辑识别为 Puzzle。
 * 真正的 Puzzle 客户端由 Puzzle 仓库的 tools/scl_launch.py 启动，SCL 只负责原版资源。
 */
export async function installPuzzle(opts: PuzzleInstallOptions): Promise<string> {
  const { gameDir, signal, onProgress, onLog } = opts
  const mc = String(opts.mcVersion ?? '').trim()
  const log = (m: string, level: 'info' | 'warn' | 'error' = 'info') => onLog?.(m, level)
  if (mc !== PUZZLE_GAME_VERSION) {
    throw new Error(`Puzzle 目前仅支持 Minecraft ${PUZZLE_GAME_VERSION}`)
  }
  const id = `${mc}-puzzle`
  const total = 1
  let current = 0
  const emit = (phase: InstallProgress['phase'], label: string, error?: string): void => {
    onProgress({ id, phase, label, current, total, bytes: 0, totalBytes: 0, speed: 0, error })
  }
  const checkAbort = (): void => {
    if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError')
  }
  try {
    emit('prepare', `检查原版 ${mc}`)
    const vanillaDir = path.join(gameDir, 'versions', mc)
    const vanillaJsonPath = path.join(vanillaDir, `${mc}.json`)
    const vanillaJarPath = path.join(vanillaDir, `${mc}.jar`)
    let needsVanilla = true
    try {
      await fs.access(vanillaJsonPath)
      await fs.access(vanillaJarPath)
      needsVanilla = false
    } catch {
      needsVanilla = true
    }
    if (needsVanilla) {
      log(`先安装原版 ${mc}`)
      await installVersion({ ...opts, versionId: mc })
      checkAbort()
    }

    emit('prepare', '创建 Puzzle 版本')
    const raw = JSON.parse(await fs.readFile(vanillaJsonPath, 'utf8')) as Record<string, unknown>
    raw.id = id
    delete raw.inheritsFrom
    const dir = path.join(gameDir, 'versions', id)
    await ensureDir(dir)
    await writeJsonAtomic(path.join(dir, `${id}.json`), raw)
    await fs.copyFile(vanillaJarPath, path.join(dir, `${id}.jar`))
    await writeLoaderMeta(gameDir, id, mc)
    // 校验继承链/JSON 可解析，避免写出一个无法启动的版本
    await resolveVersion(gameDir, id)

    current = total
    log(`Puzzle 版本已创建：${id}`)
    emit('done', `Puzzle ${mc} 安装完成`)
    return id
  } catch (err) {
    if (isAbortError(err)) {
      emit('cancelled', '已取消安装')
      log('安装已取消', 'warn')
      return ''
    }
    const message = err instanceof Error ? err.message : String(err)
    emit('error', '安装失败', message)
    log(`Puzzle 安装失败：${message}`, 'error')
    throw err
  }
}
