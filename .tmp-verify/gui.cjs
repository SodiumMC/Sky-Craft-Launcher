const { _electron } = require('playwright-core')
const path = require('node:path')
const fs = require('node:fs')

const project = path.resolve(__dirname, '..')
const home = path.join(__dirname, 'gui-home')
const env = { ...process.env, HOME: home }
delete env.ELECTRON_RUN_AS_NODE

;(async () => {
  let app
  try {
    app = await _electron.launch({ args: ['.'], cwd: project, env })
    const page = await app.firstWindow()
    await page.waitForSelector('.shell', { timeout: 30000 })
    await page.evaluate(() => window.scl.openManager('versions'))
    await page.waitForTimeout(500)

    await page.getByPlaceholder('搜索版本号').fill('1.21.1')
    const row = page.locator('.list-row').filter({ has: page.locator('.lr-name', { hasText: /^1\.21\.1$/ }) }).first()
    await row.waitFor({ timeout: 30000 })
    await row.click()
    await page.getByRole('button', { name: '安装此版本' }).click()
    const modal = page.locator('.loader-modal')
    await modal.waitFor({ timeout: 10000 })

    const puzzleBtn = modal.locator('.loader-choice').filter({ hasText: 'Puzzle' })
    const beta = puzzleBtn.locator('.badge.beta')
    console.log('PUZZLE_BUTTON_COUNT=' + (await puzzleBtn.count()))
    console.log('PUZZLE_BUTTON_TEXT=' + JSON.stringify((await puzzleBtn.innerText()).replace(/\s+/g, ' ')))
    console.log('PUZZLE_BETA_TEXT=' + JSON.stringify(await beta.innerText()))
    console.log('PUZZLE_BETA_VISIBLE=' + (await beta.isVisible()))
    console.log('PUZZLE_BUTTON_ENABLED=' + (await puzzleBtn.isEnabled()))
    const all = await modal.locator('.loader-choice').allInnerTexts()
    console.log('ALL_CHOICES=' + JSON.stringify(all.map((s) => s.replace(/\s+/g, ' '))))
    await page.screenshot({ path: path.join(__dirname, 'loader-modal.png') })
    console.log('SCREENSHOT=' + path.join(__dirname, 'loader-modal.png'))
  } catch (err) {
    console.error('GUI_TEST_FAILED', err)
    process.exitCode = 1
  } finally {
    if (app) await app.close()
  }
})()
