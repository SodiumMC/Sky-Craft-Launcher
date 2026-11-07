export type Mirror = 'official' | 'bmclapi'

const HOST_MAP: Record<string, string> = {
  'https://piston-meta.mojang.com': 'https://bmclapi2.bangbang93.com',
  'https://piston-data.mojang.com': 'https://bmclapi2.bangbang93.com',
  'https://launchermeta.mojang.com': 'https://bmclapi2.bangbang93.com',
  'https://launcher.mojang.com': 'https://bmclapi2.bangbang93.com',
  'https://libraries.minecraft.net': 'https://bmclapi2.bangbang93.com/maven',
  'https://resources.download.minecraft.net': 'https://bmclapi2.bangbang93.com/assets'
}

export function mirrorUrl(raw: string): string {
  try {
    const u = new URL(raw)
    const base = `${u.protocol}//${u.host}`
    const mapped = HOST_MAP[base]
    if (!mapped) return raw
    return `${mapped}${u.pathname}${u.search}`
  } catch {
    return raw
  }
}

/** 返回候选 URL：镜像优先时先镜像、失败回落官方 */
export function candidates(raw: string, mirror: Mirror): string[] {
  if (mirror === 'official') return [raw]
  const m = mirrorUrl(raw)
  return m === raw ? [raw] : [m, raw]
}

export const OFFICIAL_MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'
export const BMCLAPI_MANIFEST = 'https://bmclapi2.bangbang93.com/mc/game/version_manifest_v2.json'
export const BMCLAPI_VERSION_JSON = (id: string) =>
  `https://bmclapi2.bangbang93.com/version/${encodeURIComponent(id)}/json`

export const FABRIC_META = 'https://meta.fabricmc.net'
