# TV YouTube Downloader

[Bahasa Indonesia](#bahasa-indonesia) · [English](#english)

---

## Bahasa Indonesia

Aplikasi Windows kecil yang mengunduh video YouTube menjadi **MP4 yang benar-benar bisa diputar di TV**.

Banyak hasil download YouTube dikirim sebagai *fragmented MP4* (potongan `moof`/`mdat` ala DASH setelah proses gabung). Kebanyakan smart TV dan pemutar USB menolak struktur ini, bahkan kalau filenya bernama `.mp4` dan memakai H.264. Aplikasi ini otomatis memperbaiki masalah container tersebut, sehingga hasilnya langsung bisa diputar di TV tanpa mengorbankan kualitas gambar.

### Kenapa ini dibuat

File yang kelihatannya valid di komputer bisa saja ditolak TV dengan pesan "unsupported". Penyebabnya bukan codec-nya, melainkan struktur file: `moov` berukuran kecil dan isi video terbagi-bagi menjadi fragmen `moof/mdat`. Aplikasi ini merapikan struktur itu menjadi MP4 progressive dan memindahkan `moov` ke depan file (`+faststart`).

### Fitur

- UI web lokal yang otomatis terbuka di browser
- Pencarian video YouTube di dalam aplikasi (memakai yt-dlp, tanpa API key) dengan preview embed — klik hasil untuk mengisi URL lalu download
- Sakelar bahasa **Indonesia / English** (pilihan tersimpan di browser); termasuk terjemahan progress, error, dan log
- Pilihan kualitas: 360p / 480p / 720p / 1080p / **2160p 4K** / terbaik
- Memilih stream `avc1` (H.264) + `mp4a` (AAC) — pasangan codec yang dipahami TV
- Hasil gabungan diperiksa dengan `ffprobe`:
  - codec sudah aman → di-remux tanpa re-encode (kualitas identik)
  - codec tidak aman → otomatis dikonversi ke H.264 + AAC
- Selalu menghasilkan **MP4 progressive dengan `+faststart`** (`ftyp → moov → mdat`)
- Bar progres dengan persen global, kecepatan, ETA, dan animasi
- Tombol batal, tombol buka lokasi file, dan pembaruan yt-dlp sendiri
- Installer Windows (Inno Setup) dengan shortcut Desktop/Start Menu dan Node.js yang sudah dibundling

### Teknologi

- **Node.js** — tanpa dependency npm; memakai `http`, `child_process`, `fs` bawaan
- **yt-dlp** — ekstraksi dan download dari YouTube
- **FFmpeg / ffprobe** — inspeksi codec, remux, dan transcoding cadangan
- **HTML / CSS / JavaScript murni** — UI satu halaman
- **Inno Setup 6** — installer `.exe`

### Cara kerja

1. UI mengirim URL + kualitas ke server Node lokal (`127.0.0.1:7777`).
2. Server menjalankan yt-dlp dengan format yang mengutamakan H.264 + AAC lalu menggabungkannya ke MP4.
3. `ffprobe` memeriksa hasilnya. Codec aman disalin apa adanya; codec tidak aman ditranscode.
4. FFmpeg meremux menjadi MP4 non-fragmented dan memindahkan atom `moov` ke depan (`+faststart`).
5. Browser melakukan polling ke `/api/status` dan menampilkan bar 0 → 100% yang tidak pernah mundur (video 2–60%, audio 60–85%, gabung 87%, proses akhir 90–99%).

### Menjalankan dari source

```bat
setup.bat      :: mengunduh yt-dlp.exe dan menginstall ffmpeg lewat winget jika belum ada
start.bat      :: menjalankan aplikasi dan membuka http://127.0.0.1:7777
```

Butuh Windows 10/11 x64 dan koneksi internet. Node.js 18+ hanya diperlukan untuk menjalankan dari source — installer sudah membundling Node.js.

### Membuat installer

1. Install [Inno Setup 6](https://jrsoftware.org/isinfo.php).
2. Kompilasi `installer/setup.iss` dengan `ISCC.exe` (path sumber sudah relatif, jadi bisa langsung dikompilasi dari folder mana pun).
3. Hasil: `installer/TV_YouTube_Downloader_Setup.exe`.

Script otomatis mencari `node.exe` di `%ProgramFiles%\nodejs` maupun `%ProgramW6432%\nodejs`. Kalau Node terinstall di tempat lain, tentukan sendiri:

```bat
ISCC.exe /dNodeExe="D:\path\node.exe" installer\setup.iss
```

Installer memasang aplikasi ke `%LOCALAPPDATA%\TV YouTube Downloader`, membuat shortcut Desktop dan Start Menu, serta mendaftarkan uninstaller.

### Struktur proyek

```
app.js                  server HTTP lokal + pipeline download/cek/remux
public/index.html       UI web bilingual bertema gelap (tanpa framework)
bin/yt-dlp.exe          diunduh oleh setup.bat (tidak masuk git)
launch.vbs              launcher tersembunyi untuk aplikasi terinstall
start.bat               launcher untuk development
setup.bat               bootstrap alat saat pertama kali
icon-round.ico          ikon aplikasi & shortcut (mark "Y")
public/favicon.ico      favicon browser, identik dengan ikon aplikasi
installer/setup.iss     skrip Inno Setup
README.md / LICENSE / THIRD_PARTY_NOTICES.md
```

### Catatan

`yt-dlp.exe` dan installer yang sudah dikompilasi sengaja tidak dimasukkan ke git (`.gitignore`); `setup.bat` akan mengunduhnya lagi saat clone bersih. FFmpeg dicari dari `PATH`, lokasi instalasi winget, atau folder `bin/`.

### Penafian

Aplikasi ini hanya untuk mengunduh konten yang Anda miliki atau memiliki izin untuk mengunduhnya. Patuhi Syarat Layanan platform sumber video dan peraturan hak cipta yang berlaku. Penulis tidak bertanggung jawab atas penyalahgunaan atau pelanggaran oleh pengguna. Rincian lisensi pihak ketiga ada di `THIRD_PARTY_NOTICES.md`.

---

## English

A small Windows app that downloads YouTube videos as **MP4 files that actually play on TVs**.

Many YouTube downloads arrive as *fragmented MP4* (DASH-style `moof`/`mdat` fragments after merging). Most smart TVs and USB media players reject that layout even when the file is named `.mp4` and uses H.264. This app fixes the container problem automatically, so the output works on TV without touching the video quality.

### Why

A file that looks perfectly fine on a PC can still be rejected by a TV with an "unsupported" message. The culprit is usually the container structure, not the codec: a tiny `moov` atom with the actual media split into `moof/mdat` fragments. This app rewrites it into a progressive MP4 and moves `moov` to the front (`+faststart`).

### Features

- Simple local web UI that opens automatically in the browser
- Built-in YouTube search (powered by yt-dlp, no API key) with embedded preview — click a result to fill the URL and download
- **Indonesian / English** language switch (remembered in your browser), including progress, errors and log lines
- Quality presets: 360p / 480p / 720p / 1080p / **2160p 4K** / best
- Prefers `avc1` (H.264) + `mp4a` (AAC) streams — the codec pair TVs understand
- Verifies the merged file with `ffprobe`:
  - already TV-safe → lossless remux (no re-encode)
  - not safe → automatic transcode to H.264 + AAC
- Always writes a **progressive MP4 with `+faststart`** (`ftyp → moov → mdat`)
- Live progress bar with global percentage, speed, ETA and animations
- Cancel button, "open file location" button, and yt-dlp self-update
- Windows installer (Inno Setup) with desktop/Start Menu shortcuts and a bundled Node.js runtime

### Tech stack

- **Node.js** — zero npm dependencies; plain `http`, `child_process`, `fs`
- **yt-dlp** — YouTube extraction and downloading
- **FFmpeg / ffprobe** — codec inspection, remux and fallback transcode
- **Vanilla HTML / CSS / JavaScript** — single-page local UI
- **Inno Setup 6** — `.exe` installer

### How it works

1. The UI sends the URL + quality to a local Node server (`127.0.0.1:7777`).
2. The server runs yt-dlp with a format chain that prefers H.264 + AAC and merges into MP4.
3. `ffprobe` inspects the result. Safe codecs are copied as-is; unsafe ones are transcoded.
4. FFmpeg remuxes to a non-fragmented MP4 and moves the `moov` atom to the front (`+faststart`).
5. The browser polls `/api/status` and animates a monotonic 0 → 100% progress bar (video 2–60%, audio 60–85%, merge 87%, finishing 90–99%).

### Getting started

```bat
setup.bat      :: downloads yt-dlp.exe and installs ffmpeg via winget if missing
start.bat      :: starts the app and opens http://127.0.0.1:7777
```

Requires Windows 10/11 x64 and internet access. Node.js 18+ is only needed to run from source — the installer bundles Node.

### Building the installer

1. Install [Inno Setup 6](https://jrsoftware.org/isinfo.php).
2. Compile `installer/setup.iss` with `ISCC.exe` (source paths are relative, so it works from any checkout location).
3. Output: `installer/TV_YouTube_Downloader_Setup.exe`.

The script looks for `node.exe` in both `%ProgramFiles%\nodejs` and `%ProgramW6432%\nodejs`. If Node lives elsewhere, pass it explicitly:

```bat
ISCC.exe /dNodeExe="D:\path\node.exe" installer\setup.iss
```

The installer installs to `%LOCALAPPDATA%\TV YouTube Downloader`, creates desktop and Start Menu shortcuts, and registers an uninstaller.

### Project structure

```
app.js                  local HTTP server + download/verify/remux pipeline
public/index.html       dark-themed bilingual web UI (no frameworks)
bin/yt-dlp.exe          downloaded by setup.bat (not committed)
launch.vbs              hidden launcher used by the installed app
start.bat               developer launcher
setup.bat               first-run tool bootstrap
icon-round.ico          app/shortcut icon (letter "Y" mark)
public/favicon.ico      browser favicon, identical to the app icon
installer/setup.iss     Inno Setup script
README.md / LICENSE / THIRD_PARTY_NOTICES.md
```

### Notes

`yt-dlp.exe` and the compiled installer are intentionally excluded from git (`.gitignore`); `setup.bat` recreates the tool on a fresh clone. FFmpeg is detected from `PATH`, winget install locations, or the `bin/` folder.

### Disclaimer

This app is only for downloading content you own or have permission to download. Comply with the source platform's Terms of Service and applicable copyright laws. The author is not responsible for misuse or violations by users. Third-party license details are in `THIRD_PARTY_NOTICES.md`.
