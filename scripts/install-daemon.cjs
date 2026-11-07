#!/usr/bin/env node
/**
 * 安装/卸载更新服务守护进程（macOS LaunchAgent）
 *   node scripts/install-daemon.cjs
 *   node scripts/install-daemon.cjs --uninstall
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

const label = 'com.scl.update-daemon'
const plist = path.join(os.homedir(), 'Library', 'LaunchAgents', `${label}.plist`)
const project = path.join(__dirname, '..')
const uid = process.getuid()

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8' })
  } catch (err) {
    return String(err.stderr || err.message)
  }
}

if (process.argv.includes('--uninstall')) {
  run('launchctl', ['bootout', `gui/${uid}/${label}`])
  fs.rmSync(plist, { force: true })
  console.log('uninstalled')
  process.exit(0)
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array>
    <string>${process.execPath}</string>
    <string>${path.join(project, 'scripts', 'update-daemon.cjs')}</string>
  </array>
  <key>WorkingDirectory</key><string>${project}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/scl-update-daemon.log</string>
  <key>StandardErrorPath</key><string>/tmp/scl-update-daemon.log</string>
</dict></plist>
`

fs.mkdirSync(path.dirname(plist), { recursive: true })
fs.writeFileSync(plist, xml)
run('launchctl', ['bootout', `gui/${uid}/${label}`])
const out = run('launchctl', ['bootstrap', `gui/${uid}`, plist])
console.log(out.trim() || `installed: ${plist}`)
setTimeout(() => {
  console.log(run('launchctl', ['print', `gui/${uid}/${label}`]).split('\n').slice(0, 12).join('\n'))
}, 800)
