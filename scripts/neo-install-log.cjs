const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const inst = await p.evaluate(() => window.scl.installNeoForge('1.21.1', '21.1.264'))
  console.log('install:', JSON.stringify(inst))
  const logs = await p.evaluate(() => window.scl.getRecentLogs())
  console.log(logs.slice(-12).map((l) => l.text.slice(0, 200)).join('\n'))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
