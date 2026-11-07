const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: '/Applications/SCL.app/Contents/MacOS/SCL', env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const state = await p.evaluate(() => window.scl.getState())
  console.log('gameDir:', state.config.gameDir)
  console.log('versions:', state.versions.map((v) => `${v.id}:${v.installed}`).join(', '))
  console.log('check 1.20.1:', JSON.stringify(await p.evaluate(() => window.scl.checkVersion('1.20.1'))))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
