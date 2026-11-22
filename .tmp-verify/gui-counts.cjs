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
    await page.waitForSelector('.shell', { state: 'attached', timeout: 30000 })
    await page.waitForTimeout(1200)
    const dock = page.locator('.dock-item').filter({ hasText: '版本' }).first()
    await dock.click()
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: '安装新版本' }).click()
    await page.waitForTimeout(500)
    await page.waitForSelector('.list-row', { timeout: 30000 })
    await page.getByPlaceholder('搜索版本号').fill('1.21.1')
    await page.waitForTimeout(600)
    console.log('PANELS=' + (await page.locator('.page.download').count()))
    console.log('DETAIL_PANES=' + (await page.locator('.detail-pane').count()))
    console.log('DETAIL_H2=' + JSON.stringify(await page.locator('.detail-pane h2').allInnerTexts()))
    console.log('INSTALL_BTNS=' + (await page.getByRole('button', { name: '安装此版本' }).count()))
    const btns = page.getByRole('button', { name: '安装此版本' })
    for (let i = 0; i < await btns.count(); i++) {
      console.log('BTN' + i + ' visible=' + (await btns.nth(i).isVisible()) + ' box=' + JSON.stringify(await btns.nth(i).boundingBox()))
    }
    const row = page.locator('.list-row .lr-name').filter({ hasText: /^1\.21\.1$/ }).first()
    await row.click()
    await page.waitForTimeout(700)
    console.log('AFTER_DETAIL_H2=' + JSON.stringify(await page.locator('.detail-pane h2').allInnerTexts()))
    console.log('AFTER_INSTALL_BTNS=' + (await page.getByRole('button', { name: '安装此版本' }).count()))
    // click the last/first visible install button explicitly
    const visible = page.locator('.detail-pane').getByRole('button', { name: '安装此版本' })
    console.log('DETAIL_BTN_COUNT=' + (await visible.count()))
    await visible.first().click()
    await page.waitForSelector('.loader-modal')
    console.log('MODAL_HEAD=' + JSON.stringify(await page.locator('.loader-modal h2').innerText()))
    console.log('MODAL_COUNT=' + (await page.locator('.loader-modal').count()))
    const puzzleBtn = page.locator('.loader-choice').filter({ hasText: 'Puzzle' })
    console.log('PUZZLE_ENABLED=' + (await puzzleBtn.isEnabled()))
    await page.screenshot({ path: path.join(__dirname, 'loader-modal-1211.png') })
    console.log('SCREENSHOT=' + path.join(__dirname, 'loader-modal-1211.png'))
  } catch (err) {
    console.error('FAILED', err)
    process.exitCode = 1
  } finally {
    if (app) await app.close().catch(() => {})
  }
})()
