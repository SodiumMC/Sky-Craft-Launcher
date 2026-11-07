import type { CrashReport } from '../../shared/types'

export type { CrashReport }


interface Rule {
  test: RegExp
  title: string
  detail: string
  suggestions: string[]
}

const RULES: Rule[] = [
  {
    test: /UnsupportedClassVersionError|class file version \d+/i,
    title: 'Java 版本过低',
    detail: '游戏是用更高版本的 Java 编译的，当前 Java 无法加载。',
    suggestions: ['在版本设置里选择 Java 21/25', '或开启「自动下载 Java」后重新启动']
  },
  {
    test: /Could not find or load main class|NoClassDefFoundError: net\/minecraft|LevelStorageException/i,
    title: '版本文件不完整',
    detail: '客户端 jar 或依赖库缺失，通常是下载中断或加载器安装不完整。',
    suggestions: ['在版本页点「校验并修复」', '重新安装对应加载器（Forge/NeoForge/Fabric）']
  },
  {
    test: /already on the JVM'?s module path|module.*reads more than one module|ResolutionException/i,
    title: '加载器模块冲突',
    detail: 'Forge/NeoForge 的模块路径里有重复模块，通常是依赖版本冲突。',
    suggestions: ['删除多余版本的 asm / securejarhandler', '用启动器重新安装该加载器']
  },
  {
    test: /ProviderNotFoundException|Failed to open file system from path/i,
    title: '加载器文件系统异常',
    detail: '某个 jar 需要自定义文件系统（jar-in-jar），但对应 provider 没有加载。',
    suggestions: ['重新安装该 NeoForge/Forge 版本', '避免混用 Modrinth/其他启动器的版本目录']
  },
  {
    test: /Failed to locate library|UnsatisfiedLinkError|lwjgl\.dll|lwjgl\.dylib/i,
    title: '原生库加载失败',
    detail: '版本的原生库没有解压到正确目录，或 Java 架构与系统不匹配。',
    suggestions: ['把启动器更新到 2.0.4 或更高版本', '确认 Java 位数与系统一致（Windows x64 用 64 位 Java）']
  },
  {
    test: /OutOfMemoryError|Java heap space/i,
    title: '内存不足',
    detail: '分配给游戏的堆内存不够，或模组占用过高。',
    suggestions: ['在设置里提高最大内存', '减少大型整合包/高清资源包']
  },
  {
    test: /GLFW error|Failed to create window|NSGL|Pixel format|OpenGL/i,
    title: '图形/窗口初始化失败',
    detail: '游戏无法创建窗口或 OpenGL 上下文。',
    suggestions: ['更新显卡驱动 / macOS 系统', '关闭其他占用显卡的程序', '如果是旧 Mac，尝试较低游戏版本']
  },
  {
    test: /Missing or unsupported mandatory dependencies|ModResolutionException|Incompatible mod set/i,
    title: '模组依赖冲突',
    detail: '模组缺少前置，或模组之间不兼容。',
    suggestions: ['在「版本设置 → 模组」里禁用最近添加的模组', '安装提示缺少的前置模组']
  },
  {
    test: /AccessDeniedException|Permission denied|EPERM/i,
    title: '文件权限不足',
    detail: '游戏无法读写版本/存档目录。',
    suggestions: ['检查游戏目录权限', '执行 xattr -cr 或更换游戏目录']
  },
  {
    test: /Could not create the Java Virtual Machine|Unrecognized VM option|Invalid maximum heap size/i,
    title: 'JVM 参数无效',
    detail: '自定义 JVM 参数或内存设置不被当前 Java 接受。',
    suggestions: ['清空设置里的自定义 JVM 参数', '把最大内存调低']
  },
  {
    test: /exit code:? ?253|253/,
    title: '游戏退出码 253',
    detail: 'macOS 上 26.x 常见的启动崩溃，通常是原生库/图形初始化失败。',
    suggestions: ['用官方启动器测试同一版本', '更新 macOS', '尝试 26.1.2 或更低版本']
  }
]

export function analyzeCrash(lines: string[], code: number, versionId?: string, logFile?: string): CrashReport {
  const text = lines.join('\n')
  for (const rule of RULES) {
    if (rule.test.test(text)) {
      const hit = lines.find((l) => rule.test.test(l))
      return {
        title: rule.title,
        detail: `${rule.detail}\n\n${hit ? hit.slice(0, 240) : ''}`.trim(),
        suggestions: rule.suggestions,
        versionId,
        code,
        logFile
      }
    }
  }
  const lastError =
    [...lines].reverse().find((l) => /error|exception|caused by|fatal/i.test(l)) ?? lines[lines.length - 1] ?? ''
  return {
    title: '游戏异常退出',
    detail: `退出码 ${code}，没有匹配到已知错误。\n\n${lastError.slice(0, 300)}`,
    suggestions: ['打开日志查看完整堆栈', '把日志发给我分析'],
    versionId,
    code,
    logFile
  }
}
