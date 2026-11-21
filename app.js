'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, exec, execSync } = require('child_process');

const ROOT = __dirname;
const BIN = path.join(ROOT, 'bin');
const YTDLP = path.join(BIN, 'yt-dlp.exe');
const PUBLIC = path.join(ROOT, 'public');
const BASE_PORT = 7777;

const QUALITY_FORMATS = {
  '1080': 'bv*[height<=1080][vcodec^=avc1]+ba[acodec^=mp4a]/bv*[height<=1080]+ba/b[height<=1080]',
  '720': 'bv*[height<=720][vcodec^=avc1]+ba[acodec^=mp4a]/bv*[height<=720]+ba/b[height<=720]',
  '480': 'bv*[height<=480][vcodec^=avc1]+ba[acodec^=mp4a]/bv*[height<=480]+ba/b[height<=480]',
  '360': 'bv*[height<=360][vcodec^=avc1]+ba[acodec^=mp4a]/bv*[height<=360]+ba/b[height<=360]',
  'best': 'bv*[vcodec^=avc1]+ba[acodec^=mp4a]/bv*+ba/b',
};

let ffmpegPath = null;
let ffprobePath = null;
let ytdlpVersion = null;

let job = {
  state: 'idle',
  phase: '',
  percent: 0,
  speed: null,
  eta: null,
  log: [],
  file: '',
  error: '',
  startedAt: 0,
  aborted: false,
};

let child = null;
let ffmpegChild = null;

function log(msg) {
  const t = new Date().toLocaleTimeString('id-ID', { hour12: false });
  job.log.push('[' + t + '] ' + msg);
  if (job.log.length > 500) job.log.shift();
}

function detectTools() {
  ffmpegPath = null;
  ffprobePath = null;
  const candidates = [path.join(BIN, 'ffmpeg.exe')];
  try {
    const out = execSync('where ffmpeg 2>nul', { windowsHide: true }).toString().trim().split(/\r?\n/);
    for (const c of out) if (c) candidates.push(c);
  } catch (e) {}
  const winget = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
  try {
    for (const d of fs.readdirSync(winget)) {
      if (/^Gyan\.FFmpeg/i.test(d)) {
        for (const sub of fs.readdirSync(path.join(winget, d))) {
          candidates.push(path.join(winget, d, sub, 'bin', 'ffmpeg.exe'));
        }
      }
    }
  } catch (e) {}
  for (const c of candidates) {
    try { if (fs.existsSync(c)) { ffmpegPath = c; break; } } catch (e) {}
  }
  if (ffmpegPath) {
    const p = path.join(path.dirname(ffmpegPath), 'ffprobe.exe');
    if (fs.existsSync(p)) ffprobePath = p;
  }
  ytdlpVersion = null;
  try {
    if (fs.existsSync(YTDLP)) {
      ytdlpVersion = execSync('"' + YTDLP + '" --version', { windowsHide: true }).toString().trim();
    }
  } catch (e) {}
}

function defaultFolder() {
  return path.join(os.homedir(), 'Downloads');
}

function probeValue(file, args) {
  if (!ffprobePath) return null;
  try {
    const out = execSync('"' + ffprobePath + '" -v error ' + args.join(' ') + ' "' + file + '"', {
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    }).toString().trim();
    return out || null;
  } catch (e) {
    return null;
  }
}

function pickOutputFile(candidates) {
  for (let i = candidates.length - 1; i >= 0; i--) {
    try {
      if (fs.existsSync(candidates[i])) return candidates[i];
    } catch (e) {}
  }
  return null;
}

function runFfmpeg(args, duration, label) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error('ffmpeg tidak ditemukan'));
    log(label);
    ffmpegChild = spawn(ffmpegPath, args, { windowsHide: true });
    let buf = '';
    ffmpegChild.stdout.on('data', (d) => {
      buf += d.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      for (const line of lines) {
        const m = line.match(/^out_time=(\d+):(\d+):([\d.]+)/);
        if (m) {
          if (duration > 0) {
            const t = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
            const p = 90 + Math.max(0, Math.min(1, t / duration)) * 9;
            job.percent = Math.max(job.percent, Math.round(p * 10) / 10);
          } else {
            job.percent = Math.max(job.percent, Math.min(99, Math.round((job.percent + 0.6) * 10) / 10));
          }
        }
      }
    });
    let errBuf = '';
    ffmpegChild.stderr.on('data', (d) => { errBuf += d.toString(); });
    ffmpegChild.on('error', (e) => { ffmpegChild = null; reject(e); });
    ffmpegChild.on('close', (code) => {
      ffmpegChild = null;
      if (job.aborted) return reject(new Error('Dibatalkan'));
      if (code === 0) return resolve();
      const tail = errBuf.split(/\r?\n/).filter((l) => l.includes('Error') || l.includes('error') || l.includes('Invalid')).slice(-3).join(' | ');
      reject(new Error('ffmpeg exit ' + code + (tail ? ' — ' + tail : '')));
    });
  });
}

