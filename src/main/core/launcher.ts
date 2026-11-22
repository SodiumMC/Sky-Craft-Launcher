/**
 * 启动核心：把 ResolvedVersion 变成一条 java 命令。
 * 负责 classpath、原生库解压、参数模板替换、macOS 主线程参数、
 * 旧版资源目录，以及 NeoForge/Forge 的 SRG 版本 jar。
 */

import { spawn, ChildProcess } from 'node:child_process'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import AdmZip from 'adm-zip'
import { Account, JavaInfo, LauncherConfig, LogLine } from '../../shared/types'
import { ensureDir, exists, offlineUuid } from './util'
import { pickJava } from './java'
import {
  artifactOf,
  collectNatives,
  DEFAULT_FEATURES,
  expandArgEntries,
  FeatureFlags,
  isNativeLib,
  resolveVersion,
  ResolvedVersion,
  rulesAllow
} from './version'

export interface LaunchOptions {
  gameDir: string
  versionId: string
  config: LauncherConfig
  account: Account
  javas: JavaInfo[]
  onLog: (line: LogLine) => void
  onExit?: (code: number | null) => void
  logDir?: string
  server?: string
  /** 实例隔离目录：存档/模组/配置写这里，库与资源仍用 gameDir */
  dataDir?: string
  /** 没有合适 Java 时由调用方自动下载，返回 java 路径 */
  ensureJava?: (major: number) => Promise<string>
}

export interface LaunchResult {
  pid: number
  logFile: string
  command: string[]
  kill: () => void
}

const APP_VERSION = '1.0.0'

/** Modrinth App 把资源放在 meta/assets，原版/其他启动器在 assets。 */
export function resolveAssetsRoot(gameDir: string): string {
  const direct = path.join(gameDir, 'assets')
  if (existsSync(path.join(direct, 'indexes'))) return direct
  const meta = path.join(gameDir, 'meta', 'assets')
  if (existsSync(path.join(meta, 'indexes'))) return meta
  return direct
}

export function expandLegacyArguments(raw: string): string[] {
  const out: string[] = []
  const re = /"([^"]*)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw))) out.push(m[1] ?? m[2])
  return out
}

export function substitute(value: string, vars: Record<string, string>): string {
  return value.replace(/\$\{([^}]+)\}/g, (whole, key: string) => (key in vars ? vars[key] : whole))
}

export function buildClasspath(resolved: ResolvedVersion, gameDir: string, features: FeatureFlags = DEFAULT_FEATURES): { classpath: string[]; missing: string[] } {
  const entries: string[] = []
  const missing: string[] = []
  for (const lib of resolved.libraries) {
    if (!rulesAllow(lib.rules, features)) continue
    if (isNativeLib(lib)) continue
    const artifact = artifactOf(lib)
    if (!artifact) continue
    const rel = artifact.path ?? ''
    if (!rel) continue
    const abs = path.join(gameDir, 'libraries', rel)
    // 只有 natives 分类器、没有基础 jar 的老库（如 jinput-platform）不进 classpath
    if (lib.natives && !fileExists(abs)) continue
    entries.push(abs)
    if (!fileExists(abs)) missing.push(rel)
  }
  const jar = path.join(gameDir, 'versions', resolved.jarId, `${resolved.jarId}.jar`)
  entries.push(jar)
  if (!fileExists(jar)) missing.push(`versions/${resolved.jarId}/${resolved.jarId}.jar`)
  return { classpath: entries, missing }
}

function fileExists(p: string): boolean {
  // 同步检查仅在启动时使用，文件数量有限
  return existsSync(p)
}

