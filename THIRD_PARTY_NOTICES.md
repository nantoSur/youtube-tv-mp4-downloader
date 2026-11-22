# Third-Party Notices / Pemberitahuan Pihak Ketiga

Dokumen ini mencantumkan komponen pihak ketiga yang dipakai oleh **tvYD – TV YouTube Downloader** beserta lisensinya.

This document lists the third-party components used by **tvYD – TV YouTube Downloader** and their licenses.

---

## Kode aplikasi / Application code

Kode sumber tvYD sendiri dilisensikan di bawah **MIT License**. Lihat file `LICENSE`.

The tvYD source code itself is licensed under the **MIT License**. See the `LICENSE` file.

---

## yt-dlp

- **Lisensi / License:** [The Unlicense](https://unlicense.org/) (public domain)
- **Sumber / Source:** https://github.com/yt-dlp/yt-dlp
- **Teks lisensi / License text:** https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE
- **Pemakaian / Use:** diunduh sebagai `bin/yt-dlp.exe` oleh `setup.bat` dan disertakan dalam installer.

The Unlicense secara eksplisit mengizinkan penggunaan, modifikasi, dan distribusi untuk keperluan komersial maupun non-komersial. Atribusi tidak diwajibkan, tetapi dicantumkan di sini sebagai bentuk apresiasi.

The Unlicense explicitly permits use, modification and distribution for commercial and non-commercial purposes. Attribution is not required, but is included here out of appreciation.

---

## Node.js

- **Lisensi / License:** MIT
- **Sumber / Source:** https://nodejs.org/
- **Pemakaian / Use:** file `node.exe` disertakan dalam installer agar aplikasi bisa jalan tanpa Node.js terpasang di komputer pengguna.

---

## Inno Setup

- **Lisensi / License:** freeware; penggunaan komersial diperbolehkan tanpa biaya
- **Sumber / Source:** https://jrsoftware.org/isinfo.php
- **Pemakaian / Use:** compiler untuk membuat file installer `.exe`.

---

## FFmpeg / ffprobe

- **Tidak didistribusikan / Not distributed:** installer tvYD **tidak** menyertakan biner FFmpeg. Aplikasi hanya mendeteksi FFmpeg yang sudah ada di `PATH`, lokasi instalasi winget, atau folder `bin/`.
- **Build yang umum dipakai / Common build:** Gyan Doshi Windows builds — **GPLv3** (https://www.gyan.dev/ffmpeg/builds/).

Jika Anda nanti memutuskan untuk membundling FFmpeg ke dalam installer, perhatikan kewajiban lisensi GPLv3 (pencantuman lisensi, akses ke source code, dan kemungkinan kewajiban source untuk karya turunan). Cara paling aman adalah tetap mengandalkan FFmpeg yang dipasang pengguna sendiri.

If you later decide to bundle FFmpeg into the installer, GPLv3 obligations apply (license notices, source availability, and possible source obligations for derivative works). The safest option is to keep relying on a user-installed FFmpeg.

---

## Aset / Assets

`icon-round.ico` dan `public/favicon.ico` dibuat khusus untuk proyek ini (mark huruf "Y"). Tidak ada aset visual pihak ketiga yang disertakan.

`icon-round.ico` and `public/favicon.ico` were generated specifically for this project (a letter "Y" mark). No third-party artwork is included.

---

## Merek dagang / Trademarks

"YouTube" adalah merek dagang Google LLC. "Spotify" adalah merek dagang Spotify AB. Proyek ini **tidak berafiliasi**, tidak disponsori, dan tidak disetujui oleh keduanya. Penyebutan nama tersebut bersifat deskriptif untuk menjelaskan fungsi aplikasi.

"YouTube" is a trademark of Google LLC. "Spotify" is a trademark of Spotify AB. This project is **not affiliated with, sponsored by, or endorsed by** either company. Names are used descriptively to explain the app's function.

---

## Penafian / Disclaimer

Aplikasi ini ditujukan hanya untuk mengunduh konten yang Anda miliki atau memiliki izin untuk mengunduhnya. Pastikan Anda mematuhi Syarat Layanan platform sumber video serta peraturan hak cipta yang berlaku di wilayah Anda. Penulis tidak bertanggung jawab atas penyalahgunaan, pelanggaran hak cipta, atau kerugian yang timbul dari penggunaan aplikasi ini.

This app is intended only for downloading content that you own or have permission to download. Make sure you comply with the source platform's Terms of Service and applicable copyright laws in your jurisdiction. The author is not responsible for misuse, copyright infringement, or damages arising from the use of this app.