async function finalize(candidates) {
  job.phase = 'Memeriksa file hasil download';
  job.percent = Math.max(job.percent, 90);
  job.speed = null;
  job.eta = null;

  let src = pickOutputFile(candidates);
  if (!src) {
    const folder = job.folder;
    try {
      const now = Date.now();
      let best = null;
      for (const f of fs.readdirSync(folder)) {
        if (!f.toLowerCase().endsWith('.mp4')) continue;
        const full = path.join(folder, f);
        const st = fs.statSync(full);
        if (st.mtimeMs >= job.startedAt - 60000 && (!best || st.mtimeMs > best.mtimeMs)) best = { full, mtimeMs: st.mtimeMs };
      }
      if (best) src = best.full;
    } catch (e) {}
  }

  if (!src) {
    job.state = 'error';
    job.error = 'File hasil download tidak ditemukan';
    log('Gagal: file hasil download tidak ditemukan.');
    return;
  }

  log('File: ' + src);

  const videoCodec = probeValue(src, ['-select_streams', 'v:0', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0']);
  const audioCodec = probeValue(src, ['-select_streams', 'a:0', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0']);
  const duration = parseFloat(probeValue(src, ['-show_entries', 'format=duration', '-of', 'csv=p=0']) || '0');

  log('Codec terdeteksi: video=' + (videoCodec || '?') + ', audio=' + (audioCodec || '?'));

  const tvSafe = videoCodec === 'h264' && audioCodec === 'aac';
  const dir = path.dirname(src);
  const base = path.basename(src, path.extname(src));
  const tmp = path.join(dir, base + '.tvfix.tmp.mp4');

  try {
    if (tvSafe) {
      job.phase = 'Merapikan MP4 untuk TV';
      log('Codec sudah sesuai TV — merapikan struktur file tanpa re-encode...');
      await runFfmpeg(
        ['-y', '-i', src, '-c', 'copy', '-movflags', '+faststart', '-progress', 'pipe:1', '-nostats', tmp],
        duration,
        'Membuat MP4 progressive + faststart...'
      );
    } else {
      job.phase = 'Transcoding ke H.264 + AAC untuk TV';
      log('Codec tidak aman untuk TV — dikonversi ke H.264 + AAC, tunggu sebentar...');
      await runFfmpeg(
        ['-y', '-i', src, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p',
          '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-progress', 'pipe:1', '-nostats', tmp],
        duration,
        'Transcoding berjalan...'
      );
    }

    fs.rmSync(src, { force: true });
    fs.renameSync(tmp, src);

    job.file = src;
    job.percent = 100;
    job.phase = 'Selesai';
    job.state = 'done';
    log('Selesai! File siap diputar di TV.');
  } catch (e) {
    try { if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true }); } catch (_) {}
    job.state = 'error';
    job.error = e.message;
    log('Gagal memproses file: ' + e.message);
  }
}

function handleYtdlpLine(line) {
  if (!line || !line.trim()) return;
  if (line.length > 600) line = line.slice(0, 600) + '...';

  let m = line.match(/\[download\]\s+Destination:\s*(.+)/i);
  if (m) {
    job.candidates.push(m[1].trim());
    job.destCount++;
    job.phase = job.destCount >= 2 ? 'Mengunduh audio' : 'Mengunduh video';
    job.speed = null;
    job.eta = null;
    log(line.trim());
    return;
  }

  m = line.match(/Merging formats into "(.+)"/i);
  if (m) {
    job.candidates.push(m[1].trim());
    job.phase = 'Menggabungkan stream';
    job.percent = Math.max(job.percent, 87);
    job.speed = null;
    job.eta = null;
    log(line.trim());
    return;
  }

  m = line.match(/\[download\]\s+([\d.]+)%/);
  if (m) {
    const p = parseFloat(m[1]);
    const base = job.destCount >= 2 ? 60 : 2;
    const span = job.destCount >= 2 ? 25 : 58;
    job.percent = Math.max(job.percent, Math.round((base + (p / 100) * span) * 10) / 10);
    const me = line.match(/at\s+(\S+)\s+ETA\s+(\S+)/);
    if (me && p < 100 && me[2] !== 'Unknown' && me[2] !== '--:--') {
      job.speed = me[1];
      job.eta = me[2];
    }
    return;
  }

  if (line.includes('ERROR:') || line.includes('WARNING:')) {
    log(line.trim());
    return;
  }

  if (line.startsWith('[')) log(line.trim());
}

function killTree(pid) {
  if (!pid) return;
  try {
    exec('taskkill /pid ' + pid + ' /T /F', { windowsHide: true }, () => {});
  } catch (e) {}
}

function startDownload(body) {
  if (job.state === 'running') return { error: 'Masih ada proses download yang berjalan' };

  const url = (body.url || '').trim();
  const quality = QUALITY_FORMATS[body.quality] ? body.quality : '720';
  const folder = (body.folder || '').trim() || defaultFolder();

  let parsed;
  try { parsed = new URL(url); } catch (e) { return { error: 'URL tidak valid' }; }
  const host = parsed.hostname.replace(/^www\./, '');
  if (!(host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com'))) {
    return { error: 'Bukan URL YouTube' };
  }

  if (!path.isAbsolute(folder)) return { error: 'Folder tujuan harus path absolut' };
  try { fs.mkdirSync(folder, { recursive: true }); } catch (e) { return { error: 'Folder tidak bisa dibuat: ' + e.message } };

  detectTools();
  if (!fs.existsSync(YTDLP)) return { error: 'yt-dlp.exe tidak ada di folder bin' };
  if (!ffmpegPath) return { error: 'ffmpeg tidak ditemukan. Klik "Install ffmpeg" dulu.' };

  job = {
    state: 'running',
    phase: 'Menyiapkan download',
    percent: 0,
    speed: null,
    eta: null,
    log: [],
    file: '',
    error: '',
    startedAt: Date.now(),
    aborted: false,
    folder,
    candidates: [],
    destCount: 0,
  };

  const args = [
    '--newline',
    '--no-playlist',
    '--ignore-config',
    '--js-runtimes', 'node',
    '--merge-output-format', 'mp4',
    '--ffmpeg-location', path.dirname(ffmpegPath),
    '-f', QUALITY_FORMATS[quality],
    '-o', path.join(folder, '%(title)s [%(id)s].%(ext)s'),
    url,
  ];

  log('Kualitas: ' + quality + (quality === 'best' ? '' : 'p') + ' | Folder: ' + folder);

  child = spawn(YTDLP, args, { windowsHide: true });

  let bufOut = '';
  child.stdout.on('data', (d) => {
    bufOut += d.toString();
    const lines = bufOut.split(/\r?\n/);
    bufOut = lines.pop();
    lines.forEach(handleYtdlpLine);
  });
  let bufErr = '';
  child.stderr.on('data', (d) => {
    bufErr += d.toString();
    const lines = bufErr.split(/\r?\n/);
    bufErr = lines.pop();
    lines.forEach(handleYtdlpLine);
  });

  child.on('error', (e) => {
    child = null;
    job.state = 'error';
    job.error = 'Gagal menjalankan yt-dlp: ' + e.message;
    log(job.error);
  });

  child.on('close', (code) => {
    child = null;
    if (job.aborted) {
      job.state = 'error';
      job.error = 'Dibatalkan';
      log('Download dibatalkan.');
      return;
    }
    if (code !== 0) {
      job.state = 'error';
      job.error = 'yt-dlp exit code ' + code;
      log('Download gagal (exit ' + code + '). Cek URL dan koneksi internet.');
      return;
    }
    finalize(job.candidates);
  });

  return { ok: true };
}

function downloadFile(url, dest, redirectCount) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 10) return reject(new Error('Terlalu banyak redirect'));
    const mod = url.startsWith('https') ? require('https') : require('http');
    const req = mod.get(url, { headers: { 'User-Agent': 'yt-tv-dl' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(downloadFile(res.headers.location, dest, redirectCount + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => { out.close(() => resolve()); });
      out.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(new Error('Timeout')); });
  });
}

async function updateYtdlp() {
  if (job.state === 'running') return { error: 'Tunggu proses download selesai' };
  if (!fs.existsSync(YTDLP)) return { error: 'yt-dlp.exe tidak ada, muat ulang aplikasi' };
  const tmp = YTDLP + '.new';
  log('Mengupdate yt-dlp...');
  try {
    await downloadFile('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe', tmp, 0);
    fs.rmSync(YTDLP, { force: true });
    fs.renameSync(tmp, YTDLP);
    detectTools();
    log('yt-dlp terupdate ke versi ' + ytdlpVersion);
    return { ok: true, version: ytdlpVersion };
  } catch (e) {
    try { if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true }); } catch (_) {}
    return { error: 'Update gagal: ' + e.message };
  }
}

