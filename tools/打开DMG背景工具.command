#!/bin/bash
cd "$(dirname "$0")/.."
env -u ELECTRON_RUN_AS_NODE ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron tools/dmg-bg-app/main.js
