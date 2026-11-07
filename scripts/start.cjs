// 启动 Electron；同时清除可能存在的 ELECTRON_RUN_AS_NODE，避免被当作 Node 进程运行
const { spawn } = require('node:child_process')
const electron = require('electron')
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
env.VITE_DEV_SERVER_URL = env.VITE_DEV_SERVER_URL || ''
const child = spawn(electron, ['.'], { stdio: 'inherit', env })
child.on('close', (code) => process.exit(code ?? 0))
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig))
