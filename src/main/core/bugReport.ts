import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import os from 'node:os'
import https from 'node:https'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import AdmZip from 'adm-zip'
import type { BugContext, BugSubmit, BugSubmitResult } from '../../shared/types'

const MAX_LOG_CHARS = 400_000
const MAX_SCREENSHOT = 3

function trimLogs(lines: string[]): string[] {
  const text = lines.join('\n')
  if (text.length <= MAX_LOG_CHARS) return lines
  return text.slice(text.length - MAX_LOG_CHARS).split('\n')
}

export function redactLog(line: string): string {
  return line
    .replace(/(--accessToken\s+)\S+/gi, '$1<redacted>')
    .replace(/(--uuid\s+)\S+/gi, '$1<redacted>')
    .replace(/(--clientId\s+)\S+/gi, '$1<redacted>')
    .replace(/(--xuid\s+)\S+/gi, '$1<redacted>')
    .replace(/(access_token|refresh_token|client_secret)["'\s:=]+\S+/gi, '$1=<redacted>')
}

export function buildReport(submit: BugSubmit, context: BugContext): Record<string, unknown> {
  const id = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8)}`
  return {
    id,
    createdAt: new Date().toISOString(),
    title: submit.title,
    category: submit.category,
    description: submit.description,
    steps: submit.steps ?? '',
    contact: submit.contact ?? '',
    appVersion: context.appVersion,
    platform: `${context.os} / ${context.arch}`,
    context: submit.includeSystem
      ? {
          appVersion: context.appVersion,
          os: context.os,
          arch: context.arch,
          locale: context.locale,
          totalMemory: context.totalMem,
          gameDir: context.gameDir,
          selectedVersion: context.selectedVersion,
          java: context.java,
          javaMajor: context.javaMajor,
          versions: context.versions
        }
      : { appVersion: context.appVersion, os: context.os, arch: context.arch },
    mods: submit.includeMods ? context.mods : [],
    logs: submit.includeLogs ? trimLogs(context.logs.map(redactLog)) : []
  }
}

function postJson(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const payload = Buffer.from(JSON.stringify(body))
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request(
      u,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length },
        timeout: 20_000,
        rejectUnauthorized: false
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          let data: unknown = text
          try {
            data = JSON.parse(text)
          } catch {
            /* ignore */
          }
          resolve({ ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300, status: res.statusCode ?? 0, data })
        })
      }
    )
    req.on('timeout', () => req.destroy(new Error('提交超时')))
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

export async function submitBugReport(
  submit: BugSubmit,
  context: BugContext,
  opts: { updateUrl: string; reportDir: string }
): Promise<BugSubmitResult> {
  const report = buildReport(submit, context) as Record<string, unknown> & { id: string; logs: string[] }
  const screenshots = (submit.screenshots ?? []).slice(0, MAX_SCREENSHOT)
  const payload = { ...report, screenshots }
  const logs = (report.logs as string[]) ?? []
  delete (report as { logs?: string[] }).logs

  await fs.mkdir(opts.reportDir, { recursive: true })
  const jsonPath = path.join(opts.reportDir, `${report.id}.json`)
  await fs.writeFile(jsonPath, JSON.stringify({ ...report, logs }, null, 2))

  const base = opts.updateUrl.replace(/\/latest\.json.*$/, '')
  let error = ''
  try {
    const res = await postJson(`${base}/api/bug-report`, { ...payload, logs })
    if (!res.ok) error = `服务器返回 ${res.status}`
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  if (error) {
    const zipPath = await exportBugReport(submit, context, opts.reportDir)
    return { ok: false, id: report.id as string, error, localPath: zipPath }
  }
  return { ok: true, id: report.id as string, localPath: jsonPath }
}

export async function exportBugReport(submit: BugSubmit, context: BugContext, dir: string): Promise<string> {
  const report = buildReport(submit, context) as Record<string, unknown> & { id: string; logs: string[] }
  const zip = new AdmZip()
  zip.addFile('report.json', Buffer.from(JSON.stringify({ ...report, logs: [] }, null, 2)))
  zip.addFile('logs.txt', Buffer.from((report.logs as string[]).join('\n')))
  zip.addFile('system.txt', Buffer.from(JSON.stringify(context, null, 2)))
  for (const [i, shot] of (submit.screenshots ?? []).slice(0, MAX_SCREENSHOT).entries()) {
    const base64 = shot.dataUrl.split(',')[1] ?? ''
    const ext = shot.name.split('.').pop()?.toLowerCase() || 'png'
    zip.addFile(`screenshot-${i + 1}.${ext}`, Buffer.from(base64, 'base64'))
  }
  await fs.mkdir(dir, { recursive: true })
  const zipPath = path.join(dir, `SCL-Bug-${report.id}.zip`)
  zip.writeZip(zipPath)
  return zipPath
}

export function latestLogFromDisk(logDir: string): string[] {
  try {
    const files = fsSync
      .readdirSync(logDir)
      .filter((f) => f.endsWith('.log'))
      .sort((a, b) => fsSync.statSync(path.join(logDir, b)).mtimeMs - fsSync.statSync(path.join(logDir, a)).mtimeMs)
    if (!files.length) return []
    const raw = fsSync.readFileSync(path.join(logDir, files[0]), 'utf8')
    return raw.split(/\r?\n/).slice(-400)
  } catch {
    return []
  }
}

export function systemInfo(): { os: string; arch: string; locale: string; totalMem: number } {
  return {
    os: `${os.type()} ${os.release()}`,
    arch: process.arch,
    locale: 'zh-CN',
    totalMem: Math.round(os.totalmem() / 1024 / 1024 / 1024)
  }
}
