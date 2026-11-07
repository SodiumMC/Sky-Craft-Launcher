import React, { useEffect, useState } from 'react'
import { Icon } from './components/Icons'

export default function NotificationToast(): React.ReactElement {
  const params = new URLSearchParams(window.location.search)
  const kind = params.get('kind') ?? 'info'
  const text = params.get('text') ?? ''
  const [angle, setAngle] = useState(0)
  useEffect(() => window.scl.onNotificationFall(({ angle }) => setAngle(angle)), [])
  return (
    <div
      className={`notif ${kind}`}
      style={{ transform: angle ? `rotate(${angle}deg)` : undefined, transition: 'transform 0.34s cubic-bezier(0.3, 0, 0.8, 1)' }}
    >
      <Icon name={kind === 'success' ? 'check' : kind === 'error' ? 'warning' : 'info'} size={16} />
      <span className="notif-text">{text}</span>
      <button className="notif-x" onClick={() => void window.scl.dismissNotification()} aria-label="关闭">
        <Icon name="close" size={12} />
      </button>
    </div>
  )
}
