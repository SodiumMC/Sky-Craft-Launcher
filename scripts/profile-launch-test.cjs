const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const s = await p.evaluate(() => window.scl.getState())
  const profile = s.versions.find((v) => v.profile && v.gameVersion === '1.20.1')
  const res = await p.evaluate((id) => window.scl.launch(id), profile.id)
  console.log('launch:', JSON.stringify(res).slice(0, 160))
  if (res.ok) {
    await p.waitForTimeout(12000)
    const logs = await p.evaluate(() => window.scl.getRecentLogs())
    console.log('tail:', logs.slice(-2).map((l) => l.text).join(' | ').slice(0, 160))
    await p.evaluate(() => window.scl.killGame()).catch(() => {})
    await p.waitForTimeout(1000)
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
