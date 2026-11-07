import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

export const APP_NAME = 'SCL'
export const USER_AGENT = `SCL/1.0.0 (Minecraft Launcher; ${process.platform})`

export function osName(): 'windows' | 'osx' | 'linux' {
  if (process.platform === 'win32') return 'windows'
  if (process.platform === 'darwin') return 'osx'
  return 'linux'
}

export function osArch(): string {
  switch (process.arch) {
    case 'x64':
      return 'x86_64'
    case 'ia32':
      return 'x86'
    case 'arm64':
      return 'arm64'
    case 'arm':
      return 'arm32'
    default:
      return process.arch
  }
}

export function osVersion(): string {
  return os.release()
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

export async function fileSize(p: string): Promise<number> {
  try {
    const st = await fs.stat(p)
    return st.isFile() ? st.size : -1
  } catch {
    return -1
  }
}

export async function sha1File(p: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha1')
    const stream = createReadStream(p)
    stream.on('error', reject)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

export function sha1(text: string): string {
  return createHash('sha1').update(text).digest('hex')
}

export async function readJson<T>(p: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(p, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function writeJsonAtomic(p: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(p))
  const tmp = `${p}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, p)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function anySignal(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(signals)
  const ctrl = new AbortController()
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort(s.reason)
      break
    }
    s.addEventListener('abort', () => ctrl.abort(s.reason), { once: true })
  }
  return ctrl.signal
}

export async function fetchJson<T>(url: string, signal?: AbortSignal, timeoutMs = 25000): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: signal ? anySignal([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return (await res.json()) as T
}

export async function fetchText(url: string, signal?: AbortSignal, timeoutMs = 25000): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: signal ? anySignal([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return await res.text()
}

/** 有限并发 map，保持结果顺序 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = new Array(Math.min(limit, items.length || 1)).fill(0).map(async () => {
    for (;;) {
      if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError')
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

export function offlineUuid(name: string): string {
  const hash = createHash('md5').update(`OfflinePlayer:${name}`, 'utf8').digest()
  hash[6] = (hash[6] & 0x0f) | 0x30
  hash[8] = (hash[8] & 0x3f) | 0x80
  const hex = hash.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function defaultGameDir(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA ?? os.homedir(), '.minecraft')
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'minecraft')
  }
  return path.join(os.homedir(), '.minecraft')
}

export function suggestedMemoryMb(): number {
  const totalMb = Math.floor(os.totalmem() / 1024 / 1024)
  if (totalMb >= 16384) return 6144
  if (totalMb >= 8192) return 4096
  if (totalMb >= 4096) return 2048
  return 1024
}

export function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'AbortError' || err.message === 'aborted' || err.message.includes('aborted'))
  )
}
