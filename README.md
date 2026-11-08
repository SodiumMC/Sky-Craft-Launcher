# SCL · Sky Craft Launcher

English | [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-45-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-111827)](#download)

A Minecraft launcher developed by **OMS Work!**, built with Electron, React and TypeScript. It uses a single floating-window design and supports vanilla Minecraft plus the major mod loaders.

![Home](https://gcore.jsdelivr.net/gh/SodiumMC/Sky-Craft-Launcher@main/docs/screenshots/home.png)

## Features

### Interface

- **Single window with dynamic resizing** — the launcher, manager pages and dialogs resize the window smoothly while keeping the animation rhythm
- **Floating cards** — a frameless, transparent window with separated layers for cards, the dock and the background
- **3D cursor tilt** — the card subtly follows the pointer; strength is adjustable and can be disabled completely
- **Notification system** — separate transparent always-on-top windows; multiple notifications stack from the top and slide up when one leaves
- **Dark mode** — light, dark or follow system, using a space-gray palette
- **English / Chinese UI** — switchable at runtime

### Versions and launching

- Vanilla releases and snapshots, with BMCLAPI mirror and automatic fallback to Mojang
- **Fabric / Quilt / Forge / NeoForge** installation
- Reads **Modrinth App** instances and versions and launches them directly
- **mrpack** modpack import (detects the loader, installs required dependencies, extracts overrides)
- Full version inheritance, rule evaluation and argument-template expansion
- Native libraries selected per OS/architecture, including the `natives/java` layout used by 26.x
- Legacy versions (1.12.2 and older) automatically use Java 8; on Apple Silicon an x64 Java 8 is downloaded and run through Rosetta
- Pre-1.6 versions get a generated `assets/virtual` directory
- **Crash analysis** — on abnormal exit a dialog explains Java version issues, missing dependencies, module conflicts, native library failures, out-of-memory and more

### Java

- Detects system JDKs, `JAVA_HOME`, `PATH` and Mojang runtimes
- Automatically downloads a **Zulu JRE** when no suitable Java is found (Adoptium fallback)
- Picks Java according to the version requirements; legacy versions are pinned to Java 8

### Downloads

- Mods, resource packs and shaders powered by **Modrinth**
- Filter by game version / loader; sort by downloads or newest
- Automatically installs required mod dependencies
- Manages resource packs, shaders, saves and server lists

### Accounts

- Offline accounts (username + offline UUID)
- Microsoft account login (OAuth device-code flow)

### Extras

- Live logs with filtering and export
- **Bug reporting** — attaches redacted logs, system information, mod list and screenshots; falls back to a local zip on the Desktop if submission fails
- An easter egg called “Treasure Box”

## Screenshots

| Downloads | Versions |
| --- | --- |
| ![Downloads](https://gcore.jsdelivr.net/gh/SodiumMC/Sky-Craft-Launcher@main/docs/screenshots/download.png) | ![Versions](https://gcore.jsdelivr.net/gh/SodiumMC/Sky-Craft-Launcher@main/docs/screenshots/versions.png) |

| Settings | Notifications |
| --- | --- |
| ![Settings](https://gcore.jsdelivr.net/gh/SodiumMC/Sky-Craft-Launcher@main/docs/screenshots/settings.png) | ![Notifications](https://gcore.jsdelivr.net/gh/SodiumMC/Sky-Craft-Launcher@main/docs/screenshots/notifications.png) |

## Download

Get builds from [GitHub Releases](https://github.com/SodiumMC/Sky-Craft-Launcher/releases):

- macOS (Apple Silicon): `SCL-<version>-arm64.dmg`
- Windows x64: `SCL-Setup-<version>-x64.exe`

> The builds are not notarized by Apple. If Gatekeeper blocks the first launch, allow it in **System Settings → Privacy & Security**, or right-click the app and choose **Open**.

You can also build from source — see below.

## Development

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/SodiumMC/Sky-Craft-Launcher.git
cd Sky-Craft-Launcher
npm install
npm start
```

`npm start` builds the main process, preload script and renderer, then launches Electron.

### Scripts

| Command | Description |
| --- | --- |
| `npm start` | Build and launch |
| `npm run build` | Build main process + preload + renderer |
| `npm run build:main` | Build the main process only |
| `npm run build:renderer` | Build the renderer only (Vite) |
| `npm run typecheck` | TypeScript type checking |

### Packaging

macOS (Apple Silicon):

```bash
npx electron-packager . SCL --platform=darwin --arch=arm64 \
  --out=release --overwrite --asar --prune=true \
  --app-bundle-id=studio.scl.launcher --app-version=<version> \
  --icon=build/icon.icns
```

Windows (NSIS installer):

```bash
npx electron-builder --win nsis --x64
```

Artifacts are written to `release/` and `release-installer/`.

## Project structure

```
src/
  main/
    index.ts            windows, IPC, state and updates
    core/
      launcher.ts       launch arguments, native libraries, logs
      version.ts        version JSON merging, rules, natives
      installer.ts      vanilla / Fabric / Quilt installation
      forge.ts          Forge / NeoForge installation
      mods.ts           Modrinth mods / resource packs / shaders
      modpack.ts        mrpack import
      modrinth.ts       Modrinth App instance reading
      java.ts           Java detection and selection
      javaDownload.ts   JRE auto-download
      crashAnalyzer.ts  crash analysis
      bugReport.ts      bug report collection, submission and export
      config.ts         configuration and version list
  preload/              contextBridge API
  renderer/             React UI
  shared/               shared types and API definitions
scripts/                update service, development and test scripts
docs/screenshots/       UI screenshots
```

Stack: Electron 45, React 19, TypeScript, Vite, esbuild, `@electron/packager` and `electron-builder`.

## Data directories

| Platform | Path |
| --- | --- |
| macOS | `~/Library/Application Support/SCL` |
| Windows | `%APPDATA%\SCL` |

These contain configuration, logs, auto-downloaded Java runtimes and local bug reports.

## Contributing

See [`docs/CODE_REVIEW.md`](docs/CODE_REVIEW.md) for the current code-quality notes and refactoring roadmap.

- Search existing issues before opening a new one
- Use **Settings → Help & Feedback → Submit Bug** in the launcher to attach logs and environment information
- Pull requests should preserve the existing design language; run `npm run typecheck` and `npm run build` before submitting
- Never commit account tokens, server private keys, `updates/tls/` or other secrets

## Acknowledgements

- [Electron](https://www.electronjs.org/), [React](https://react.dev/), [Vite](https://vite.dev/)
- [Fabric](https://fabricmc.net/), [Forge](https://files.minecraftforge.net/), [NeoForge](https://neoforged.net/), [Quilt](https://quiltmc.org/)
- [Modrinth](https://modrinth.com/) for its API and content
- [BMCLAPI](https://bmclapi2.bangbang93.com/) for the mirror
- [Azul Zulu](https://www.azul.com/downloads/) and [Adoptium](https://adoptium.net/) for Java runtimes
- Everyone who tested the launcher and submitted feedback

## Copyright and license

Copyright © 2026 **OMS Work!**.

Licensed under the [MIT License](LICENSE).

Minecraft is a trademark of Mojang Studios. This project is not affiliated with Mojang or Microsoft.
