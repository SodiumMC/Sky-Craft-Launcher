const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: 'release/SCL-darwin-arm64/SCL.app/Contents/MacOS/SCL', env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.waitForTimeout(1200)
  await p.addStyleTag({ content: 'html,body{background:radial-gradient(800px 600px at 30% 20%,#e3ebf6,#cbd7e7 60%,#b7c7dc) !important;}' })
  await p.waitForTimeout(300)
  console.log('beta tags:', await p.locator('.beta-tag').count())
  await p.screenshot({ path: '/tmp/scl-beta.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
