@echo off
title TV YouTube Downloader - Setup
cd /d "%~dp0"
echo Menyiapkan alat untuk TV YouTube Downloader...
echo.

if not exist bin mkdir bin

if exist bin\yt-dlp.exe (
  echo yt-dlp.exe sudah ada, dilewati.
) else (
  echo Mengunduh yt-dlp.exe...
  powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile 'bin\yt-dlp.exe'"
  if errorlevel 1 (
    echo GAGAL mengunduh yt-dlp.exe. Cek koneksi internet.
    pause
    exit /b 1
  )
)

where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo ffmpeg belum ada, menginstall lewat winget...
  winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements
) else (
  echo ffmpeg sudah terdeteksi.
)

echo.
echo Selesai. Jalankan start.bat untuk memulai aplikasi.
pause
