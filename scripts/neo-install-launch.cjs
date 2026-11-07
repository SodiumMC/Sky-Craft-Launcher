const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const inst = await p.evaluate(() => window.scl.installNeoForge('1.21.1', '21.1.264'))
  console.log('install:', JSON.stringify(inst))
  if (!inst.ok) { await app.close(); process.exit(1) }
  const res = await p.evaluate((id) => window.scl.launch(id), inst.versionId)
  console.log('launch:', JSON.stringify(res).slice(0, 160))
  await p.waitForTimeout(15000)
  const logs = await p.evaluate(() => window.scl.getRecentLogs())
  console.log('errors:', logs.filter((l) => /Exception|Error|Caused by/.test(l.text)).slice(0, 6).map((l) => l.text.slice(0, 200)).join('\n---\n'))
  console.log('tail:', logs.slice(-2).map((l) => l.text.slice(0, 120)).join(' | '))
  await p.evaluate(() => window.scl.killGame()).catch(() => {})
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
