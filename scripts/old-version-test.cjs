const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const inst = await p.evaluate(() => window.scl.install('1.0'))
  console.log('install:', JSON.stringify(inst).slice(0, 200))
  if (!inst.ok) { console.log((await p.evaluate(() => window.scl.getRecentLogs())).slice(-6).map(l => l.text).join('\n')); await app.close(); process.exit(1) }
  const res = await p.evaluate(() => window.scl.launch('1.0'))
  console.log('launch:', JSON.stringify(res).slice(0, 160))
  await p.waitForTimeout(12000)
  const logs = await p.evaluate(() => window.scl.getRecentLogs())
  console.log('errors:', logs.filter(l => /Exception|Error|Caused by|Exit|exit/.test(l.text)).slice(0, 8).map(l => l.text.slice(0, 200)).join('\n---\n'))
  console.log('tail:', logs.slice(-4).map(l => l.text.slice(0, 160)).join('\n'))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
