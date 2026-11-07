/**
 * 启动页视图：版本卡片、启动按钮、精简 Dock、账户头像。
 * 与 App.tsx 同时挂载；主进程负责窗口尺寸与通知层，这里只发指令。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AppState, InstallProgress, LogLine, VersionSummary } from '../../shared/types'
import { Icon } from './components/Icons'
import { avatarGradient, formatRelative, initials, loaderMeta, percent } from './lib/format'
import { tr, type Lang } from './i18n'

const api = window.scl

type Notice = { kind: 'success' | 'error' | 'info'; text: string }

const DOCK: {
  view: 'download' | 'versions' | 'settings'
  label: string
  icon: React.ComponentProps<typeof Icon>['name']
  tip: string
}[] = [
  { view: 'download', label: '下载', icon: 'download', tip: '模组 / 资源包 / 光影 / 整合包' },
  { view: 'versions', label: '版本', icon: 'grid', tip: '版本管理与安装' },
  { view: 'settings', label: '设置', icon: 'settings', tip: '启动器设置' }
]

export default function HomeApp(): React.ReactElement {
  const [state, setState] = useState<AppState | null>(null)
  const [cursor, setCursor] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [install, setInstall] = useState<InstallProgress | null>(null)
  const [launching, setLaunching] = useState(false)

  const announce = useCallback((kind: Notice['kind'], text: string) => {
    void api.notify(kind, text)
  }, [])

  const refresh = useCallback(async () => setState(await api.getState()), [])

  useEffect(() => {
    void refresh()
    const offProgress = api.onInstallProgress((p) => {
      setInstall(p)
      if (['done', 'error', 'cancelled'].includes(p.phase)) {
        void refresh()
        if (p.phase === 'done') announce('success', `${p.id} 安装完成`)
        if (p.phase === 'error') announce('error', p.error ?? '安装失败')
        window.setTimeout(() => setInstall((cur) => (cur && cur.phase === p.phase ? null : cur)), 3000)
      }
    })
    const offExit = api.onLaunchExit(({ code }) => {
      void refresh()
      announce(code === 0 ? 'info' : 'error', code === 0 ? '游戏已退出' : `游戏异常退出（${code ?? '未知'}）`)
    })
    const offState = api.onStateChanged(() => void refresh())
    const offLog = api.onLog((line: LogLine) => {
      // 首页不展示日志，仅保留订阅以保持事件流一致
      void line
    })
    const offCursor = api.onCursor((pos) => setCursor(pos))
    return () => {
      offProgress()
      offExit()
      offState()
      offLog()
      offCursor()
    }
  }, [announce, refresh])

  const selected = useMemo(() => {
    if (!state) return null
    return (
      state.versions.find((v) => v.id === state.config.selectedVersion && v.installed) ??
      state.versions.find((v) => v.installed) ??
      null
    )
  }, [state])

  const selectVersion = useCallback(async (id: string) => {
    setState((prev) => (prev ? { ...prev, config: { ...prev.config, selectedVersion: id } } : prev))
    setState(await api.saveConfig({ selectedVersion: id }))
  }, [])

  const launch = useCallback(async () => {
    if (!selected) return
    if (state?.running) {
      await api.killGame()
      announce('info', '正在停止游戏…')
      return
    }
    setLaunching(true)
    try {
      const res = await api.launch(selected.id)
      if (!res.ok) announce('error', res.error ?? '启动失败')
      else {
        announce('success', `${selected.id} 已启动`)
        void refresh()
      }
    } finally {
      setLaunching(false)
    }
  }, [announce, refresh, selected, state?.running])

  if (!state) {
    return (
      <div className="home boot-home">
        <div className="boot-logo">SC</div>
      </div>
    )
  }

  const L = (state.config.language ?? 'zh-CN') as Lang
  const t = (text: string) => tr(L, text)
  const account = state.accounts.find((a) => a.id === state.currentAccountId) ?? state.accounts[0]
  const running = Boolean(state.running)
  const pct = install ? percent(install.bytes, install.totalBytes) : 0
  const effectiveMemory = selected ? state.config.memoryOverrides?.[selected.id] ?? state.config.maxMemory : state.config.maxMemory
  const requiredJava = selected?.javaMajor
  const overridePath = selected ? state.config.javaOverrides?.[selected.id] : ''
  const overrideMajor = overridePath ? state.javas.find((j) => j.path === overridePath)?.major : undefined
  const globalMajor = state.config.javaPath
    ? state.javas.find((j) => j.path === state.config.javaPath)?.major
    : undefined
  const autoJava = state.javas
    .filter((j) => !requiredJava || j.major >= requiredJava)
    .sort((a, b) => a.major - b.major)[0]
  const effectiveJava = overrideMajor ?? globalMajor ?? autoJava?.major ?? requiredJava
  const parallax = (() => {
    if (!cursor) return {} as React.CSSProperties
    const dx = Math.max(-1, Math.min(1, (cursor.x - cursor.w / 2) / (cursor.w / 2)))
    const dy = Math.max(-1, Math.min(1, (cursor.y - cursor.h / 2) / (cursor.h / 2)))
    return {
      '--tilt-x': `${(-dy * 2.2).toFixed(2)}deg`,
      '--tilt-y': `${(dx * 2.2).toFixed(2)}deg`,
      '--mx': `${(dx * 8).toFixed(1)}px`,
      '--my': `${(dy * 8).toFixed(1)}px`
    } as React.CSSProperties
  })()

  return (
    <div className="home" style={parallax}>
      <div className="home-top">
        <div className="home-win">
          <button className="win-btn" title="最小化" onClick={() => void api.minimizeWindow()}>
            <Icon name="minimize" size={12} />
          </button>
          <button className="win-btn" title="隐藏启动页" onClick={() => void api.closeWindow()}>
            <Icon name="close" size={12} />
          </button>
        </div>
      </div>

      <section className="launch-card">
        <div className="lc-head">
          <div className="card-brand">
            SCL<span>Sky Craft Launcher</span><em className="beta-tag">BETA</em>
          </div>
          <VersionPicker state={state} selected={selected} onSelect={selectVersion} />
        </div>

        <div className="lc-body">
          <h1 className="lc-title" title={selected?.id}>
            {selected?.displayName ?? selected?.id ?? '还没有版本'}
          </h1>
          <div className="lc-meta">
            {selected ? (
              <>
                <LoaderTag loader={selected.loader} />
                <span>
                  {running
                    ? t('游戏运行中')
                    : selected.lastPlayed
                      ? `${t('上次启动')} ${formatRelative(selected.lastPlayed, state.config.language)}`
                      : t('尚未启动')}
                </span>
              </>
            ) : (
              <span>安装一个原版或 Fabric 版本，就可以从这里一键启动。</span>
            )}
          </div>
          {selected && (
            <div className="lc-stats">
              <div>
                <span>{t('游戏版本')}</span>
                <b>{selected.gameVersion}</b>
              </div>
              <div>
                <span>{t('加载器')}</span>
                <b>{selected.loader === 'vanilla' ? '原版' : `${loaderMeta(selected.loader).label} ${selected.loaderVersion ?? ''}`}</b>
              </div>
              <div>
                <span>Java</span>
                <b>{effectiveJava != null ? effectiveJava : '未检测'}</b>
              </div>
              <div>
                <span>{t('内存')}</span>
                <b>{effectiveMemory / 1024} GB</b>
              </div>
            </div>
          )}
        </div>

        {install && (
          <div className="lc-task">
            <div className="lc-task-head">
              <span>{install.label}</span>
              <b>{pct}%</b>
            </div>
            <div className={`progress ${install.totalBytes ? '' : 'indeterminate'}`}>
              <i style={{ width: install.totalBytes ? `${pct}%` : undefined }} />
            </div>
          </div>
        )}

        <div className="lc-foot">
          <button
            className={`lc-launch ${running ? 'stop' : ''}`}
            disabled={launching}
            onClick={selected ? () => void launch() : () => void api.openManager('download')}
          >
            {launching ? <span className="spinner light" /> : <Icon name={running ? 'stop' : 'play'} size={20} />}
            <span>{launching ? t('启动中…') : running ? t('停止游戏') : selected ? t('启动游戏') : t('打开下载')}</span>
          </button>
        </div>
      </section>

      <button
        className="home-avatar"
        style={{ background: avatarGradient(account?.username ?? 'Player') }}
        title={`${account?.username ?? 'Player'} · 账户与设置`}
        onClick={() => void api.openAccount()}
      >
        {initials(account?.username ?? 'Player')}
      </button>

      <div className="home-dock">
        <button className="dock-item dock-active">
          <Icon name="play" size={15} />
          <span>{t('启动')}</span>
        </button>
        {DOCK.map((d) => (
          <button key={d.view} className="dock-item" onClick={() => void api.openManager(d.view)}>
            <Icon name={d.icon} size={15} />
            <span>{t(d.label)}</span>
          </button>
        ))}
      </div>

    </div>
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

function VersionPicker(props: {
  state: AppState
  selected: VersionSummary | null
  onSelect: (id: string) => void
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    const rect = ref.current?.getBoundingClientRect()
    if (rect) setPos({ left: rect.left, top: rect.bottom + 4, width: rect.width })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || popRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown, true)
    return () => document.removeEventListener('mousedown', onDown, true)
  }, [open])

  const installed = props.state.versions.filter((v) => v.installed)
  const choice = (id: string) => {
    props.onSelect(id)
    setOpen(false)
  }

  return (
    <div className="picker" ref={ref}>
      <button className="picker-btn" onClick={toggle}>
        <span>{props.selected?.displayName ?? props.selected?.id ?? '选择版本'}</span>
        <Icon name="chevronDown" size={13} />
      </button>
      {open && pos &&
        createPortal(
          <div
            className="picker-pop picker-pop-portal"
            ref={popRef}
            style={{ left: pos.left, top: pos.top, width: pos.width }}
          >
            {installed.length === 0 && <div className="picker-empty">没有已安装版本</div>}
            {installed.map((v) => (
              <button
                key={v.id}
                className={`picker-row ${props.selected?.id === v.id ? 'active' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  choice(v.id)
                }}
                onClick={() => choice(v.id)}
              >
                <span className="vglyph" style={{ background: loaderMeta(v.loader).bg, color: loaderMeta(v.loader).color }}>
                  <Icon name="cube" size={12} />
                </span>
                <span className="picker-name">{v.displayName ?? v.id}</span>
                <span className="picker-loader">{loaderMeta(v.loader).label}</span>
                {props.selected?.id === v.id && <Icon name="check" size={13} />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}

