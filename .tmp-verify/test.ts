import fs from 'node:fs/promises'
import path from 'node:path'
import { installPuzzle } from '../src/main/core/installer'
import { launchPuzzle } from '../src/main/core/launcher'
import { readLoaderMeta } from '../src/main/core/loaderMeta'
import { listVersions } from '../src/main/core/config'

const base = path.join(__dirname, 'fixture')
const gameDir = path.join(base, 'game')
const puzzleHome = path.join(base, 'puzzle')

async function main(): Promise<void> {
  await fs.rm(base, { recursive: true, force: true })
  const vanillaDir = path.join(gameDir, 'versions', '1.21.1')
  await fs.mkdir(vanillaDir, { recursive: true })
  await fs.writeFile(
    path.join(vanillaDir, '1.21.1.json'),
    JSON.stringify({ id: '1.21.1', type: 'release', mainClass: 'net.minecraft.client.main.Main', assets: '17', assetIndex: { id: '17', url: 'https://example.invalid/17.json' } })
  )
  await fs.writeFile(path.join(vanillaDir, '1.21.1.jar'), 'fake-client-jar')

  // 1) installPuzzle
  const phases: string[] = []
  const logs: string[] = []
  const id = await installPuzzle({
    gameDir,
    mirror: 'official',
    mcVersion: '1.21.1',
    onProgress: (p) => phases.push(`${p.phase}:${p.label}`),
    onLog: (m) => logs.push(m)
  })
  console.log('INSTALL_ID=' + id)
  console.log('INSTALL_PHASES=' + JSON.stringify(phases))
  console.log('INSTALL_LOGS=' + JSON.stringify(logs))

  const versionDir = path.join(gameDir, 'versions', '1.21.1-puzzle')
  const copied = JSON.parse(await fs.readFile(path.join(versionDir, '1.21.1-puzzle.json'), 'utf8'))
  console.log('COPIED_JSON_ID=' + copied.id)
  console.log('COPIED_JAR=' + (await fs.readFile(path.join(versionDir, '1.21.1-puzzle.jar'), 'utf8')))
  console.log('META=' + JSON.stringify(await readLoaderMeta(gameDir, '1.21.1-puzzle')))

  const versions = await listVersions(gameDir, {})
  const puzzle = versions.find((v) => v.id === '1.21.1-puzzle')
  console.log('LIST_ENTRY=' + JSON.stringify(puzzle))

  // 2) launchPuzzle with a fake wrapper (no real game)
  const tools = path.join(puzzleHome, 'tools')
  await fs.mkdir(tools, { recursive: true })
  await fs.writeFile(
    path.join(tools, 'scl_launch.py'),
    '#!/usr/bin/env python3\nimport sys, json\nprint("FAKE-ARGS " + json.dumps(sys.argv[1:]))\nprint("FAKE-STDERR", file=sys.stderr)\nsys.exit(0)\n'
  )
  const lines: string[] = []
  let exitCode: number | null | undefined
  const exited = new Promise<void>((resolve) => {
    void launchPuzzle({
      gameDir,
      versionId: '1.21.1-puzzle',
      gameVersion: '1.21.1',
      puzzleHome,
      config: {
        gameDir, javaPath: '', maxMemory: 2048, minMemory: 512, jvmArgs: '', width: 854, height: 480,
        customResolution: false, fullscreen: false, mirror: 'official', selectedVersion: '', closeOnLaunch: false,
        lastPlayed: {}, memoryOverrides: {}, javaOverrides: {}, msClientId: '', language: 'zh-CN',
        dynamicWindow: true, isolatedVersions: {}, autoDownloadJava: false, theme: 'system', updateUrl: '',
        tiltStrength: 100, gameLanguage: 'zh_cn'
      },
      account: { id: 'a', username: 'Steve', uuid: '0123456789abcdef0123456789abcdef', type: 'offline', createdAt: 0 },
      javas: [],
      logDir: path.join(base, 'logs'),
      onLog: (line) => lines.push(`${line.source}/${line.level}:${line.text}`),
      onExit: (code) => { exitCode = code; resolve() }
    }).catch((err) => {
      console.log('LAUNCH_ERROR=' + err.message)
      resolve()
    })
  })
  await Promise.race([exited, new Promise((r) => setTimeout(r, 15000))])
  console.log('LAUNCH_EXIT=' + exitCode)
  console.log('LAUNCH_LINES=' + JSON.stringify(lines))

  // 3) unsupported version rejected
  try {
    await installPuzzle({ gameDir, mirror: 'official', mcVersion: '1.20.1', onProgress: () => {} })
    console.log('UNSUPPORTED=NOT_REJECTED')
  } catch (err) {
    console.log('UNSUPPORTED=' + (err as Error).message)
  }
}

void main().catch((err) => {
  console.error('TEST_FAILED', err)
  process.exit(1)
})
