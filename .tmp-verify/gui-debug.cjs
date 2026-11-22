const { _electron } = require('playwright-core')
const path = require('node:path')
const project = path.resolve(__dirname, '..')
const home = path.join(__dirname, 'gui-home')
const env = { ...process.env, HOME: home, CFFIXED_USER_HOME: home }
delete env.ELECTRON_RUN_AS_NODE
;(async () => {
  let app
  try {
    app = await _electron.launch({ args: ['.'], cwd: project, env })
    const page = await app.firstWindow()
    page.on('console', (m) => console.log('CONSOLE[' + m.type() + '] ' + m.text()))
    page.on('pageerror', (e) => console.log('PAGEERROR ' + e.message))
    await page.waitForSelector('.shell', { state: 'attached', timeout: 30000 })
    await page.waitForTimeout(1500)
    console.log('STATE_GAMEDIR=' + (await page.evaluate(() => window.scl.getState().then((s) => s.config.gameDir))))
    const dock = page.locator('.dock-item').filter({ hasText: '版本' })
    console.log('DOCK_COUNT=' + (await dock.count()))
    await dock.first().click()
    await page.waitForTimeout(1000)
    console.log('VIEW_ON=' + (await page.locator('.view.on').count()))
    await page.getByRole('button', { name: '安装新版本' }).click()
    await page.waitForTimeout(500)
    try {
      await page.waitForSelector('.list-row', { timeout: 30000 })
    } catch (e) {
      console.log('NO_ROWS_ALERT=' + JSON.stringify(await page.locator('.alert').allInnerTexts()))
      console.log('BODY_TEXT=' + JSON.stringify((await page.locator('body').innerText()).slice(0, 600)))
      throw e
    }
    console.log('ROWS_BEFORE=' + (await page.locator('.list-row').count()))
    const input = page.getByPlaceholder('搜索版本号')
    console.log('INPUT_COUNT=' + (await input.count()))
    await input.fill('1.21.1')
    await page.waitForTimeout(800)
    console.log('INPUT_VALUE=' + JSON.stringify(await input.inputValue()))
    const names = await page.locator('.list-row .lr-name').allInnerTexts()
    console.log('NAMES=' + JSON.stringify(names))
    const exact = names.filter((n) => n === '1.21.1')
    console.log('EXACT_MATCHES=' + JSON.stringify(exact))
    if (exact.length) {
      await page.locator('.list-row .lr-name').filter({ hasText: /^1\.21\.1$/ }).first().click()
      await page.waitForTimeout(500)
      console.log('DETAIL=' + JSON.stringify(await page.locator('.detail-pane h2').innerText()))
      await page.getByRole('button', { name: '安装此版本' }).click()
      await page.waitForSelector('.loader-modal')
      console.log('MODAL_HEAD=' + JSON.stringify(await page.locator('.loader-modal h2').innerText()))
      const puzzleBtn = page.locator('.loader-choice').filter({ hasText: 'Puzzle' })
      console.log('PUZZLE_ENABLED=' + (await puzzleBtn.isEnabled()))
      console.log('PUZZLE_TEXT=' + JSON.stringify((await puzzleBtn.innerText()).replace(/\s+/g, ' ')))
      await page.screenshot({ path: path.join(__dirname, 'loader-modal-1211.png') })
      console.log('SCREENSHOT=' + path.join(__dirname, 'loader-modal-1211.png'))
    }
  } catch (err) {
    console.error('FAILED', err)
    process.exitCode = 1
  } finally {
    if (app) await app.close().catch(() => {})
  }
})()
