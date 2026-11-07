const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const test = async (platform) => p.evaluate(async (plat) => {
    Object.defineProperty(window.scl, 'platform', { value: plat, configurable: true })
    let got = ''
    const orig = window.scl.downloadUpdate
    window.scl.downloadUpdate = async (u) => { got = u; return { ok: true, path: '/tmp/x' } }
    await window.scl.openManager('home').catch(() => {})
    // 触发一次更新检查并等待弹窗出现
    await window.scl.checkUpdate()
    await new Promise((r) => setTimeout(r, 400))
    const btn = document.querySelector('.update-card button.primary')
    if (btn) btn.click()
    await new Promise((r) => setTimeout(r, 300))
    window.scl.downloadUpdate = orig
    return got
  }, platform)
  console.log('darwin ->', await test('darwin'))
  // 关闭弹窗后重开
  await p.evaluate(() => document.querySelector('.update-card .icon-btn')?.click())
  await p.waitForTimeout(300)
  console.log('win32 ->', await test('win32'))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
