#!/usr/bin/env node
/**
 * SCL 更新后台（本地管理端 + 静态更新源）
 *   node scripts/update-server.cjs [--port 8787] [--dir updates]
 * 浏览器打开 http://127.0.0.1:8787/admin 发布版本；
 * 客户端请求 http://<host>:8787/latest.json 获取更新。
 */
const http = require('http')
const https = require('https')
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const port = Number(arg('port', process.env.PORT || 8787))
const root = path.resolve(arg('dir', path.join(__dirname, '..', 'updates')))
const token = process.env.ADMIN_TOKEN || ''

const MIME = {
  '.json': 'application/json; charset=utf-8',
  '.dmg': 'application/x-apple-diskimage',
  '.zip': 'application/zip',
  '.exe': 'application/vnd.microsoft.portable-executable',
  '.html': 'text/html; charset=utf-8'
}

function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' })
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

async function readBody(req, max = 12 * 1024 * 1024) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > max) throw new Error('请求体过大')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function reportId(input) {
  const id = String(input || '').trim()
  if (/^[A-Za-z0-9-]{4,80}$/.test(id)) return id
  return `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 10)}`
}

const ADMIN_HTML = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>SCL 更新后台</title>
<style>
:root{--bg:#eef2f7;--card:#fff;--line:#e3e7ee;--text:#141a24;--muted:#7b8494;--accent:#0067c0}
*{box-sizing:border-box}body{margin:0;font:14px/1.5 "PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text)}
.wrap{max-width:640px;margin:60px auto;padding:0 20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px;box-shadow:0 20px 50px rgba(20,30,50,.10)}
h1{font-size:18px;margin:0 0 4px}.sub{color:var(--muted);font-size:12px;margin-bottom:18px}
label{display:block;font-size:12px;color:var(--muted);margin:12px 0 4px}
input,textarea{width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff}
textarea{min-height:96px;resize:vertical}
button{margin-top:16px;width:100%;padding:11px;border:0;border-radius:9px;background:var(--accent);color:#fff;font-weight:600;cursor:pointer}
button:disabled{opacity:.6}.row{display:flex;gap:10px}.row>div{flex:1}
.out{margin-top:14px;font-size:12px;color:var(--muted);white-space:pre-wrap}
.share{margin-top:10px;font-size:11px;color:var(--muted);word-break:break-all}
</style></head><body><div class="wrap"><div class="card">
<h1>SCL 更新发布</h1><div class="sub">填写版本并指向本机的 DMG / zip，发布后客户端立即能检查到。</div>
<label>版本号</label><input id="ver" placeholder="1.0.2"/>
<label>更新说明</label><textarea id="notes" placeholder="- 修复…&#10;- 新增…"></textarea>
<div class="row"><div><label>macOS DMG 路径</label><input id="dmg" placeholder="/Users/you/SCL.dmg"/></div>
<div><label>Windows zip 路径</label><input id="win" placeholder="/Users/you/SCL-win.zip"/></div></div>
<button id="go">发布更新</button><div class="out" id="out"></div>
<div class="share" id="share"></div>
<hr style="margin:22px 0;border:0;border-top:1px solid var(--line)"/>
<h2 style="font-size:15px;margin:0 0 8px">Bug 反馈</h2>
<label>管理 Token（未设置可留空）</label><input id="admintoken" type="password" placeholder="ADMIN_TOKEN"/>
<button id="loadreports">加载反馈</button>
<div class="out" id="reports"></div>
</div></div>
<script>
const out=document.getElementById('out'),share=document.getElementById('share');
document.getElementById('go').onclick=async()=>{
  const body={version:document.getElementById('ver').value.trim(),notes:document.getElementById('notes').value,
    dmg:document.getElementById('dmg').value.trim(),win:document.getElementById('win').value.trim()};
  if(!body.version){out.textContent='请填写版本号';return}
  out.textContent='发布中…';
  const r=await fetch('/api/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json();
  out.textContent=j.ok?'发布成功，客户端下次检查即可看到 '+body.version:'失败：'+j.error;
  if(j.ok){share.textContent='更新源：'+location.origin+'/latest.json';}
};
document.getElementById('loadreports').onclick=async()=>{
  const box=document.getElementById('reports');
  const token=document.getElementById('admintoken').value.trim();
  box.textContent='加载中…';
  const r=await fetch('/api/bug-reports',{headers:token?{'x-admin-token':token}:{}});
  const j=await r.json();
  if(!j.ok){box.textContent='失败：'+(j.error||r.status);return}
  if(!j.reports.length){box.textContent='暂无反馈';return}
  box.innerHTML=j.reports.map(function(x){
    const esc=function(v){return String(v==null?'':v).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})};
    return '<div style="padding:8px 0;border-bottom:1px solid #eee"><b>'+esc(x.title)+'</b>'+
      '<div style="font-size:11px;color:#666">'+esc(x.createdAt)+' · '+esc(x.appVersion)+' · '+esc(x.platform)+' · '+esc(x.id)+'</div>'+
      '<a style="font-size:11px" href="/api/bug-reports/'+encodeURIComponent(x.id)+'" target="_blank">详情 JSON</a></div>';
  }).join('');
};
fetch('/api/state').then(r=>r.json()).then(j=>{
  if(j.manifest){document.getElementById('ver').value=j.manifest.version;document.getElementById('notes').value=j.manifest.notes||''}
  share.textContent='当前更新源：'+location.origin+'/latest.json';
}).catch(()=>{});
</script></body></html>`

const tlsKey = path.join(root, 'tls', 'key.pem')
const tlsCert = path.join(root, 'tls', 'cert.pem')
const useTls = fs.existsSync(tlsKey) && fs.existsSync(tlsCert)

const handler = async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  if (url === '/health') return send(res, 200, 'ok', 'text/plain')
  if (url === '/admin') return send(res, 200, ADMIN_HTML, MIME['.html'])
  if (url === '/api/state') {
    try {
      const manifest = JSON.parse(await fsp.readFile(path.join(root, 'latest.json'), 'utf8'))
      return send(res, 200, { manifest })
    } catch {
      return send(res, 200, { manifest: null })
    }
  }
  if (url === '/api/bug-report' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req))
      if (!body.title || !body.description) return send(res, 400, { ok: false, error: '缺少标题或描述' })
      const dir = path.join(root, 'bug-reports')
      await fsp.mkdir(dir, { recursive: true })
      const id = reportId(body.id)
      const { logs, screenshots, ...meta } = body
      await fsp.writeFile(path.join(dir, `${id}.json`), JSON.stringify({ ...meta, id }, null, 2))
      if (Array.isArray(logs) && logs.length) await fsp.writeFile(path.join(dir, `${id}.log`), logs.join('\n'))
      if (Array.isArray(screenshots)) {
        for (const [i, shot] of screenshots.slice(0, 3).entries()) {
          const base64 = String(shot.dataUrl || '').split(',')[1]
          if (!base64) continue
          const ext = /^[a-z0-9]{2,5}$/i.test(path.extname(shot.name || '').slice(1)) ? path.extname(shot.name).slice(1) : 'png'
          await fsp.writeFile(path.join(dir, `${id}-${i + 1}.${ext}`), Buffer.from(base64, 'base64'))
        }
      }
      console.log('[bug]', id, meta.title)
      return send(res, 200, { ok: true, id })
    } catch (err) {
      return send(res, 400, { ok: false, error: err.message })
    }
  }
  if (url === '/api/bug-reports' && req.method === 'GET') {
    if (token && req.headers['x-admin-token'] !== token) return send(res, 401, { ok: false, error: 'token 错误' })
    try {
      const dir = path.join(root, 'bug-reports')
      const files = (await fsp.readdir(dir).catch(() => [])).filter((f) => f.endsWith('.json'))
      const list = []
      for (const file of files) {
        try {
          const data = JSON.parse(await fsp.readFile(path.join(dir, file), 'utf8'))
          list.push({ id: data.id, title: data.title, category: data.category, createdAt: data.createdAt, appVersion: data.appVersion, platform: data.platform })
        } catch {
          /* ignore */
        }
      }
      list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      return send(res, 200, { ok: true, reports: list })
    } catch (err) {
      return send(res, 500, { ok: false, error: err.message })
    }
  }
  if (url.startsWith('/api/bug-reports/') && req.method === 'GET') {
    if (token && req.headers['x-admin-token'] !== token) return send(res, 401, { ok: false, error: 'token 错误' })
    const id = url.split('/').pop()
    if (!/^[A-Za-z0-9-]+$/.test(id)) return send(res, 400, { ok: false, error: 'id 无效' })
    try {
      const data = await fsp.readFile(path.join(root, 'bug-reports', `${id}.json`), 'utf8')
      return send(res, 200, JSON.parse(data))
    } catch {
      return send(res, 404, { ok: false, error: '没有找到' })
    }
  }
  if (url === '/api/publish' && req.method === 'POST') {
    if (token && req.headers['x-admin-token'] !== token) return send(res, 401, { ok: false, error: 'token 错误' })
    try {
      const body = JSON.parse(await readBody(req))
      const version = String(body.version || '').trim()
      if (!/^\d+\.\d+\.\d+/.test(version)) return send(res, 400, { ok: false, error: '版本号格式应为 x.y.z' })
      await fsp.mkdir(root, { recursive: true })
      const urls = {}
      const copy = async (src, destName) => {
        if (!src) return ''
        const from = path.resolve(src)
        const stat = await fsp.stat(from)
        if (!stat.isFile()) throw new Error('不是文件：' + from)
        const to = path.join(root, destName)
        if (from !== to) await fsp.copyFile(from, to)
        return `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host || '127.0.0.1:' + port}/${destName}`
      }
      const dmg = await copy(body.dmg, `SCL-${version}-arm64.dmg`)
      const winExt = body.win ? path.extname(body.win) || '.zip' : '.zip'
      const win = await copy(body.win, `SCL-${version}-win-x64${winExt}`)
      if (dmg) urls['darwin-arm64'] = dmg
      if (win) urls['win32-x64'] = win
      if (!dmg && !win) return send(res, 400, { ok: false, error: '至少提供 DMG 或 Windows zip' })
      const manifest = { version, notes: body.notes || '', pubDate: new Date().toISOString().slice(0, 10), urls }
      await fsp.writeFile(path.join(root, 'latest.json'), JSON.stringify(manifest, null, 2) + '\n')
      console.log('[publish]', version, urls)
      return send(res, 200, { ok: true, manifest })
    } catch (err) {
      return send(res, 400, { ok: false, error: err.message })
    }
  }
  const target = path.join(root, url === '/' ? 'latest.json' : url)
  if (!target.startsWith(root + path.sep)) return send(res, 403, 'forbidden', 'text/plain')
  try {
    const stat = await fsp.stat(target)
    if (!stat.isFile()) throw new Error('not file')
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(target)] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Access-Control-Allow-Origin': '*'
    })
    fs.createReadStream(target).pipe(res)
  } catch {
    send(res, 404, 'not found', 'text/plain')
  }
}

const server = useTls
  ? https.createServer({ key: fs.readFileSync(tlsKey), cert: fs.readFileSync(tlsCert) }, handler)
  : http.createServer(handler)

server.listen(port, () => {
  const scheme = useTls ? 'https' : 'http'
  console.log(`SCL update server: ${scheme}://127.0.0.1:${port}/latest.json`)
  console.log(`admin: ${scheme}://127.0.0.1:${port}/admin`)
})
