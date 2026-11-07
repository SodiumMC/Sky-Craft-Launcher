import path from 'node:path'
import { existsSync } from 'node:fs'
import type { VersionSummary } from '../../shared/types'

/**
 * 直接读取 Modrinth App 的实例（profiles），不需要导入。
 * 实例元数据存在 app.db（SQLite），版本本体在 meta/versions。
 */

export interface ModrinthInstance {
  id: string
  name: string
  dir: string
  gameVersion: string
  loader: VersionSummary['loader']
  loaderVersion?: string
  lastPlayed?: number
  baseVersion: string
  installed: boolean
}

function modrinthBase(gameDir: string): string | null {
  const base = path.basename(gameDir) === 'meta' ? path.dirname(gameDir) : gameDir
  if (existsSync(path.join(base, 'app.db')) && existsSync(path.join(base, 'profiles'))) return base
  return null
}

function normalizeLoader(value: unknown): VersionSummary['loader'] {
  const loader = String(value ?? '').toLowerCase()
  if (loader === 'fabric' || loader === 'forge' || loader === 'neoforge' || loader === 'quilt') return loader
  return 'vanilla'
}

function resolveBaseVersion(metaDir: string, gameVersion: string, loaderVersion?: string): string | null {
  const versions = path.join(metaDir, 'versions')
  const candidates = loaderVersion ? [`${gameVersion}-${loaderVersion}`, gameVersion] : [gameVersion]
  for (const id of candidates) {
    if (existsSync(path.join(versions, id, `${id}.json`))) return id
  }
  return null
}

export function readModrinthInstances(gameDir: string): ModrinthInstance[] {
  const base = modrinthBase(gameDir)
  if (!base) return []
  try {
    const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (file: string, opts: { readOnly: boolean }) => any }
    const db = new DatabaseSync(path.join(base, 'app.db'), { readOnly: true })
    const rows = db
      .prepare(
        `SELECT i.path AS path, i.name AS name, i.last_played AS last_played,
          (SELECT cs.game_version FROM instance_content_sets cs WHERE cs.instance_id = i.id ORDER BY cs.modified DESC LIMIT 1) AS gv,
          (SELECT cs.loader FROM instance_content_sets cs WHERE cs.instance_id = i.id ORDER BY cs.modified DESC LIMIT 1) AS loader,
          (SELECT cs.loader_version FROM instance_content_sets cs WHERE cs.instance_id = i.id ORDER BY cs.modified DESC LIMIT 1) AS lv
        FROM instances i WHERE i.install_stage = 'installed'`
      )
      .all() as Array<{ path: string; name: string; last_played?: number; gv?: string; loader?: string; lv?: string }>
    db.close()
    const metaDir = path.join(base, 'meta')
    return rows
      .filter((row) => row.path && row.gv)
      .map((row) => {
        const baseVersion = resolveBaseVersion(metaDir, String(row.gv), row.lv) ?? String(row.gv)
        return {
          id: `modrinth:${row.path}`,
          name: row.name || row.path,
          dir: path.join(base, 'profiles', row.path),
          gameVersion: String(row.gv),
          loader: normalizeLoader(row.loader),
          loaderVersion: row.lv,
          lastPlayed: row.last_played ? row.last_played * 1000 : undefined,
          baseVersion,
          installed: existsSync(path.join(metaDir, 'versions', baseVersion, `${baseVersion}.json`))
        }
      })
  } catch {
    return []
  }
}

export function findModrinthInstance(gameDir: string, id: string): ModrinthInstance | null {
  if (!id.startsWith('modrinth:')) return null
  return readModrinthInstances(gameDir).find((item) => item.id === id) ?? null
}
