# SCL 更新发布

客户端会在启动 5 秒后和「设置 → 外观 → 检查更新」时请求更新源 JSON；有更高版本会弹出更新窗口。

## 1. 打包

```bash
npm run build
# macOS
npx electron-packager . SCL --platform=darwin --arch=arm64 --out=release --overwrite --asar --prune --icon=build/icon.icns
hdiutil create -volname SCL -srcfolder release/SCL-darwin-arm64/SCL.app -ov -format UDZO SCL-1.0.1-arm64.dmg
# Windows 便携 zip
npx electron-packager . SCL --platform=win32 --arch=x64 --out=release --overwrite --asar --prune --icon=build/icon.ico
```

## 2. 发布文件

把 DMG / Windows zip 和 `latest.json` 上传到任意静态托管（GitHub Releases、Gitee、对象存储均可）。

## 3. 生成 latest.json

```bash
node scripts/make-update-manifest.cjs \
  --version 1.0.1 \
  --notes "修复版本下拉、加入版本隔离" \
  --base https://example.com/scl/ \
  --dmg SCL-1.0.1-arm64.dmg \
  --win SCL-1.0.1-win-x64.zip
```

得到：

```json
{
  "version": "1.0.1",
  "notes": "修复版本下拉、加入版本隔离",
  "pubDate": "2026-10-24",
  "urls": {
    "darwin-arm64": "https://example.com/scl/SCL-1.0.1-arm64.dmg",
    "win32-x64": "https://example.com/scl/SCL-1.0.1-win-x64.zip"
  }
}
```

## 4. 配置客户端

设置 → 外观 → 更新源，填 `latest.json` 的完整 URL。之后每次启动都会检查；也可以手动点「检查更新」。

> 自动下载/覆盖安装没有做，更新弹窗里的「下载更新」会打开对应平台的下载链接；安装仍由用户完成（未签名，需要手动绕过 Gatekeeper/SmartScreen）。


## 守护进程

macOS：

```bash
node scripts/install-daemon.cjs
# 卸载：node scripts/install-daemon.cjs --uninstall
```

Windows（需要安装 Node.js LTS）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-daemon-win.ps1
# 卸载：powershell -ExecutionPolicy Bypass -File scripts\install-daemon-win.ps1 -Uninstall
```

守护进程会在服务退出后 2 秒重启，并每 30 秒请求一次 `/health`；日志在 `updates/daemon.log`。
