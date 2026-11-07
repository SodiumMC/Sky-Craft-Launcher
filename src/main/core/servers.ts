import fs from 'node:fs/promises'
import zlib from 'node:zlib'

export interface ServerEntry {
  name: string
  ip: string
}

/** 解析 servers.dat（未压缩 NBT）中的服务器列表 */
export function parseServers(buf: Buffer): ServerEntry[] {
  let o = 0
  const u8 = () => buf[o++]
  const i16 = () => { const v = buf.readInt16BE(o); o += 2; return v }
  const i32 = () => { const v = buf.readInt32BE(o); o += 4; return v }
  const str = () => { const n = buf.readUInt16BE(o); o += 2; const s = buf.toString('utf8', o, o + n); o += n; return s }
  const payload = (t: number): unknown => {
    switch (t) {
      case 1: return buf.readInt8(o++)
      case 2: return i16()
      case 3: return i32()
      case 4: { const v = Number(buf.readBigInt64BE(o)); o += 8; return v }
      case 5: { const v = buf.readFloatBE(o); o += 4; return v }
      case 6: { const v = buf.readDoubleBE(o); o += 8; return v }
      case 7: { const n = i32(); o += n; return null }
      case 8: return str()
      case 9: {
        const ct = u8(); const n = i32(); const arr: unknown[] = []
        for (let i = 0; i < n; i++) arr.push(payload(ct))
        return arr
      }
      case 10: {
        const obj: Record<string, unknown> = {}
        for (;;) {
          const tt = u8(); if (tt === 0) break
          const key = str(); obj[key] = payload(tt)
        }
        return obj
      }
      case 11: { const n = i32(); o += n * 4; return null }
      case 12: { const n = i32(); o += n * 8; return null }
      default: throw new Error('bad tag')
    }
  }
  const rootType = u8()
  str()
  const root = payload(rootType) as Record<string, unknown>
  const list = (root?.servers ?? []) as Record<string, unknown>[]
  return list
    .filter((s) => typeof s.name === 'string' && typeof s.ip === 'string')
    .map((s) => ({ name: String(s.name), ip: String(s.ip) }))
}

export async function readServers(gameDir: string): Promise<ServerEntry[]> {
  try {
    let buf = await fs.readFile(`${gameDir}/servers.dat`)
    if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf)
    return parseServers(buf)
  } catch {
    return []
  }
}

/** 把服务器列表写回 servers.dat（gzip NBT，vanilla 标准格式）。 */
export async function writeServers(gameDir: string, entries: ServerEntry[]): Promise<void> {
  const chunks: Buffer[] = []
  const push = (b: Buffer | number[]) => chunks.push(Buffer.from(b))
  const u8 = (v: number) => push([v & 0xff])
  const u16 = (v: number) => { const b = Buffer.alloc(2); b.writeUInt16BE(v); push(b) }
  const i32 = (v: number) => { const b = Buffer.alloc(4); b.writeInt32BE(v); push(b) }
  const str = (s: string) => { const b = Buffer.from(s, 'utf8'); u16(b.length); push(b) }
  const compound = (obj: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        u8(8); str(key); str(value)
      } else if (typeof value === 'number') {
        u8(3); str(key); i32(value)
      }
    }
    u8(0)
  }
  // root: TAG_Compound ""
  u8(10); str('')
  // servers: TAG_List of TAG_Compound
  u8(9); str('servers'); u8(10); i32(entries.length)
  for (const entry of entries) compound({ name: entry.name, ip: entry.ip })
  u8(0) // end root compound
  await fs.writeFile(`${gameDir}/servers.dat`, zlib.gzipSync(Buffer.concat(chunks)))
}
