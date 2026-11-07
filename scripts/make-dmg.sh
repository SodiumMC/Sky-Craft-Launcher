#!/bin/bash
# 生成带背景/图标排布的美化 DMG
# 用法: scripts/make-dmg.sh <App路径> <输出.dmg> [卷名]
set -euo pipefail
APP="$1"
OUT="$2"
VOL="${3:-SCL}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d)"
RW="$(mktemp -u).dmg"
MOUNT=""

cleanup() {
  [ -n "$MOUNT" ] && hdiutil detach "$MOUNT" -quiet 2>/dev/null || true
  rm -rf "$STAGE" "$RW"
}
trap cleanup EXIT

cp -R "$APP" "$STAGE/SCL.app"
ln -s /Applications "$STAGE/Applications"
cp "$ROOT/build/dmg-background.png" "$STAGE/.background.png"
cp "$ROOT/build/icon.icns" "$STAGE/.VolumeIcon.icns"

hdiutil create -volname "$VOL" -srcfolder "$STAGE" -ov -format UDRW -quiet "$RW"
MOUNT="$(hdiutil attach -nobrowse -noautoopen "$RW" | grep -o '/Volumes/.*' | head -1)"
if [ -z "$MOUNT" ]; then echo "mount failed"; exit 1; fi
if command -v SetFile >/dev/null 2>&1; then SetFile -a C "$MOUNT" || true; fi

python3 "$ROOT/scripts/write-dsstore.py" "$MOUNT" || echo "warn: Finder 排版失败（可能没有自动化权限），仍生成普通 DMG"

sync
hdiutil detach "$MOUNT" -force -quiet || true
MOUNT=""
rm -f "$OUT"
hdiutil convert "$RW" -format UDZO -o "$OUT" -quiet
echo "built: $OUT"
