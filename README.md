# TV YouTube Downloader

A tiny Windows app that downloads YouTube videos as **MP4 files that actually play on TVs**.

Many YouTube downloads are delivered as *fragmented MP4* (DASH-style `moof`/`mdat` fragments after merging). Most smart TVs and USB media players reject that layout even when the file is named `.mp4` and uses H.264. This app fixes the container problem automatically, so the output works on TV without touching the video quality.

## Features

- Simple local web UI (opens automatically in the browser)
- Quality presets: 360p / 480p / 720p / 1080p / best
- Prefers `avc1` (H.264) + `mp4a` (AAC) streams — the codec pair TVs understand
- Verifies the merged file with `ffprobe`:
  - if codecs are already TV-safe → lossless remux (no re-encode)
  - otherwise → transcodes to H.264 + AAC automatically
- Always writes a **progressive MP4 with `+faststart`** (`ftyp → moov → mdat`)
- Live progress bar with global percentage, speed, ETA and animations
- Cancel button, "open file location" button, yt-dlp self-update
- Windows installer (Inno Setup) with desktop/Start Menu shortcuts and bundled Node.js runtime

## Tech stack

- **Node.js** — zero npm dependencies; plain `http`, `child_process`, `fs`
- **yt-dlp** — YouTube extraction/downloading
- **FFmpeg / ffprobe** — codec inspection, remux and fallback transcode
- **Vanilla HTML / CSS / JavaScript** — single-page local UI
- **Inno Setup 6** — `.exe` installer

## How it works

1. The UI sends the URL + quality to a local Node server (`127.0.0.1:7777`).
2. The server runs yt-dlp with a format chain that prefers H.264 + AAC and merges into MP4.
3. `ffprobe` inspects the result. Safe codecs are copied as-is; unsafe ones are transcoded.
4. FFmpeg remuxes to a non-fragmented MP4 and moves the `moov` atom to the front (`+faststart`).
5. The browser polls `/api/status` and animates a monotonic 0 → 100% progress bar (video 2–60%, audio 60–85%, merge 87%, finishing 90–99%).

## Getting started

```bat
setup.bat      :: downloads yt-dlp.exe and installs ffmpeg via winget if missing
start.bat      :: starts the app and opens http://127.0.0.1:7777
```

Requirements: Windows 10/11 x64, Node.js 18+ (only for running from source — the installer bundles Node), internet access.

## Building the installer

1. Install [Inno Setup 6](https://jrsoftware.org/isinfo.php).
2. Compile `installer/setup.iss` with `ISCC.exe`.
3. Output: `installer/TV_YouTube_Downloader_Setup.exe`.

The installer installs to `%LOCALAPPDATA%\TV YouTube Downloader`, creates desktop and Start Menu shortcuts, and registers an uninstaller.

## Project structure

```
app.js                  local HTTP server + download/verify/remux pipeline
public/index.html       pink-themed web UI (no frameworks)
bin/yt-dlp.exe          downloaded by setup.bat (not committed)
launch.vbs              hidden launcher used by the installed app
start.bat               developer launcher
setup.bat               first-run tool bootstrap
icon-round.ico          app/icon asset
installer/setup.iss     Inno Setup script
README.md / LICENSE
```

## Notes

`yt-dlp.exe` and the compiled installer are intentionally excluded from git (`.gitignore`); `setup.bat` recreates the tool on a fresh clone. FFmpeg is detected from `PATH`, from Inno/winget install locations, or from `bin/`.