function openExplorer(target) {
  if (!target || !fs.existsSync(target)) return { error: 'File tidak ditemukan' };
  spawn('explorer.exe', ['/select,' + target], { detached: true, windowsHide: true }).unref();
  return { ok: true };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const full = path.normalize(path.join(PUBLIC, rel));
  if (!full.startsWith(PUBLIC)) { res.writeHead(403); res.end(); return; }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 16384) { req.destroy(); resolve(null); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve(null); } });
  });
}

function apiStatus() {
  return {
    state: job.state,
    phase: job.phase,
    percent: Math.round(job.percent * 10) / 10,
    speed: job.speed || null,
    eta: job.eta || null,
    log: job.log,
    file: job.file,
    error: job.error,
    startedAt: job.startedAt,
  };
}

const server = http.createServer(async (req, res) => {
  const send = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
  };

  try {
    if (req.method === 'GET' && (req.url === '/' || !req.url.startsWith('/api/'))) return serveStatic(req, res);

    if (req.method === 'GET' && req.url === '/api/status') return send(200, apiStatus());

    if (req.method === 'GET' && req.url === '/api/tools') {
      detectTools();
      return send(200, {
        ytdlp: ytdlpVersion,
        ffmpeg: ffmpegPath,
        ffprobe: !!ffprobePath,
        defaultFolder: defaultFolder(),
      });
    }

    if (req.method === 'POST' && req.url === '/api/download') {
      const body = await readBody(req);
      if (!body) return send(400, { error: 'Body tidak valid' });
      const r = startDownload(body);
      return send(r.error ? 400 : 200, r);
    }

    if (req.method === 'POST' && req.url === '/api/abort') {
      if (job.state !== 'running') return send(400, { error: 'Tidak ada proses yang berjalan' });
      job.aborted = true;
      if (child) killTree(child.pid);
      if (ffmpegChild) killTree(ffmpegChild.pid);
      return send(200, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/api/update') {
      const r = await updateYtdlp();
      return send(r.error ? 400 : 200, r);
    }

    if (req.method === 'POST' && req.url === '/api/open') {
      const body = await readBody(req);
      if (!body) return send(400, { error: 'Body tidak valid' });
      const r = openExplorer(body.path);
      return send(r.error ? 400 : 200, r);
    }

    send(404, { error: 'Not found' });
  } catch (e) {
    send(500, { error: e.message });
  }
});

function openBrowser(port) {
  exec('start "" "http://127.0.0.1:' + port + '"', { windowsHide: true }, () => {});
}

function probeExisting(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/api/tools', timeout: 800 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  const exists = await probeExisting(BASE_PORT);
  if (exists) {
    console.log('Aplikasi sudah berjalan di port ' + BASE_PORT + ', membuka browser...');
    openBrowser(BASE_PORT);
    return;
  }

  detectTools();

  let port = BASE_PORT;
  for (; port < BASE_PORT + 10; port++) {
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
      });
      break;
    } catch (e) {
      if (e.code !== 'EADDRINUSE') throw e;
    }
  }

  console.log('TV YouTube Downloader berjalan di http://127.0.0.1:' + port);
  console.log('yt-dlp: ' + (ytdlpVersion || 'TIDAK ADA') + ' | ffmpeg: ' + (ffmpegPath || 'TIDAK ADA'));
  openBrowser(port);
}

process.on('SIGINT', () => {
  if (child) killTree(child.pid);
  if (ffmpegChild) killTree(ffmpegChild.pid);
  process.exit(0);
});

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
