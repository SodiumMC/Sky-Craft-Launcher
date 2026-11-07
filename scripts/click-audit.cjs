const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env, SCL_UPDATE_URL: 'http://127.0.0.1:1/none' }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const audit = async (page) => {
    const res = await p.evaluate(() => {
      const els = [...document.querySelectorAll('button, a, input, select, textarea, [role="button"]')]
      const bad = []
      let total = 0
      for (const el of els) {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        if (r.width < 2 || r.height < 2) continue
        if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.05 || cs.pointerEvents === 'none') continue
        if (el.closest('.view:not(.on)')) continue
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue
        total++
        const top = document.elementFromPoint(x, y)
        if (!top || !(el === top || el.contains(top) || top.contains(el))) {
          bad.push({
            tag: el.tagName,
            text: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 24),
            cls: el.className && String(el.className).slice(0, 40),
            cover: top ? `${top.tagName}.${String(top.className).slice(0, 30)}` : 'none'
          })
        }
      }
      return { total, bad }
    })
    console.log(`[${page}] interactive=${res.total} blocked=${res.bad.length}`)
    for (const b of res.bad.slice(0, 8)) console.log('  !', JSON.stringify(b))
    return res.bad.length
  }
  let bad = await audit('home')
  await p.evaluate(() => window.scl.openManager('versions'))
  await p.waitForTimeout(900)
  for (const view of ['versions', 'download', 'saves', 'packs', 'servers', 'logs', 'settings']) {
    await p.evaluate((v) => window.scl.openManager(v), view)
    await p.waitForTimeout(700)
    bad += await audit(view)
  }
  await app.close().catch(() => {})
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
