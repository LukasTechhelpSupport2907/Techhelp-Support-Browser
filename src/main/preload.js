const { contextBridge, ipcRenderer } = require('electron')

// ── Sichere API-Brücke zwischen Main-Process und Renderer ──
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

  // Events vom Main-Process empfangen
  on: (channel, callback) => {
    const allowed = ['download-progress', 'download-done']
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_e, ...args) => callback(...args))
    }
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback)
  },
})
