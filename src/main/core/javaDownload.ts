import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import AdmZip from 'adm-zip'

const run = promisify(execFile)
const ADOPTIUM = 'https://api.adoptium.net/v3/assets/latest'
const AZUL = 'https://api.azul.com/metadata/v1/zulu/packages/'

function platformParams(archOverride?: 'x64' | 'aarch64'): { azulOs: string; azulArch: string; adoptiumOs: string; adoptiumArch: string; archive: string } {
  const isWin = process.platform === 'win32'
  const isMac = process.platform === 'darwin'
  const arm = archOverride ? archOverride === 'aarch64' : process.arch === 'arm64'
  return {
    azulOs: isMac ? 'macos' : isWin ? 'windows' : 'linux',
    azulArch: arm ? 'aarch64' : 'x86_64',
    adoptiumOs: isMac ? 'mac' : isWin ? 'windows' : 'linux',
    adoptiumArch: arm ? 'aarch64' : 'x64',
    archive: isWin ? 'zip' : 'tar.gz'
  }
}

async function azulPackage(major: number, archOverride?: 'x64' | 'aarch64'): Promise<{ link: string; name: string } | null> {
  const { azulOs, azulArch, archive } = platformParams(archOverride)
  const url = new URL(AZUL)
  url.searchParams.set('java_version', String(major))
  url.searchParams.set('os', azulOs)
  url.searchParams.set('arch', azulArch)
  url.searchParams.set('java_package_type', 'jre')
  url.searchParams.set('archive_type', archive)
  url.searchParams.set('latest', 'true')
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!res.ok) return null
  const list = (await res.json()) as Array<{ download_url?: string; name?: string }>
  const first = list[0]
  return first?.download_url && first.name ? { link: first.download_url, name: first.name } : null
}

async function adoptiumPackage(major: number, archOverride?: 'x64' | 'aarch64'): Promise<{ link: string; name: string } | null> {
  const { adoptiumOs, adoptiumArch } = platformParams(archOverride)
  const url = `${ADOPTIUM}/${major}/hotspot?architecture=${adoptiumArch}&image_type=jre&os=${adoptiumOs}&vendor=eclipse`
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!res.ok) return null
  const list = (await res.json()) as Array<{ binary?: { package?: { link?: string; name?: string } } }>
  const pkg = list[0]?.binary?.package
  return pkg?.link && pkg.name ? { link: pkg.link, name: pkg.name } : null
}

function javaInDir(root: string): string | null {
  const candidates =
    process.platform === 'darwin'
      ? fs.readdirSync(root).map((d) => path.join(root, d, 'Contents', 'Home', 'bin', 'java'))
      : fs.readdirSync(root).map((d) => path.join(root, d, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))
  return candidates.find((p) => fs.existsSync(p)) ?? null
}

/** 已下载到启动器运行库目录的 Java。 */
export function findBundledJava(runtimeDir: string, major: number, preferArch?: 'x64' | 'aarch64'): string | null {
  try {
    if (!fs.existsSync(runtimeDir)) return null
    const dirs = fs
      .readdirSync(runtimeDir)
      .filter((d) => d.startsWith(`jdk-${major}`))
      .sort((a, b) => {
        const am = preferArch && a.includes(`-${preferArch}`) ? 0 : 1
        const bm = preferArch && b.includes(`-${preferArch}`) ? 0 : 1
        return am - bm
      })
    for (const dir of dirs) {
      const found = javaInDir(path.join(runtimeDir, dir))
      if (found) return found
    }
  } catch {
    /* ignore */
  }
  return null
}

/** 从 Adoptium 下载对应版本的 JRE，解压到 runtimeDir，返回 java 可执行文件路径。 */
export async function downloadJre(
  major: number,
  runtimeDir: string,
  log: (text: string) => void,
  archOverride?: 'x64' | 'aarch64'
): Promise<string> {
  log(`正在查询 Java ${major} 下载地址…`)
  const pkg =
    (await azulPackage(major, archOverride).catch(() => null)) ??
    (await adoptiumPackage(major, archOverride).catch(() => null))
  if (!pkg) throw new Error(`没有找到 Java ${major} 的可用下载`)

  const file = path.join(os.tmpdir(), pkg.name)
  log(`正在下载 ${pkg.name}…`)
  const dl = await fetch(pkg.link, { signal: AbortSignal.timeout(600_000) })
  if (!dl.ok) throw new Error(`Java 下载失败：HTTP ${dl.status}`)
  const bin = Buffer.from(await dl.arrayBuffer())
  await fsp.writeFile(file, bin)

  const dest = path.join(runtimeDir, `jdk-${major}${archOverride ? '-' + archOverride : ''}`)
  await fsp.rm(dest, { recursive: true, force: true })
  await fsp.mkdir(dest, { recursive: true })
  log('正在解压…')
  if (pkg.name.endsWith('.zip')) new AdmZip(file).extractAllTo(dest, true)
  else await run('tar', ['-xzf', file, '-C', dest])
  await fsp.rm(file, { force: true })

  const java = javaInDir(dest)
  if (!java) throw new Error('Java 解压完成，但没有找到可执行文件')
  await run(java, ['-version']).catch(() => {})
  log(`Java ${major} 已就绪：${java}`)
  return java
}
