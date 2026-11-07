import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icons'

export interface SelectOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export function Select(props: {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}): React.ReactElement {
  const { value, options, onChange, className = '', disabled, placeholder } = props
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState({ left: 0, top: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  const toggle = () => {
    if (disabled) return
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const height = Math.min(280, options.length * 34 + 12)
    const below = r.bottom + 6
    const top = below + height > window.innerHeight - 8 ? Math.max(8, r.top - height - 6) : below
    setRect({
      left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 180) - 8)),
      top,
      width: Math.max(r.width, 180)
    })
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  return (
    <div className={`cselect ${className}`}>
      <button ref={btnRef} type="button" className="cselect-btn" disabled={disabled} onClick={toggle}>
        <span className={`cselect-label ${current ? '' : 'is-placeholder'}`}>
          {current?.label ?? placeholder ?? '—'}
        </span>
        <Icon name="chevronDown" size={12} />
      </button>
      {open &&
        createPortal(
          <div className="cselect-pop" ref={popRef} style={{ left: rect.left, top: rect.top, width: rect.width }}>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`cselect-item ${o.value === value ? 'active' : ''}`}
                disabled={o.disabled}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                {o.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}
