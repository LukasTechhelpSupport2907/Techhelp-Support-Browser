/**
 * Electron Auto-Updater Integration
 * Für native Desktop-Updates (Windows, macOS, Linux)
 */

const { autoUpdater } = require('electron-updater')
const { dialog } = require('electron')
const log = require('electron-log')

// Logging konfigurieren
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'

// Update-Server konfigurieren
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'LukasTechhelpSupport2907',
  repo: 'Techhelp-Support-Webseite-u.-Bot',
  private: false
})

// Auto-Download aktivieren
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

class ElectronAutoUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow
    this.setupListeners()
  }

  setupListeners() {
    // Update verfügbar
    autoUpdater.on('update-available', (info) => {
      log.info('Update verfügbar:', info.version)
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-available', {
          tag_name: `v${info.version}`,
          name: `Version ${info.version}`,
          body: info.releaseNotes || 'Neue Version verfügbar',
          published_at: info.releaseDate,
          assets: []
        })
      }

      // Dialog anzeigen
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update verfügbar',
        message: `Version ${info.version} ist verfügbar!`,
        detail: 'Möchtest du das Update jetzt herunterladen?',
        buttons: ['Ja', 'Später'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
    })

    // Kein Update verfügbar
    autoUpdater.on('update-not-available', (info) => {
      log.info('Kein Update verfügbar')
    })

    // Download-Fortschritt
    autoUpdater.on('download-progress', (progress) => {
      log.info(`Download-Fortschritt: ${progress.percent}%`)
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-download-progress', {
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
          bytesPerSecond: progress.bytesPerSecond
        })
      }
    })

    // Download abgeschlossen
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update heruntergeladen:', info.version)
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-downloaded', info)
      }

      // Dialog anzeigen
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update bereit',
        message: 'Update wurde heruntergeladen!',
        detail: 'Die Anwendung wird neu gestartet, um das Update zu installieren.',
        buttons: ['Jetzt neu starten', 'Später'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall(false, true)
        }
      })
    })

    // Fehler
    autoUpdater.on('error', (error) => {
      log.error('Auto-Updater Fehler:', error)
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-error', {
          message: error.message
        })
      }
    })
  }

  // Manuell nach Updates suchen
  checkForUpdates() {
    log.info('Suche nach Updates...')
    autoUpdater.checkForUpdates()
  }

  // Update herunterladen
  downloadUpdate() {
    log.info('Lade Update herunter...')
    autoUpdater.downloadUpdate()
  }

  // App neu starten und Update installieren
  quitAndInstall() {
    log.info('Installiere Update und starte neu...')
    autoUpdater.quitAndInstall(false, true)
  }
}

module.exports = ElectronAutoUpdater
