// The Owners Hub — desktop app (Electron main process)
const { app, BrowserWindow, ipcMain, shell, dialog, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
let autoUpdater = null;
try { ({ autoUpdater } = require('electron-updater')); } catch { /* not installed in dev */ }

const MODEL = 'claude-sonnet-5-5';
const keyFile = () => path.join(app.getPath('userData'), 'anthropic-key.bin');

function readKey() {
  try {
    const buf = fs.readFileSync(keyFile());
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : buf.toString('utf8');
  } catch { return ''; }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 520, height: 920, minWidth: 400, minHeight: 600,
    title: 'The Owners Hub',
    backgroundColor: '#0A0B0D',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  // Links (calendar, manufacturer pages, API console) open in the normal browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); if (/^https:\/\//.test(url)) shell.openExternal(url); }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

ipcMain.handle('key:has', () => !!readKey());
ipcMain.handle('key:set', (_e, key) => {
  try {
    if (!key) { fs.rmSync(keyFile(), { force: true }); return { ok: true }; }
    const data = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(key) : Buffer.from(key, 'utf8');
    fs.mkdirSync(path.dirname(keyFile()), { recursive: true });
    fs.writeFileSync(keyFile(), data);
    return { ok: true };
  } catch { return { ok: false }; }
});

ipcMain.handle('ai:ask', async (_e, { content }) => {
  const key = readKey();
  if (!key) return { error: 'not_granted', message: 'No API key' };
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 16000, messages: [{ role: 'user', content }] }),
    });
    if (!res.ok) {
      const code = res.status === 401 || res.status === 403 ? 'not_granted'
        : res.status === 429 || res.status === 529 ? 'rate_limited'
        : res.status === 400 ? 'image_rejected' : 'upstream_error';
      return { error: code, message: 'HTTP ' + res.status };
    }
    const j = await res.json();
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    if (!text.trim()) return { error: 'empty_completion' };
    return { text, truncated: j.stop_reason === 'max_tokens' };
  } catch (err) {
    return { error: 'upstream_error', message: String(err && err.message || err) };
  }
});

ipcMain.handle('file:save', async (e, { name, data }) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showSaveDialog(win, {
    defaultPath: path.join(app.getPath('documents'), name),
    filters: [{ name: 'Owners Hub backup', extensions: ['json'] }],
  });
  if (r.canceled || !r.filePath) return { saved: false };
  fs.writeFileSync(r.filePath, data, 'utf8');
  return { saved: true };
});

/* ---------- updates (GitHub Releases via electron-updater) ---------- */
let lastUpd = { state: 'idle' };
function sendUpd(s) { lastUpd = s; BrowserWindow.getAllWindows().forEach(w => w.webContents.send('update:status', s)); }
function notesText(n) {
  const raw = Array.isArray(n) ? n.map(x => x.note || '').join('\n') : String(n || '');
  return raw.replace(/<\/(p|li|h\d)>/gi, '\n').replace(/<li>/gi, '• ').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000);
}
// Only builds published from GitHub carry app-update.yml; local builds skip updates.
const canUpdate = () => !!autoUpdater && app.isPackaged && fs.existsSync(path.join(process.resourcesPath, 'app-update.yml'));
if (autoUpdater) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => sendUpd({ state: 'checking' }));
  autoUpdater.on('update-available', i => sendUpd({ state: 'available', version: i.version, notes: notesText(i.releaseNotes) }));
  autoUpdater.on('update-not-available', () => sendUpd({ state: 'none', checked: Date.now() }));
  autoUpdater.on('download-progress', p => sendUpd({ ...lastUpd, state: 'downloading', percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', i => sendUpd({ ...lastUpd, state: 'ready', version: i.version }));
  autoUpdater.on('error', e => sendUpd({ ...lastUpd, state: 'error', message: String((e && e.message) || e).slice(0, 200) }));
}
async function checkUpdates() {
  if (!canUpdate()) { sendUpd({ state: 'dev' }); return; }
  if (['downloading', 'ready'].includes(lastUpd.state)) return;
  try { await autoUpdater.checkForUpdates(); } catch (e) { sendUpd({ state: 'error', message: String((e && e.message) || e).slice(0, 200) }); }
}
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('update:last', () => lastUpd);
ipcMain.handle('update:check', async () => { await checkUpdates(); return lastUpd; });
ipcMain.handle('update:download', async () => {
  if (!canUpdate()) return lastUpd;
  sendUpd({ ...lastUpd, state: 'downloading', percent: 0 });
  try { await autoUpdater.downloadUpdate(); } catch (e) { sendUpd({ ...lastUpd, state: 'error', message: String((e && e.message) || e).slice(0, 200) }); }
  return lastUpd;
});
ipcMain.handle('update:install', () => { if (canUpdate() && lastUpd.state === 'ready') setImmediate(() => autoUpdater.quitAndInstall(false, true)); return true; });

app.setAppUserModelId('com.ownershub.app'); // needed for Windows notifications
app.whenReady().then(() => {
  createWindow();
  setTimeout(checkUpdates, 4000);
  setInterval(checkUpdates, 6 * 60 * 60 * 1000);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
