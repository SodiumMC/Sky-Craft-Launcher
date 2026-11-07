const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(2500)
  console.log(await p.evaluate(() => {
    const all = [...document.querySelectorAll('.page.download *')]
    const hit = all.find((e) => e.textContent.trim().startsWith('26.3') && e.children.length <= 3)
    const chain = []
    let n = hit
    for (let i = 0; n && i < 5; i++, n = n.parentElement) chain.push(`${n.tagName}.${n.className}`)
    const r = hit?.getBoundingClientRect()
    const top = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null
    return JSON.stringify({ chain, top: top ? `${top.tagName}.${top.className}` : 'none' })
  }))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
