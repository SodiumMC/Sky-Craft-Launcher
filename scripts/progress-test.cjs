const fs = require('fs')
const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const out = await p.evaluate(async () => {
    const events = []
    const off = window.scl.onUpdateDownloadProgress((x) => events.push(x))
    const res = await window.scl.downloadUpdate('https://frp-jar.com:11354/progress-test.bin')
    off()
    return { res, events: events.slice(0, 4), count: events.length }
  })
  console.log(JSON.stringify(out))
  if (out.res.path) fs.unlinkSync(out.res.path)
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
