export type LoaderKind =
  | 'vanilla'
  | 'fabric'
  | 'forge'
  | 'neoforge'
  | 'quilt'
  | 'optifine'
  | 'unknown'

export interface VersionSummary {
  id: string
  type: string
  loader: LoaderKind
  loaderVersion?: string
  gameVersion?: string
  installed: boolean
  javaMajor?: number
  lastPlayed?: number
  path: string
  hasJar: boolean
  broken?: string
  displayName?: string
  profile?: boolean
  baseVersion?: string
}

export interface LauncherConfig {
  gameDir: string
  javaPath: string
  maxMemory: number
  minMemory: number
  jvmArgs: string
  width: number
  height: number
  customResolution: boolean
  fullscreen: boolean
  mirror: 'official' | 'bmclapi'
  selectedVersion: string
  closeOnLaunch: boolean
  lastPlayed: Record<string, number>
  memoryOverrides: Record<string, number>
  javaOverrides: Record<string, string>
  msClientId: string
  language: 'zh-CN' | 'en-US'
  dynamicWindow: boolean
  isolatedVersions?: Record<string, boolean>
  autoDownloadJava?: boolean
  theme?: 'light' | 'dark' | 'system'
  updateUrl: string
  tiltStrength: number
  gameLanguage: string
}

export interface Account {
  id: string
  username: string
  uuid: string
  type: 'offline' | 'microsoft'
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  live?: boolean
  createdAt: number
}

export interface JavaInfo {
  path: string
  version: string
  major: number
  vendor: string
  arch: string
}

export interface RemoteVersion {
  id: string
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha' | string
  releaseTime: string
  url: string
}

export interface FabricLoader {
  version: string
  stable: boolean
}

export interface InstallProgress {
  id: string
  phase: 'prepare' | 'version' | 'client' | 'libraries' | 'assets' | 'natives' | 'done' | 'error' | 'cancelled'
  label: string
  current: number
  total: number
  bytes: number
  totalBytes: number
  speed: number
  error?: string
}

export interface LogLine {
  source: 'launcher' | 'game'
  level: 'info' | 'warn' | 'error'
  text: string
  time: number
}

export interface RunningState {
  versionId: string
  pid: number
  startedAt: number
  exited?: boolean
  exitCode?: number | null
}

export interface AppState {
  config: LauncherConfig
  accounts: Account[]
  currentAccountId: string
  versions: VersionSummary[]
  javas: JavaInfo[]
  running: RunningState | null
  appVersion: string
  platform: string
  totalMemMb: number
}

export interface LaunchRequest {
  versionId: string
}

export interface InstallRequest {
  versionId: string
}

export interface FabricInstallRequest {
  gameVersion: string
  loaderVersion?: string
}

export interface InstallResult {
  ok: boolean
  versionId?: string
  error?: string
}

export interface LaunchResult {
  ok: boolean
  pid?: number
  error?: string
  logFile?: string
}


export interface UpdateInfo {
  version: string
  notes?: string
  pubDate?: string
  urls?: Record<string, string>
}


export interface CrashReport {
  title: string
  detail: string
  suggestions: string[]
  versionId?: string
  code?: number
  logFile?: string
}


export interface BugContext {
  appVersion: string
  os: string
  arch: string
  locale: string
  totalMem: number
  gameDir: string
  selectedVersion?: string
  java?: string
  javaMajor?: number
  versions: string[]
  mods: string[]
  logs: string[]
}

export interface BugSubmit {
  title: string
  category: 'bug' | 'suggestion' | 'other'
  description: string
  steps?: string
  contact?: string
  includeLogs: boolean
  includeSystem: boolean
  includeMods: boolean
  screenshots?: Array<{ name: string; dataUrl: string }>
}

export interface BugSubmitResult {
  ok: boolean
  id?: string
  error?: string
  localPath?: string
}
