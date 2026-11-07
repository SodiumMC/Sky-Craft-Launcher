/**
 * 版本模型：解析 versions/<id>/<id>.json、处理 inheritsFrom 继承链、
 * 合并 libraries/arguments，并按 OS + 架构挑选原生库。
 * 这里只做纯数据变换，不涉及网络与进程。
 */

import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { exists, osArch, osName, osVersion, readJson } from './util'

export interface Rule {
  action: 'allow' | 'disallow'
  os?: { name?: string; arch?: string; version?: string }
  features?: Record<string, boolean>
}

export type FeatureFlags = Record<string, boolean>

export const DEFAULT_FEATURES: FeatureFlags = {
  is_demo_user: false,
  has_custom_resolution: false,
  has_quick_plays_support: false
}

export interface ArgValueObject {
  rules?: Rule[]
  value: string | string[]
}
export type ArgValue = string | ArgValueObject
export interface Arguments {
  game?: ArgValue[]
  jvm?: ArgValue[]
}

export interface DownloadArtifact {
  path?: string
  url: string
  sha1?: string
  size?: number
}

export interface Library {
  name: string
  url?: string
  downloads?: {
    artifact?: DownloadArtifact
    classifiers?: Record<string, DownloadArtifact>
  }
  natives?: Record<string, string>
  rules?: Rule[]
  extract?: { exclude?: string[] }
}

export interface AssetIndexInfo {
  id: string
  sha1?: string
  size?: number
  totalSize?: number
  url: string
  virtual?: boolean
  map_to_resources?: boolean
}

export interface LoggingFile {
  id: string
  url: string
  sha1?: string
  size?: number
}

export interface VersionJson {
  id: string
  type?: string
  inheritsFrom?: string
  mainClass?: string
  assets?: string
  assetIndex?: AssetIndexInfo
  downloads?: Record<string, DownloadArtifact>
  libraries?: Library[]
  arguments?: Arguments
  minecraftArguments?: string
  logging?: { client?: { argument?: string; file: LoggingFile; type?: string } }
  javaVersion?: { component?: string; majorVersion?: number }
  releaseTime?: string
  time?: string
  minimumLauncherVersion?: number
  complianceLevel?: number
}

export interface ResolvedVersion {
  id: string
  type: string
  gameVersion: string
  mainClass: string
  libraries: Library[]
  arguments: Arguments
  minecraftArguments?: string
  assetIndex?: AssetIndexInfo
  assets: string
  logging?: { client?: { argument?: string; file: LoggingFile; type?: string } }
  javaMajor: number
  downloads: Record<string, DownloadArtifact>
  versionDir: string
  jsonPath: string
  chain: string[]
  jarId: string
}

export function ruleApplies(rule: Rule, features: FeatureFlags): boolean {
  if (rule.os) {
    if (rule.os.name && rule.os.name !== osName()) return false
    if (rule.os.arch && rule.os.arch !== osArch()) return false
    if (rule.os.version) {
      try {
        if (!new RegExp(rule.os.version).test(osVersion())) return false
      } catch {
        /* ignore invalid regex */
      }
    }
  }
  if (rule.features) {
    for (const [key, want] of Object.entries(rule.features)) {
      if (Boolean(features[key]) !== Boolean(want)) return false
    }
  }
  return true
}

export function rulesAllow(rules: Rule[] | undefined, features: FeatureFlags = DEFAULT_FEATURES): boolean {
  if (!rules || rules.length === 0) return true
  let allowed = false
  for (const rule of rules) {
    if (ruleApplies(rule, features)) allowed = rule.action === 'allow'
  }
  return allowed
}

export function expandArgEntries(entries: ArgValue[] | undefined, features: FeatureFlags): string[] {
  if (!entries) return []
  const out: string[] = []
  for (const entry of entries) {
    if (typeof entry === 'string') {
      out.push(entry)
    } else if (rulesAllow(entry.rules, features)) {
      if (Array.isArray(entry.value)) out.push(...entry.value)
      else out.push(entry.value)
    }
  }
  return out
}

const NATIVE_RE = /^(natives|natives-|native-)/

export function libraryNameParts(name: string): { group: string; artifact: string; version: string; classifier?: string; ext: string } | null {
  const [coordsRaw, extRaw] = name.split('@')
  const parts = coordsRaw.split(':')
  if (parts.length < 3) return null
  return {
    group: parts[0],
    artifact: parts[1],
    version: parts[2],
    classifier: parts[3] || undefined,
    ext: extRaw || 'jar'
  }
}

export function mavenPath(name: string): string | null {
  const p = libraryNameParts(name)
  if (!p) return null
  const file = `${p.artifact}-${p.version}${p.classifier ? `-${p.classifier}` : ''}.${p.ext}`
  return `${p.group.replace(/\./g, '/')}/${p.artifact}/${p.version}/${file}`
}

export function libKey(name: string): string {
  const p = libraryNameParts(name)
  return p ? `${p.group}:${p.artifact}${p.classifier ? ':' + p.classifier : ''}` : name
}

export function isNativeLib(lib: Library): boolean {
  const p = libraryNameParts(lib.name)
  return Boolean(p?.classifier && NATIVE_RE.test(p.classifier))
}

