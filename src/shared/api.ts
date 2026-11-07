import {
  AppState,
  FabricLoader,
  InstallResult,
  LaunchResult,
  LauncherConfig,
  LogLine,
  RemoteVersion,
  UpdateInfo,
  BugContext,
  BugSubmit,
  BugSubmitResult,
  CrashReport
} from './types'

export interface RemoteVersionList {
  releases: RemoteVersion[]
  snapshots: RemoteVersion[]
  latest: { release: string; snapshot: string }
}

export interface McqdqApi {
  getState(): Promise<AppState>
  refresh(): Promise<AppState>
  fetchVersions(): Promise<RemoteVersionList>
  fetchFabricLoaders(gameVersion: string): Promise<FabricLoader[]>
  install(versionId: string): Promise<InstallResult>
  installFabric(req: { gameVersion: string; loaderVersion?: string }): Promise<InstallResult>
  abortInstall(): Promise<void>
  launch(versionId: string, server?: string): Promise<LaunchResult>
  killGame(): Promise<void>
  saveConfig(patch: Partial<LauncherConfig>): Promise<AppState>
  saveAccount(username: string): Promise<AppState>
  addAccount(username: string): Promise<AppState>
  openAccount(): Promise<void>
  switchAccount(id: string): Promise<AppState>
  deleteAccount(id: string): Promise<AppState>
  pickJava(): Promise<string | null>
  pickDir(): Promise<string | null>
  pickModpackFile(): Promise<string>
  importModpack(file: string): Promise<{ ok: boolean; instanceId?: string; baseVersion?: string; loader?: string; modsInstalled?: number; error?: string }>
  readonly platform: string
  openPath(target: string): Promise<void>
  openExternal(url: string): Promise<void>
  bounceWindow(): Promise<void>
  easterEggFall(): Promise<void>
  eggClang(): Promise<void>
  onEggClang(cb: (payload: { audio?: string }) => void): () => void
  onEggFallImage(cb: (payload: { items: Array<{ dataUrl: string; x: number; y: number; w: number; h: number }>; audio?: string }) => void): () => void
  getBugContext(): Promise<BugContext>
  submitBugReport(submit: BugSubmit): Promise<BugSubmitResult>
  exportBugReport(submit: BugSubmit): Promise<{ ok: boolean; path?: string; error?: string }>
  pickBugScreenshot(): Promise<{ name: string; dataUrl: string } | null>
  downloadJava(major: number): Promise<{ ok: boolean; path?: string; error?: string }>
  checkUpdate(): Promise<{ available: boolean; current: string; info?: UpdateInfo; error?: string }>
  downloadUpdate(url: string): Promise<{ ok: boolean; path?: string; error?: string }>
  onUpdateDownloadProgress(cb: (p: { received: number; total: number }) => void): () => void
  onUpdateAvailable(cb: (info: UpdateInfo) => void): () => void
  onCrash(cb: (report: CrashReport) => void): () => void
  onWindowAnimating(cb: (active: boolean) => void): () => void
  openLogs(): Promise<void>
  openManager(view: ManagerView): Promise<void>
  focusHome(): Promise<void>
  minimizeWindow(): Promise<void>
  closeWindow(): Promise<void>
  fitWindow(height: number): Promise<void>
  resizeWindow(width: number, height: number): Promise<void>
  notify(kind: 'success' | 'error' | 'info', text: string): Promise<void>
  dismissNotification(): Promise<void>
  deleteVersion(id: string): Promise<{ ok: boolean; error?: string }>
  checkVersion(id: string): Promise<{ ok: boolean; missing?: number; repaired?: boolean; cancelled?: boolean; error?: string }>
  listMods(versionId?: string): Promise<{ name: string; size: number; mtime: number; enabled: boolean; title?: string; version?: string }[]>
  toggleMod(name: string, versionId?: string): Promise<boolean>
  deleteMod(name: string, versionId?: string): Promise<boolean>
  listSaves(versionId?: string): Promise<{ name: string; mtime: number }[]>
  deleteSave(name: string, versionId?: string): Promise<boolean>
  listContent(dir: 'resourcepacks' | 'shaderpacks', versionId?: string): Promise<{ name: string; size: number; mtime: number }[]>
  searchContent(type: 'resourcepack' | 'shader', query: string, gameVersion?: string): Promise<{ id: string; title: string; description: string; icon?: string; downloads: number }[]>
  installContent(type: 'resourcepack' | 'shader', id: string, gameVersion?: string, versionId?: string): Promise<{ ok: boolean; file?: string; error?: string }>
  deleteContent(dir: 'resourcepacks' | 'shaderpacks', name: string, versionId?: string): Promise<boolean>
  forgeVersions(mc: string): Promise<{ recommended?: string; latest?: string }>
  installForge(mc: string, forge: string): Promise<{ ok: boolean; versionId?: string; error?: string }>
  quiltLoaders(mc: string): Promise<{ version: string }[]>
  installQuilt(mc: string, loader: string): Promise<{ ok: boolean; versionId?: string; error?: string }>
  listServers(versionId?: string): Promise<{ name: string; ip: string }[]>
  saveServers(entries: { name: string; ip: string }[], versionId?: string): Promise<boolean>
  searchMods(req: { query: string; loader?: string; gameVersion?: string; sort?: 'relevance' | 'downloads' | 'newest' }): Promise<{ id: string; title: string; description: string; icon?: string; downloads: number; source: 'modrinth' }[]>
  installMod(req: { id: string; loader?: string; gameVersion?: string; versionId?: string }): Promise<{ ok: boolean; file?: string; files?: string[]; error?: string }>
  msStart(): Promise<{ deviceCode: string; userCode: string; verificationUri: string; interval: number }>
  msPoll(deviceCode: string): Promise<{ status: 'pending' | 'done' | 'error'; state?: AppState; error?: string }>
  msWebLogin(): Promise<{ ok: boolean; state?: AppState; error?: string }>
  msComplete(code: string): Promise<{ ok: boolean; state?: AppState; error?: string }>
  openLoginWindow(info: { userCode: string; verificationUri: string }): Promise<void>
  closeLoginWindow(): Promise<void>
  neoVersions(mc: string): Promise<string[]>
  installNeoForge(mc: string, version: string): Promise<{ ok: boolean; versionId?: string; error?: string }>
  onNotificationFall(cb: (payload: { angle: number }) => void): () => void
  getRecentLogs(): Promise<LogLine[]>
  onLog(cb: (line: LogLine) => void): () => void
  onInstallProgress(cb: (progress: import('./types').InstallProgress) => void): () => void
  onLaunchExit(cb: (info: { code: number | null }) => void): () => void
  onStateChanged(cb: () => void): () => void
  onNavigate(cb: (view: ManagerView) => void): () => void
  onCursor(cb: (pos: { x: number; y: number; w: number; h: number }) => void): () => void
  onViewChange(cb: (view: 'home' | 'manager') => void): () => void
  onAccountOpen(cb: (payload?: { returnHome?: boolean }) => void): () => void
  onConfigChanged(cb: (patch: { tiltStrength?: number; theme?: 'light' | 'dark' | 'system' }) => void): () => void
}

export type ManagerView = 'versions' | 'download' | 'mods' | 'saves' | 'packs' | 'servers' | 'logs' | 'settings'

declare global {
  interface Window {
    scl: McqdqApi
  }
}
