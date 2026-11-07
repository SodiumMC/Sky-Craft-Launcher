import { EN, type Lang } from './i18n'
import extra from './extra-en.json'

/**
 * 英文模式兜底翻译：界面里仍有少量直接写死的中文文本节点，
 * 启动时遍历 DOM 并按字典/模式替换，MutationObserver 负责后续渲染。
 */
const MAP: Record<string, string> = { ...EN, ...(extra as Record<string, string>) }

const PATTERNS: Array<[RegExp, string]> = [
  [/^共 (\d+) 个版本$/, '$1 versions'],
  [/^(\d+) 个存档$/, '$1 saves'],
  [/^(\d+) 个服务器$/, '$1 servers'],
  [/^(\d+) 个文件$/, '$1 files'],
  [/^(\d+) 个模组$/, '$1 mods'],
  [/^(\d+) 个版本$/, '$1 versions'],
  [/^(\d+) 个$/, '$1'],
  [/^(\d+) 行$/, '$1 lines'],
  [/^上次启动 (.+)$/, 'Last played $1'],
  [/^游戏运行中 · PID (\d+)$/, 'Running · PID $1'],
  [/^运行中 · (.+)$/, 'Running · $1'],
  [/^(.+) · 退出码 (\d+)$/, '$1 · exit code $2'],
  [/^(.+) · 账户与设置$/, '$1 · Account & Settings'],
  [/^(.+) · 账户设置$/, '$1 · Account settings'],
  [/^(.+) · 当前$/, '$1 · Current'],
  [/^发现新版本 (.+)$/, 'New version $1 available'],
  [/^已下载 (.+)$/, 'Downloaded $1'],
  [/^已安装 (.+)$/, 'Installed $1'],
  [/^已删除 (.+)$/, 'Deleted $1'],
  [/^已修复 (.+)$/, 'Repaired $1'],
  [/^已导入 (.+)（(\d+) 个模组）$/, 'Imported $1 ($2 mods)'],
  [/^(.+) 安装完成$/, '$1 installed'],
  [/^(.+) 已启动$/, '$1 launched'],
  [/^(.+) 文件完整$/, '$1 files OK'],
  [/^(.+) 使用 Java (\d+)$/, '$1 uses Java $2'],
  [/^(.+) 跟随全局 Java 设置$/, '$1 follows global Java'],
  [/^(\d+) GB 内存$/, '$1 GB RAM'],
  [/^跟随全局（(\d+) GB）$/, 'Follow global ($1 GB)'],
  [/^系统共 (\d+) GB，建议 4–6 GB$/, '$1 GB total, 4–6 GB recommended'],
  [/^将附带：(.+)$/, 'Attached: $1'],
  [/^当前平台暂无更新包（(.+)）$/, 'No update package for this platform ($1)'],
  [/^搜索(.+)$/, 'Search $1'],
  [/^安装 (.+)$/, 'Install $1'],
  [/^(.+)（推荐）$/, '$1 (recommended)'],
  [/^(.+)（最新）$/, '$1 (latest)']
]

const CJK = /[\u3400-\u9fff]/

function translateCore(text: string): string {
  const exact = MAP[text]
  if (exact) return exact
  for (const [re, value] of PATTERNS) {
    if (re.test(text)) return text.replace(re, value)
  }
  return text
}

export function translateText(raw: string): string {
  if (!CJK.test(raw)) return raw
  const lead = raw.match(/^\s*/)?.[0] ?? ''
  const trail = raw.match(/\s*$/)?.[0] ?? ''
  const core = raw.slice(lead.length, raw.length - trail.length)
  if (!core) return raw
  const translated = translateCore(core)
  return translated === core ? raw : lead + translated + trail
}

const SKIP = 'pre, code, .cline, .mini-line, .ctext, .vtitle, .lr-name, [data-no-i18n]'

function skipNode(el: Element | null): boolean {
  return !el || Boolean(el.closest(SKIP))
}

function translateAttributes(el: Element): void {
  if (skipNode(el)) return
  for (const attr of ['placeholder', 'title', 'aria-label', 'alt']) {
    const value = el.getAttribute(attr)
    if (!value || !CJK.test(value)) continue
    const translated = translateCore(value.trim())
    if (translated !== value.trim()) el.setAttribute(attr, translated)
  }
}

function walk(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    if (!skipNode(node.parentElement)) {
      const next = translateText(node.nodeValue ?? '')
      if (next !== node.nodeValue) node.nodeValue = next
    }
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return
  const el = node as Element
  translateAttributes(el)
  // 输入框只翻译 placeholder/title，不碰用户输入内容
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return
  for (const child of Array.from(el.childNodes)) walk(child)
}

export function installAutoTranslate(lang: Lang | undefined): void {
  if (lang !== 'en-US') return
  let scheduled = false
  const run = () => {
    scheduled = false
    walk(document.body)
  }
  run()
  const observer = new MutationObserver(() => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(run)
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
}
