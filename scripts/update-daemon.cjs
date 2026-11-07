#!/usr/bin/env node
/**
 * 更新服务守护进程：拉起 update-server，退出自动重启，并做健康检查。
 * 由 launchd (com.scl.update-daemon) 常驻，不占用终端。
 */
const { spawn } = require('node:child_process')
const https = require('node:https')
const path = require('node:path')
const fs = require('node:fs')

const dir = path.join(__dirname, '..')
const port = Number(process.env.SCL_UPDATE_PORT || 11354)
const server = path.join(dir, 'scripts', 'update-server.cjs')
let child = null
let stopped = false
const logFile = path.join(dir, 'updates', 'daemon.log')
const logFd = fs.openSync(logFile, 'a')

function start() {
  child = spawn(process.execPath, [server, '--port', String(port)], {
    cwd: dir,
    stdio: ['ignore', logFd, logFd]
  })
  child.on('exit', (code) => {
    child = null
    if (!stopped) setTimeout(start, 2000)
  })
}

function health() {
  return new Promise((resolve, reject) => {
    https
      .get(`https://127.0.0.1:${port}/health`, { rejectUnauthorized: false, timeout: 5000 }, (res) => {
        res.resume()
        res.statusCode === 200 ? resolve() : reject(new Error(`status ${res.statusCode}`))
      })
      .on('error', reject)
      .on('timeout', function () { this.destroy(new Error('timeout')) })
  })
}

setInterval(() => {
  health().catch(() => {
    if (child) child.kill('SIGTERM')
  })
}, 30_000)

process.on('SIGTERM', () => {
  stopped = true
  if (child) child.kill('SIGTERM')
  process.exit(0)
})
process.on('SIGINT', () => {
  stopped = true
  if (child) child.kill('SIGTERM')
  process.exit(0)
})

console.log('[daemon] starting update server on', port)
start()
