const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(1600)
  const info = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('.vtable tbody tr')]
    const r = rows[1]?.getBoundingClientRect()
    const x = r ? r.left + r.width / 2 : 0
    const y = r ? r.top + r.height / 2 : 0
    const top = document.elementFromPoint(x, y)
    return { count: rows.length, box: r ? [x, y, r.width, r.height] : null, top: top ? `${top.tagName}.${top.className}` : 'none', cls: rows[1]?.className }
  })
  console.log(JSON.stringify(info))
  try {
    await p.locator('.vtable tbody tr').nth(1).click({ timeout: 4000 })
    console.log('click ok')
  } catch (e) {
    console.log('click err:', e.message.split('\n').slice(0, 6).join(' | '))
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