export function artifactOf(lib: Library): DownloadArtifact | null {
  if (lib.downloads?.artifact?.url) return lib.downloads.artifact
  const mp = mavenPath(lib.name)
  if (!mp) return null
  const base = (lib.url ?? 'https://libraries.minecraft.net/').replace(/\/+$/, '')
  return { path: mp, url: `${base}/${mp}` }
}

function archTokenOf(classifier: string): string | null {
  const c = classifier.toLowerCase()
  if (/(^|[-_])arm64($|[-_])/.test(c) || c.includes('aarch64')) return 'arm64'
  if (c.includes('arm32') || /(^|[-_])arm($|[-_])/.test(c)) return 'arm32'
  if (c.includes('x86_64') || c.includes('amd64')) return 'x86_64'
  if (c.includes('x86') || /(^|[-_])32($|[-_])/.test(c)) return 'x86'
  return null
}

function nativeScore(classifier: string): number {
  const token = archTokenOf(classifier)
  if (!token) return 5
  if (token === osArch()) return 10
  // 32 位 Java 可以跑在 64 位系统上，但没有 32 位 Java 时不要选 32 位库
  return -1
}

export interface NativeSelection {
  lib: Library
  classifier: string
  artifact: DownloadArtifact
}

/** 选择当前系统/架构下应当解压的原生库，同一 artifact 只保留最匹配的一个 */
export function collectNatives(libraries: Library[], features: FeatureFlags = DEFAULT_FEATURES): NativeSelection[] {
  const groups = new Map<string, NativeSelection[]>()
  for (const lib of libraries) {
    if (!rulesAllow(lib.rules, features)) continue
    const p = libraryNameParts(lib.name)
    if (!p) continue
    let classifier: string | undefined
    if (lib.natives) {
      const key = lib.natives[osName()]
      if (key) classifier = key.replace('${arch}', osArch() === 'x86' ? '32' : '64')
    } else if (p.classifier && NATIVE_RE.test(p.classifier)) {
      classifier = p.classifier
    }
    if (!classifier) continue
    const artifact = lib.downloads?.classifiers?.[classifier] ?? (p.classifier === classifier ? lib.downloads?.artifact : undefined)
    if (!artifact?.url) continue
    const group = `${p.group}:${p.artifact}`
    const list = groups.get(group) ?? []
    list.push({ lib, classifier, artifact })
    groups.set(group, list)
  }
  const out: NativeSelection[] = []
  for (const list of groups.values()) {
    const scored = list
      .map((s) => ({ s, score: nativeScore(s.classifier) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
    if (scored.length) out.push(scored[0].s)
  }
  return out
}

export function classifyLoader(json: VersionJson): { loader: ResolvedLoader; loaderVersion?: string } {
  const libs = json.libraries ?? []
  const find = (prefix: string) => libs.find((l) => l.name.startsWith(prefix))
  const fabric = find('net.fabricmc:fabric-loader')
  if (fabric) return { loader: 'fabric', loaderVersion: libraryNameParts(fabric.name)?.version }
  const quilt = find('org.quiltmc:quilt-loader')
  if (quilt) return { loader: 'quilt', loaderVersion: libraryNameParts(quilt.name)?.version }
  const neo = find('net.neoforged:neoforge')
  if (neo) return { loader: 'neoforge', loaderVersion: libraryNameParts(neo.name)?.version }
  const forge = find('net.minecraftforge:forge') ?? find('net.minecraftforge:fmlloader')
  if (forge) return { loader: 'forge', loaderVersion: libraryNameParts(forge.name)?.version }
  const optifine = find('optifine:OptiFine')
  if (optifine) return { loader: 'optifine', loaderVersion: libraryNameParts(optifine.name)?.version }
  if (/forge/i.test(json.id)) return { loader: 'forge' }
  if (/fabric/i.test(json.id)) return { loader: 'fabric' }
  return { loader: 'vanilla' }
}

export type ResolvedLoader = 'vanilla' | 'fabric' | 'forge' | 'neoforge' | 'quilt' | 'optifine' | 'unknown'

export function guessGameVersion(id: string): string {
  const fabric = /^fabric-loader-[^-]+-(.+)$/.exec(id)
  if (fabric) return fabric[1]
  const quilt = /^quilt-loader-[^-]+-(.+)$/.exec(id)
  if (quilt) return quilt[1]
  const m = /(\d+\.\d+(?:\.\d+)?)/.exec(id)
  return m ? m[1] : id
}

export function requiredJavaMajor(gameVersion: string, explicit?: number): number {
  if (explicit) return explicit
  const m = /^(\d+)\.(\d+)(?:\.(\d+))?/.exec(gameVersion)
  if (!m) return 8
  const major = Number(m[1])
  const minor = Number(m[2])
  if (major > 1) return 21
  if (minor >= 20 && Number(m[3] ?? 0) >= 5) return 21
  if (minor >= 18) return 17
  if (minor >= 17) return 16
  return 8
}

export async function readVersionJson(gameDir: string, id: string): Promise<VersionJson> {
  const p = path.join(gameDir, 'versions', id, `${id}.json`)
  return readJson<VersionJson>(p, { id } as VersionJson)
}

export async function loadVersionChain(gameDir: string, id: string): Promise<VersionJson[]> {
  const chain: VersionJson[] = []
  const seen = new Set<string>()
  let current: string | undefined = id
  while (current && !seen.has(current) && chain.length < 12) {
    seen.add(current)
    const json = await readVersionJson(gameDir, current)
    if (!json || !json.id) throw new Error(`版本 ${current} 的 JSON 不存在或已损坏`)
    chain.unshift(json)
    current = json.inheritsFrom
  }
  return chain
}

export function mergeVersions(chain: VersionJson[], gameDir: string, id: string): ResolvedVersion {
  const leaf = chain[chain.length - 1]
  const libs = new Map<string, Library>()
  for (const json of chain) {
    for (const lib of json.libraries ?? []) {
      // 老版本会同时列出 lwjgl 2.9.0 和 2.9.1-nightly，用 os.version 规则二选一；
      // 这类库的 key 必须带版本号，否则后者会覆盖前者，而后者在新型 macOS 上被禁用
      const osVersionRule = lib.rules?.some((r) => r.os?.version)
      const parts = libraryNameParts(lib.name)
      const key = libKey(lib.name) + (osVersionRule && parts ? `@${parts.version}` : '')
      libs.set(key, lib)
    }
  }
  const game: ArgValue[] = []
  const jvm: ArgValue[] = []
  for (const json of chain) {
    if (json.arguments?.game) game.push(...json.arguments.game)
    if (json.arguments?.jvm) jvm.push(...json.arguments.jvm)
  }
  const downloads: Record<string, DownloadArtifact> = {}
  let mainClass = ''
  let assets = 'legacy'
  let assetIndex: AssetIndexInfo | undefined
  let logging: ResolvedVersion['logging']
  let javaMajor = 0
  let type = leaf.type ?? 'release'
  let minecraftArguments: string | undefined
  for (const json of chain) {
    Object.assign(downloads, json.downloads ?? {})
    if (json.mainClass) mainClass = json.mainClass
    if (json.assets) assets = json.assets
    if (json.assetIndex) assetIndex = json.assetIndex
    if (json.logging) logging = json.logging
    if (json.javaVersion?.majorVersion) javaMajor = json.javaVersion.majorVersion
    if (json.type) type = json.type
    if (json.minecraftArguments) minecraftArguments = json.minecraftArguments
  }
  const rootId = chain[0].id
  const gameVersion = chain.length > 1 ? rootId : guessGameVersion(rootId)

  // 寻找客户端 jar：优先本版本，其次继承链上的任意版本
  let jarId = id
  for (let i = chain.length - 1; i >= 0; i--) {
    const candidate = path.join(gameDir, 'versions', chain[i].id, `${chain[i].id}.jar`)
    if (existsSync(candidate)) {
      jarId = chain[i].id
      break
    }
  }

  return {
    id,
    type,
    gameVersion,
    mainClass,
    libraries: [...libs.values()],
    arguments: { game, jvm },
    minecraftArguments,
    assetIndex,
    assets,
    logging,
    javaMajor: requiredJavaMajor(gameVersion, javaMajor || undefined),
    downloads,
    versionDir: path.join(gameDir, 'versions', id),
    jsonPath: path.join(gameDir, 'versions', id, `${id}.json`),
    chain: chain.map((c) => c.id),
    jarId
  }
}

export async function resolveVersion(gameDir: string, id: string): Promise<ResolvedVersion> {
  const chain = await loadVersionChain(gameDir, id)
  return mergeVersions(chain, gameDir, id)
}

export interface ScannedVersion {
  id: string
  json: VersionJson
  broken?: string
}

export async function scanVersionDir(gameDir: string): Promise<ScannedVersion[]> {
  const dir = path.join(gameDir, 'versions')
  let entries: string[] = []
  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true })
    entries = dirents.filter((d) => d.isDirectory()).map((d) => d.name)
  } catch {
    return []
  }
  const out: ScannedVersion[] = []
  for (const name of entries) {
    const base = path.join(dir, name)
    // 兼容不同启动器：优先 <name>.json，其次 version.json，最后目录内任意 json
    let files: string[] = []
    try {
      files = await fs.readdir(base)
    } catch {
      files = []
    }
    const candidates = [
      `${name}.json`,
      'version.json',
      ...files.filter((f) => f.endsWith('.json') && f !== `${name}.json` && f !== 'version.json')
    ]
    let parsed: VersionJson | null = null
    let lastError = ''
    for (const file of candidates) {
      try {
        const raw = (await fs.readFile(path.join(base, file), 'utf8')).replace(/^\uFEFF/, '')
        const json = JSON.parse(raw) as VersionJson
        if (!json.id) json.id = name
        parsed = json
        break
      } catch (err) {
        lastError = (err as Error).message
      }
    }
    if (parsed) out.push({ id: name, json: parsed })
    else out.push({ id: name, json: { id: name }, broken: lastError || '缺少版本 JSON' })
  }
  return out
}
