/**
 * Forge / NeoForge 安装：拉取版本号、下载官方 installer、以 --installClient 运行。
 * NeoForge 的 maven 域名在部分网络不可达，因此会改写 installer 内的 JSON URL 指向 BMCLAPI；
 * 安装完成后把 installer 生成的 SRG jar 复制成版本 jar，否则启动会缺 Minecraft 类。
 */

import { spawn } from 'node:child_process'
import AdmZip from 'adm-zip'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fetchJson, fetchText, ensureDir, exists } from './util'
import { ensureFile } from './downloader'
import { pickJava } from './java'
import { JavaInfo } from '../../shared/types'

const PROMOTIONS = 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
const MAVEN = 'https://maven.minecraftforge.net/net/minecraftforge/forge'

export interface ForgeVersions {
  recommended?: string
  latest?: string
}

export async function fetchForgeVersions(mc: string): Promise<ForgeVersions> {
  const data = await fetchJson<{ promos: Record<string, string> }>(PROMOTIONS, undefined, 30000)
  return {
    recommended: data.promos[`${mc}-recommended`],
    latest: data.promos[`${mc}-latest`]
  }
}

export interface ForgeInstallOptions {
  gameDir: string
  mcVersion: string
  forgeVersion: string
  javas: JavaInfo[]
  onLog: (text: string, level?: 'info' | 'warn' | 'error') => void
  signal?: AbortSignal
}

/** Forge/NeoForge 安装器要求 gameDir 里有 launcher_profiles.json（Modrinth 的 meta 目录没有）。 */
async function ensureLauncherProfiles(gameDir: string): Promise<void> {
  const file = path.join(gameDir, 'launcher_profiles.json')
  if (!(await exists(file))) {
    await fs.writeFile(file, JSON.stringify({ profiles: {}, settings: {}, version: 3 }, null, 2))
  }
}

