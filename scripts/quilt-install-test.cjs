const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const loaders = await p.evaluate(() => window.scl.quiltLoaders('1.21.1'))
  console.log('loader:', loaders[0]?.version)
  const res = await p.evaluate((v) => window.scl.installQuilt('1.21.1', v), loaders[0].version)
  console.log('install:', JSON.stringify(res))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
