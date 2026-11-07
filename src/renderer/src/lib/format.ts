import { LoaderKind, VersionSummary } from '../../../shared/types'

export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : digits)} ${units[i]}`
}

export function formatSpeed(bps: number): string {
  if (!Number.isFinite(bps) || bps <= 0) return '—'
  return `${formatBytes(bps)}/s`
}

export function formatRelative(ts?: number, lang?: string): string {
  const en = lang === 'en-US'
  if (!ts) return en ? 'Never' : '尚未启动'
  const diff = Date.now() - ts
  if (diff < 60_000) return en ? 'just now' : '刚刚'
  if (diff < 3_600_000) {
    const n = Math.floor(diff / 60_000)
    return en ? `${n} min ago` : `${n} 分钟前`
  }
  if (diff < 86_400_000) {
    const n = Math.floor(diff / 3_600_000)
    return en ? `${n} h ago` : `${n} 小时前`
  }
  if (diff < 30 * 86_400_000) {
    const n = Math.floor(diff / 86_400_000)
    return en ? `${n} d ago` : `${n} 天前`
  }
  return new Date(ts).toLocaleDateString(en ? 'en-US' : 'zh-CN')
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export interface LoaderMeta {
  label: string
  color: string
  bg: string
}

const LOADER_META: Record<LoaderKind, LoaderMeta> = {
  vanilla: { label: '原版', color: '#2f6fed', bg: '#e8f0ff' },
  fabric: { label: 'Fabric', color: '#b45309', bg: '#fff4e5' },
  forge: { label: 'Forge', color: '#6b7280', bg: '#eef1f6' },
  neoforge: { label: 'NeoForge', color: '#c2410c', bg: '#ffefe6' },
  quilt: { label: 'Quilt', color: '#7c3aed', bg: '#f3ecff' },
  optifine: { label: 'OptiFine', color: '#047857', bg: '#e6f7f0' },
  unknown: { label: '未知', color: '#64748b', bg: '#eef1f6' }
}

export function loaderMeta(loader: LoaderKind): LoaderMeta {
  return LOADER_META[loader] ?? LOADER_META.unknown
}

export function typeLabel(type: string): string {
  switch (type) {
    case 'release':
      return '正式版'
    case 'snapshot':
      return '快照'
    case 'old_beta':
      return '远古 Beta'
    case 'old_alpha':
      return '远古 Alpha'
    default:
      return type
  }
}

export function versionTitle(version: VersionSummary): string {
  if (version.loader === 'fabric' && version.loaderVersion) return `Fabric ${version.loaderVersion}`
  if (version.loader === 'forge' && version.loaderVersion) return `Forge ${version.loaderVersion}`
  if (version.loader === 'quilt' && version.loaderVersion) return `Quilt ${version.loaderVersion}`
  if (version.loader === 'neoforge' && version.loaderVersion) return `NeoForge ${version.loaderVersion}`
  return typeLabel(version.type)
}

export function initials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed.slice(0, 1).toUpperCase()
}

const AVATAR_COLORS = [
  ['#4f8cff', '#7db4ff'],
  ['#8b5cf6', '#c4b5fd'],
  ['#06b6d4', '#67e8f9'],
  ['#f59e0b', '#fcd34d'],
  ['#ef4444', '#fca5a5'],
  ['#10b981', '#6ee7b7']
]

export function avatarGradient(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const [a, b] = AVATAR_COLORS[hash % AVATAR_COLORS.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

export function percent(done: number, total: number): number {
  if (!total || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
}

export function shortVersionName(id: string): string {
  return id.length > 26 ? `${id.slice(0, 24)}…` : id
}
