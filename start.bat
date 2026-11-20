@echo off
title TV YouTube Downloader
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js tidak ditemukan. Install dari https://nodejs.org
  pause
  exit /b 1
)
node app.js
pause
