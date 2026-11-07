const AdmZip = require('adm-zip')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { _electron: electron } = require('playwright-core')

const pack = '/tmp/scl-test.mrpack'
const zip = new AdmZip()
zip.addFile('modrinth.index.json', Buffer.from(JSON.stringify({
  formatVersion: 1, game: 'minecraft', versionId: '1.20.1',
  dependencies: { minecraft: '1.20.1' }, files: []
})))
zip.addFile('overrides/config/test.txt', Buffer.from('hello'))
zip.writeZip(pack)

;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const res = await p.evaluate((f) => window.scl.importModpack(f), pack)
  console.log('import:', JSON.stringify(res))
  const inst = path.join(os.homedir(), 'Library/Application Support/ModrinthApp/meta/versions', res.instanceId)
  console.log('json:', fs.existsSync(path.join(inst, `${res.instanceId}.json`)))
  console.log('override:', fs.existsSync(path.join(inst, 'game/config/test.txt')))
  // cleanup
  fs.rmSync(inst, { recursive: true, force: true })
  const s = await p.evaluate(() => window.scl.getState())
  const iso = { ...(s.config.isolatedVersions ?? {}) }; delete iso[res.instanceId]
  await p.evaluate((i) => window.scl.saveConfig({ isolatedVersions: i }), iso)
  await app.close().catch(() => {})
  fs.rmSync(pack, { force: true })
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
