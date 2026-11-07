import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { JavaInfo } from '../../shared/types'
import { exists } from './util'

function majorOf(version: string): number {
  const v = version.trim()
  if (v.startsWith('1.')) return Number(v.split('.')[1] ?? 0)
  return Number(v.split('.')[0] ?? 0)
}

function probe(javaPath: string): Promise<JavaInfo | null> {
  return new Promise((resolve) => {
    execFile(
      javaPath,
      ['-XshowSettings:properties', '-version'],
      { timeout: 7000, maxBuffer: 1024 * 256, windowsHide: true },
      (err, _stdout, stderr) => {
        if (err && !stderr) return resolve(null)
        const text = String(stderr ?? '')
        const grab = (key: string) => {
          const m = new RegExp(`${key}\\s*=\\s*(.+)`).exec(text)
          return m ? m[1].trim() : ''
        }
        let version = grab('java.version')
        if (!version) {
          const m = /version "([^"]+)"/.exec(text)
          if (m) version = m[1]
        }
        if (!version) return resolve(null)
        resolve({
          path: javaPath,
          version,
          major: majorOf(version),
          vendor: grab('java.vendor') || 'Unknown',
          arch: grab('os.arch') || process.arch
        })
      }
    )
  })
}

async function listDirs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name))
  } catch {
    return []
  }
}

async function javaCandidates(extra?: string): Promise<string[]> {
  const out = new Set<string>()
  const push = (p?: string) => {
    if (p && p.trim()) out.add(path.resolve(p.trim()))
  }
  push(extra)
  if (process.env.JAVA_HOME) {
    push(path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))
  }
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!dir) continue
    const p = path.join(dir, process.platform === 'win32' ? 'java.exe' : 'java')
    if (await exists(p)) push(p)
  }
  if (process.platform === 'darwin') {
    for (const root of ['/Library/Java/JavaVirtualMachines', path.join(os.homedir(), 'Library', 'Java', 'JavaVirtualMachines')]) {
      for (const jdk of await listDirs(root)) {
        push(path.join(jdk, 'Contents', 'Home', 'bin', 'java'))
        push(path.join(jdk, 'Contents', 'Home', 'jre', 'bin', 'java'))
      }
    }
    const mojangRuntime = path.join(os.homedir(), 'Library', 'Application Support', 'minecraft', 'runtime')
    for (const rt of await listDirs(mojangRuntime)) {
      for (const sub of await listDirs(rt)) {
        push(path.join(sub, 'jre.bundle', 'Contents', 'Home', 'bin', 'java'))
        push(path.join(sub, 'bin', 'java'))
      }
    }
  } else if (process.platform === 'win32') {
    for (const root of [
      path.join(process.env['ProgramFiles'] ?? 'C:\\Program Files', 'Java'),
      path.join(process.env['ProgramFiles'] ?? 'C:\\Program Files', 'Eclipse Adoptium'),
      path.join(process.env['ProgramFiles'] ?? 'C:\\Program Files', 'Microsoft'),
      path.join(os.homedir(), '.jdks')
    ]) {
      for (const jdk of await listDirs(root)) {
        push(path.join(jdk, 'bin', 'java.exe'))
        push(path.join(jdk, 'jre', 'bin', 'java.exe'))
      }
    }
  } else {
    for (const root of ['/usr/lib/jvm', path.join(os.homedir(), '.jdks')]) {
      for (const jdk of await listDirs(root)) {
        push(path.join(jdk, 'bin', 'java'))
      }
    }
  }
  // 只有真正存在的路径才保留
  const filtered: string[] = []
  for (const p of out) if (await exists(p)) filtered.push(p)
  return filtered
}

let cached: JavaInfo[] | null = null

export async function detectJavas(extra?: string, force = false): Promise<JavaInfo[]> {
  if (cached && !force) return cached
  const candidates = await javaCandidates(extra)
  const results: JavaInfo[] = []
  const seen = new Set<string>()
  const probed = await Promise.all(candidates.map((c) => probe(c)))
  for (const info of probed) {
    if (!info) continue
    let real = info.path
    try {
      real = await fs.realpath(info.path)
    } catch {
      /* ignore */
    }
    if (seen.has(real)) continue
    seen.add(real)
    results.push({ ...info, path: info.path })
  }
  results.sort((a, b) => b.major - a.major || a.path.localeCompare(b.path))
  cached = results
  return results
}

export function clearJavaCache(): void {
  cached = null
}

export function pickJava(javas: JavaInfo[], required: number): JavaInfo | null {
  // 1.12.2 及更早版本依赖 LaunchWrapper，Java 9+ 会直接 ClassCastException，只能用 Java 8
  const compatible =
    required <= 8 ? javas.filter((j) => j.major === 8) : javas.filter((j) => j.major >= required)
  if (compatible.length === 0) return null
  compatible.sort((a, b) => a.major - b.major)
  return compatible.find((j) => j.major === required) ?? compatible[0]
}
