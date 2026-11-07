import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import AdmZip from 'adm-zip'
import { ensureFile } from './downloader'
import { ensureDir } from './util'
import { installVersion, installFabric, installQuilt, InstallOptions } from './installer'
import { installForge, installNeoForge, ForgeInstallOptions } from './forge'

export interface ModpackResult {
  instanceId: string
  baseVersion: string
  loader: string
  loaderVersion?: string
  modsInstalled: number
}

/** 从 mrpack 的依赖里识别加载器。 */
function detectLoader(deps: Record<string, string>): { loader: string; version?: string } {
  for (const [key, value] of Object.entries(deps)) {
    const k = key.toLowerCase()
    if (k.includes('fabric')) return { loader: 'fabric', version: value }
    if (k.includes('neoforge')) return { loader: 'neoforge', version: value }
    if (k.includes('forge')) return { loader: 'forge', version: value }
    if (k.includes('quilt')) return { loader: 'quilt', version: value }
  }
  return { loader: 'vanilla' }
}

function sanitize(name: string): string {
  const s = name.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 48)
  return s || 'modpack'
}

export async function importMrpack(
  file: string,
  gameDir: string,
  opts: {
    mirror: InstallOptions['mirror']
    javas: ForgeInstallOptions['javas']
    onLog?: (text: string, level?: 'info' | 'warn' | 'error') => void
    onProgress?: InstallOptions['onProgress']
  }
): Promise<ModpackResult> {
  const log = (m: string, level: 'info' | 'warn' | 'error' = 'info') => opts.onLog?.(m, level)
  const zip = new AdmZip(file)
  const idxEntry = zip.getEntry('modrinth.index.json')
  if (!idxEntry) throw new Error('不是 Modrinth 整合包（缺少 modrinth.index.json）')
  const index = JSON.parse(idxEntry.getData().toString('utf8')) as {
    versionId?: string
    dependencies?: Record<string, string>
    files?: Array<{ path?: string; env?: Record<string, string>; downloads?: string[] }>
  }
  const deps = index.dependencies ?? {}
  const mc = deps.minecraft ?? index.versionId
  if (!mc) throw new Error('整合包没有声明 Minecraft 版本')
  const { loader, version: loaderVersion } = detectLoader(deps)
  const instanceId = sanitize(path.basename(file, '.mrpack'))

  // 计算或安装基础版本
  let baseVersion = ''
  const existing = (id: string) => existsSync(path.join(gameDir, 'versions', id, `${id}.json`))
  const baseGuess = loader === 'vanilla' ? mc : `${loader === 'fabric' ? 'fabric-loader' : loader}-${loaderVersion}-${mc}`
  if (existing(baseGuess)) {
    baseVersion = baseGuess
  } else if (existing(mc)) {
    baseVersion = mc
  } else {
    log(`安装基础版本 ${mc} / ${loader} ${loaderVersion ?? ''}`)
    if (loader === 'vanilla') {
      await installVersion({ gameDir, mirror: opts.mirror, versionId: mc, onProgress: opts.onProgress ?? (() => {}), onLog: log })
      baseVersion = mc
    } else if (loader === 'fabric') {
      baseVersion = await installFabric({ gameDir, mirror: opts.mirror, versionId: mc, loaderVersion, onProgress: opts.onProgress ?? (() => {}), onLog: log })
    } else if (loader === 'quilt') {
      baseVersion = await installQuilt({ gameDir, mirror: opts.mirror, versionId: mc, loaderVersion, onProgress: opts.onProgress ?? (() => {}), onLog: log })
    } else if (loader === 'forge') {
      baseVersion = await installForge({ gameDir, mcVersion: mc, forgeVersion: loaderVersion ?? '', javas: opts.javas, onLog: log })
    } else if (loader === 'neoforge') {
      baseVersion = await installNeoForge({ gameDir, mcVersion: mc, forgeVersion: loaderVersion ?? '', javas: opts.javas, onLog: log })
    }
    if (!baseVersion) throw new Error('基础版本安装失败')
  }

  // 写实例 JSON（inheritsFrom 基础版本）
  const instDir = path.join(gameDir, 'versions', instanceId)
  await ensureDir(instDir)
  await fs.writeFile(
    path.join(instDir, `${instanceId}.json`),
    JSON.stringify({ id: instanceId, inheritsFrom: baseVersion, type: 'release' }, null, 2)
  )

  // 解包 overrides 与下载 mod 文件
  const gameDir2 = path.join(instDir, 'game')
  await ensureDir(path.join(gameDir2, 'mods'))
  let modsInstalled = 0
  const files = index.files ?? []
  for (const f of files) {
    const isClient = !f.env || f.env.client === 'required' || f.env.client === 'optional'
    if (!isClient || !f.path) continue
    if (f.downloads?.[0]) {
      const name = path.basename(f.path)
      await ensureFile({ urls: f.downloads, dest: path.join(gameDir2, 'mods', name), label: name })
      modsInstalled++
    }
  }
  const overrides = zip.getEntries().filter((e) => e.entryName.startsWith('overrides/'))
  for (const e of overrides) {
    const rel = e.entryName.slice('overrides/'.length)
    if (!rel) continue
    const dest = path.join(gameDir2, rel)
    if (e.isDirectory) continue
    await ensureDir(path.dirname(dest))
    await fs.writeFile(dest, e.getData())
  }

  return { instanceId, baseVersion, loader, loaderVersion, modsInstalled }
}
