const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const dataUrl = 'data:audio/mpeg;base64,' + fs.readFileSync('resources/pipe-fall.mp3').toString('base64')
  const fileUrl = pathToFileURL(path.join(process.cwd(), 'resources/pipe-fall.mp3')).toString()
  const res = await p.evaluate(async ([data, file]) => {
    const test = (src) => new Promise((resolve) => {
      const a = new Audio(src)
      a.onloadedmetadata = () => resolve('meta:' + a.duration.toFixed(2))
      a.onerror = () => resolve('error:' + (a.error && a.error.code))
      a.play().catch((e) => resolve('playerr:' + e.name))
      setTimeout(() => resolve('timeout'), 4000)
    })
    return [await test(data), await test(file)]
  }, [dataUrl, fileUrl])
  console.log(res)
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
