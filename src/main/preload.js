const { contextBridge, ipcRenderer } = require('electron')

// ── Sichere API-Brücke zwischen Main-Process und Renderer ──
contextBridge.exposeInMainWorld('electron', {
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate:  () => ipcRenderer.send('download-update'),
  restartApp:      () => ipcRenderer.send('quit-and-install'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (_e, info) => callback(info))
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (_e, info) => callback(info))
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (_e, progress) => callback(progress))
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (_e, error) => callback(error))
  }
})

contextBridge.exposeInMainWorld('thBrowser', {
  // Fenster
  minimize:      () => ipcRenderer.invoke('window-minimize'),
  maximize:      () => ipcRenderer.invoke('window-maximize'),
  close:         () => ipcRenderer.invoke('window-close'),
  isMaximized:   () => ipcRenderer.invoke('window-is-maximized'),

  // Store
  storeGet:      (key)        => ipcRenderer.invoke('store-get', key),
  storeSet:      (key, value) => ipcRenderer.invoke('store-set', key, value),

  // Verlauf
  historyAdd:    (entry)  => ipcRenderer.invoke('history-add', entry),
  historyGet:    ()       => ipcRenderer.invoke('history-get'),
  historyClear:  ()       => ipcRenderer.invoke('history-clear'),

  // Lesezeichen
  bookmarksGet:    ()         => ipcRenderer.invoke('bookmarks-get'),
  bookmarksAdd:    (bookmark) => ipcRenderer.invoke('bookmarks-add', bookmark),
  bookmarksRemove: (url)      => ipcRenderer.invoke('bookmarks-remove', url),

  // Dialoge
  showSaveDialog: (opts) => ipcRenderer.invoke('show-save-dialog', opts),

  // App-Info
  appVersion: () => ipcRenderer.invoke('app-version'),

  // Auto-Updater
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate:  () => ipcRenderer.send('download-update'),
  restartApp:      () => ipcRenderer.send('quit-and-install'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (_e, info) => callback(info))
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (_e, info) => callback(info))
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (_e, progress) => callback(progress))
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (_e, error) => callback(error))
  },

  // Events vom Main-Process empfangen
  on: (channel, callback) => {
    const allowed = ['download-progress', 'download-done', 'update-available', 'update-downloaded', 'update-download-progress', 'update-error']
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_e, ...args) => callback(...args))
    }
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback)
  },
})
