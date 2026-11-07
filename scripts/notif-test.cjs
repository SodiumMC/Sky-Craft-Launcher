const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => { for (let i = 0; i < 4; i++) window.scl.notify('info', '测试通知 ' + (i + 1)) })
  await p.waitForTimeout(1800)
  const list = () => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()
    .filter((w) => w.webContents.getURL().includes('view=notification'))
    .map((w) => w.getBounds()).sort((a, b) => a.y - b.y))
  console.log('after show:', JSON.stringify(await list()))
  // 关掉最上面那条
  await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('view=notification'))
    w?.close()
  })
  await p.waitForTimeout(900)
  console.log('after close:', JSON.stringify(await list()))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