export async function prepareNatives(
  resolved: ResolvedVersion,
  gameDir: string,
  features: FeatureFlags
): Promise<string> {
  const nativesDir = path.join(gameDir, 'versions', resolved.id, 'natives')
  await fs.rm(nativesDir, { recursive: true, force: true })
  await ensureDir(nativesDir)
  // 26.x 的 JVM 参数会用到 ${natives_directory}/java、/jna、/lwjgl、/netty
  for (const sub of ['java', 'jna', 'lwjgl', 'netty']) await ensureDir(path.join(nativesDir, sub))
  const natives = collectNatives(resolved.libraries, features)
  for (const native of natives) {
    const artifact = native.artifact
    const rel = artifact.path ?? ''
    if (!rel) continue
    const jarPath = path.join(gameDir, 'libraries', rel)
    if (!fileExists(jarPath)) continue
    try {
      const zip = new AdmZip(jarPath)
      for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue
        const name = entry.entryName.replace(/\\/g, '/')
        if (/^META-INF\//i.test(name)) continue
        if (resolved.libraries.some((l) => l.extract?.exclude?.some((ex) => name.startsWith(ex)))) continue
        const dest = path.resolve(nativesDir, name)
        if (!dest.startsWith(path.resolve(nativesDir) + path.sep)) continue
        await ensureDir(path.dirname(dest))
        const data = entry.getData()
        await fs.writeFile(dest, data)
        // 新版本把 java.library.path 指向 natives/java，这里同步放一份
        const javaDest = path.resolve(path.join(nativesDir, 'java'), name)
        if (javaDest.startsWith(path.resolve(nativesDir) + path.sep)) {
          await ensureDir(path.dirname(javaDest))
          await fs.writeFile(javaDest, data).catch(() => {})
        }
        try {
          await fs.chmod(dest, 0o755)
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      throw new Error(`解压原生库失败：${rel}（${(err as Error).message}）`)
    }
  }
  return nativesDir
}

export async function prepareLegacyAssets(
  resolved: ResolvedVersion,
  gameDir: string
): Promise<string | null> {
  const info = resolved.assetIndex
  if (!info) return null
  const root = resolveAssetsRoot(gameDir)
  const indexFile = path.join(root, 'indexes', `${info.id}.json`)
  if (!fileExists(indexFile)) return null
  if (!info.virtual && !info.map_to_resources) return null
  const raw = JSON.parse(await fs.readFile(indexFile, 'utf8')) as {
    objects: Record<string, { hash: string; size: number }>
  }
  const target = path.join(root, 'virtual', info.id)
  await ensureDir(target)
  for (const [name, obj] of Object.entries(raw.objects ?? {})) {
    const src = path.join(root, 'objects', obj.hash.slice(0, 2), obj.hash)
    const dest = path.join(target, name)
    if (!fileExists(dest) && fileExists(src)) {
      await ensureDir(path.dirname(dest))
      await fs.copyFile(src, dest)
    }
  }
  return target
}

export function buildLaunchArgs(
  resolved: ResolvedVersion,
  gameDir: string,
  nativesDir: string,
  classpath: string[],
  config: LauncherConfig,
  account: Account,
  dataDir: string = gameDir
): { args: string[]; jvmArgs: string[]; gameArgs: string[] } {
  const features: FeatureFlags = {
    ...DEFAULT_FEATURES,
    has_custom_resolution: Boolean(config.customResolution)
  }
  const uuid = account.uuid || offlineUuid(account.username)
  const assetsRoot = resolveAssetsRoot(gameDir)
  const virtualAssets = path.join(assetsRoot, 'virtual', resolved.assets)
  const vars: Record<string, string> = {
    auth_player_name: account.username,
    version_name: resolved.id,
    game_directory: dataDir,
    assets_root: assetsRoot,
    game_assets: virtualAssets,
    assets_index_name: resolved.assets,
    auth_uuid: uuid,
    auth_access_token: account.type === 'microsoft' && account.accessToken ? account.accessToken : '0',
    auth_session: '0',
    user_type: account.type === 'microsoft' ? 'msa' : 'legacy',
    version_type: resolved.type || 'release',
    natives_directory: nativesDir,
    launcher_name: 'SCL',
    launcher_version: APP_VERSION,
    classpath: classpath.join(path.delimiter),
    classpath_separator: path.delimiter,
    library_directory: path.join(gameDir, 'libraries'),
    resolution_width: String(config.width || 854),
    resolution_height: String(config.height || 480),
    clientid: '',
    auth_xuid: '',
    user_properties: '{}'
  }

  let jvmArgs: string[] = expandArgEntries(resolved.arguments.jvm, features)
  if (!jvmArgs.length) {
    jvmArgs = [`-Djava.library.path=${nativesDir}`, '-cp', classpath.join(path.delimiter)]
  }
  let gameArgs: string[] = []
  if (resolved.arguments.game?.length) {
    gameArgs = expandArgEntries(resolved.arguments.game, features)
  } else if (resolved.minecraftArguments) {
    gameArgs = expandLegacyArguments(resolved.minecraftArguments)
  }
  if (resolved.logging?.client?.argument) {
    const configPath = path.join(assetsRoot, 'log_configs', resolved.logging.client.file.id)
    // 外部启动器安装的版本可能缺少日志配置，缺失时不要传入无效路径
    if (fileExists(configPath)) {
      const logArg = resolved.logging.client.argument.replace('${path}', configPath)
      if (!jvmArgs.some((a) => a.includes('log4j.configurationFile'))) jvmArgs.push(logArg)
    }
  }
  jvmArgs.push(`-Xmx${config.maxMemory}M`, `-Xms${Math.min(config.minMemory || 512, config.maxMemory)}M`)
  const customArgs = (config.jvmArgs ?? '').trim()
  if (customArgs) jvmArgs.push(...expandLegacyArguments(customArgs))
  if (config.fullscreen) gameArgs.push('--fullscreen')

  const substitutedJvm = jvmArgs.map((a) => substitute(a, vars))
  const substitutedGame = gameArgs.map((a) => substitute(a, vars))

  // Forge/NeoForge 把 asm 等库放在 -p 模块路径上；如果同一个 jar 又出现在 classpath，
  // Bootstraplauncher 会报「Module ... was already on the JVM's module path」，这里把它们从 classpath 去掉。
  const moduleJars = new Set<string>()
  for (let i = 0; i < substitutedJvm.length - 1; i++) {
    if (substitutedJvm[i] === '-p' || substitutedJvm[i] === '--module-path') {
      for (const entry of substitutedJvm[i + 1].split(path.delimiter)) {
        if (entry) moduleJars.add(path.normalize(entry))
      }
    }
  }
  if (moduleJars.size) {
    const oldCp = classpath.join(path.delimiter)
    // 模块路径上的 jar 所在 artifact 目录（去掉版本号），用于清掉 classpath 里同名的其他版本
    const moduleRoots = new Set<string>()
    for (const jar of moduleJars) moduleRoots.add(path.dirname(path.dirname(jar)))
    const filtered = classpath.filter((entry) => {
      const norm = path.normalize(entry)
      // 模块路径上的那份保留（securejarhandler 需要它注册 unionfs provider），
      // 只删掉同一 artifact 的其他版本，避免模块重名。
      if (moduleJars.has(norm)) return true
      for (const root of moduleRoots) if (norm.startsWith(root + path.sep)) return false
      return true
    })
    const newCp = filtered.join(path.delimiter)
    for (let i = 0; i < substitutedJvm.length; i++) {
      if (substitutedJvm[i] === oldCp) substitutedJvm[i] = newCp
    }
  }

  // LWJGL 在 macOS 上必须运行在主线程
  if (process.platform === 'darwin') {
    const idx = substitutedJvm.indexOf('-XstartOnFirstThread')
    if (idx > 0) {
      substitutedJvm.splice(idx, 1)
      substitutedJvm.unshift('-XstartOnFirstThread')
    } else if (idx === -1) {
      substitutedJvm.unshift('-XstartOnFirstThread')
    }
  }
  return { args: [...substitutedJvm, resolved.mainClass, ...substitutedGame], jvmArgs: substitutedJvm, gameArgs: substitutedGame }
}

export async function launchGame(opts: LaunchOptions): Promise<LaunchResult> {
  const { gameDir, versionId, config, account, javas, onLog, onExit, logDir, server } = opts
  const dataDir = opts.dataDir ?? gameDir
  const log = (text: string, level: LogLine['level'] = 'info') =>
    onLog({ source: 'launcher', level, text, time: Date.now() })

  const resolved = await resolveVersion(gameDir, versionId)
  const features: FeatureFlags = { ...DEFAULT_FEATURES, has_custom_resolution: Boolean(config.customResolution) }
  const { classpath, missing } = buildClasspath(resolved, gameDir, features)
  if (missing.length) log(`缺少 ${missing.length} 个依赖文件，版本可能不完整`, 'warn')
  if (missing.length) {
    throw new Error(`版本文件不完整，缺少 ${missing.length} 个依赖（例如 ${missing[0]}），请先重新安装该版本`)
  }
  if (!resolved.assetIndex) throw new Error('版本没有资源索引信息，无法启动')
  const indexFile = path.join(resolveAssetsRoot(gameDir), 'indexes', `${resolved.assetIndex.id}.json`)
  if (!(await exists(indexFile))) throw new Error('游戏资源索引缺失，请重新安装该版本')

  let javaPath = ''
  const overrideJava = config.javaOverrides?.[versionId]
  if (overrideJava && existsSync(overrideJava)) {
    javaPath = overrideJava
  } else if (config.javaPath) {
    javaPath = config.javaPath
    if (!(await exists(javaPath))) throw new Error(`指定的 Java 不存在：${javaPath}`)
  } else {
    const java = pickJava(javas, resolved.javaMajor)
    if (java) {
      javaPath = java.path
    } else if (opts.ensureJava) {
      log(`没有找到 Java ${resolved.javaMajor} 或更高版本，正在自动下载…`)
      javaPath = await opts.ensureJava(resolved.javaMajor)
    } else {
      throw new Error(`没有找到 Java ${resolved.javaMajor} 或更高版本，请在设置中手动选择 Java`)
    }
  }

  log(`启动 ${versionId}，Java：${javaPath}`)
  if (config.gameLanguage) {
    try {
      await ensureDir(dataDir)
      const optionsFile = path.join(dataDir, 'options.txt')
      const raw = await fs.readFile(optionsFile, 'utf8').catch(() => '')
      const lines = raw ? raw.split('\n') : []
      const idx = lines.findIndex((l) => l.startsWith('lang:'))
      if (idx >= 0) lines[idx] = `lang:${config.gameLanguage}`
      else lines.push(`lang:${config.gameLanguage}`)
      await fs.writeFile(optionsFile, lines.filter((l, i) => l !== '' || i < lines.length - 1).join('\n') + '\n', 'utf8')
      log(`游戏语言设置为 ${config.gameLanguage}`)
    } catch {
      /* 非关键配置，忽略失败 */
    }
  }
  const nativesDir = await prepareNatives(resolved, gameDir, features)
  const virtualDir = await prepareLegacyAssets(resolved, gameDir)
  if (virtualDir) log('已准备旧版资源目录 (virtual assets)')
  const overrideMemory = config.memoryOverrides?.[versionId]
  const effectiveConfig = overrideMemory ? { ...config, maxMemory: overrideMemory } : config
  const { args } = buildLaunchArgs(resolved, gameDir, nativesDir, classpath, effectiveConfig, account, dataDir)
  if (server) {
    const [host, port] = server.split(':')
    args.push('--server', host, '--port', port || '25565')
  }

  const logsRoot = logDir ?? path.join(path.dirname(gameDir), '.scl-logs')
  await ensureDir(logsRoot).catch(() => {})
  const safeId = versionId.replace(/[^\w.-]+/g, '_')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logFile = path.join(logsRoot, `${safeId}-${stamp}.log`)
  const header = [`# SCL ${APP_VERSION} 启动日志`, `# ${new Date().toISOString()}`, `# java: ${javaPath}`, `# 版本: ${versionId}`, '']
  await fs.writeFile(logFile, header.join('\n'), 'utf8').catch(() => {})
  const appendLog = async (text: string) => {
    await fs.appendFile(logFile, text + '\n').catch(() => {})
  }
  appendLog(args.join(' ')).catch(() => {})

  const child: ChildProcess = spawn(javaPath, args, {
    cwd: dataDir,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false
  })

  const recent: string[] = []
  const record = (source: LogLine['source'], level: LogLine['level'], text: string) => {
    const trimmed = text.replace(/\r$/, '')
    onLog({ source, level, text: trimmed, time: Date.now() })
    recent.push(trimmed)
    if (recent.length > 300) recent.shift()
  }

  child.stdout?.on('data', (buf: Buffer) => {
    for (const line of buf.toString('utf8').split('\n')) {
      if (line.trim()) record('game', 'info', line)
    }
  })
  child.stderr?.on('data', (buf: Buffer) => {
    for (const line of buf.toString('utf8').split('\n')) {
      if (line.trim()) record('game', 'warn', line)
    }
  })
  child.on('error', (err) => {
    record('launcher', 'error', `启动进程失败：${err.message}`)
  })

  const pid = child.pid ?? -1
  log(`游戏进程已启动 (PID ${pid})`)

  let done = false
  const finish = (code: number | null) => {
    if (done) return
    done = true
    const crash = analyzeCrash(recent, code)
    if (crash) log(crash, 'error')
    else if (code === 0) log('游戏已正常退出')
    else log(`游戏进程结束，退出码 ${code}`, code === null ? 'warn' : 'error')
    appendLog(`# exit code: ${code}`).catch(() => {})
    onExit?.(code)
  }
  child.on('exit', (code) => finish(code))
  child.on('close', (code) => finish(code))

  return {
    pid,
    logFile,
    command: [javaPath, ...args],
    kill: () => {
      try {
        child.kill('SIGTERM')
      } catch {
        /* ignore */
      }
    }
  }
}

export interface PuzzleLaunchOptions extends LaunchOptions {
  /** 原版版本号，例如 1.21.1；Puzzle 包装脚本需要原始版本目录 */
  gameVersion: string
  /** Puzzle 仓库路径，默认 PUZZLE_HOME 或 ~/Documents/Puzzle */
  puzzleHome?: string
}

/** Puzzle 仓库默认位置（可用 PUZZLE_HOME 覆盖）。 */
export function resolvePuzzleHome(explicit?: string): string {
  return explicit || process.env.PUZZLE_HOME || path.join(os.homedir(), 'Documents', 'Puzzle')
}

/**
 * 启动 Puzzle（Beta）：Puzzle 的进程、JVM 与游戏参数由
 * `<puzzleHome>/tools/scl_launch.py` 负责，SCL 只提供 root（versions/libraries/assets）、
 * 实例目录和当前账号。stdout/stderr 仍按 SCL 原有格式写入日志与日志页。
 */
export async function launchPuzzle(opts: PuzzleLaunchOptions): Promise<LaunchResult> {
  const { gameDir, config, account, javas, onLog, onExit, logDir, dataDir, server } = opts
  const instance = dataDir ?? gameDir
  const log = (text: string, level: LogLine['level'] = 'info') =>
    onLog({ source: 'launcher', level, text, time: Date.now() })

  const home = resolvePuzzleHome(opts.puzzleHome)
  const wrapper = path.join(home, 'tools', 'scl_launch.py')
  if (!existsSync(wrapper)) {
    throw new Error(`找不到 Puzzle 启动脚本：${wrapper}。请设置环境变量 PUZZLE_HOME 指向 Puzzle 仓库`)
  }
  await ensureDir(instance)

  let javaPath = ''
  const overrideJava = config.javaOverrides?.[opts.versionId]
  if (overrideJava && existsSync(overrideJava)) {
    javaPath = overrideJava
  } else if (config.javaPath && existsSync(config.javaPath)) {
    javaPath = config.javaPath
  } else {
    javaPath = pickJava(javas, 21)?.path ?? ''
  }
  if (!javaPath && opts.ensureJava) {
    log('没有找到 Java 21 或更高版本，正在自动下载…')
    try {
      javaPath = await opts.ensureJava(21)
    } catch (err) {
      log(`自动下载 Java 失败，将交由 Puzzle 自行查找：${(err as Error).message}`, 'warn')
    }
  }

  const uuid = account.uuid || offlineUuid(account.username)
  const args = [
    wrapper,
    '--root', gameDir,
    '--instance', instance,
    '--version-id', opts.gameVersion,
    '--username', account.username,
    '--uuid', uuid,
    '--user-type', account.type === 'microsoft' ? 'msa' : 'legacy',
    '--puzzle-home', home
  ]
  if (account.type === 'microsoft' && account.accessToken) args.push('--token', account.accessToken)
  if (javaPath) args.push('--java', javaPath)
  const puzzleMemory = config.memoryOverrides?.[opts.versionId] ?? config.maxMemory
  if (puzzleMemory) {
    args.push('--jvm-arg', `-Xmx${puzzleMemory}M`,
      '--jvm-arg', `-Xms${Math.min(config.minMemory || 512, puzzleMemory)}M`)
  }
  if (config.jvmArgs?.trim()) {
    for (const extra of expandLegacyArguments(config.jvmArgs)) args.push('--jvm-arg', extra)
  }
  if (server) {
    const [host, port] = server.split(':')
    args.push('--game-arg', '--server', '--game-arg', host, '--game-arg', '--port', '--game-arg', port || '25565')
  }

  const python = process.env.PUZZLE_PYTHON || 'python3'
  const logsRoot = logDir ?? path.join(path.dirname(gameDir), '.scl-logs')
  await ensureDir(logsRoot).catch(() => {})
  const safeId = opts.versionId.replace(/[^\w.-]+/g, '_')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logFile = path.join(logsRoot, `${safeId}-${stamp}.log`)
  const header = [
    `# SCL ${APP_VERSION} 启动日志`,
    `# ${new Date().toISOString()}`,
    `# puzzle: ${home}`,
    `# 版本: ${opts.versionId}（原版 ${opts.gameVersion}）`,
    javaPath ? `# java: ${javaPath}` : '# java: 由 Puzzle 自动选择',
    ''
  ]
  await fs.writeFile(logFile, header.join('\n'), 'utf8').catch(() => {})
  const appendLog = async (text: string) => {
    await fs.appendFile(logFile, text + '\n').catch(() => {})
  }
  appendLog([python, ...args].join(' ')).catch(() => {})

  log(`启动 Puzzle ${opts.gameVersion}（${opts.versionId}），Puzzle 仓库：${home}`)
  const child: ChildProcess = spawn(python, args, {
    cwd: instance,
    env: { ...process.env, PUZZLE_HOME: home },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false
  })

  const recent: string[] = []
  const record = (source: LogLine['source'], level: LogLine['level'], text: string) => {
    const trimmed = text.replace(/\r$/, '')
    onLog({ source, level, text: trimmed, time: Date.now() })
    recent.push(trimmed)
    if (recent.length > 300) recent.shift()
  }
  child.stdout?.on('data', (buf: Buffer) => {
    for (const line of buf.toString('utf8').split('\n')) {
      if (line.trim()) record('game', 'info', line)
    }
  })
  child.stderr?.on('data', (buf: Buffer) => {
    for (const line of buf.toString('utf8').split('\n')) {
      if (line.trim()) record('game', 'warn', line)
    }
  })
  child.on('error', (err) => {
    record('launcher', 'error', `启动 Puzzle 进程失败：${err.message}`)
  })

  const pid = child.pid ?? -1
  log(`Puzzle 进程已启动 (PID ${pid})`)

  let done = false
  const finish = (code: number | null) => {
    if (done) return
    done = true
    const crash = analyzeCrash(recent, code)
    if (crash) log(crash, 'error')
    else if (code === 0) log('游戏已正常退出')
    else log(`游戏进程结束，退出码 ${code}`, code === null ? 'warn' : 'error')
    appendLog(`# exit code: ${code}`).catch(() => {})
    onExit?.(code)
  }
  child.on('exit', (code) => finish(code))
  child.on('close', (code) => finish(code))

  return {
    pid,
    logFile,
    command: [python, ...args],
    kill: () => {
      try {
        child.kill('SIGTERM')
      } catch {
        /* ignore */
      }
    }
  }
}

function analyzeCrash(lines: string[], code: number | null): string | null {  if (code === 0 || code === null) return null
  const text = lines.join('\n')
  if (/UnsupportedClassVersionError/i.test(text)) return '启动失败：当前 Java 版本过低，请在设置中换用更高版本的 Java'
  if (/OutOfMemoryError/i.test(text)) return '启动失败：内存不足，请在设置中调大最大内存或关闭其他程序'
  if (/Could not find or load main class/i.test(text)) return '启动失败：主类加载失败，版本文件可能不完整'
  if (/Failed to locate library|UnsatisfiedLinkError/i.test(text)) return '启动失败：原生库加载失败，可能是操作系统/架构不匹配'
  if (/GLFW error|Failed to create window/i.test(text)) return '启动失败：创建游戏窗口失败，请检查显卡驱动或显示环境'
  if (/Missing or unsupported mandatory dependencies/i.test(text)) return '启动失败：缺少必要的前置模组'
  if (code !== 130 && code !== 143) return `游戏异常退出（退出码 ${code}），可查看日志页获取详细信息`
  return null
}

export function describeVersion(versionId: string, resolved: ResolvedVersion): string {
  return `${versionId}（${resolved.libraries.length} 个依赖）`
}
