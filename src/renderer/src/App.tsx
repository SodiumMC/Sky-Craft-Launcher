/**
 * 管理页（单窗口内的第二个视图）。
 * 由 Root 同时挂载，通过 view:change 切换可见性，不重新加载页面。
 * 弹窗不是浮层：打开时会用 resizeWindow 把窗口变成弹窗尺寸，关闭再恢复。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AppState,
  BugContext,
  BugSubmitResult,
  FabricLoader,
  InstallProgress,
  LauncherConfig,
  LogLine,
  RemoteVersion,
  VersionSummary
} from '../../shared/types'
import { Icon } from './components/Icons'
import { tr, type Lang } from './i18n'
import { LIVE_AUTH_URL, LIVE_REDIRECT } from '../../shared/constants'
import {
  avatarGradient,
  formatBytes,
  formatDate,
  formatRelative,
  formatSpeed,
  initials,
  loaderMeta,
  percent,
  typeLabel
} from './lib/format'

type Page = 'home' | 'versions' | 'download' | 'mods' | 'saves' | 'packs' | 'servers' | 'settings' | 'logs'
type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  text: string
  exit?: 'back' | 'drop'
}

const api = window.scl

const NAV: { page: Page; label: string; icon: React.ComponentProps<typeof Icon>['name']; tip: string }[] = [
  { page: 'versions', label: '版本', icon: 'grid', tip: '版本管理与安装' },
  { page: 'download', label: '下载', icon: 'download', tip: '模组 / 资源包 / 光影 / 整合包' },
  { page: 'saves', label: '存档', icon: 'folder', tip: '当前版本的存档' },
  { page: 'packs', label: '资源包', icon: 'package', tip: '本地资源包与光影管理' },
  { page: 'servers', label: '服务器', icon: 'globe', tip: '服务器列表与快速进入' },
  { page: 'logs', label: '日志', icon: 'terminal', tip: '启动与游戏日志' },
  { page: 'settings', label: '设置', icon: 'settings', tip: '启动器设置' }
]

export default function App(): React.ReactElement {
  const [state, setState] = useState<AppState | null>(null)
  const [page, setPage] = useState<Page>(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    return tab && ['versions', 'download', 'logs', 'settings'].includes(tab) ? (tab as Page) : 'versions'
  })
  const [logs, setLogs] = useState<LogLine[]>([])
  const [install, setInstall] = useState<InstallProgress | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [accountOpen, setAccountOpen] = useState(false)
  const [versionSettings, setVersionSettings] = useState<VersionSummary | null>(null)
  const [accountFromHome, setAccountFromHome] = useState(false)
  const [launching, setLaunching] = useState(false)

  const notify = useCallback((kind: ToastKind, text: string) => {
    void api.notify(kind, text)
  }, [])

  const refresh = useCallback(async () => {
    setState(await api.getState())
  }, [])

  useEffect(() => {
    void refresh()
    void api.getRecentLogs().then(setLogs)
    const offLog = api.onLog((line) => setLogs((prev) => [...prev.slice(-800), line]))
    const offProgress = api.onInstallProgress((p) => {
      setInstall(p)
      if (['done', 'error', 'cancelled'].includes(p.phase)) {
        void refresh()
        if (p.phase === 'done') notify('success', `${p.id} 安装完成`)
        if (p.phase === 'error') notify('error', p.error ?? '安装失败')
        window.setTimeout(() => setInstall((cur) => (cur && cur.phase === p.phase ? null : cur)), 3000)
      }
    })
    const offExit = api.onLaunchExit(({ code }) => {
      void refresh()
      notify(code === 0 ? 'info' : 'error', code === 0 ? '游戏已退出' : `游戏异常退出（${code ?? '未知'}）`)
    })
    const offState = api.onStateChanged(() => void refresh())
    const offNav = api.onNavigate((view) => setPage(view))
    const offAccount = api.onAccountOpen((payload) => {
      if (state?.config.dynamicWindow) void api.resizeWindow(460, 560)
      setAccountFromHome(Boolean(payload?.returnHome))
      setAccountOpen(true)
    })
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      offLog()
      offProgress()
      offExit()
      offState()
      offNav()
      offAccount()
      window.removeEventListener('focus', onFocus)
    }
  }, [notify, refresh])

  useEffect(() => {
    const fit = () => {
      const el = document.querySelector('.viewport > .page') as HTMLElement | null
      if (!el || el.offsetParent === null) return
      const host = el.closest('.view')
      if (host && !host.classList.contains('on')) return
      const fixed: Record<string, number> = { download: 640, mods: 580, saves: 560, packs: 580, servers: 600, logs: 600 }
      void api.fitWindow(fixed[page] ?? el.scrollHeight + 174)
    }
    const timer = window.setTimeout(fit, 90)
    const el = document.querySelector('.viewport > .page')
    const ro = new ResizeObserver(fit)
    if (el) ro.observe(el)
    window.addEventListener('resize', fit)
    return () => {
      window.clearTimeout(timer)
      ro.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [page, state?.versions.length, logs.length, install?.phase])

  const updateConfig = useCallback(
    async (patch: Partial<LauncherConfig>) => {
      setState((prev) => (prev ? { ...prev, config: { ...prev.config, ...patch } } : prev))
      try {
        setState(await api.saveConfig(patch))
      } catch (err) {
        notify('error', (err as Error).message)
      }
    },
    [notify]
  )

  const selected = useMemo(() => {
    if (!state) return null
    return (
      state.versions.find((v) => v.id === state.config.selectedVersion && v.installed) ??
      state.versions.find((v) => v.installed) ??
      null
    )
  }, [state])

  const selectVersion = useCallback((id: string) => void updateConfig({ selectedVersion: id }), [updateConfig])

  const launch = useCallback(
    async (id?: string, server?: string) => {
      const versionId = id ?? selected?.id
      if (!versionId) {
        notify('error', '请先安装一个版本')
        setPage('download')
        return
      }
      if (state?.running) {
        await api.killGame()
        notify('info', '正在停止游戏…')
        return
      }
      setLaunching(true)
      try {
        const res = await api.launch(versionId, server)
        if (!res.ok) notify('error', res.error ?? '启动失败')
        else {
          notify('success', `${versionId} 已启动`)
          void refresh()
        }
      } finally {
        setLaunching(false)
      }
    },
    [notify, refresh, selected, state?.running]
  )

  const startInstall = useCallback(
    async (versionId: string, fabric?: { gameVersion: string; loader?: string }) => {
      setInstall({
        id: fabric ? `fabric-${fabric.gameVersion}` : versionId,
        phase: 'prepare',
        label: '准备中',
        current: 0,
        total: 0,
        bytes: 0,
        totalBytes: 0,
        speed: 0
      })
      const res = fabric
        ? await api.installFabric({ gameVersion: fabric.gameVersion, loaderVersion: fabric.loader })
        : await api.install(versionId)
      if (!res.ok) notify('error', res.error ?? '安装失败')
      void refresh()
    },
    [notify, refresh]
  )

  if (!state) {
    return (
      <div className="boot">
        <div className="boot-logo">SC</div>
        <p>正在加载 SCL…</p>
      </div>
    )
  }

  const L = (state.config.language ?? 'zh-CN') as Lang
  const t = (text: string) => tr(L, text)
  const account = state.accounts.find((a) => a.id === state.currentAccountId) ?? state.accounts[0]
  const installedCount = state.versions.filter((v) => v.installed).length
  const mirrorLabel = state.config.mirror === 'bmclapi' ? 'BMCLAPI 镜像' : 'Mojang 官方'
  const title: Record<Page, string> = { home: '启动', versions: '版本', download: '下载', mods: '模组', saves: '存档', packs: '资源包', servers: '服务器', logs: '日志', settings: '设置' }
  const subtitle: Record<Page, string> = {
    home: `${installedCount} 个已安装版本 · ${account?.username ?? ''}`,
    versions: `共 ${state.versions.length} 个版本`,
    download: `下载源 ${mirrorLabel}`,
    mods: '管理全局 mods 目录',
    saves: '世界存档',
    packs: '资源包与光影包',
    servers: 'servers.dat 服务器列表',
    logs: state.running ? `游戏运行中 · PID ${state.running.pid}` : '启动器与游戏输出',
    settings: '修改后自动保存'
  }

  return (
    <>
      <div className="home-top manager-top">
        <div className="home-win">
          <button className="win-btn" title="最小化" onClick={() => void api.minimizeWindow()}>
            <Icon name="minimize" size={12} />
          </button>
          <button className="win-btn" title="隐藏启动器" onClick={() => void api.closeWindow()}>
            <Icon name="close" size={12} />
          </button>
        </div>
      </div>
      <div className={`shell ${state.platform === 'darwin' ? 'is-mac' : ''}`}>
      <aside className="sidebar">
        <div className="brand" onClick={() => void api.focusHome()} title="打开启动页">
          <span className="logo">SC</span>
          <span className="brand-name">
            SCL
            <small>Sky Craft Launcher</small>
          </span>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <button
              key={item.page}
              className={`nav-item ${page === item.page ? 'active' : ''}`}
              onClick={() => setPage(item.page)}
            >
              <Icon name={item.icon} size={16} />
              <span>{t(item.label)}</span>
              {item.page === 'versions' && installedCount > 0 && <em>{installedCount}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-fill" />
        <button
          className="account"
          onClick={() => {
            if (state.config.dynamicWindow) void api.resizeWindow(460, 560)
            setAccountOpen(true)
          }}
        >
          <span className="avatar" style={{ background: avatarGradient(account?.username ?? 'Player') }}>
            {initials(account?.username ?? 'Player')}
          </span>
          <span className="account-name">
            {account?.username ?? 'Player'}
            <small>离线账户</small>
          </span>
          <Icon name="chevronRight" size={14} />
        </button>
        <div className="sidebar-foot">v{state.appVersion}</div>
      </aside>

      <div className="workspace">
        <div className="card-bar">
          <div className="card-bar-title">
            <span className="card-brand-inline">SCL<em className="beta-tag">BETA</em></span>
            <strong>{t(title[page])}</strong>
            <span>{subtitle[page]}</span>
          </div>
          <div className="card-bar-actions">
            {install && (
              <span className="task-chip">
                <span className="spinner" />
                {percent(install.bytes, install.totalBytes)}%
              </span>
            )}
            <button className="icon-btn" title="刷新" onClick={() => void api.refresh().then(setState)}>
              <Icon name="refresh" size={15} />
            </button>
            <button className="icon-btn" title="打开游戏目录" onClick={() => void api.openPath(state.config.gameDir)}>
              <Icon name="folder" size={15} />
            </button>
            <button
              className="avatar card-avatar"
              title={`${account?.username ?? 'Player'} · 账户设置`}
              style={{ background: avatarGradient(account?.username ?? 'Player') }}
              onClick={() => setAccountOpen(true)}
            >
              {initials(account?.username ?? 'Player')}
            </button>
          </div>
        </div>
        <header className="topbar">
          <div className="topbar-title">
            <strong>{t(title[page])}</strong>
            <span>{subtitle[page]}</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" title="启动页" onClick={() => void api.focusHome()}>
              <Icon name="play" size={15} />
            </button>
            {install && (
              <button className="task-chip" onClick={() => setPage('download')}>
                {install.phase === 'done' ? (
                  <Icon name="check" size={14} />
                ) : install.phase === 'error' ? (
                  <Icon name="warning" size={14} />
                ) : (
                  <span className="spinner" />
                )}
                <span>
                  {install.phase === 'done'
                    ? '任务完成'
                    : install.phase === 'error'
                      ? '任务失败'
                      : `${percent(install.bytes, install.totalBytes)}%`}
                </span>
              </button>
            )}
            <button className="icon-btn" title="刷新" onClick={() => void api.refresh().then(setState)}>
              <Icon name="refresh" size={16} />
            </button>
            <button className="icon-btn" title="打开游戏目录" onClick={() => void api.openPath(state.config.gameDir)}>
              <Icon name="folder" size={16} />
            </button>
            <div className="topbar-winctl">
              <button className="win-btn" title="最小化" onClick={() => void api.minimizeWindow()}>
                <Icon name="minimize" size={12} />
              </button>
              <button className="win-btn" title="关闭" onClick={() => void api.closeWindow()}>
                <Icon name="close" size={12} />
              </button>
            </div>
          </div>
        </header>

        <div className="viewport">
          {page === 'home' && (
            <Dashboard
              state={state}
              selected={selected}
              logs={logs}
              install={install}
              launching={launching}
              onLaunch={launch}
              onSelect={selectVersion}
              onPage={setPage}
              onInstallCancel={() => void api.abortInstall()}
            />
          )}
          {page === 'versions' && (
            <VersionsPage
              state={state}
              selected={selected}
              onSelect={selectVersion}
              onLaunch={(id) => void launch(id)}
              onPage={setPage}
              notify={notify}
              onConfig={updateConfig}
              onSettings={setVersionSettings}
              install={install}
              onInstall={(id) => void startInstall(id)}
              onInstallFabric={(gv, lv) => void startInstall('', { gameVersion: gv, loader: lv })}
              onCancel={() => void api.abortInstall()}
              onInstallForge={(mc, forge) => {
                void api.installForge(mc, forge).then((r) => {
                  if (r.ok) notify('success', `Forge ${forge} 安装完成`)
                  else notify('error', r.error ?? 'Forge 安装失败')
                  void refresh()
                })
              }}
              onInstallQuilt={(mc, loader) => {
                void api.installQuilt(mc, loader).then((r) => {
                  if (r.ok) notify('success', `Quilt ${loader} 安装完成`)
                  else notify('error', r.error ?? 'Quilt 安装失败')
                  void refresh()
                })
              }}
            />
          )}
          {page === 'download' && (
            <DownloadPage state={state} notify={notify} selected={selected} gameDir={state.config.gameDir} />
          )}
          {page === 'saves' && <SavesPage
            notify={notify}
            gameDir={
              (selected && state.config.isolatedVersions?.[selected.id])
                ? `${state.config.gameDir}/versions/${selected.id}/game`
                : state.config.gameDir
            }
            versionId={selected?.id}
          />}
          {page === 'packs' && <PacksPage
            notify={notify}
            gameDir={
              (selected && state.config.isolatedVersions?.[selected.id])
                ? `${state.config.gameDir}/versions/${selected.id}/game`
                : state.config.gameDir
            }
            versionId={selected?.id}
            gameVersion={selected?.gameVersion}
          />}
          {page === 'servers' && (
            <ServersPage
              gameDir={state.config.gameDir}
              versionId={selected?.id}
              notify={notify}
              onJoin={(ip) => {
                if (!selected) notify('error', '请先选择一个已安装版本')
                else void launch(selected.id, ip)
              }}
            />
          )}
          {page === 'settings' && <SettingsPage state={state} onChange={updateConfig} />}
          {page === 'logs' && <LogsPage logs={logs} running={state.running} notify={notify} />}
        </div>

        <footer className="statusbar">
          <span className="status-left">
            <i className={`status-dot ${state.running ? 'on' : ''}`} />
            {state.running ? `运行中 · ${state.running.versionId}` : '就绪'}
          </span>
          <span>{selected?.id ?? '未选择版本'}</span>
          <span>{state.config.maxMemory / 1024} GB 内存</span>
          <span>Java {state.javas[0]?.major ?? '未检测'}</span>
          <span>{mirrorLabel}</span>
        </footer>
      </div>

      </div>

      <div className="home-dock manager-dock">
        <button className="dock-item" onClick={() => void api.focusHome()}>
          <Icon name="play" size={15} />
          <span>启动</span>
        </button>
        {NAV.map((item) => (
          <button
            key={item.page}
            className={`dock-item ${page === item.page ? 'dock-active' : ''}`}
            onClick={() => setPage(item.page)}
          >
            <Icon name={item.icon} size={15} />
            <span>{t(item.label)}</span>
          </button>
        ))}
      </div>

      {install && (
        <div className={`task-dock ${install.phase === 'error' ? 'error' : ''}`}>
          <div className="task-dock-head">
            <Icon name={install.phase === 'done' ? 'check' : install.phase === 'error' ? 'warning' : 'download'} size={15} />
            <strong>{install.id}</strong>
            <span>{install.label}</span>
            {['done', 'error', 'cancelled'].includes(install.phase) ? (
              <button className="icon-btn tiny" onClick={() => setInstall(null)}>
                <Icon name="close" size={13} />
              </button>
            ) : (
              <button className="link danger" onClick={() => void api.abortInstall()}>
                取消
              </button>
            )}
          </div>
          <div className={`progress ${install.totalBytes ? '' : 'indeterminate'}`}>
            <i style={{ width: install.totalBytes ? `${percent(install.bytes, install.totalBytes)}%` : undefined }} />
          </div>
          <div className="task-dock-foot">
            <span>
              {formatBytes(install.bytes)} / {formatBytes(install.totalBytes)}
            </span>
            <span>{formatSpeed(install.speed)}</span>
          </div>
        </div>
      )}

      {versionSettings && (
        <VersionSettings
          version={versionSettings}
          state={state}
          onClose={() => setVersionSettings(null)}
          onConfig={updateConfig}
          notify={notify}
        />
      )}

      {accountOpen && (
        <AccountDialog
          state={state}
          onClose={() => {
            setAccountOpen(false)
            if (accountFromHome) {
              setAccountFromHome(false)
              void api.focusHome()
            } else if (state.config.dynamicWindow) {
              void api.resizeWindow(880, 620)
            }
          }}
          onChanged={setState}
          notify={notify}
        />
      )}
    </>
  )
}

function LoaderTag({ loader }: { loader: VersionSummary['loader'] }): React.ReactElement {
  const meta = loaderMeta(loader)
  return (
    <span className="loader-tag" style={{ color: meta.color, background: meta.bg }}>
      {meta.label}
    </span>
  )
}

function effectiveJavaMajor(state: AppState, version: VersionSummary | null): number | undefined {
  const required = version?.javaMajor
  const override = version ? state.config.javaOverrides?.[version.id] : ''
  const overrideMajor = override ? state.javas.find((j) => j.path === override)?.major : undefined
  const globalMajor = state.config.javaPath
    ? state.javas.find((j) => j.path === state.config.javaPath)?.major
    : undefined
  const auto = state.javas.filter((j) => !required || j.major >= required).sort((a, b) => a.major - b.major)[0]
  return overrideMajor ?? globalMajor ?? auto?.major ?? required
}

function Dashboard(props: {
  state: AppState
  selected: VersionSummary | null
  logs: LogLine[]
  install: InstallProgress | null
  launching: boolean
  onLaunch: (id?: string) => Promise<void>
  onSelect: (id: string) => void
  onPage: (p: Page) => void
  onInstallCancel: () => void
}): React.ReactElement {
  const { state, selected, logs, install, launching, onLaunch, onSelect, onPage } = props
  const running = Boolean(state.running)
  const installed = state.versions.filter((v) => v.installed)

  return (
    <div className="page dashboard">
      <section className="launch-band">
        <div className="lb-main">
          <div className="caps">当前版本</div>
          <div className="lb-title">
            {selected ? selected.displayName ?? selected.id : '未安装版本'}
            {selected && <LoaderTag loader={selected.loader} />}
          </div>
          <div className="lb-meta">
            {selected ? (
              <>
                <span>游戏 {selected.gameVersion}</span>
                <span>Java {effectiveJavaMajor(state, selected) ?? '—'}</span>
                <span>{selected.lastPlayed ? `上次启动 ${formatRelative(selected.lastPlayed)}` : '尚未启动'}</span>
              </>
            ) : (
              <span>前往下载页安装原版或 Fabric 版本</span>
            )}
          </div>
        </div>
        <div className="lb-actions">
          <VersionPicker state={state} selected={selected} onSelect={onSelect} />
          {selected ? (
            <button className={`btn ${running ? 'danger' : 'primary'} lg`} disabled={launching} onClick={() => void onLaunch()}>
              {launching ? <span className="spinner light" /> : <Icon name={running ? 'stop' : 'play'} size={16} />}
              {launching ? '启动中…' : running ? '停止游戏' : '启动游戏'}
            </button>
          ) : (
            <button className="btn primary lg" onClick={() => onPage('download')}>
              <Icon name="download" size={16} /> 下载版本
            </button>
          )}
        </div>
      </section>

      <div className="metrics">
        <div>
          <b>{installed.length}</b>
          <span>已安装版本</span>
        </div>
        <div>
          <b>{state.config.maxMemory / 1024} GB</b>
          <span>分配内存</span>
        </div>
        <div>
          <b>{effectiveJavaMajor(state, selected) ?? '—'}</b>
          <span>游戏 Java</span>
        </div>
        <div>
          <b>{state.config.mirror === 'bmclapi' ? 'BMCLAPI' : '官方'}</b>
          <span>下载源</span>
        </div>
      </div>

      {install && (
        <div className="inline-task">
          <div className="inline-task-head">
            <strong>{install.label}</strong>
            <span>{percent(install.bytes, install.totalBytes)}%</span>
          </div>
          <div className="progress">
            <i style={{ width: `${percent(install.bytes, install.totalBytes)}%` }} />
          </div>
          <div className="inline-task-foot">
            <span>
              {formatBytes(install.bytes)} / {formatBytes(install.totalBytes)} · {formatSpeed(install.speed)}
            </span>
            <button className="link danger" onClick={props.onInstallCancel}>
              取消
            </button>
          </div>
        </div>
      )}

      <div className="dash-cols">
        <section className="panel">
          <header className="panel-head">
            <h3>已安装版本</h3>
            <button className="link" onClick={() => onPage('versions')}>
              全部版本
            </button>
          </header>
          {installed.length === 0 ? (
            <div className="panel-empty">
              还没有版本，先去
              <button className="link" onClick={() => onPage('download')}>
                下载
              </button>
              。
            </div>
          ) : (
            <table className="vtable">
              <thead>
                <tr>
                  <th>版本</th>
                  <th>Java</th>
                  <th>上次启动</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {installed.slice(0, 6).map((v) => (
                  <tr key={v.id} className={selected?.id === v.id ? 'selected' : ''} onDoubleClick={() => void onLaunch(v.id)}>
                    <td>
                      <div className="vname">
                        <span className="vglyph" style={{ background: loaderMeta(v.loader).bg, color: loaderMeta(v.loader).color }}>
                          <Icon name="cube" size={13} />
                        </span>
                        <span className="vtitle" title={v.id}>
                          {v.displayName ?? v.id}
                        </span>
                        <LoaderTag loader={v.loader} />
                      </div>
                    </td>
                    <td className="mono">
                  {effectiveJavaMajor(state, v) ?? '—'}
                </td>
                    <td>{v.lastPlayed ? formatRelative(v.lastPlayed) : '—'}</td>
                    <td className="right">
                      <button className="icon-btn tiny" title="启动" onClick={() => void onLaunch(v.id)}>
                        <Icon name="play" size={13} />
                      </button>
                      <button className="icon-btn tiny" title="设为当前" onClick={() => onSelect(v.id)}>
                        <Icon name={selected?.id === v.id ? 'check' : 'chevronRight'} size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <header className="panel-head">
            <h3>最近日志</h3>
            <button className="link" onClick={() => onPage('logs')}>
              打开日志
            </button>
          </header>
          <div className="mini-console">
            {logs.length === 0 && <div className="mini-empty">{running ? '游戏运行中，等待输出…' : '还没有日志。启动游戏后显示输出。'}</div>}
            {logs.slice(-7).map((l, i) => (
              <div key={i} className={`mini-line ${l.level}`}>
                <span>{l.source === 'game' ? 'GAME' : 'SCL'}</span>
                {l.text}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function VersionPicker(props: {
  state: AppState
  selected: VersionSummary | null
  onSelect: (id: string) => void
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const installed = props.state.versions.filter((v) => v.installed)
  return (
    <div className="picker">
      <button className="picker-btn" onClick={() => setOpen((v) => !v)}>
        <span>{props.selected?.id ?? '选择版本'}</span>
        <Icon name="chevronDown" size={13} />
      </button>
      {open && (
        <>
          <div className="backdrop" onMouseDown={() => setOpen(false)} />
          <div className="picker-pop">
            {installed.length === 0 && <div className="picker-empty">没有已安装版本</div>}
            {installed.map((v) => (
              <button
                key={v.id}
                className={`picker-row ${props.selected?.id === v.id ? 'active' : ''}`}
                onClick={() => {
                  props.onSelect(v.id)
                  setOpen(false)
                }}
              >
                <span className="vglyph" style={{ background: loaderMeta(v.loader).bg, color: loaderMeta(v.loader).color }}>
                  <Icon name="cube" size={12} />
                </span>
                <span className="picker-name">{v.displayName ?? v.id}</span>
                <span className="picker-loader">{loaderMeta(v.loader).label}</span>
                {props.selected?.id === v.id && <Icon name="check" size={13} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function VersionsPage(props: {
  state: AppState
  selected: VersionSummary | null
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
  onPage: (p: Page) => void
  notify: (kind: ToastKind, text: string) => void
  onConfig: (patch: Partial<LauncherConfig>) => Promise<void>
  onSettings: (v: VersionSummary) => void
  install: InstallProgress | null
  onInstall: (id: string) => void
  onInstallFabric: (gameVersion: string, loader?: string) => void
  onCancel: () => void
  onInstallForge: (mc: string, forge: string) => void
  onInstallQuilt: (mc: string, loader: string) => void
}): React.ReactElement {
  const { state, selected, onSelect, onLaunch, onPage, notify, onConfig, onSettings, install, onInstall, onInstallFabric, onCancel, onInstallForge, onInstallQuilt } = props
  const [query, setQuery] = useState('')
  const [installing, setInstalling] = useState(false)
  const list = state.versions.filter((v) => v.id.toLowerCase().includes(query.toLowerCase()))

  if (installing) {
    return (
      <VersionInstallPanel
        state={state}
        install={install}
        onInstall={onInstall}
        onInstallFabric={onInstallFabric}
        onCancel={onCancel}
        notify={notify}
        onInstallForge={onInstallForge}
        onInstallQuilt={onInstallQuilt}
        onBack={() => setInstalling(false)}
      />
    )
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={14} />
          <input placeholder="搜索版本" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <span className="toolbar-hint">{list.length} 个版本</span>
        <div className="toolbar-fill" />
        <button className="btn primary small" onClick={() => setInstalling(true)}>
          <Icon name="download" size={13} /> 安装新版本
        </button>
        <button className="btn small" onClick={() => void api.openPath(`${state.config.gameDir}/versions`)}>
          <Icon name="folder" size={13} /> 版本目录
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <Icon name="cube" size={22} />
          <p>没有找到版本</p>
          <button className="btn primary small" onClick={() => setInstalling(true)}>
            安装版本
          </button>
        </div>
      ) : (
        <table className="vtable full">
          <thead>
            <tr>
              <th style={{ width: '42%' }}>版本</th>
              <th>加载器</th>
              <th>Java</th>
              <th>上次启动</th>
              <th>类型</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className={selected?.id === v.id ? 'selected' : ''} onClick={() => onSelect(v.id)}>
                <td>
                  <div className="vname">
                    <span className="vglyph" style={{ background: loaderMeta(v.loader).bg, color: loaderMeta(v.loader).color }}>
                      <Icon name="cube" size={13} />
                    </span>
                    <span className="vtitle" title={v.id}>
                      {v.displayName ?? v.id}
                    </span>
                    {selected?.id === v.id && <span className="tag-current">当前</span>}
                    {v.broken && <span className="tag-broken">损坏</span>}
                  </div>
                </td>
                <td>
                  <LoaderTag loader={v.loader} /> {v.loaderVersion && <span className="muted">{v.loaderVersion}</span>}
                </td>
                <td className="mono">
                  {effectiveJavaMajor(state, v) ?? '—'}
                </td>
                <td>{v.lastPlayed ? formatRelative(v.lastPlayed) : '—'}</td>
                <td>{typeLabel(v.type)}</td>
                <td className="right">
                  <button
                    className="btn tiny"
                    disabled={!v.installed}
                    onClick={(e) => {
                      e.stopPropagation()
                      onLaunch(v.id)
                    }}
                  >
                    <Icon name="play" size={12} /> 启动
                  </button>
                  <button
                    className="icon-btn tiny"
                    title="版本设置"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSettings(v)
                    }}
                  >
                    <Icon name="settings" size={13} />
                  </button>
                  <button
                    className="icon-btn tiny"
                    title="打开文件夹"
                    onClick={(e) => {
                      e.stopPropagation()
                      void api.openPath(v.path)
                    }}
                  >
                    <Icon name="folder" size={13} />
                  </button>
                  <button
                    className="icon-btn tiny"
                    title="切换该版本内存"
                    onClick={(e) => {
                      e.stopPropagation()
                      const cur = state.config.memoryOverrides?.[v.id] ?? state.config.maxMemory
                      const steps = [2048, 4096, 6144, 8192]
                      const next = steps[(steps.indexOf(cur) + 1) % steps.length]
                      void onConfig({ memoryOverrides: { ...state.config.memoryOverrides, [v.id]: next } })
                      notify('info', `${v.id} 内存 ${next / 1024} GB`)
                    }}
                  >
                    <Icon name="memory" size={13} />
                  </button>
                  <button
                    className="icon-btn tiny"
                    title="切换该版本 Java"
                    onClick={(e) => {
                      e.stopPropagation()
                      const options = ['', ...state.javas.map((j) => j.path)]
                      const cur = state.config.javaOverrides?.[v.id] ?? ''
                      const next = options[(options.indexOf(cur) + 1) % options.length]
                      void onConfig({ javaOverrides: { ...state.config.javaOverrides, [v.id]: next } })
                      const java = state.javas.find((j) => j.path === next)
                      notify('info', java ? `${v.id} 使用 Java ${java.major}` : `${v.id} 跟随全局 Java 设置`)
                    }}
                  >
                    <Icon name="java" size={13} />
                  </button>
                  <button
                    className="icon-btn tiny"
                    title="校验并修复"
                    onClick={async (e) => {
                      e.stopPropagation()
                      const res = await api.checkVersion(v.id)
                      if (res.error) notify('error', res.error)
                      else if (res.repaired) notify('success', `已修复 ${v.id}`)
                      else if (res.missing === 0) notify('success', `${v.id} 文件完整`)
                    }}
                  >
                    <Icon name="check" size={13} />
                  </button>
                  <button
                    className="icon-btn tiny"
                    title="删除版本"
                    onClick={async (e) => {
                      e.stopPropagation()
                      const res = await api.deleteVersion(v.id)
                      if (res.ok) notify('success', `已删除 ${v.id}`)
                      else if (res.error) notify('error', res.error)
                    }}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}


function OnlineContentPanel({
  type,
  gameVersion,
  versionId,
  notify
}: {
  type: 'resourcepack' | 'shader'
  gameVersion?: string
  versionId?: string
  notify: (kind: ToastKind, text: string) => void
}): React.ReactElement {
  const [q, setQ] = React.useState('')
  const [hits, setHits] = React.useState<{ id: string; title: string; description: string; icon?: string; downloads: number }[]>([])
  const [busy, setBusy] = React.useState(false)
  const [installing, setInstalling] = React.useState('')
  const search = async (term: string) => {
    setBusy(true)
    try {
      setHits(await api.searchContent(type, term, gameVersion))
    } finally {
      setBusy(false)
    }
  }
  React.useEffect(() => {
    void search('')
  }, [type, gameVersion])
  const install = async (id: string) => {
    setInstalling(id)
    const res = await api.installContent(type, id, gameVersion, versionId)
    setInstalling('')
    if (res.ok) notify('success', `已下载 ${res.file}`)
    else notify('error', res.error ?? '下载失败')
  }
  return (
    <div className="online-content">
      <div className="online-search">
        <div className="search">
          <Icon name="search" size={14} />
          <input
            placeholder={type === 'shader' ? '搜索光影' : '搜索资源包'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void search(q)}
          />
        </div>
        <button className="btn small primary" onClick={() => void search(q)}>{busy ? '搜索中…' : '搜索'}</button>
      </div>
      <div className="online-list">
        {hits.map((h) => (
          <div className="online-hit" key={h.id}>
            {h.icon ? <img src={h.icon} alt="" /> : <span className="online-hit-ph"><Icon name="package" size={16} /></span>}
            <div className="online-hit-body">
              <span className="online-hit-title">{h.title}</span>
              <span className="online-hit-desc">{h.description}</span>
            </div>
            <span className="online-hit-dl">{(h.downloads / 1000).toFixed(1)}k</span>
            <button className="btn small" disabled={installing === h.id} onClick={() => void install(h.id)}>
              {installing === h.id ? '下载中…' : '下载'}
            </button>
          </div>
        ))}
        {!busy && hits.length === 0 && (
          <div className="empty"><Icon name="package" size={20} /><p>搜索 Modrinth 在线内容</p></div>
        )}
      </div>
    </div>
  )
}

function DownloadPage({
  state,
  notify,
  selected,
  gameDir
}: {
  state: AppState
  notify: (kind: ToastKind, text: string) => void
  selected: VersionSummary | null
  gameDir: string
}): React.ReactElement {
  const [tab, setTab] = React.useState<'mods' | 'resourcepacks' | 'shaders'>('mods')
  const [importing, setImporting] = React.useState(false)
  const modsDir =
    selected && state.config.isolatedVersions?.[selected.id]
      ? `${state.config.gameDir}/versions/${selected.id}/game`
      : gameDir
  const importPack = async () => {
    const file = await api.pickModpackFile()
    if (!file) return
    setImporting(true)
    notify('info', '正在导入整合包，可能需要下载基础版本与模组…')
    const res = await api.importModpack(file)
    setImporting(false)
    if (res.ok) notify('success', `已导入 ${res.instanceId}（${res.modsInstalled} 个模组）`)
    else notify('error', res.error ?? '导入失败')
  }
  return (
    <div className="page download">
      <div className="toolbar">
        <div className="tabs">
          <button className={tab === 'mods' ? 'active' : ''} onClick={() => setTab('mods')}>模组</button>
          <button className={tab === 'resourcepacks' ? 'active' : ''} onClick={() => setTab('resourcepacks')}>资源包</button>
          <button className={tab === 'shaders' ? 'active' : ''} onClick={() => setTab('shaders')}>光影</button>
        </div>
        <div className="toolbar-fill" />
        <button className="btn small" disabled={importing} onClick={() => void importPack()}>
          {importing ? '导入中…' : '导入整合包'}
        </button>
      </div>
      {tab === 'mods' && <ModsPanel notify={notify} gameDir={modsDir} selected={selected} />}
      {tab === 'resourcepacks' && (
        <OnlineContentPanel type="resourcepack" gameVersion={selected?.gameVersion} versionId={selected?.id} notify={notify} />
      )}
      {tab === 'shaders' && (
        <OnlineContentPanel type="shader" gameVersion={selected?.gameVersion} versionId={selected?.id} notify={notify} />
      )}
    </div>
  )
}

function VersionInstallPanel(props: {
  state: AppState
  install: InstallProgress | null
  onInstall: (id: string) => void
  onInstallFabric: (gameVersion: string, loader?: string) => void
  onCancel: () => void
  notify: (kind: ToastKind, text: string) => void
  onInstallForge: (mc: string, forge: string) => void
  onInstallQuilt: (mc: string, loader: string) => void
  onBack?: () => void
}): React.ReactElement {
  const { state, install, onInstall, onInstallFabric, onCancel, notify, onInstallForge, onInstallQuilt, onBack } = props
  const [tab, setTab] = useState<'release' | 'snapshot' | 'fabric' | 'forge' | 'quilt'>('release')
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<{ releases: RemoteVersion[]; snapshots: RemoteVersion[] } | null>(null)
  const [loadError, setLoadError] = useState('')
  const [picked, setPicked] = useState('')
  const [gameVersion, setGameVersion] = useState('')
  const [loaders, setLoaders] = useState<FabricLoader[]>([])
  const [loader, setLoader] = useState('')
  const [loadingFabric, setLoadingFabric] = useState(false)
  const [forgeOpts, setForgeOpts] = useState<{ recommended?: string; latest?: string } | null>(null)
  const [forgePick, setForgePick] = useState('')
  const [quiltLoaders, setQuiltLoaders] = useState<{ version: string }[]>([])
  const [quiltPick, setQuiltPick] = useState('')
  const [loaderKind, setLoaderKind] = useState<'none' | 'fabric' | 'forge' | 'quilt'>('none')
  const [askLoader, setAskLoader] = useState<string | null>(null)
  React.useEffect(() => {
    if (!state.config.dynamicWindow) return
    if (askLoader) {
      void api.resizeWindow(470, 460)
      return () => {
        void api.resizeWindow(880, 620)
      }
    }
    void api.resizeWindow(880, 620)
  }, [askLoader, state.config.dynamicWindow])

  useEffect(() => {
    api
      .fetchVersions()
      .then((r) => {
        setRemote({ releases: r.releases, snapshots: r.snapshots })
        setGameVersion(r.latest.release)
        setPicked(r.latest.release)
      })
      .catch((err) => setLoadError((err as Error).message))
  }, [])

  useEffect(() => {
    if (!gameVersion) return
    setLoadingFabric(true)
    setLoader('')
    api
      .fetchFabricLoaders(gameVersion)
      .then((list) => {
        setLoaders(list)
        setLoader((list.find((l) => l.stable) ?? list[0])?.version ?? '')
      })
      .catch(() => setLoaders([]))
      .finally(() => setLoadingFabric(false))
  }, [gameVersion])

  useEffect(() => {
    if (tab !== 'forge' || !gameVersion) return
    setForgeOpts(null)
    setForgePick('')
    api
      .forgeVersions(gameVersion)
      .then((o) => {
        setForgeOpts(o)
        setForgePick(o.recommended ?? o.latest ?? '')
      })
      .catch(() => setForgeOpts({}))
  }, [tab, gameVersion])

  useEffect(() => {
    if (tab !== 'quilt' || !gameVersion) return
    setQuiltLoaders([])
    setQuiltPick('')
    api.quiltLoaders(gameVersion).then((list) => {
      setQuiltLoaders(list.slice(0, 30))
      setQuiltPick(list[0]?.version ?? '')
    }).catch(() => setQuiltLoaders([]))
  }, [tab, gameVersion])

  const installWithLoader = async (kind: 'none' | 'fabric' | 'forge' | 'quilt' | 'neoforge') => {
    const target = askLoader
    setAskLoader(null)
    if (!target) return
    try {
      if (kind === 'none') onInstall(target)
      else if (kind === 'fabric') onInstallFabric(target)
      else if (kind === 'forge') {
        const o = await api.forgeVersions(target)
        onInstallForge(target, o.recommended ?? o.latest ?? '')
      } else if (kind === 'quilt') {
        const list = await api.quiltLoaders(target)
        onInstallQuilt(target, list[0]?.version ?? '')
      } else {
        const versions = await api.neoVersions(target)
        const res = await api.installNeoForge(target, versions[versions.length - 1] ?? '')
        if (!res.ok) notify('error', res.error ?? 'NeoForge 安装失败')
      }
    } catch (err) {
      notify('error', (err as Error).message)
    }
  }

  const installedIds = useMemo(() => new Set(state.versions.filter((v) => v.installed).map((v) => v.id)), [state.versions])
  const list = (tab === 'snapshot' ? remote?.snapshots : remote?.releases) ?? []
  const filtered = list.filter((v) => v.id.toLowerCase().includes(query.toLowerCase())).slice(0, 120)
  const busy = Boolean(install && !['done', 'error', 'cancelled'].includes(install.phase))
  const current = tab === 'fabric' ? gameVersion : picked
  const detail = list.find((v) => v.id === current)
  const installed = tab !== 'fabric' && installedIds.has(current)
  const currentInstall = install?.id === current

  return (
    <div className="page download">
      <div className="toolbar">
        {onBack && (
          <button className="btn small" onClick={onBack}>← 版本列表</button>
        )}
        <div className="tabs">
          <button className={tab === 'release' ? 'active' : ''} onClick={() => { setTab('release'); setQuery('') }}>
            正式版
          </button>
          <button className={tab === 'snapshot' ? 'active' : ''} onClick={() => { setTab('snapshot'); setQuery('') }}>
            快照
          </button>
        </div>
        <div className="search">
          <Icon name="search" size={14} />
          <input placeholder="搜索版本号" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="toolbar-fill" />
      </div>

      {tab === 'forge' && (
        <div className="fabric-panel card">
          <div className="fabric-head">
            <span className="fabric-icon"><Icon name="package" size={22} /></span>
            <div>
              <h3>Forge</h3>
              <p>自动下载并运行官方安装器，需要 Java 8+。</p>
            </div>
          </div>
          <div className="form-row">
            <label>游戏版本</label>
            <select value={gameVersion} onChange={(e) => setGameVersion(e.target.value)}>
              {(remote?.releases ?? []).slice(0, 40).map((v) => <option key={v.id} value={v.id}>{v.id}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Forge</label>
            <select value={forgePick} onChange={(e) => setForgePick(e.target.value)} disabled={!forgeOpts}>
              {forgeOpts?.recommended && <option value={forgeOpts.recommended}>{forgeOpts.recommended}（推荐）</option>}
              {forgeOpts?.latest && forgeOpts.latest !== forgeOpts.recommended && <option value={forgeOpts.latest}>{forgeOpts.latest}（最新）</option>}
            </select>
          </div>
          <button className="btn primary wide" disabled={!forgePick} onClick={() => onInstallForge(gameVersion, forgePick)}>
            <Icon name="download" size={14} /> 安装 Forge
          </button>
          <p className="hint">安装完成后会出现在版本列表，可直接启动。</p>
        </div>
      )}

      {tab === 'quilt' && (
        <div className="fabric-panel card">
          <div className="fabric-head">
            <span className="fabric-icon"><Icon name="package" size={22} /></span>
            <div>
              <h3>Quilt</h3>
              <p>自动安装原版并写入 Quilt 加载器配置。</p>
            </div>
          </div>
          <div className="form-row">
            <label>游戏版本</label>
            <select value={gameVersion} onChange={(e) => setGameVersion(e.target.value)}>
              {(remote?.releases ?? []).slice(0, 40).map((v) => <option key={v.id} value={v.id}>{v.id}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Loader</label>
            <select value={quiltPick} onChange={(e) => setQuiltPick(e.target.value)} disabled={!quiltLoaders.length}>
              {quiltLoaders.map((l) => <option key={l.version} value={l.version}>{l.version}</option>)}
            </select>
          </div>
          <button className="btn primary wide" disabled={!quiltPick} onClick={() => onInstallQuilt(gameVersion, quiltPick)}>
            <Icon name="download" size={14} /> 安装 Quilt
          </button>
        </div>
      )}

      {tab !== 'forge' && tab !== 'quilt' && loadError && (
        <div className="alert">
          <Icon name="warning" size={14} /> {loadError}
        </div>
      )}

      {askLoader && (
        <div className="modal-backdrop solid" onMouseDown={() => setAskLoader(null)}>
          <div className="modal loader-modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="modal-head">
              <h2>安装 {askLoader}</h2>
              <button className="icon-btn tiny" onClick={() => setAskLoader(null)}>
                <Icon name="close" size={14} />
              </button>
            </header>
            <p className="modal-desc">要同时安装模组加载器吗？加载器版本会自动选择稳定版。</p>
            <div className="loader-choices">
              <button className="loader-choice" onClick={() => void installWithLoader('none')}>
                <span>不安装加载器</span>
                <small>仅原版</small>
              </button>
              <button className="loader-choice" onClick={() => void installWithLoader('fabric')}>
                <span>Fabric</span>
                <small>最新稳定版</small>
              </button>
              <button className="loader-choice" onClick={() => void installWithLoader('forge')}>
                <span>Forge</span>
                <small>推荐版</small>
              </button>
              <button className="loader-choice" onClick={() => void installWithLoader('quilt')}>
                <span>Quilt</span>
                <small>最新稳定版</small>
              </button>
              <button className="loader-choice" onClick={() => void installWithLoader('neoforge')}>
                <span>NeoForge</span>
                <small>最新版本（BMCLAPI 镜像）</small>
              </button>
            </div>
          </div>
        </div>
      )}

      {tab !== 'forge' && tab !== 'quilt' && <div className="split">
        <div className="list-pane">
          <div className="list-head">
            <span>版本</span>
            <span>类型</span>
            <span>发布日期</span>
            <span />
          </div>
          <div className="list-body">
            {!remote && !loadError && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
            {filtered.map((v, i) => (
              <button
                key={v.id}
                className={`list-row ${current === v.id ? 'active' : ''}`}
                style={{ '--i': Math.min(i, 12) } as React.CSSProperties}
                onClick={() => setPicked(v.id)}
              >
                <span className="lr-name">{v.id}</span>
                <span>{typeLabel(v.type)}</span>
                <span className="muted">{formatDate(v.releaseTime)}</span>
                <span className="right">{installedIds.has(v.id) && <span className="tag-installed">已安装</span>}</span>
              </button>
            ))}
            {remote && filtered.length === 0 && <div className="list-loading">没有匹配的版本</div>}
          </div>
        </div>

        <aside className="detail-pane">
          <div className="caps">版本详情</div>
          <h2>{current || '—'}</h2>
          {tab !== 'fabric' ? (
            <>
              <dl className="detail-list">
                <dt>类型</dt>
                <dd>{detail ? typeLabel(detail.type) : '—'}</dd>
                <dt>发布日期</dt>
                <dd>{formatDate(detail?.releaseTime)}</dd>
                <dt>下载源</dt>
                <dd>{state.config.mirror === 'bmclapi' ? 'BMCLAPI 镜像' : 'Mojang 官方'}</dd>
                <dt>状态</dt>
                <dd>{installed ? '已安装' : '未安装'}</dd>
              </dl>
              {currentInstall && busy ? (
                <div className="detail-progress">
                  <div className="inline-task-head">
                    <span>{install!.label}</span>
                    <span>{percent(install!.bytes, install!.totalBytes)}%</span>
                  </div>
                  <div className="progress">
                    <i style={{ width: `${percent(install!.bytes, install!.totalBytes)}%` }} />
                  </div>
                  <div className="inline-task-foot">
                    <span>{formatSpeed(install!.speed)}</span>
                    <button className="link danger" onClick={onCancel}>
                      取消
                    </button>
                  </div>
                </div>
              ) : installed ? (
                <button className="btn wide" disabled>
                  <Icon name="check" size={14} /> 已安装
                </button>
              ) : (
                <button className="btn primary wide" disabled={busy || !current} onClick={() => setAskLoader(current)}>
                  <Icon name="download" size={14} /> 安装此版本
                </button>
              )}
              <p className="detail-note">安装会下载客户端、依赖库与游戏资源，已存在的文件将跳过。</p>
            </>
          ) : (
            <>
              <dl className="detail-list">
                <dt>游戏版本</dt>
                <dd>{gameVersion}</dd>
                <dt>Loader</dt>
                <dd>
                  <select className="select" value={loader} onChange={(e) => setLoader(e.target.value)} disabled={loadingFabric}>
                    {loaders.map((l) => (
                      <option key={l.version} value={l.version}>
                        {l.version} {l.stable ? '(稳定)' : ''}
                      </option>
                    ))}
                  </select>
                </dd>
              </dl>
              <button className="btn primary wide" disabled={busy || !loader} onClick={() => onInstallFabric(gameVersion, loader)}>
                <Icon name="download" size={14} /> 安装 Fabric
              </button>
              <p className="detail-note">会自动安装对应原版，然后写入 Fabric 加载器。安装完成后出现在版本列表。</p>
            </>
          )}
        </aside>
      </div>}
    </div>
  )
}


let eggAudioCtx: AudioContext | null = null

function ensureEggAudio(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!eggAudioCtx) eggAudioCtx = new Ctx()
    if (eggAudioCtx.state === 'suspended') void eggAudioCtx.resume()
  } catch {
    /* ignore */
  }
}

