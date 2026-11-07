import path from 'node:path'
import { ensureFile } from './downloader'
import { ensureDir, fetchJson } from './util'

/** 模组来源目前只有 Modrinth（CurseForge 需要独立 API Key，已移除）。 */
export type ModSource = 'modrinth'

export interface ModHit {
  id: string
  title: string
  description: string
  icon?: string
  downloads: number
  source: ModSource
}

const MODRINTH = 'https://api.modrinth.com/v2'

interface ModrinthFile {
  url: string
  filename: string
  primary: boolean
  hashes?: { sha1?: string }
}
interface ModrinthVersion {
  id: string
  project_id: string
  files: ModrinthFile[]
  dependencies?: Array<{
    version_id: string | null
    project_id: string | null
    dependency_type: string
  }>
}

/** 按关键词 + 加载器 + 游戏版本 + 排序搜索 Modrinth 模组。 */
export async function searchMods(opts: {
  query: string
  loader?: string
  gameVersion?: string
  sort?: 'relevance' | 'downloads' | 'newest'
}): Promise<ModHit[]> {
  const facets: string[][] = [['project_type:mod']]
  if (opts.loader) facets.push([`categories:${opts.loader}`])
  if (opts.gameVersion) facets.push([`versions:${opts.gameVersion}`])
  const index = opts.sort ?? 'relevance'
  const url =
    `${MODRINTH}/search?query=${encodeURIComponent(opts.query)}&limit=20&index=${index}` +
    `&facets=${encodeURIComponent(JSON.stringify(facets))}`
  const data = await fetchJson<{ hits: Array<Record<string, unknown>> }>(url)
  return data.hits.map((h) => ({
    id: String(h.project_id),
    title: String(h.title),
    description: String(h.description ?? ''),
    icon: h.icon_url ? String(h.icon_url) : undefined,
    downloads: Number(h.downloads ?? 0),
    source: 'modrinth' as const
  }))
}

/** 下载一个文件到 mods 目录，跳过同名已下载。 */
async function downloadFile(file: ModrinthFile, modsDir: string): Promise<void> {
  const dest = path.join(modsDir, file.filename)
  await ensureFile({ urls: [file.url], dest, sha1: file.hashes?.sha1, label: file.filename })
}

/** 安装指定版本，并递归安装其 required 依赖。 */
async function installVersion(
  version: ModrinthVersion,
  modsDir: string,
  params: URLSearchParams,
  seen: Set<string>,
  installed: string[]
): Promise<void> {
  if (seen.has(version.id)) return
  seen.add(version.id)
  const file = version.files.find((f) => f.primary) ?? version.files[0]
  if (!file) return
  await downloadFile(file, modsDir)
  installed.push(file.filename)
  for (const dep of version.dependencies ?? []) {
    if (dep.dependency_type !== 'required' || !dep.project_id) continue
    let depVersion: ModrinthVersion | undefined
    if (dep.version_id) {
      depVersion = await fetchJson<ModrinthVersion>(`${MODRINTH}/version/${dep.version_id}`)
    } else {
      const list = await fetchJson<ModrinthVersion[]>(`${MODRINTH}/project/${dep.project_id}/version?${params}`)
      depVersion = list[0]
    }
    if (depVersion) await installVersion(depVersion, modsDir, params, seen, installed)
  }
}

/** 安装模组本体 + required 依赖，返回下载的文件列表。 */
export async function installMod(opts: {
  id: string
  loader?: string
  gameVersion?: string
  modsDir: string
}): Promise<{ primary: string; installed: string[] }> {
  await ensureDir(opts.modsDir)
  const params = new URLSearchParams()
  if (opts.loader) params.set('loaders', JSON.stringify([opts.loader]))
  if (opts.gameVersion) params.set('game_versions', JSON.stringify([opts.gameVersion]))
  const versions = await fetchJson<ModrinthVersion[]>(`${MODRINTH}/project/${opts.id}/version?${params}`)
  if (!versions.length) throw new Error('没有兼容当前版本/加载器的文件')
  const installed: string[] = []
  const seen = new Set<string>()
  await installVersion(versions[0], opts.modsDir, params, seen, installed)
  const primary =
    versions[0].files.find((f) => f.primary)?.filename ??
    versions[0].files[0]?.filename ??
    ''
  return { primary, installed }
}

export type ContentType = 'resourcepack' | 'shader'

/** 在线搜索资源包 / 光影（Modrinth project_type）。 */
export async function searchProjects(opts: {
  type: ContentType
  query: string
  gameVersion?: string
}): Promise<ModHit[]> {
  const facets: string[][] = [[`project_type:${opts.type}`]]
  if (opts.gameVersion) facets.push([`versions:${opts.gameVersion}`])
  const url =
    `${MODRINTH}/search?query=${encodeURIComponent(opts.query)}&limit=20&index=downloads` +
    `&facets=${encodeURIComponent(JSON.stringify(facets))}`
  const data = await fetchJson<{ hits: Array<Record<string, unknown>> }>(url)
  return data.hits.map((h) => ({
    id: String(h.project_id),
    title: String(h.title),
    description: String(h.description ?? ''),
    icon: h.icon_url ? String(h.icon_url) : undefined,
    downloads: Number(h.downloads ?? 0),
    source: 'modrinth' as const
  }))
}

/** 下载资源包 / 光影的第一个兼容文件到目标目录。 */
export async function installContentFile(opts: {
  id: string
  gameVersion?: string
  targetDir: string
}): Promise<string> {
  await ensureDir(opts.targetDir)
  const params = new URLSearchParams()
  if (opts.gameVersion) params.set('game_versions', JSON.stringify([opts.gameVersion]))
  const versions = await fetchJson<ModrinthVersion[]>(`${MODRINTH}/project/${opts.id}/version?${params}`)
  if (!versions.length) throw new Error('没有兼容当前游戏版本的文件')
  const file = versions[0].files.find((f) => f.primary) ?? versions[0].files[0]
  if (!file) throw new Error('该项目没有可下载文件')
  await downloadFile(file, opts.targetDir)
  return file.filename
}
