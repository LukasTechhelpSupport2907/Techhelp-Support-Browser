const { app, BrowserWindow, ipcMain, Menu, shell, dialog, session } = require('electron')
const path = require('path')
const Store = require('electron-store')

// ── Persistenter Speicher für Einstellungen, Verlauf, Lesezeichen ──
const store = new Store({
  defaults: {
    windowBounds: { width: 1280, height: 800 },
    homepage: 'https://techhelp-support.de',
    bookmarks: [
      { title: 'TechHelp Support', url: 'https://techhelp-support.de', favicon: null },
      { title: 'TechHelp Bot',     url: 'https://bot.techhelp-support.de', favicon: null },
      { title: 'Discord',          url: 'https://discord.gg/Hfqc6JPTXU', favicon: null },
    ],
    history: [],
    downloads: [],
    theme: 'dark',
    searchEngine: 'google',
    adblockEnabled: true,
  }
})

let mainWindow = null

// ── Sicherheits-Header für alle Webseiten-Requests ──
app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Frame-Options': ['SAMEORIGIN'],
      }
    })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function createWindow() {
  const { width, height } = store.get('windowBounds')

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    frame: false,           // eigener custom titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#0e0e0e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,       // <webview> für Tab-Inhalte erlauben
      sandbox: false,
    },
    icon: path.join(__dirname, '..', '..', 'assets', 'icons', 'icon.png'),
    show: false,
  })

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))

  // Fenster anzeigen sobald bereit (verhindert weißes Flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Fenstergröße speichern
  mainWindow.on('resize', () => {
    const [w, h] = mainWindow.getSize()
    store.set('windowBounds', { width: w, height: h })
  })

  // Externe Links im System-Browser öffnen (aus dem UI selbst, nicht aus Tabs)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: Fenster-Steuerung (minimize, maximize, close) ──
ipcMain.handle('window-minimize', () => mainWindow?.minimize())
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.handle('window-close', () => mainWindow?.close())
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)

// ── IPC: Store (Einstellungen, Verlauf, Lesezeichen) ──
ipcMain.handle('store-get', (_e, key) => store.get(key))
ipcMain.handle('store-set', (_e, key, value) => store.set(key, value))

// ── IPC: Verlauf hinzufügen ──
ipcMain.handle('history-add', (_e, entry) => {
  const history = store.get('history')
  // Doppelten letzten Eintrag überspringen
  if (history.length > 0 && history[0].url === entry.url) return
  history.unshift({ ...entry, timestamp: Date.now() })
  // Max 1000 Einträge
  if (history.length > 1000) history.pop()
  store.set('history', history)
})

ipcMain.handle('history-get', () => store.get('history'))
ipcMain.handle('history-clear', () => store.set('history', []))

// ── IPC: Lesezeichen ──
ipcMain.handle('bookmarks-get', () => store.get('bookmarks'))
ipcMain.handle('bookmarks-add', (_e, bookmark) => {
  const bookmarks = store.get('bookmarks')
  if (!bookmarks.find(b => b.url === bookmark.url)) {
    bookmarks.push(bookmark)
    store.set('bookmarks', bookmarks)
  }
  return bookmarks
})
ipcMain.handle('bookmarks-remove', (_e, url) => {
  const bookmarks = store.get('bookmarks').filter(b => b.url !== url)
  store.set('bookmarks', bookmarks)
  return bookmarks
})

// ── IPC: Download-Dialog ──
ipcMain.handle('show-save-dialog', async (_e, opts) => {
  const result = await dialog.showSaveDialog(mainWindow, opts)
  return result
})

// ── IPC: App-Info ──
ipcMain.handle('app-version', () => app.getVersion())
ipcMain.handle('app-path', () => app.getAppPath())

// ── Downloads abfangen und im UI anzeigen ──
mainWindow?.webContents.session.on('will-download', (_event, item) => {
  item.on('updated', (_e, state) => {
    if (state === 'progressing') {
      mainWindow?.webContents.send('download-progress', {
        filename: item.getFilename(),
        received: item.getReceivedBytes(),
        total: item.getTotalBytes(),
        url: item.getURL(),
      })
    }
  })
  item.once('done', (_e, state) => {
    mainWindow?.webContents.send('download-done', {
      filename: item.getFilename(),
      state,
      path: item.getSavePath(),
    })
  })
})
