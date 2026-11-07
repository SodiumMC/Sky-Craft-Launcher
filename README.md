# SCL · Sky Craft Launcher

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-45-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-111827)](#下载)

由 **OMS Work!** 开发的 Minecraft 启动器。Electron + React + TypeScript，单窗口浮动卡片设计，支持原版与主流模组加载器。

![启动页](docs/screenshots/home.png)

## 特性

### 界面

- **单窗口 + 灵动尺寸**：启动页、管理页、弹窗之间平滑改变窗口大小，保留动画节奏
- **浮动卡片**：无边框透明窗口，卡片、Dock 与背景层次分离
- **3D 鼠标跟随**：卡片随光标轻微倾斜，强度可调，可完全关闭
- **通知系统**：独立透明置顶小窗，多条通知从上往下堆叠，退场后自动补位
- **深色模式**：浅色 / 深色 / 跟随系统，深空灰配色
- **中英双语**：界面文案可切换

### 版本与启动

- 原版正式版 / 快照安装，BMCLAPI 镜像与官方源自动回退
- **Fabric / Quilt / Forge / NeoForge** 安装
- 读取 **Modrinth App** 的实例与版本，直接启动
- **mrpack 整合包**导入（自动识别加载器、补齐依赖、解压 overrides）
- 版本继承链、规则与参数模板解析
- 原生库按系统/架构挑选并解压，兼容 26.x 的 `natives/java` 布局
- 旧版本（1.12.2 及更早）自动使用 Java 8；Apple Silicon 上下载 x64 Java 8 走 Rosetta
- 1.6 以前的旧版资源自动生成 `assets/virtual`
- 崩溃分析：非正常退出时弹窗定位 Java 版本、依赖缺失、模块冲突、原生库、内存等问题

### Java

- 扫描系统 JDK、`JAVA_HOME`、`PATH`、Mojang runtime
- 缺少合适 Java 时自动下载 **Zulu JRE**（Adoptium 回退）
- 按版本要求选择 Java，旧版本强制 Java 8

### 下载

- 模组、资源包、光影，数据来自 **Modrinth**
- 按游戏版本 / 加载器筛选，支持按下载量、时间排序
- 安装模组时自动补齐必需前置
- 资源包、光影、存档、服务器列表管理

### 账户

- 离线账户（用户名 + 离线 UUID）
- 微软正版登录（OAuth 设备码流程）

### 其他

- 实时日志、日志过滤与导出
- **Bug 提交**：附带脱敏日志、系统信息、模组列表与截图，失败自动导出 zip 到桌面
- 彩蛋「百宝箱」

## 截图

| 下载 | 版本 |
| --- | --- |
| ![下载](docs/screenshots/download.png) | ![版本](docs/screenshots/versions.png) |

| 设置 | 通知 |
| --- | --- |
| ![设置](docs/screenshots/settings.png) | ![通知](docs/screenshots/notifications.png) |

## 下载

从 [GitHub Releases](https://github.com/SodiumMC/Sky-Craft-Launcher/releases) 下载：

- macOS（Apple Silicon）：`SCL-<version>-arm64.dmg`
- Windows x64：`SCL-Setup-<version>-x64.exe`

> 构建未做 Apple 公证，首次打开如被 Gatekeeper 拦截，请在「系统设置 → 隐私与安全性」中允许，或右键 → 打开。

也可以从源码构建，见下文。

## 开发

要求：Node.js 20+、npm。

```bash
git clone https://github.com/SodiumMC/Sky-Craft-Launcher.git
cd SCL
npm install
npm start
```

`npm start` 会先构建主进程、preload 和渲染层，再启动 Electron。

### 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm start` | 构建并启动 |
| `npm run build` | 构建主进程 + preload + 渲染层 |
| `npm run build:main` | 只构建主进程 |
| `npm run build:renderer` | 只构建渲染层（Vite） |
| `npm run typecheck` | TypeScript 类型检查 |

### 打包

macOS（Apple Silicon）：

```bash
npx electron-packager . SCL --platform=darwin --arch=arm64 \
  --out=release --overwrite --asar --prune=true \
  --app-bundle-id=studio.scl.launcher --app-version=<version> \
  --icon=build/icon.icns
```

Windows（NSIS 安装包）：

```bash
npx electron-builder --win nsis --x64
```

产物分别在 `release/` 与 `release-installer/`。

## 目录结构

```
src/
  main/
    index.ts            窗口、IPC、状态与更新
    core/
      launcher.ts       启动参数、原生库、日志
      version.ts        版本 JSON 合并、规则、natives
      installer.ts      原版 / Fabric / Quilt 安装
      forge.ts          Forge / NeoForge 安装
      mods.ts           Modrinth 模组 / 资源包 / 光影
      modpack.ts        mrpack 导入
      modrinth.ts       Modrinth App 实例读取
      java.ts           Java 探测与选择
      javaDownload.ts   JRE 自动下载
      crashAnalyzer.ts  崩溃分析
      bugReport.ts      Bug 报告采集、提交、导出
      config.ts         配置与版本列表
  preload/              contextBridge API
  renderer/            React 界面
  shared/              共享类型与 API 定义
scripts/               更新服务、开发与测试脚本
docs/screenshots/      界面截图
```

技术栈：Electron 45、React 19、TypeScript、Vite、esbuild、`@electron/packager`、`electron-builder`。

## 数据目录

| 平台 | 路径 |
| --- | --- |
| macOS | `~/Library/Application Support/SCL` |
| Windows | `%APPDATA%\SCL` |

其中包含配置、日志、自动下载的 Java、本地 Bug 报告等。

## 参与贡献

- 提交 Issue 前请先搜索是否已有相同问题
- 通过启动器内的「设置 → 帮助与反馈 → 提交 Bug」附上日志和环境信息
- PR 请保持现有设计语言，提交前运行 `npm run typecheck` 和 `npm run build`
- 不要提交账号令牌、服务器私钥、`updates/tls/` 等敏感文件

## 致谢

- [Electron](https://www.electronjs.org/)、[React](https://react.dev/)、[Vite](https://vite.dev/)
- [Fabric](https://fabricmc.net/)、[Forge](https://files.minecraftforge.net/)、[NeoForge](https://neoforged.net/)、[Quilt](https://quiltmc.org/)
- [Modrinth](https://modrinth.com/) 提供的 API 与内容
- [BMCLAPI](https://bmclapi2.bangbang93.com/) 镜像
- [Azul Zulu](https://www.azul.com/downloads/)、[Adoptium](https://adoptium.net/) 提供的 Java 运行时
- 所有参与测试和提交反馈的玩家

## 版权与许可

Copyright © 2026 **OMS Work!**. All rights reserved.

本项目使用 [MIT License](LICENSE) 开源。

Minecraft 是 Mojang Studios 的商标，本项目与 Mojang、Microsoft 无隶属关系。
