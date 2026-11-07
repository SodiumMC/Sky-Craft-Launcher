const { _electron: electron } = require('playwright-core')
const fs = require('fs')
const { execFileSync } = require('child_process')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  console.log('downloading...')
  const res = await p.evaluate(() => window.scl.downloadJava(21))
  console.log('res:', JSON.stringify(res))
  if (res.path && fs.existsSync(res.path)) {
    const out = execFileSync(res.path, ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    console.log('java ok:', out.split('\n')[0])
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
