// Safe bridge between the app page and the desktop shell.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ohDesktop', {
  hasKey: () => ipcRenderer.invoke('key:has'),
  setKey: (key) => ipcRenderer.invoke('key:set', String(key || '')),
  ask: (payload) => ipcRenderer.invoke('ai:ask', payload),
  version: () => ipcRenderer.invoke('app:version'),
  update: {
    last: () => ipcRenderer.invoke('update:last'),
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onStatus: (cb) => ipcRenderer.on('update:status', (_e, s) => cb(s)),
  },
  saveFile: (name, data) => ipcRenderer.invoke('file:save', { name: String(name), data: String(data) }),
});
