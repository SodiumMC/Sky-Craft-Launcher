const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  for (const view of ['download','versions','saves','servers','settings','logs']) {
    await p.evaluate((v) => window.scl.openManager(v), view)
    await p.waitForTimeout(1100)
    const bad = await p.evaluate(() => {
      const text = [...new Set(document.body.innerText.split('\n').map(s => s.trim()).filter(s => /[\u4e00-\u9fa5]/.test(s)))]
      const attrs = [...new Set(Array.from(document.querySelectorAll('input,textarea')).map(e => e.getAttribute('placeholder')).filter(x => x && /[\u4e00-\u9fa5]/.test(x)))]
      return { text, attrs }
    })
    console.log(view, JSON.stringify(bad))
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
