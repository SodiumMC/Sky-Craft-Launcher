/**
 * 每个版本可选的加载器元数据（写在版本目录内的 scl-loader.json）。
 * 目前只有 Puzzle 使用；Puzzle 版本本质上是原版 1.21.1 的副本，
 * 光看 version json 无法和原版区分，因此额外落一个标记文件。
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { writeJsonAtomic } from './util'

export interface LoaderMeta {
  loader: 'puzzle'
  /** 实际启动的原版版本号，例如 1.21.1 */
  gameVersion: string
  versionId: string
  installedAt: number
}

const META_FILE = 'scl-loader.json'

export function loaderMetaPath(gameDir: string, versionId: string): string {
  return path.join(gameDir, 'versions', versionId, META_FILE)
}

export async function readLoaderMeta(gameDir: string, versionId: string): Promise<LoaderMeta | null> {
  try {
    const raw = await fs.readFile(loaderMetaPath(gameDir, versionId), 'utf8')
    const parsed = JSON.parse(raw) as Partial<LoaderMeta> | null
    if (!parsed || parsed.loader !== 'puzzle') return null
    return {
      loader: 'puzzle',
      gameVersion: typeof parsed.gameVersion === 'string' && parsed.gameVersion ? parsed.gameVersion : '1.21.1',
      versionId: typeof parsed.versionId === 'string' && parsed.versionId ? parsed.versionId : versionId,
      installedAt: typeof parsed.installedAt === 'number' ? parsed.installedAt : 0
    }
  } catch {
    return null
  }
}

export async function writeLoaderMeta(gameDir: string, versionId: string, gameVersion: string): Promise<void> {
  const meta: LoaderMeta = {
    loader: 'puzzle',
    gameVersion,
    versionId,
    installedAt: Date.now()
  }
  await writeJsonAtomic(loaderMetaPath(gameDir, versionId), meta)
}
