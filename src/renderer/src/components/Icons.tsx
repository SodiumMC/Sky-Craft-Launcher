import React from 'react'

export type IconName =
  | 'play'
  | 'stop'
  | 'grid'
  | 'download'
  | 'settings'
  | 'terminal'
  | 'folder'
  | 'refresh'
  | 'search'
  | 'chevronDown'
  | 'chevronRight'
  | 'close'
  | 'check'
  | 'warning'
  | 'plus'
  | 'arrowRight'
  | 'copy'
  | 'trash'
  | 'external'
  | 'sparkles'
  | 'cube'
  | 'cpu'
  | 'java'
  | 'user'
  | 'clock'
  | 'package'
  | 'globe'
  | 'monitor'
  | 'info'
  | 'edit'
  | 'memory'
  | 'rocket'
  | 'minimize'

interface IconProps {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 18, className, strokeWidth = 1.8 }: IconProps): React.ReactElement {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true
  }
  switch (name) {
    case 'play':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M8.5 5.4c0-.9 1-1.5 1.8-1l9 6.1c.7.5.7 1.5 0 2l-9 6.1c-.8.5-1.8-.1-1.8-1V5.4Z" />
        </svg>
      )
    case 'stop':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <rect x="6" y="6" width="12" height="12" rx="2.4" />
        </svg>
      )
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3.5v11" />
          <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
          <path d="M4.5 20.5h15" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M20 17h0" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="12" r="2" />
          <circle cx="18" cy="17" r="2" />
        </svg>
      )
    case 'terminal':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="m7 9 3 3-3 3M12.5 15H17" />
        </svg>
      )
    case 'folder':
      return (
        <svg {...common}>
          <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.2c.6 0 1.2.2 1.6.7l1.1 1.3H18a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 1 0-2.3 6.3" />
          <path d="M20 4.5V11h-6.5" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
      )
    case 'chevronDown':
      return (
        <svg {...common}>
          <path d="m6 9.5 6 6 6-6" />
        </svg>
      )
    case 'chevronRight':
      return (
        <svg {...common}>
          <path d="m9.5 6 6 6-6 6" />
        </svg>
      )
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m4.5 12.5 5 5 10-11" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...common}>
          <path d="M12 3.8 21 20H3L12 3.8Z" />
          <path d="M12 9.5v5M12 17.4v.2" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'arrowRight':
      return (
        <svg {...common}>
          <path d="M4 12h15" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      )
    case 'copy':
      return (
        <svg {...common}>
          <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
          <path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16M10 4h4M6.5 7l.8 12.2A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.8L17.5 7M10 11v6M14 11v6" />
        </svg>
      )
    case 'external':
      return (
        <svg {...common}>
          <path d="M14 4h6v6M20 4l-9 9" />
          <path d="M18 14v4.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2H10" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg {...common}>
          <path d="M12 3.5c.6 3.7 1.8 4.9 5.5 5.5-3.7.6-4.9 1.8-5.5 5.5-.6-3.7-1.8-4.9-5.5-5.5 3.7-.6 4.9-1.8 5.5-5.5Z" />
          <path d="M18.5 14.5c.3 1.9.9 2.5 2.8 2.8-1.9.3-2.5.9-2.8 2.8-.3-1.9-.9-2.5-2.8-2.8 1.9-.3 2.5-.9 2.8-2.8Z" />
        </svg>
      )
    case 'cube':
      return (
        <svg {...common}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </svg>
      )
    case 'cpu':
      return (
        <svg {...common}>
          <rect x="6" y="6" width="12" height="12" rx="2.5" />
          <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
          <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
        </svg>
      )
    case 'java':
      return (
        <svg {...common}>
          <path d="M6.5 8h11v6.5a5.5 5.5 0 0 1-11 0V8Z" />
          <path d="M17.5 9.5h1.2a2.3 2.3 0 0 1 0 4.6h-1.2" />
          <path d="M9 3.5c0 1.5-1 1.8-1 3M13 3.5c0 1.5-1 1.8-1 3" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.8" />
          <path d="M4.5 20c.7-3.6 3.7-5.6 7.5-5.6s6.8 2 7.5 5.6" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5.2l3.2 2" />
        </svg>
      )
    case 'package':
      return (
        <svg {...common}>
          <path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16V8Z" />
          <path d="m3.5 8 8.5 4.5L20.5 8M12 12.5v8" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5S14.4 18.1 12 20.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5Z" />
        </svg>
      )
    case 'monitor':
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="12" rx="2.5" />
          <path d="M9 20.5h6M12 16.5v4" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5M12 8v.2" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common}>
          <path d="M4 20h4.2L19 9.2a2.1 2.1 0 0 0 0-3L17.8 5a2.1 2.1 0 0 0-3 0L4 15.8V20Z" />
          <path d="m14 6 4 4" />
        </svg>
      )
    case 'memory':
      return (
        <svg {...common}>
          <rect x="3.5" y="7" width="17" height="10" rx="2" />
          <path d="M7 7V4.5M12 7V4.5M17 7V4.5M7 19.5V17M12 19.5V17M17 19.5V17M3.5 11h17M3.5 13.5h17" />
        </svg>
      )
    case 'minimize':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      )
    case 'rocket':
      return (
        <svg {...common}>
          <path d="M12 15c4.5-2 6.5-6 6-11-5-.5-9 1.5-11 6l-3 3 3 3 5-1Z" />
          <circle cx="14.5" cy="8.5" r="1.6" />
          <path d="M6.5 15.5c-1.5 1-2 3-2 5 2 0 4-.5 5-2" />
        </svg>
      )
    default:
      return <svg {...common} />
  }
}
