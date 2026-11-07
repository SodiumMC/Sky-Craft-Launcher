import { FabricLoader, RemoteVersion } from '../../shared/types'
import { fetchJson, USER_AGENT } from './util'
import { BMCLAPI_MANIFEST, BMCLAPI_VERSION_JSON, FABRIC_META, OFFICIAL_MANIFEST, Mirror } from './mirror'
import { VersionJson } from './version'

interface ManifestJson {
  latest: { release: string; snapshot: string }
  versions: { id: string; type: string; url: string; time: string; releaseTime: string; sha1?: string }[]
}

let cache: { at: number; mirror: Mirror; data: ManifestJson } | null = null

export async function fetchManifest(mirror: Mirror, signal?: AbortSignal): Promise<ManifestJson> {
  if (cache && cache.mirror === mirror && Date.now() - cache.at < 5 * 60_000) return cache.data
  const urls = mirror === 'bmclapi' ? [BMCLAPI_MANIFEST, OFFICIAL_MANIFEST] : [OFFICIAL_MANIFEST]
  let lastErr: unknown = null
  for (const url of urls) {
    try {
      const data = await fetchJson<ManifestJson>(url, signal, 30000)
      if (!data?.versions?.length) throw new Error('版本列表为空')
      cache = { at: Date.now(), mirror, data }
      return data
    } catch (err) {
      lastErr = err
    }
  }
  throw new Error(`无法获取 Minecraft 版本列表：${lastErr instanceof Error ? lastErr.message : String(lastErr)}`)
}

export async function fetchRemoteVersions(mirror: Mirror, signal?: AbortSignal): Promise<{ releases: RemoteVersion[]; snapshots: RemoteVersion[]; latest: { release: string; snapshot: string } }> {
  const data = await fetchManifest(mirror, signal)
  const map = (v: ManifestJson['versions'][number]): RemoteVersion => ({
    id: v.id,
    type: v.type,
    releaseTime: v.releaseTime,
    url: v.url
  })
  const releases = data.versions.filter((v) => v.type === 'release').map(map)
  const snapshots = data.versions.filter((v) => v.type === 'snapshot').map(map)
  return { releases, snapshots, latest: data.latest }
}

export async function fetchVersionJson(id: string, mirror: Mirror, officialUrl?: string, signal?: AbortSignal): Promise<VersionJson> {
  const urls: string[] = []
  if (mirror === 'bmclapi') urls.push(BMCLAPI_VERSION_JSON(id))
  if (officialUrl) urls.push(officialUrl)
  if (!urls.length) urls.push(`https://piston-meta.mojang.com/v1/packages/x/${id}.json`)
  let lastErr: unknown = null
  for (const url of urls) {
    try {
      const json = await fetchJson<VersionJson>(url, signal, 30000)
      if (!json?.id) throw new Error('版本 JSON 格式错误')
      return json
    } catch (err) {
      lastErr = err
    }
  }
  throw new Error(`无法获取版本 ${id} 的 JSON：${lastErr instanceof Error ? lastErr.message : String(lastErr)}`)
}

export async function resolveRemoteVersion(id: string, mirror: Mirror, signal?: AbortSignal): Promise<RemoteVersion> {
  const { releases, snapshots } = await fetchRemoteVersions(mirror, signal)
  const found = [...releases, ...snapshots].find((v) => v.id === id)
  if (!found) throw new Error(`官方版本列表中找不到 ${id}`)
  return found
}

export async function fetchFabricLoaders(gameVersion: string, signal?: AbortSignal): Promise<FabricLoader[]> {
  const url = `${FABRIC_META}/v2/versions/loader/${encodeURIComponent(gameVersion)}`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal })
  if (!res.ok) throw new Error(`Fabric 加载器列表获取失败：HTTP ${res.status}`)
  const list = (await res.json()) as { loader: { version: string; stable: boolean } }[]
  return list.map((x) => ({ version: x.loader.version, stable: Boolean(x.loader.stable) }))
}

export async function fetchFabricProfile(gameVersion: string, loaderVersion: string, signal?: AbortSignal): Promise<VersionJson> {
  const url = `${FABRIC_META}/v2/versions/loader/${encodeURIComponent(gameVersion)}/${encodeURIComponent(loaderVersion)}/profile/json`
  return fetchJson<VersionJson>(url, signal, 30000)
}
