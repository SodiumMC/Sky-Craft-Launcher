import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { anySignal, ensureDir, exists, fileSize, isAbortError, sha1File, sleep, USER_AGENT } from './util'

export interface DownloadTask {
  urls: string[]
  dest: string
  sha1?: string
  size?: number
  verifyHash?: boolean
  label?: string
}

export interface DownloadOutcome {
  downloaded: boolean
  bytes: number
}

async function downloadOnce(url: string, task: DownloadTask, signal: AbortSignal | undefined, onBytes: (n: number) => void): Promise<void> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new Error('连接超时')), 20000)
  let res: Response
  try {
    res = await fetch(url, {
      signal: signal ? anySignal([signal, ctrl.signal]) : ctrl.signal,
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow'
    })
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }
  await ensureDir(path.dirname(task.dest))
  const part = `${task.dest}.part`
  await fs.rm(part, { force: true })
  const hash = createHash('sha1')
  let received = 0
  const meter = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      hash.update(chunk)
      received += chunk.length
      onBytes(chunk.length)
      cb(null, chunk)
    }
  })
  try {
    await pipeline(Readable.fromWeb(res.body as import('node:stream/web').ReadableStream), meter, createWriteStream(part))
    if (task.sha1 && hash.digest('hex') !== task.sha1) {
      throw new Error('SHA1 校验失败')
    }
    if (task.size && received !== task.size) {
      throw new Error(`文件大小不符 (${received}/${task.size})`)
    }
    await fs.rename(part, task.dest)
  } catch (err) {
    await fs.rm(part, { force: true })
    throw err
  }
}

export async function ensureFile(
  task: DownloadTask,
  signal?: AbortSignal,
  onBytes: (n: number) => void = () => {}
): Promise<DownloadOutcome> {
  const size = await fileSize(task.dest)
  if (size >= 0) {
    const sizeOk = task.size ? size === task.size : true
    if (sizeOk) {
      if (task.verifyHash && task.sha1) {
        try {
          if ((await sha1File(task.dest)) === task.sha1) return { downloaded: false, bytes: size }
        } catch {
          /* 重新下载 */
        }
      } else {
        return { downloaded: false, bytes: size }
      }
    }
  }
  let lastErr: unknown = null
  for (const url of task.urls) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError')
      try {
        await downloadOnce(url, task, signal, onBytes)
        return { downloaded: true, bytes: task.size ?? (await fileSize(task.dest)) ?? 0 }
      } catch (err) {
        if (isAbortError(err) || signal?.aborted) throw err
        lastErr = err
        await sleep(400 + attempt * 800)
      }
    }
  }
  throw new Error(`下载失败：${task.label ?? task.dest} (${lastErr instanceof Error ? lastErr.message : String(lastErr)})`)
}
