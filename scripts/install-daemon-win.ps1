# SCL 更新服务守护进程（Windows 计划任务）
# 以当前用户身份安装，登录后自动运行，失败自动重启。
#   powershell -ExecutionPolicy Bypass -File scripts\install-daemon-win.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\install-daemon-win.ps1 -Uninstall
param([switch]$Uninstall)

$TaskName = 'SCL Update Daemon'
$Project = Split-Path -Parent $PSScriptRoot
$Daemon = Join-Path $Project 'scripts\update-daemon.cjs'

if ($Uninstall) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "已卸载计划任务：$TaskName"
  exit 0
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  Write-Error '未找到 node.exe，请先安装 Node.js LTS（https://nodejs.org）并确保在 PATH 中。'
  exit 1
}
if (-not (Test-Path $Daemon)) {
  Write-Error "找不到守护脚本：$Daemon"
  exit 1
}

$action = New-ScheduledTaskAction -Execute $node -Argument "`"$Daemon`"" -WorkingDirectory $Project
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName
Write-Host "已安装并启动：$TaskName"
Write-Host "更新服务：https://127.0.0.1:11354/latest.json"
Write-Host "卸载：powershell -ExecutionPolicy Bypass -File scripts\install-daemon-win.ps1 -Uninstall"
