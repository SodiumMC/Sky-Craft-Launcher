/**
 * 渲染入口：主窗口挂载 Root（启动页 + 管理页两个视图），
 * 通知 / 登录等辅助窗口通过 query 参数走独立组件。
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import HomeApp from './HomeApp'
import ManagerApp from './App'
import NotificationToast from './NotificationToast'
import LoginWindow from './LoginWindow'
import './styles.css'
import { installAutoTranslate } from './i18nAuto'

let themeMode: 'light' | 'dark' | 'system' = 'system'
const darkMq = window.matchMedia('(prefers-color-scheme: dark)')
function applyTheme(): void {
  const resolved = themeMode === 'system' ? (darkMq.matches ? 'dark' : 'light') : themeMode
  document.documentElement.dataset.theme = resolved
}
void window.scl.getState().then((s) => {
  themeMode = s.config.theme ?? 'system'
  applyTheme()
  installAutoTranslate(s.config.language)
})
window.scl.onConfigChanged((patch) => {
  if (patch.theme) {
    themeMode = patch.theme
    applyTheme()
  }
})
darkMq.addEventListener('change', applyTheme)
applyTheme()
import type { CrashReport, UpdateInfo } from '../../shared/types'

function Root(): React.ReactElement {
  const [view, setView] = React.useState<'home' | 'manager'>('home')
  const [update, setUpdate] = React.useState<UpdateInfo | null>(null)
  const [crash, setCrash] = React.useState<CrashReport | null>(null)
  const viewRef = React.useRef(view)
  viewRef.current = view
  const dynamicRef = React.useRef(true)
  React.useEffect(() => {
    void window.scl.getState().then((s) => {
      dynamicRef.current = s.config.dynamicWindow
    })
  }, [])
  React.useEffect(() => {
    if (!update) return
    if (dynamicRef.current) void window.scl.resizeWindow(720, 460)
    return () => {
      if (!dynamicRef.current) return
      const home = viewRef.current === 'home'
      void window.scl.resizeWindow(home ? 640 : 880, home ? 480 : 620)
    }
  }, [update])
  React.useEffect(() => {
    if (!crash) return
    if (dynamicRef.current) void window.scl.resizeWindow(760, 560)
    return () => {
      if (!dynamicRef.current) return
      const home = viewRef.current === 'home'
      void window.scl.resizeWindow(home ? 640 : 880, home ? 480 : 620)
    }
  }, [crash])
  const strength = React.useRef(100)
  React.useEffect(() => window.scl.onViewChange((next) => setView(next)), [])
  React.useEffect(() => window.scl.onUpdateAvailable((info) => setUpdate(info)), [])
  React.useEffect(() => window.scl.onCrash((report) => setCrash(report)), [])
  React.useEffect(
    () =>
      window.scl.onWindowAnimating((active) => {
        document.body.classList.toggle('is-resizing', active)
      }),
    []
  )
  React.useEffect(() => {
    void window.scl.getState().then((s) => {
      strength.current = s.config.tiltStrength ?? 100
    })
    return window.scl.onConfigChanged((patch) => {
      if (typeof patch.tiltStrength === 'number') strength.current = patch.tiltStrength
    })
  }, [])
  React.useEffect(() => {
    const off = window.scl.onCursor(({ x, y, w, h }) => {
      const k = strength.current / 100
      // 指针落在可交互元素上时冻结倾斜，避免按钮在点击前移动
      const hit = document
        .elementFromPoint(x, y)
        ?.closest('button, a, input, select, textarea, [role="button"], tr, .list-row, .picker-row')
      if (hit) return
      const dx = Math.max(-1, Math.min(1, (x - w / 2) / (w / 2)))
      const dy = Math.max(-1, Math.min(1, (y - h / 2) / (h / 2)))
      const root = document.documentElement.style
      root.setProperty('--tilt-x', `${(-dy * 2.2 * k).toFixed(2)}deg`)
      root.setProperty('--tilt-y', `${(dx * 2.2 * k).toFixed(2)}deg`)
      root.setProperty('--mx', `${(dx * 8 * k).toFixed(1)}px`)
      root.setProperty('--my', `${(dy * 8 * k).toFixed(1)}px`)
    })
    return () => off()
  }, [])
  return (
    <div className={`view-stack ${update ? 'update-mode' : ''} ${crash ? 'crash-mode' : ''}`}>
      <div className={`view ${view === 'home' ? 'on' : ''}`}>
        <HomeApp />
      </div>
      <div className={`view ${view === 'manager' ? 'on' : ''}`}>
        <ManagerApp />
      </div>
      {update && <UpdateDialog info={update} onClose={() => setUpdate(null)} />}
      {crash && <CrashDialog report={crash} onClose={() => setCrash(null)} />}
    </div>
  )
}

const params = new URLSearchParams(window.location.search)
const special = params.get('view')

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {special === 'notification' ? (
      <NotificationToast />
    ) : special === 'login' ? (
      <LoginWindow />
    ) : special === 'eggFall' ? (
      <EggFallView />
    ) : (
      <Root />
    )}
  </React.StrictMode>
)


function UpdateDialog({ info, onClose }: { info: UpdateInfo; onClose: () => void }): React.ReactElement {
  const [downloading, setDownloading] = React.useState(false)
  const [result, setResult] = React.useState('')
  const [progress, setProgress] = React.useState<{ received: number; total: number } | null>(null)
  React.useEffect(() => window.scl.onUpdateDownloadProgress((p) => setProgress(p)), [])
  const platform = window.scl.platform
  const prefix = platform === 'win32' ? 'win32' : platform === 'darwin' ? 'darwin' : platform
  const keys = Object.keys(info.urls ?? {})
  const key = keys.find((k) => k.startsWith(prefix))
  const url = key ? info.urls?.[key] ?? '' : ''
  const missing = !key
  return (
    <div className="update-backdrop" onMouseDown={onClose}>
      <div className="update-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="update-head">
          <strong>发现新版本 {info.version}</strong>
          <button className="icon-btn tiny" onClick={onClose}>✕</button>
        </div>
        {info.pubDate && <div className="update-date">{info.pubDate}</div>}
        <div className="update-notes">{info.notes || '本次更新没有提供说明。'}</div>
        {downloading && progress && (
          <div className="update-progress">
            <div className="update-progress-bar">
              <i style={{ width: progress.total ? `${Math.min(100, (progress.received / progress.total) * 100)}%` : '100%' }} />
            </div>
            <span>
              {progress.total
                ? `${(progress.received / 1048576).toFixed(1)} / ${(progress.total / 1048576).toFixed(1)} MB · ${Math.min(100, Math.round((progress.received / progress.total) * 100))}%`
                : `${(progress.received / 1048576).toFixed(1)} MB`}
            </span>
          </div>
        )}
        {missing && !result && (
          <div className="update-status">当前平台暂无更新包（{platform}）</div>
        )}
        {result && <div className="update-status">{result}</div>}
        <div className="update-actions">
          <button className="btn" onClick={onClose}>稍后</button>
          <button
            className="btn primary"
            data-url={url}
            data-platform={platform}
            disabled={!url || downloading}
            onClick={async () => {
              if (!url) return
              setDownloading(true)
              setProgress(null)
              setResult('')
              const res = await window.scl.downloadUpdate(url)
              setDownloading(false)
              setResult(res.ok ? `已下载到 ${res.path}` : res.error ?? '下载失败')
            }}
          >
            {downloading ? '下载中…' : '下载更新'}
          </button>
        </div>
      </div>
    </div>
  )
}


function CrashDialog({ report, onClose }: { report: CrashReport; onClose: () => void }): React.ReactElement {
  return (
    <div className="update-backdrop" onMouseDown={onClose}>
      <div className="update-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="update-head">
          <strong>游戏异常退出</strong>
          <button className="icon-btn tiny" onClick={onClose}>✕</button>
        </div>
        <div className="crash-sub">
          {report.versionId ?? ''} · 退出码 {report.code ?? '—'}
        </div>
        <div className="crash-title">{report.title}</div>
        <div className="update-notes">{report.detail}</div>
        {report.suggestions.length > 0 && (
          <ul className="crash-tips">
            {report.suggestions.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
        <div className="update-actions">
          {report.logFile && (
            <button className="btn" onClick={() => void window.scl.openPath(report.logFile!)}>
              打开日志
            </button>
          )}
          <button className="btn primary" onClick={onClose}>知道了</button>
        </div>
      </div>
    </div>
  )
}


function EggFallView(): React.ReactElement {
  const [payload, setPayload] = React.useState<{
    items: Array<{ dataUrl: string; x: number; y: number; w: number; h: number }>
    audio?: string
  } | null>(null)
  React.useEffect(() => window.scl.onEggFallImage(setPayload), [])
  React.useEffect(() => {
    if (!payload) return
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('.egg-piece'))
    const ground = window.innerHeight - 38
    const state = payload.items.map(() => ({
      vx: (Math.random() * 2 - 1) * 420,
      vy: Math.random() * 60,
      r: (Math.random() * 2 - 1) * 8,
      vr: (Math.random() * 2 - 1) * 18,
      dx: 0,
      dy: 0,
      landed: false
    }))
    let raf = 0
    let last = performance.now()
    let clanged = false
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      let active = false
      state.forEach((s, i) => {
        const item = payload.items[i]
        if (!item || s.landed) return
        s.vy += 2200 * dt
        s.dx += s.vx * dt
        s.dy += s.vy * dt
        s.r += s.vr * dt
        const bottom = item.y + s.dy + item.h
        if (bottom >= ground) {
          s.dy -= bottom - ground
          if (!clanged && s.vy > 120) {
            clanged = true
            if (payload.audio) {
              const audio = new Audio(payload.audio)
              audio.volume = 1
              audio
                .play()
                .then(() => {
                  ;(window as unknown as { __eggAudio?: string }).__eggAudio = 'ok'
                })
                .catch((err) => {
                  ;(window as unknown as { __eggAudio?: string }).__eggAudio = 'err:' + String(err)
                  void window.scl.eggClang()
                })
            } else {
              void window.scl.eggClang()
            }
          }
          s.vy *= -0.3
          s.vx *= 0.72
          s.vr *= 0.5
          if (Math.abs(s.vy) < 45) {
            s.vy = 0
            s.vx = 0
            s.landed = true
          }
        }
        if (item.x + s.dx < 0) {
          s.dx = -item.x
          s.vx = Math.abs(s.vx) * 0.6
        }
        if (item.x + s.dx + item.w > window.innerWidth) {
          s.dx = window.innerWidth - item.w - item.x
          s.vx = -Math.abs(s.vx) * 0.6
        }
        if (!s.landed) active = true
      })

      // 地面上的块互相推开，避免叠在一起看不清
      const grounded: number[] = []
      state.forEach((s, i) => {
        const item = payload.items[i]
        if (!item) return
        if (item.y + s.dy + item.h >= ground - 1.5) grounded.push(i)
      })
      for (let a = 0; a < grounded.length; a++) {
        for (let b = a + 1; b < grounded.length; b++) {
          const i = grounded[a]
          const j = grounded[b]
          const si = state[i]
          const sj = state[j]
          const pi = payload.items[i]
          const pj = payload.items[j]
          if (!pi || !pj) continue
          const ci = pi.x + si.dx + pi.w / 2
          const cj = pj.x + sj.dx + pj.w / 2
          const need = (pi.w + pj.w) / 2 + 6
          const delta = cj - ci
          if (Math.abs(delta) < need) {
            const push = (need - Math.abs(delta)) / 2
            if (delta >= 0) {
              si.dx -= push
              sj.dx += push
            } else {
              si.dx += push
              sj.dx -= push
            }
          }
        }
      }
      state.forEach((s, i) => {
        const img = imgs[i]
        const item = payload.items[i]
        if (!img || !item) return
        if (item.x + s.dx < 0) s.dx = -item.x
        if (item.x + s.dx + item.w > window.innerWidth) s.dx = window.innerWidth - item.w - item.x
        img.style.transform = `translate(${s.dx}px, ${s.dy}px) rotate(${s.r}deg)`
      })
      if (active) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [payload])
  return (
    <>
      {payload?.items.map((item, i) => (
        <img
          key={i}
          className="egg-piece"
          src={item.dataUrl}
          alt=""
          style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
        />
      ))}
      <div className="egg-ground" />
    </>
  )
}
