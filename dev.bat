@echo off
:: 小白记账 开发模式启动器
:: 双击此文件启动开发模式（带热更新）
set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0"
npx electron-vite dev
pause
