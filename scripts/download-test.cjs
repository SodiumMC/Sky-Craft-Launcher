const fs = require('fs')
const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const res = await p.evaluate(() => window.scl.downloadUpdate('https://frp-jar.com:11354/latest.json'))
  console.log('download:', JSON.stringify(res), 'exists:', res.path ? fs.existsSync(res.path) : false)
  if (res.path) fs.unlinkSync(res.path)
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