function playEggSound(audio?: string): void {
  if (audio) {
    try {
      const el = new Audio(audio)
      void el.play()
      return
    } catch {
      /* fallthrough */
    }
  }
  playClangSound()
}

function playClangSound(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = eggAudioCtx ?? new Ctx()
    eggAudioCtx = ctx
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(190, now)
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.35)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.7)
    const len = Math.floor(ctx.sampleRate * 0.16)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const ng = ctx.createGain()
    ng.gain.value = 0.35
    src.connect(ng).connect(ctx.destination)
    src.start(now)
  } catch {
    /* 音频失败忽略 */
  }
}

function eggFall(): void {
  ensureEggAudio()
  void api.easterEggFall()
}

function eggSpin(): void {
  const style = document.createElement('style')
  style.textContent = '@keyframes eggSpin { to { transform: rotate(360deg) } } body.egg-spin button { animation: eggSpin .8s linear infinite }'
  document.head.appendChild(style)
  document.body.classList.add('egg-spin')
}

function eggGlitch(): void {
  document.body.classList.add('egg-glitch')
}


function BugReportDialog({ onClose }: { onClose: () => void }): React.ReactElement {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'bug' | 'suggestion' | 'other'>('bug')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('')
  const [contact, setContact] = useState('')
  const [includeLogs, setIncludeLogs] = useState(true)
  const [includeSystem, setIncludeSystem] = useState(true)
  const [includeMods, setIncludeMods] = useState(true)
  const [shots, setShots] = useState<Array<{ name: string; dataUrl: string }>>([])
  const [context, setContext] = useState<BugContext | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BugSubmitResult | null>(null)

  useEffect(() => {
    void api.getBugContext().then(setContext).catch(() => {})
  }, [])

  const payload = () => ({
    title: title.trim(),
    category,
    description: description.trim(),
    steps,
    contact,
    includeLogs,
    includeSystem,
    includeMods,
    screenshots: shots
  })

  const submit = async () => {
    if (!title.trim()) return setError('请填写标题')
    if (!description.trim()) return setError('请填写问题描述')
    setBusy(true)
    setError('')
    const res = await api.submitBugReport(payload())
    setResult(res)
    setBusy(false)
  }

  const addShot = async () => {
    const shot = await api.pickBugScreenshot()
    if (!shot) return setError('没有选择图片，或图片超过 4 MB')
    setError('')
    setShots((prev) => [...prev, shot].slice(0, 3))
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal bug-modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>提交 Bug</h2>
          <button className="icon-btn tiny" onClick={onClose}>✕</button>
        </header>

        {result ? (
          <div className="bug-result">
            <div className={`bug-result-title ${result.ok ? 'ok' : 'bad'}`}>
              {result.ok ? '提交成功' : '提交失败'}
            </div>
            {result.id && <div className="bug-result-line">编号：<b>{result.id}</b></div>}
            {result.error && <div className="bug-result-line">原因：{result.error}</div>}
            {!result.ok && <div className="bug-result-line">已保存到本地，可直接把压缩包发给我。</div>}
            <div className="bug-actions">
              {result.localPath && (
                <button className="btn small" onClick={() => void api.openPath(result.localPath!)}>
                  打开本地文件
                </button>
              )}
              {result.id && (
                <button className="btn small" onClick={() => void navigator.clipboard.writeText(result.id!)}>
                  复制编号
                </button>
              )}
              <button className="btn primary" onClick={onClose}>关闭</button>
            </div>
          </div>
        ) : (
          <>
            <div className="bug-grid">
              <label className="bug-field">
                <span>标题</span>
                <input className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="一句话描述问题" />
              </label>
              <label className="bug-field">
                <span>类型</span>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
                  <option value="bug">Bug</option>
                  <option value="suggestion">建议</option>
                  <option value="other">其他</option>
                </select>
              </label>
            </div>
            <label className="bug-field">
              <span>问题描述</span>
              <textarea className="input bug-area" value={description} maxLength={4000} onChange={(e) => setDescription(e.target.value)} placeholder="发生了什么？期望是什么？" />
            </label>
            <label className="bug-field">
              <span>复现步骤（可选）</span>
              <textarea className="input bug-area small" value={steps} maxLength={2000} onChange={(e) => setSteps(e.target.value)} placeholder="1. 打开…&#10;2. 点击…" />
            </label>
            <label className="bug-field">
              <span>联系方式（可选）</span>
              <input className="input" value={contact} maxLength={120} onChange={(e) => setContact(e.target.value)} placeholder="QQ / 邮箱，方便追问" />
            </label>

            <div className="bug-checks">
              <label><input type="checkbox" checked={includeLogs} onChange={(e) => setIncludeLogs(e.target.checked)} /> 附加日志</label>
              <label><input type="checkbox" checked={includeSystem} onChange={(e) => setIncludeSystem(e.target.checked)} /> 附加系统信息</label>
              <label><input type="checkbox" checked={includeMods} onChange={(e) => setIncludeMods(e.target.checked)} /> 附加模组列表</label>
            </div>

            <div className="bug-shots">
              {shots.map((shot, i) => (
                <div className="bug-shot" key={i}>
                  <img src={shot.dataUrl} alt={shot.name} />
                  <button onClick={() => setShots((prev) => prev.filter((_, idx) => idx !== i))}>✕</button>
                </div>
              ))}
              {shots.length < 3 && (
                <button className="btn small" onClick={() => void addShot()}>添加截图</button>
              )}
            </div>

            {context && (
              <div className="bug-context">
                将附带：{context.appVersion} · {context.os} · {context.versions.length} 个版本 · {context.mods.length} 个模组 · {context.logs.length} 行日志
              </div>
            )}
            {error && <div className="bug-error">{error}</div>}

            <div className="bug-actions">
              <button className="btn" disabled={busy} onClick={() => void api.exportBugReport(payload()).then((r) => r.ok && r.path && void api.openPath(r.path))}>
                导出到桌面
              </button>
              <button className="btn primary" disabled={busy} onClick={() => void submit()}>
                {busy ? '提交中…' : '提交'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SettingsPage(props: {
  state: AppState
  onChange: (patch: Partial<LauncherConfig>) => Promise<void>
}): React.ReactElement {
  const { state, onChange } = props
  const cfg = state.config
  const [updateStatus, setUpdateStatus] = React.useState('')
  const [eggWarn, setEggWarn] = React.useState(false)
  const [bugOpen, setBugOpen] = React.useState(false)
  const runEgg = () => {
    ensureEggAudio()
    setEggWarn(false)
    // 权重：1 掉落 32%，2 Rickroll 32%，3 电视故障 14%，4 按钮旋转 12%，5 乱撞 10%
    const roll = Math.random()
    const n = roll < 0.32 ? 1 : roll < 0.64 ? 2 : roll < 0.78 ? 3 : roll < 0.9 ? 4 : 5
    if (n === 1) eggFall()
    else if (n === 2) void api.openExternal('https://www.bilibili.com/video/BV1GJ411x7h7/')
    else if (n === 3) eggGlitch()
    else if (n === 4) eggSpin()
    else void api.bounceWindow()
  }
  const maxMemory = Math.min(16384, Math.max(2048, Math.floor(state.totalMemMb / 1024) * 1024))

  return (
    <div className="page settings">
      <div className="settings-col">
        <section className="sgroup">
          <h3>游戏</h3>
          <div className="srow">
            <div className="slabel">
              <b>游戏目录</b>
              <small>{cfg.gameDir}</small>
            </div>
            <div className="scontrol">
              <button
                className="btn small"
                onClick={async () => {
                  const dir = await api.pickDir()
                  if (dir) await onChange({ gameDir: dir })
                }}
              >
                更改
              </button>
              <button className="icon-btn tiny" title="打开目录" onClick={() => void api.openPath(cfg.gameDir)}>
                <Icon name="folder" size={14} />
              </button>
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>窗口分辨率</b>
              <small>启动时使用的游戏窗口大小</small>
            </div>
            <div className="scontrol">
              <label className="switch">
                <input type="checkbox" checked={cfg.customResolution} onChange={(e) => void onChange({ customResolution: e.target.checked })} />
                <i />
              </label>
              <input
                className="input num"
                type="number"
                value={cfg.width}
                disabled={!cfg.customResolution}
                onChange={(e) => void onChange({ width: Number(e.target.value) || 854 })}
              />
              <span className="muted">×</span>
              <input
                className="input num"
                type="number"
                value={cfg.height}
                disabled={!cfg.customResolution}
                onChange={(e) => void onChange({ height: Number(e.target.value) || 480 })}
              />
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>游戏语言</b>
              <small>启动前自动写入 options.txt 的 lang 设置</small>
            </div>
            <div className="scontrol">
              <select className="select" value={cfg.gameLanguage} onChange={(e) => void onChange({ gameLanguage: e.target.value })}>
                <option value="zh_cn">简体中文</option>
                <option value="zh_tw">繁體中文</option>
                <option value="en_us">English (US)</option>
                <option value="ja_jp">日本語</option>
                <option value="ko_kr">한국어</option>
              </select>
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>全屏启动</b>
              <small>直接以全屏模式进入游戏</small>
            </div>
            <div className="scontrol">
              <label className="switch">
                <input type="checkbox" checked={cfg.fullscreen} onChange={(e) => void onChange({ fullscreen: e.target.checked })} />
                <i />
              </label>
            </div>
          </div>
        </section>

        <section className="sgroup">
          <h3>Java 与内存</h3>
          <div className="srow">
            <div className="slabel">
              <b>最大内存</b>
              <small>系统共 {Math.floor(state.totalMemMb / 1024)} GB，建议 4–6 GB</small>
            </div>
            <div className="scontrol">
              <input
                className="range"
                type="range"
                min={1024}
                max={maxMemory}
                step={512}
                value={cfg.maxMemory}
                onChange={(e) => void onChange({ maxMemory: Number(e.target.value) })}
              />
              <span className="value">{cfg.maxMemory / 1024} GB</span>
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>Java 运行时</b>
              <small>{cfg.javaPath || '根据版本要求自动选择'}</small>
            </div>
            <div className="scontrol">
              <select className="select" value={cfg.javaPath} onChange={(e) => void onChange({ javaPath: e.target.value })}>
                <option value="">自动选择</option>
                {state.javas.map((j) => (
                  <option key={j.path} value={j.path}>
                    Java {j.major} · {j.version}
                  </option>
                ))}
              </select>
              <button
                className="btn small"
                onClick={async () => {
                  const p = await api.pickJava()
                  if (p) await onChange({ javaPath: p })
                }}
              >
                浏览
              </button>
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>JVM 参数</b>
              <small>附加到 Java 命令行</small>
            </div>
            <div className="scontrol">
              <input
                className="input"
                placeholder="-XX:+UseG1GC"
                value={cfg.jvmArgs}
                onChange={(e) => void onChange({ jvmArgs: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="sgroup">
          <h3>外观</h3>
          <div className="srow">
            <div className="slabel">
              <b>主题</b>
              <small>浅色 / 深色 / 跟随系统</small>
            </div>
            <div className="scontrol theme-seg">
              {([
                ['light', '浅色'],
                ['dark', '深色'],
                ['system', '跟随系统']
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  className={`btn small ${(cfg.theme ?? 'system') === value ? 'active' : ''}`}
                  onClick={() => void onChange({ theme: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>鼠标跟随</b>
              <small>调整卡片随鼠标倾斜的强度，拉到 0 即完全关闭</small>
            </div>
            <div className="scontrol tilt-control">
              <input
                className="range"
                type="range"
                min="0"
                max="100"
                step="5"
                value={cfg.tiltStrength}
                onChange={(e) => void onChange({ tiltStrength: Number(e.target.value) })}
              />
              <span className="range-value">{cfg.tiltStrength === 0 ? '关闭' : `${cfg.tiltStrength}%`}</span>
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>灵动窗口</b>
              <small>关闭后窗口不再随页面与弹窗改变尺寸</small>
            </div>
            <div className="scontrol">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={cfg.dynamicWindow}
                  onChange={(e) => void onChange({ dynamicWindow: e.target.checked })}
                />
                <i />
              </label>
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>启动器语言</b>
              <small>切换界面语言（重启后完全生效）</small>
            </div>
            <div className="scontrol">
              <select className="select" value={cfg.language} onChange={(e) => void onChange({ language: e.target.value as 'zh-CN' | 'en-US' })}>
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>
        </section>

        <section className="sgroup">
          <h3>下载与启动</h3>
          <div className="srow">
            <div className="slabel">
              <b>下载源</b>
              <small>BMCLAPI 适用于国内网络，失败时自动回退官方</small>
            </div>
            <div className="scontrol">
              <div className="tabs small">
                <button className={cfg.mirror === 'bmclapi' ? 'active' : ''} onClick={() => void onChange({ mirror: 'bmclapi' })}>
                  BMCLAPI
                </button>
                <button className={cfg.mirror === 'official' ? 'active' : ''} onClick={() => void onChange({ mirror: 'official' })}>
                  官方
                </button>
              </div>
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>启动后隐藏启动器</b>
              <small>从 Dock 图标可重新打开</small>
            </div>
            <div className="scontrol">
              <label className="switch">
                <input type="checkbox" checked={cfg.closeOnLaunch} onChange={(e) => void onChange({ closeOnLaunch: e.target.checked })} />
                <i />
              </label>
            </div>
          </div>
          <div className="srow">
            <div className="slabel">
              <b>日志目录</b>
              <small>启动日志与游戏输出</small>
            </div>
            <div className="scontrol">
              <button className="btn small" onClick={() => void api.openLogs()}>
                打开
              </button>
            </div>
          </div>
        </section>

        <section className="sgroup">
          <h3>帮助与反馈</h3>
          <div className="srow">
            <div className="slabel">
              <b>提交 Bug</b>
              <small>附带日志、系统信息和模组列表，帮助定位问题</small>
            </div>
            <div className="scontrol">
              <button
                className="btn"
                onClick={() => {
                  setBugOpen(true)
                  if (cfg.dynamicWindow) void api.resizeWindow(760, 680)
                }}
              >
                提交 Bug
              </button>
            </div>
          </div>
        </section>
        <section className="sgroup">
          <h3>百宝箱</h3>
          <div className="srow">
            <div className="slabel">
              <b>千万别点</b>
              <small>点了会后悔</small>
            </div>
            <div className="scontrol">
              <button className="btn egg-danger" onClick={() => setEggWarn(true)}>千万别点</button>
            </div>
          </div>
        </section>
        <section className="sgroup about">
          <h3>关于</h3>
          <p>
            SCL · Sky Craft Launcher v{state.appVersion}
            <br />
            由 OMS Work! 开发
            <br />© 2026 OMS Work! 保留所有权利。
          </p>
          <p className="about-thanks">
            致谢：Electron、React、Vite、Fabric、Forge、NeoForge、Quilt、Modrinth、BMCLAPI、Azul Zulu、Adoptium，以及所有参与测试和提交反馈的玩家。
            <br />
            Minecraft 是 Mojang Studios 的商标，本项目与 Mojang、Microsoft 无隶属关系。
          </p>
          <div className="srow">
            <div className="slabel">
              <b>更新</b>
              <small>{updateStatus || '启动时自动检查，有新版本会弹窗'}</small>
            </div>
            <div className="scontrol">
              <button
                className="btn small"
                onClick={async () => {
                  setUpdateStatus('检查中…')
                  const res = await window.scl.checkUpdate()
                  setUpdateStatus(res.error ? res.error : res.available ? `发现新版本 ${res.info?.version}` : '已是最新版本')
                }}
              >
                检查更新
              </button>
            </div>
          </div>
        </section>
      </div>
      {bugOpen && (
        <BugReportDialog
          onClose={() => {
            setBugOpen(false)
            if (cfg.dynamicWindow) void api.resizeWindow(880, 620)
          }}
        />
      )}
      {eggWarn && (
        <div className="modal-backdrop solid" onMouseDown={() => setEggWarn(false)}>
          <div className="modal egg-warn" onMouseDown={(e) => e.stopPropagation()}>
            <header className="modal-head">
              <h2>警告</h2>
              <button className="icon-btn tiny" onClick={() => setEggWarn(false)}>✕</button>
            </header>
            <p className="modal-desc">这是一个警告。三个按钮都是「确定」。</p>
            <div className="egg-actions">
              <button className="btn primary" onClick={runEgg}>确定</button>
              <button className="btn primary" onClick={runEgg}>确定</button>
              <button className="btn primary" onClick={runEgg}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LogsPage(props: {
  logs: LogLine[]
  running: AppState['running']
  notify: (kind: ToastKind, text: string) => void
}): React.ReactElement {
  const { logs, running, notify } = props
  const [query, setQuery] = useState('')
  const [onlyError, setOnlyError] = useState(false)
  const [stick, setStick] = useState(true)
  const bodyRef = useRef<HTMLDivElement>(null)

  const filtered = logs.filter(
    (l) => (!onlyError || l.level === 'error') && l.text.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (stick && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [filtered.length, stick])

  return (
    <div className="page logs">
      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={14} />
          <input placeholder="过滤日志" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className={`btn small ${onlyError ? 'primary' : ''}`} onClick={() => setOnlyError((v) => !v)}>
          仅错误
        </button>
        <label className="checkline">
          <input type="checkbox" checked={stick} onChange={(e) => setStick(e.target.checked)} />
          自动滚动
        </label>
        <div className="toolbar-fill" />
        <button
          className="btn small"
          onClick={() => {
            void navigator.clipboard.writeText(filtered.map((l) => l.text).join('\n'))
            notify('success', '日志已复制')
          }}
        >
          <Icon name="copy" size={13} /> 复制
        </button>
        <button className="btn small" onClick={() => void api.openLogs()}>
          <Icon name="folder" size={13} /> 日志目录
        </button>
      </div>

      <div className="console" ref={bodyRef}>
        {filtered.length === 0 && <div className="console-empty">暂无日志</div>}
        {filtered.map((l, i) => (
          <div key={i} className={`cline ${l.level}`}>
            <span className="ctime">{new Date(l.time).toLocaleTimeString('zh-CN', { hour12: false })}</span>
            <span className="csrc">{l.source === 'game' ? 'GAME' : 'SCL'}</span>
            <span className="ctext">{l.text}</span>
          </div>
        ))}
      </div>

      <div className="console-foot">
        <span>{filtered.length} 行</span>
        <span>{running ? `游戏运行中 · PID ${running.pid}` : '未运行游戏'}</span>
        <div className="flex-fill" />
        <button className="link danger" disabled={!running} onClick={() => void api.killGame()}>
          结束游戏进程
        </button>
      </div>
    </div>
  )
}

function AccountDialog(props: {
  state: AppState
  onClose: () => void
  onChanged: (state: AppState) => void
  notify: (kind: ToastKind, text: string) => void
}): React.ReactElement {
  const { state, notify } = props
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msBusy, setMsBusy] = useState(false)
  React.useEffect(() => {
    if (state.config.dynamicWindow) void api.resizeWindow(msBusy ? 600 : 460, msBusy ? 780 : 560)
  }, [msBusy, state.config.dynamicWindow])
  const pollRef = React.useRef<number | null>(null)
  React.useEffect(() => () => {
    if (pollRef.current) window.clearTimeout(pollRef.current)
  }, [])


  const valid = /^[A-Za-z0-9_]{3,16}$/.test(name.trim())

  const add = async () => {
    if (!valid || busy) return
    setBusy(true)
    try {
      props.onChanged(await api.addAccount(name))
      setName('')
      notify('success', '已添加离线账户')
    } catch (err) {
      notify('error', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop solid" onMouseDown={props.onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>账户</h2>
          <button className="icon-btn tiny" onClick={props.onClose}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className="ms-login">
          <button className="btn primary" disabled={msBusy} onClick={() => setMsBusy(true)}>
            <Icon name="user" size={14} /> 微软正版登录
          </button>
          {msBusy ? <p className="hint">请在弹出的登录页中完成微软账号授权。</p> : null}
        </div>

        <div className="account-list">
          {state.accounts.map((a) => (
            <div key={a.id} className={`account-row ${a.id === state.currentAccountId ? 'active' : ''}`}>
              <span className="avatar" style={{ background: avatarGradient(a.username) }}>{initials(a.username)}</span>
              <span className="account-name">
                {a.username}
                <small>
                  {a.type === 'microsoft' ? '正版账户' : '离线账户'}
                  {a.id === state.currentAccountId ? ' · 当前' : ''}
                </small>
              </span>
              {a.id !== state.currentAccountId && (
                <button
                  className="btn tiny"
                  onClick={async () => {
                    try {
                      props.onChanged(await api.switchAccount(a.id))
                    } catch (err) {
                      notify('error', (err as Error).message)
                    }
                  }}
                >
                  切换
                </button>
              )}
              {state.accounts.length > 1 && (
                <button
                  className="icon-btn tiny"
                  title="删除账户"
                  onClick={async () => {
                    try {
                      props.onChanged(await api.deleteAccount(a.id))
                    } catch (err) {
                      notify('error', (err as Error).message)
                    }
                  }}
                >
                  <Icon name="trash" size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="add-account">
          <input
            className="input"
            placeholder="新离线用户名"
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void add()}
          />
          <button className="btn primary" disabled={!valid || busy} onClick={() => void add()}>
            添加
          </button>
        </div>
        <p className="hint">离线账户用于单人游戏与离线服务器，不支持正版验证。</p>
      </div>
      {msBusy && <InAppMicrosoftLogin onDone={(state) => { setMsBusy(false); props.onChanged(state) }} onError={(msg) => { setMsBusy(false); notify('error', msg) }} onCancel={() => setMsBusy(false)} />}
    </div>
  )
}

function InAppMicrosoftLogin({
  onDone,
  onError,
  onCancel
}: {
  onDone: (state: AppState) => void
  onError: (msg: string) => void
  onCancel: () => void
}): React.ReactElement {
  const ref = React.useRef<any>(null)
  const [done, setDone] = React.useState(false)
  const doneRef = React.useRef(false)
  const callbacks = React.useRef({ onDone, onError })
  callbacks.current = { onDone, onError }
  React.useEffect(() => {
    const timer = window.setInterval(async () => {
      const wv = ref.current
      const url: string | undefined = wv?.getURL?.()
      if (!url || !url.startsWith(LIVE_REDIRECT) || doneRef.current) return
      const code = new URL(url).searchParams.get('code')
      if (!code) return
      doneRef.current = true
      setDone(true)
      window.clearInterval(timer)
      const res = await api.msComplete(code)
      if (res.ok && res.state) callbacks.current.onDone(res.state)
      else callbacks.current.onError(res.error ?? '微软登录失败')
    }, 800)
    const timeout = window.setTimeout(() => callbacks.current.onError('登录超时，请重试'), 180000)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(timeout)
    }
  }, [])
  return (
    <div className="inapp-auth">
      <div className="inapp-auth-bar">
        <span>微软登录</span>
        <button className="icon-btn tiny" onClick={onCancel}><Icon name="close" size={14} /></button>
      </div>
      {React.createElement('webview', {
        ref,
        src: LIVE_AUTH_URL,
        className: 'inapp-webview'
      })}
    </div>
  )
}

function ServersPage({
  gameDir,
  versionId,
  notify,
  onJoin
}: {
  gameDir: string
  versionId?: string
  notify: (kind: ToastKind, text: string) => void
  onJoin: (ip: string) => void
}): React.ReactElement {
  const [servers, setServers] = React.useState<{ name: string; ip: string }[]>([])
  const [name, setName] = React.useState('')
  const [ip, setIp] = React.useState('')
  const load = React.useCallback(() => void api.listServers(versionId).then(setServers), [versionId])
  React.useEffect(load, [load])
  const save = async (list: { name: string; ip: string }[]) => {
    const ok = await api.saveServers(list, versionId)
    if (ok) setServers(list)
    else notify('error', '写入 servers.dat 失败')
  }
  const add = () => {
    const n = name.trim()
    const addr = ip.trim()
    if (!n || !addr) return
    void save([...servers, { name: n, ip: addr }])
    setName('')
    setIp('')
  }
  return (
    <div className="page servers">
      <div className="toolbar">
        <div className="server-add">
          <input className="input" placeholder="名称" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="地址，如 mc.example.com:25565" value={ip} onChange={(e) => setIp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn small" onClick={add}>添加</button>
        </div>
        <span className="toolbar-hint">{servers.length} 个服务器</span>
        <div className="toolbar-fill" />
        <button className="btn small" onClick={load}>
          <Icon name="refresh" size={13} /> 刷新
        </button>
        <button className="btn small" onClick={() => void api.openPath(`${gameDir}/servers.dat`)}>
          <Icon name="folder" size={13} /> 文件
        </button>
      </div>
      {servers.length === 0 ? (
        <div className="empty">
          <Icon name="globe" size={22} />
          <p>还没有服务器，用上面的表单添加</p>
        </div>
      ) : (
        <table className="vtable full">
          <thead>
            <tr><th>名称</th><th>地址</th><th /></tr>
          </thead>
          <tbody>
            {servers.map((s) => (
              <tr key={`${s.name}-${s.ip}`}>
                <td><div className="vname"><span className="vglyph"><Icon name="globe" size={13} /></span><span className="vtitle">{s.name}</span></div></td>
                <td className="mono">{s.ip}</td>
                <td className="right">
                  <button className="btn tiny" onClick={() => onJoin(s.ip)}>
                    <Icon name="play" size={12} /> 进入
                  </button>
                  <button
                    className="icon-btn tiny"
                    title="删除"
                    onClick={() => void save(servers.filter((x) => x !== s))}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ModsPanel({
  notify,
  gameDir,
  selected,
  mode = 'download'
}: {
  notify: (kind: ToastKind, text: string) => void
  gameDir: string
  selected: VersionSummary | null
  mode?: 'download' | 'local'
}): React.ReactElement {
  const [mods, setMods] = React.useState<
    { name: string; size: number; mtime: number; enabled: boolean; title?: string; version?: string }[]
  >([])
  const [query, setQuery] = React.useState('')
  const [onlineQuery, setOnlineQuery] = React.useState('')
  const [hits, setHits] = React.useState<{ id: string; title: string; description: string; icon?: string; downloads: number; source: 'modrinth' }[]>([])
  const [sort, setSort] = React.useState<'relevance' | 'downloads' | 'newest'>('relevance')
  const [searching, setSearching] = React.useState(false)
  const [installingId, setInstallingId] = React.useState('')
  const [error, setError] = React.useState('')
  const loader = selected && selected.loader !== 'vanilla' ? selected.loader : undefined
  const gameVersion = selected?.gameVersion

  const runSearch = async (term: string, silent = false) => {
    setSearching(true)
    if (!silent) setError('')
    try {
      setHits(await api.searchMods({ query: term, loader, gameVersion, sort }))
      if (silent) setError('')
    } catch (err) {
      setHits([])
      if (!silent) setError((err as Error).message)
    } finally {
      setSearching(false)
    }
  }

  React.useEffect(() => {
    if (mode !== 'download') return
    setHits([])
    void runSearch('', true)
  }, [mode, loader, gameVersion, sort])


  const installOnline = async (hit: (typeof hits)[number]) => {
    setInstallingId(hit.id)
    const res = await api.installMod({ id: hit.id, loader, gameVersion, versionId: selected?.id })
    setInstallingId('')
    if (res.ok) {
      notify('success', res.files && res.files.length > 1 ? `已安装 ${res.files.length} 个文件` : `已安装 ${res.file ?? hit.title}`)
      load()
    } else notify('error', res.error ?? '安装失败')
  }
  const load = React.useCallback(() => void api.listMods(selected?.id).then(setMods), [])
  React.useEffect(load, [load])
  const filtered = mods.filter((m) =>
    `${m.title ?? ''} ${m.name}`.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <div className="mods-panel">
      {mode === 'download' && (
        <>
      <div className="mod-search">
        <div className="search">
          <Icon name="search" size={14} />
          <input
            placeholder={loader ? `搜索 ${loader} 模组` : '搜索模组（当前版本无加载器）'}
            value={onlineQuery}
            onChange={(e) => setOnlineQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void runSearch(onlineQuery.trim())}
          />
        </div>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="relevance">综合</option>
          <option value="downloads">下载量</option>
          <option value="newest">最新</option>
        </select>
        <button className="btn small primary" disabled={searching} onClick={() => void runSearch(onlineQuery.trim())}>
          {searching ? '搜索中…' : '搜索'}
        </button>
      </div>
      {error && <div className="alert"><Icon name="warning" size={14} /> {error}</div>}
      {hits.length > 0 && (
        <div className="mod-results">
          <div className="mod-results-label">{onlineQuery.trim() ? '搜索结果' : '推荐模组'}</div>
          {hits.map((h) => (
            <div key={`${h.source}-${h.id}`} className="mod-hit">
              {h.icon ? <img src={h.icon} alt="" /> : <span className="mod-hit-icon"><Icon name="package" size={16} /></span>}
              <div className="mod-hit-main">
                <strong>{h.title}</strong>
                <small>{h.description}</small>
              </div>
              <span className="mod-hit-dl">{(h.downloads / 1000).toFixed(1)}k</span>
              <button className="btn tiny primary" disabled={installingId === h.id} onClick={() => void installOnline(h)}>
                {installingId === h.id ? '安装中…' : '安装'}
              </button>
            </div>
          ))}
        </div>
      )}
        </>
      )}
      {mode === 'local' && (
        <>
      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={14} />
          <input placeholder="过滤本地模组" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <span className="toolbar-hint">{filtered.length} 个文件</span>
        <div className="toolbar-fill" />
        <button className="btn small" onClick={load}>
          <Icon name="refresh" size={13} /> 刷新
        </button>
        <button className="btn small" onClick={() => void api.openPath(`${gameDir}/mods`)}>
          <Icon name="folder" size={13} /> 目录
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="empty"><Icon name="package" size={22} /><p>mods 目录里还没有模组</p></div>
      ) : (
        <table className="vtable full">
          <thead>
            <tr><th style={{ width: '56%' }}>文件</th><th>大小</th><th>修改时间</th><th>状态</th><th /></tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.name} onClick={() => void api.toggleMod(m.name, selected?.id).then((ok) => ok && load())}>
                <td><div className="vname"><span className="vglyph"><Icon name="package" size={13} /></span><span className="vtitle" title={m.name}>{m.title ?? m.name}</span>
                    {m.version && <span className="mod-version">{m.version}</span>}</div></td>
                <td className="mono">{(m.size / 1024 / 1024).toFixed(1)} MB</td>
                <td>{new Date(m.mtime).toLocaleDateString('zh-CN')}</td>
                <td>{m.enabled ? '启用' : '禁用'}</td>
                <td className="right">
                  <button
                    className="icon-btn tiny"
                    title="删除"
                    onClick={(e) => {
                      e.stopPropagation()
                      void api.deleteMod(m.name, selected?.id).then((ok) => {
                        if (ok) {
                          notify('success', `已删除 ${m.name}`)
                          load()
                        }
                      })
                    }}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
        </>
      )}
    </div>
  )
}

function SavesPage({
  notify,
  gameDir,
  versionId
}: {
  notify: (kind: ToastKind, text: string) => void
  gameDir: string
  versionId?: string
}): React.ReactElement {
  const [saves, setSaves] = React.useState<{ name: string; mtime: number }[]>([])
  const load = React.useCallback(() => void api.listSaves(versionId).then(setSaves), [versionId])
  React.useEffect(load, [load])
  return (
    <div className="page saves">
      <div className="toolbar">
        <span className="toolbar-hint">{saves.length} 个存档</span>
        <div className="toolbar-fill" />
        <button className="btn small" onClick={load}><Icon name="refresh" size={13} /> 刷新</button>
        <button className="btn small" onClick={() => void api.openPath(`${gameDir}/saves`)}><Icon name="folder" size={13} /> 目录</button>
      </div>
      {saves.length === 0 ? (
        <div className="empty"><Icon name="folder" size={22} /><p>还没有存档</p></div>
      ) : (
        <table className="vtable full">
          <thead><tr><th>存档</th><th>修改时间</th><th /></tr></thead>
          <tbody>
            {saves.map((s) => (
              <tr key={s.name}>
                <td><div className="vname"><span className="vglyph"><Icon name="folder" size={13} /></span><span className="vtitle">{s.name}</span></div></td>
                <td>{new Date(s.mtime).toLocaleString('zh-CN')}</td>
                <td className="right">
                  <button className="icon-btn tiny" title="打开存档文件夹" onClick={() => void api.openPath(`${gameDir}/saves/${s.name}`)}>
                    <Icon name="folder" size={13} />
                  </button>
                  <button
                    className="icon-btn tiny"
                    title="删除存档"
                    onClick={() => {
                      void api.deleteSave(s.name, versionId).then((ok) => {
                        if (ok) {
                          notify('success', `已删除 ${s.name}`)
                          load()
                        }
                      })
                    }}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function PacksPage({
  notify,
  gameDir,
  versionId,
  gameVersion
}: {
  notify: (kind: ToastKind, text: string) => void
  gameDir: string
  versionId?: string
  gameVersion?: string
}): React.ReactElement {
  const [tab, setTab] = React.useState<'resourcepacks' | 'shaderpacks'>('resourcepacks')
  const [items, setItems] = React.useState<{ name: string; size: number; mtime: number }[]>([])
  const [online, setOnline] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [hits, setHits] = React.useState<{ id: string; title: string; description: string; icon?: string; downloads: number }[]>([])
  const [busy, setBusy] = React.useState(false)
  const [installing, setInstalling] = React.useState('')
  const load = React.useCallback(() => void api.listContent(tab, versionId).then(setItems), [tab, versionId])
  React.useEffect(load, [load])
  const ctype = tab === 'shaderpacks' ? 'shader' : 'resourcepack'
  const search = async () => {
    if (!q.trim()) return
    setBusy(true)
    setHits(await api.searchContent(ctype, q.trim(), gameVersion))
    setBusy(false)
  }
  const install = async (id: string, title: string) => {
    setInstalling(id)
    const res = await api.installContent(ctype, id, gameVersion, versionId)
    setInstalling('')
    if (res.ok) {
      notify('success', `已下载 ${res.file}`)
      load()
    } else notify('error', res.error ?? '下载失败')
  }
  return (
    <div className="page packs">
      <div className="toolbar">
        <div className="tabs small">
          <button className={tab === 'resourcepacks' ? 'active' : ''} onClick={() => setTab('resourcepacks')}>资源包</button>
          <button className={tab === 'shaderpacks' ? 'active' : ''} onClick={() => setTab('shaderpacks')}>光影包</button>
        </div>
        <span className="toolbar-hint">{items.length} 个</span>
        <div className="toolbar-fill" />
        <button className="btn small" onClick={load}><Icon name="refresh" size={13} /> 刷新</button>
        <button className="btn small" onClick={() => void api.openPath(`${gameDir}/${tab}`)}><Icon name="folder" size={13} /> 目录</button>
      </div>
      {online ? (
        <div className="online-content">
          <div className="search">
            <Icon name="search" size={14} />
            <input placeholder={`搜索${tab === 'shaderpacks' ? '光影' : '资源包'}`} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
          </div>
          <button className="btn small primary" onClick={() => void search()}>{busy ? '搜索中…' : '搜索'}</button>
          <div className="online-list">
            {hits.map((h) => (
              <div className="online-hit" key={h.id}>
                {h.icon ? <img src={h.icon} alt="" /> : <span className="online-hit-ph"><Icon name="package" size={16} /></span>}
                <div className="online-hit-body">
                  <span className="online-hit-title">{h.title}</span>
                  <span className="online-hit-desc">{h.description}</span>
                </div>
                <span className="online-hit-dl">{(h.downloads / 1000).toFixed(1)}k</span>
                <button className="btn small" disabled={installing === h.id} onClick={() => void install(h.id, h.title)}>
                  {installing === h.id ? '下载中…' : '下载'}
                </button>
              </div>
            ))}
            {!busy && hits.length === 0 && <div className="empty"><Icon name="package" size={20} /><p>搜索 Modrinth 在线内容</p></div>}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="empty"><Icon name="package" size={22} /><p>{tab === 'resourcepacks' ? '还没有资源包' : '还没有光影包'}</p></div>
      ) : (
        <table className="vtable full">
          <thead><tr><th style={{ width: '56%' }}>名称</th><th>大小</th><th>修改时间</th><th /></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.name}>
                <td><div className="vname"><span className="vglyph"><Icon name="package" size={13} /></span><span className="vtitle">{it.name}</span></div></td>
                <td className="mono">{it.size ? `${(it.size / 1024 / 1024).toFixed(1)} MB` : '—'}</td>
                <td>{new Date(it.mtime).toLocaleDateString('zh-CN')}</td>
                <td className="right">
                  <button className="icon-btn tiny" title="打开文件夹" onClick={() => void api.openPath(`${gameDir}/${tab}`)}>
                    <Icon name="folder" size={13} />
                  </button>
                  <button
                    className="icon-btn tiny"
                    title="删除"
                    onClick={() => {
                      void api.deleteContent(tab, it.name, versionId).then((ok) => {
                        if (ok) {
                          notify('success', `已删除 ${it.name}`)
                          load()
                        }
                      })
                    }}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function VersionSettings({
  version,
  state,
  onClose,
  onConfig,
  notify
}: {
  version: VersionSummary
  state: AppState
  onClose: () => void
  onConfig: (patch: Partial<LauncherConfig>) => Promise<void>
  notify: (kind: ToastKind, text: string) => void
}): React.ReactElement {
  const [tab, setTab] = React.useState<'general' | 'mods'>('general')
  React.useEffect(() => {
    if (!state.config.dynamicWindow) return
    void api.resizeWindow(700, 620)
    return () => {
      void api.resizeWindow(880, 620)
    }
  }, [state.config.dynamicWindow])
  const java = state.config.javaOverrides?.[version.id] ?? ''
  const memory = state.config.memoryOverrides?.[version.id] ?? 0
  return (
    <div className="modal-backdrop solid" onMouseDown={onClose}>
      <div className="modal version-settings" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{version.displayName ?? version.id}</h2>
          <button className="icon-btn tiny" onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className="tabs small version-tabs">
          <button className={tab === 'general' ? 'active' : ''} onClick={() => setTab('general')}>常规</button>
          <button className={tab === 'mods' ? 'active' : ''} onClick={() => setTab('mods')}>模组</button>
        </div>
        {tab === 'general' ? (
          <div className="version-general">
            <div className="srow">
              <div className="slabel"><b>Java</b><small>留空跟随全局设置</small></div>
              <div className="scontrol">
                <select
                  className="select"
                  value={java}
                  onChange={(e) => void onConfig({ javaOverrides: { ...state.config.javaOverrides, [version.id]: e.target.value } })}
                >
                  <option value="">跟随全局</option>
                  {state.javas.map((j) => (
                    <option key={j.path} value={j.path}>Java {j.major} · {j.version}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="srow">
              <div className="slabel"><b>内存</b><small>0 表示跟随全局</small></div>
              <div className="scontrol">
                <select
                  className="select"
                  value={String(memory)}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    const overrides = { ...state.config.memoryOverrides }
                    if (value) overrides[version.id] = value
                    else delete overrides[version.id]
                    void onConfig({ memoryOverrides: overrides })
                  }}
                >
                  <option value="0">跟随全局（{state.config.maxMemory / 1024} GB）</option>
                  {[2048, 4096, 6144, 8192].map((m) => (
                    <option key={m} value={m}>{m / 1024} GB</option>
                  ))}
                </select>
              </div>
            </div>
            {!version.profile && (
              <div className="srow">
                <div className="slabel">
                  <b>版本隔离</b>
                  <small>该版本的存档/模组/配置独立到 versions/&lt;id&gt;/game</small>
                </div>
                <div className="scontrol">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(state.config.isolatedVersions?.[version.id])}
                      onChange={(e) => {
                        const map = { ...(state.config.isolatedVersions ?? {}) }
                        if (e.target.checked) map[version.id] = true
                        else delete map[version.id]
                        void onConfig({ isolatedVersions: map })
                      }}
                    />
                    <i />
                  </label>
                </div>
              </div>
            )}
            <div className="srow">
              <div className="slabel"><b>目录</b><small>{version.path}</small></div>
              <div className="scontrol">
                <button className="btn small" onClick={() => void api.openPath(version.path)}>
                  <Icon name="folder" size={13} /> 打开
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="version-mods">
            <ModsPanel
              mode="local"
              gameDir={
                state.config.isolatedVersions?.[version.id]
                  ? `${state.config.gameDir}/versions/${version.id}/game`
                  : state.config.gameDir
              }
              selected={version}
              notify={notify}
            />
          </div>
        )}
      </div>
    </div>
  )
}
