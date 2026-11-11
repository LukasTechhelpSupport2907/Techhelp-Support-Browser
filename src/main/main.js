/**
 * TechHelp Support Browser - Electron Main Process
 * Copyright © 2026 TechHelp Support. All Rights Reserved.
 * 
 * PROPRIETARY SOFTWARE - Do not copy, modify, or distribute without permission.
 * See LICENSE file for full terms.
 */

const { app, BrowserWindow, ipcMain, Menu, shell, dialog, session, nativeImage } = require('electron')
const path = require('path')
const Store = require('electron-store')
const ElectronAutoUpdater = require('./auto-updater')

// ── App-Name komplett auf Techhelp Support Browser setzen ──
app.setName('Techhelp Support Browser')

// ── Electron aus dem User-Agent entfernen ──
app.userAgentFallback = app.userAgentFallback
  .replace(/Electron\/[\d.]+\s*/g, '')
  .replace(/Chrome\/[\d.]+\s*/g, 'Chrome/120.0.0.0 ')

// ── Persistenter Speicher ──
const store = new Store({
  defaults: {
    windowBounds:   { width: 1280, height: 800 },
    homepage:       'https://techhelp-support.de',
    bookmarks: [
      { title: 'Techhelp Support', url: 'https://techhelp-support.de',     favicon: null },
      { title: 'Techhelp Bot',     url: 'https://bot.techhelp-support.de', favicon: null },
      { title: 'Discord',          url: 'https://discord.gg/kDAPDXdC7q',   favicon: null },
    ],
    history:        [],
    downloads:      [],
    theme:          'dark',
    searchEngine:   'google',
    adblockEnabled: true,
  }
})

let mainWindow = null

app.whenReady().then(() => {
  // ── Sicherheits-Header + User-Agent-Patch für alle Requests ──
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Frame-Options': ['SAMEORIGIN'],
      }
    })
  })

  // User-Agent bei ausgehenden Requests bereinigen
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const ua = (details.requestHeaders['User-Agent'] || '')
      .replace(/Electron\/[\d.]+\s*/g, '')
    details.requestHeaders['User-Agent'] = ua
    callback({ requestHeaders: details.requestHeaders })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function createWindow() {
  const { width, height } = store.get('windowBounds')
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icons', 'icon.png')

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth:  800,
    minHeight: 600,
    frame:     false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0808',
    title: 'Techhelp Support Browser',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      webviewTag:       true,
      sandbox:          false,
    },
    icon: iconPath,
    show: false,
  })

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))

  // ── Auto-Updater initialisieren ──
  const autoUpdater = new ElectronAutoUpdater(mainWindow)
  
  // Bei App-Start nach Updates suchen (nach 3 Sekunden Verzögerung)
  setTimeout(() => {
    autoUpdater.checkForUpdates()
  }, 3000)

  // IPC für manuellen Update-Check
  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdates()
  })

  ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })

  // Fenster-Titel immer auf Techhelp halten
  mainWindow.on('page-title-updated', (e) => e.preventDefault())

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    // Electron-Menüleiste komplett entfernen
    Menu.setApplicationMenu(null)
  })

  mainWindow.on('resize', () => {
    const [w, h] = mainWindow.getSize()
    store.set('windowBounds', { width: w, height: h })
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.on('closed', () => { mainWindow = null })

  // ── Downloads ──
  mainWindow.webContents.session.on('will-download', (_event, item) => {
    item.on('updated', (_e, state) => {
      if (state === 'progressing') {
        mainWindow?.webContents.send('download-progress', {
          filename: item.getFilename(),
          received: item.getReceivedBytes(),
          total:    item.getTotalBytes(),
          url:      item.getURL(),
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
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: Fenster ──
ipcMain.handle('window-minimize',    () => mainWindow?.minimize())
ipcMain.handle('window-maximize',    () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.handle('window-close',       () => mainWindow?.close())
ipcMain.handle('window-is-maximized',() => mainWindow?.isMaximized() ?? false)

// ── IPC: Store ──
ipcMain.handle('store-get', (_e, key)        => store.get(key))
ipcMain.handle('store-set', (_e, key, value) => store.set(key, value))

// ── IPC: Verlauf ──
ipcMain.handle('history-add', (_e, entry) => {
  const history = store.get('history')
  if (history.length > 0 && history[0].url === entry.url) return
  history.unshift({ ...entry, timestamp: Date.now() })
  if (history.length > 1000) history.pop()
  store.set('history', history)
})
ipcMain.handle('history-get',   () => store.get('history'))
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

// ── IPC: Dialoge & App-Info ──
ipcMain.handle('show-save-dialog', async (_e, opts) => dialog.showSaveDialog(mainWindow, opts))
ipcMain.handle('app-version', () => app.getVersion())
ipcMain.handle('app-path',    () => app.getAppPath())