export async function installForge(opts: ForgeInstallOptions): Promise<string> {
  const { gameDir, mcVersion, forgeVersion, javas, onLog, signal } = opts
  const java = pickJava(javas, 8)
  if (!java) throw new Error('需要 Java 8 或更高版本来运行 Forge 安装器')
  const pair = `${mcVersion}-${forgeVersion}`
  const url = `${MAVEN}/${pair}/forge-${pair}-installer.jar`
  const cache = path.join(os.tmpdir(), 'scl-forge')
  await ensureDir(cache)
  const jar = path.join(cache, `forge-${pair}-installer.jar`)
  onLog(`下载 Forge 安装器 ${pair}`)
  await ensureFile({ urls: [url], dest: jar, label: `forge-${pair}-installer.jar` }, signal)

  await ensureLauncherProfiles(gameDir)
  onLog(`运行 Forge 安装器（Java ${java.major}）`)
  await new Promise<void>((resolve, reject) => {
    const child = spawn(java.path, ['-jar', jar, '--installClient', gameDir], { cwd: gameDir, env: { ...process.env } })
    const pipe = (buf: Buffer) => {
      for (const line of buf.toString('utf8').split('\n')) if (line.trim()) onLog(line.trim())
    }
    child.stdout.on('data', pipe)
    child.stderr.on('data', (buf) => {
      for (const line of buf.toString('utf8').split('\n')) if (line.trim()) onLog(line.trim(), 'warn')
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Forge 安装器退出码 ${code}`))
    })
    signal?.addEventListener('abort', () => child.kill('SIGTERM'), { once: true })
  })

  const versionsDir = path.join(gameDir, 'versions')
  const entries = await fs.readdir(versionsDir).catch(() => [])
  const id = entries.find((name) => name.toLowerCase().includes(`forge-${forgeVersion}`.toLowerCase()))
  if (!id) throw new Error('Forge 安装器已完成，但没有找到生成的版本目录')
  if (!(await exists(path.join(versionsDir, id, `${id}.json`)))) {
    throw new Error(`Forge 版本 ${id} 缺少 JSON`)
  }
  await attachSrgJar(gameDir, id, mcVersion)
  return id
}


const NEO_MAVEN = 'https://bmclapi2.bangbang93.com/maven/net/neoforged/neoforge'

export async function fetchNeoForgeVersions(mc: string): Promise<string[]> {
  const xml = await fetchText(`${NEO_MAVEN}/maven-metadata.xml`, undefined, 30000)
  const all = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((m) => m[1])
  const parts = mc.split('.')
  const prefix = `${parts[1]}.${parts[2] ?? '0'}.`
  return all.filter((v) => v.startsWith(prefix)).sort((a, b) => {
    const an = a.split('.').map(Number)
    const bn = b.split('.').map(Number)
    for (let i = 0; i < Math.max(an.length, bn.length); i++) {
      const d = (an[i] ?? 0) - (bn[i] ?? 0)
      if (d) return d
    }
    return 0
  })
}

function mirrorNeoInstaller(src: string, dest: string): void {
  const zip = new AdmZip(src)
  const replacements: [string, string][] = [
    ['https://maven.neoforged.net/releases/', 'https://bmclapi2.bangbang93.com/maven/'],
    ['https://maven.neoforged.net/', 'https://bmclapi2.bangbang93.com/maven/'],
    ['https://maven.minecraftforge.net/', 'https://bmclapi2.bangbang93.com/maven/'],
    ['http://files.minecraftforge.net/maven/', 'https://bmclapi2.bangbang93.com/maven/'],
    ['https://libraries.minecraft.net/', 'https://bmclapi2.bangbang93.com/maven/']
  ]
  for (const entry of zip.getEntries()) {
    if (!/\.json$/i.test(entry.entryName)) continue
    let text = entry.getData().toString('utf8')
    let changed = false
    for (const [from, to] of replacements) {
      if (text.includes(from)) {
        text = text.split(from).join(to)
        changed = true
      }
    }
    if (changed) zip.updateFile(entry.entryName, Buffer.from(text, 'utf8'))
  }
  zip.writeZip(dest)
}

async function attachSrgJar(gameDir: string, id: string, mcVersion: string): Promise<void> {
  const clientRoot = path.join(gameDir, 'libraries', 'net', 'minecraft', 'client')
  const all = await fs.readdir(clientRoot).catch(() => [])
  const matched = all.filter((dir) => dir.startsWith(`${mcVersion}-`))
  const dirs = matched.length ? matched : all
  for (const dir of dirs) {
    const files = await fs.readdir(path.join(clientRoot, dir)).catch(() => [])
    const srg = files.find((f) => f.endsWith('-srg.jar'))
    if (srg) {
      await fs.copyFile(
        path.join(clientRoot, dir, srg),
        path.join(gameDir, 'versions', id, `${id}.jar`)
      )
      return
    }
  }
}

export async function installNeoForge(opts: ForgeInstallOptions): Promise<string> {
  const { gameDir, mcVersion, forgeVersion, javas, onLog, signal } = opts
  const java = pickJava(javas, 8)
  if (!java) throw new Error('需要 Java 8 或更高版本来运行 NeoForge 安装器')
  const url = `${NEO_MAVEN}/${forgeVersion}/neoforge-${forgeVersion}-installer.jar`
  const cache = path.join(os.tmpdir(), 'scl-forge')
  await ensureDir(cache)
  const jar = path.join(cache, `neoforge-${forgeVersion}-installer.jar`)
  onLog(`下载 NeoForge 安装器 ${forgeVersion}`)
  await ensureFile({ urls: [url], dest: jar, label: jar }, signal)
  const mirrored = jar.replace(/\.jar$/, '-mirror.jar')
  onLog('把安装器内的依赖地址重写到 BMCLAPI 镜像')
  mirrorNeoInstaller(jar, mirrored)
  await ensureLauncherProfiles(gameDir)
  onLog(`运行 NeoForge 安装器（Java ${java.major}）`)
  await new Promise<void>((resolve, reject) => {
    const child = spawn(java.path, ['-jar', mirrored, '--installClient', gameDir], { cwd: gameDir, env: { ...process.env } })
    const pipe = (buf: Buffer) => {
      for (const line of buf.toString('utf8').split('\n')) if (line.trim()) onLog(line.trim())
    }
    child.stdout.on('data', pipe)
    child.stderr.on('data', (buf) => {
      for (const line of buf.toString('utf8').split('\n')) if (line.trim()) onLog(line.trim(), 'warn')
    })
    child.on('error', reject)
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`NeoForge 安装器退出码 ${code}`))))
    signal?.addEventListener('abort', () => child.kill('SIGTERM'), { once: true })
  })
  const versionsDir = path.join(gameDir, 'versions')
  const entries = await fs.readdir(versionsDir).catch(() => [])
  const id = entries.find((name) => name.toLowerCase().includes(forgeVersion.toLowerCase()))
  if (!id) throw new Error('NeoForge 安装器已完成，但没有找到生成的版本目录')
  await attachSrgJar(gameDir, id, mcVersion)
  return id
}
