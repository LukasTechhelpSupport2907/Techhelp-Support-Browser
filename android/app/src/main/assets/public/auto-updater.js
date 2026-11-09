/**
 * TechHelp Browser - Automatisches Update-System
 * 
 * Features:
 * - Automatische Versions-Prüfung beim Start
 * - Update-Benachrichtigung
 * - Download & Installation (Desktop)
 * - APK-Download (Android)
 * - Release Notes anzeigen
 * - Update im Hintergrund
 */

'use strict'

// ═══════════════════════════════════════════════════════════
// AUTO-UPDATER
// ═══════════════════════════════════════════════════════════
class AutoUpdater {
  constructor() {
    this.currentVersion = '1.0.0' // Wird automatisch aus package.json geladen
    this.updateCheckUrl = 'https://api.github.com/repos/LukasTechhelpSupport2907/Techhelp-Support-Webseite-u.-Bot/releases/latest'
    this.updateAvailable = false
    this.latestRelease = null
    this.checkInterval = 3 * 60 * 60 * 1000 // 3 Stunden
    this.autoCheckEnabled = true
  }

  async initialize() {
    // Aktuelle Version aus package.json laden (wenn verfügbar)
    try {
      const response = await fetch('./package.json')
      if (response.ok) {
        const pkg = await response.json()
        this.currentVersion = pkg.version
      }
    } catch (error) {
      console.log('Version aus package.json nicht verfügbar, nutze Standard')
    }

    // Beim Start auf Updates prüfen
    await this.checkForUpdates()

    // Automatische Update-Prüfung alle 3 Stunden
    if (this.autoCheckEnabled) {
      setInterval(() => this.checkForUpdates(), this.checkInterval)
    }

    console.log('✅ Auto-Updater initialisiert - Version:', this.currentVersion)
  }

  async checkForUpdates(showNotification = false) {
    try {
      const response = await fetch(this.updateCheckUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        console.warn('Update-Check fehlgeschlagen:', response.status)
        return false
      }

      const release = await response.json()
      this.latestRelease = release

      const latestVersion = release.tag_name.replace('v', '')
      const isNewer = this.compareVersions(latestVersion, this.currentVersion) > 0

      if (isNewer) {
        this.updateAvailable = true
        console.log('🎉 Neue Version verfügbar:', latestVersion)
        
        if (showNotification) {
          this.showUpdateNotification(release)
        }

        // Event für UI
        window.dispatchEvent(new CustomEvent('update-available', {
          detail: { release }
        }))

        return true
      } else {
        this.updateAvailable = false
        console.log('✅ Browser ist aktuell')
        
        if (showNotification) {
          this.showNoUpdateNotification()
        }

        return false
      }
    } catch (error) {
      console.error('Update-Check Fehler:', error)
      return false
    }
  }

  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0

      if (p1 > p2) return 1
      if (p1 < p2) return -1
    }

    return 0
  }

  showUpdateNotification(release) {
    const notification = document.createElement('div')
    notification.className = 'update-notification show'
    notification.innerHTML = `
      <div class="update-content">
        <div class="update-icon">🎉</div>
        <div class="update-info">
          <div class="update-title">Update verfügbar!</div>
          <div class="update-version">Version ${release.tag_name}</div>
        </div>
      </div>
      <div class="update-actions">
        <button class="update-btn update-btn-primary" id="update-install-btn">
          Jetzt aktualisieren
        </button>
        <button class="update-btn update-btn-secondary" id="update-details-btn">
          Details
        </button>
        <button class="update-btn update-btn-close" id="update-close-btn">✕</button>
      </div>
    `

    document.body.appendChild(notification)

    // Event-Listener
    document.getElementById('update-install-btn')?.addEventListener('click', () => {
      this.startUpdate(release)
      notification.remove()
    })

    document.getElementById('update-details-btn')?.addEventListener('click', () => {
      this.showUpdateDetails(release)
      notification.remove()
    })

    document.getElementById('update-close-btn')?.addEventListener('click', () => {
      notification.remove()
    })

    // Auto-Hide nach 10 Sekunden (aber Button bleibt sichtbar)
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('show')
        notification.classList.add('minimized')
      }
    }, 10000)
  }

  showNoUpdateNotification() {
    const notification = document.createElement('div')
    notification.className = 'update-notification show'
    notification.innerHTML = `
      <div class="update-content">
        <div class="update-icon">✅</div>
        <div class="update-info">
          <div class="update-title">Browser ist aktuell</div>
          <div class="update-version">Version ${this.currentVersion}</div>
        </div>
      </div>
      <button class="update-btn update-btn-close" id="update-close-btn">✕</button>
    `

    document.body.appendChild(notification)

    document.getElementById('update-close-btn')?.addEventListener('click', () => {
      notification.remove()
    })

    setTimeout(() => notification.remove(), 3000)
  }

  showUpdateDetails(release) {
    const modal = document.createElement('div')
    modal.className = 'update-modal'
    modal.innerHTML = `
      <div class="update-modal-overlay"></div>
      <div class="update-modal-content">
        <div class="update-modal-header">
          <h2>🎉 Update ${release.tag_name}</h2>
          <button class="update-modal-close" id="modal-close-btn">✕</button>
        </div>
        <div class="update-modal-body">
          <div class="release-info">
            <div class="release-meta">
              <span class="release-date">📅 ${new Date(release.published_at).toLocaleDateString('de-DE')}</span>
              <span class="release-author">👤 ${release.author.login}</span>
            </div>
            <div class="release-notes">
              <h3>Was ist neu?</h3>
              ${this.formatReleaseNotes(release.body)}
            </div>
          </div>
          <div class="update-downloads">
            <h3>Downloads</h3>
            <div class="download-list">
              ${this.renderDownloadLinks(release.assets)}
            </div>
          </div>
        </div>
        <div class="update-modal-footer">
          <button class="update-btn update-btn-primary" id="modal-install-btn">
            Jetzt aktualisieren
          </button>
          <button class="update-btn update-btn-secondary" id="modal-cancel-btn">
            Später
          </button>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Event-Listener
    const closeModal = () => modal.remove()
    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal)
    document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal)
    document.querySelector('.update-modal-overlay')?.addEventListener('click', closeModal)

    document.getElementById('modal-install-btn')?.addEventListener('click', () => {
      this.startUpdate(release)
      closeModal()
    })
  }

  formatReleaseNotes(body) {
    if (!body) return '<p>Keine Release Notes verfügbar.</p>'

    // Markdown zu HTML (einfache Konvertierung)
    let html = body
      .replace(/^### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^# (.*$)/gim, '<h2>$1</h2>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')

    // Listen umbrechen
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')

    return `<div class="release-notes-content">${html}</div>`
  }

  renderDownloadLinks(assets) {
    if (!assets || assets.length === 0) {
      return '<p>Keine Downloads verfügbar.</p>'
    }

    const platformIcons = {
      '.exe': '🪟 Windows',
      '.dmg': '🍎 macOS',
      '.AppImage': '🐧 Linux (AppImage)',
      '.deb': '🐧 Linux (Deb)',
      '.apk': '📱 Android'
    }

    return assets.map(asset => {
      const ext = asset.name.substring(asset.name.lastIndexOf('.'))
      const icon = platformIcons[ext] || '📦'
      const size = (asset.size / 1024 / 1024).toFixed(1) + ' MB'

      return `
        <a href="${asset.browser_download_url}" class="download-item" download>
          <div class="download-icon">${icon}</div>
          <div class="download-info">
            <div class="download-name">${asset.name}</div>
            <div class="download-meta">${size} • ${asset.download_count} Downloads</div>
          </div>
          <div class="download-action">⬇</div>
        </a>
      `
    }).join('')
  }

  async startUpdate(release) {
    // Platform erkennen
    const platform = this.detectPlatform()
    const asset = this.findAssetForPlatform(release.assets, platform)

    if (!asset) {
      alert('Keine passende Download-Datei für deine Plattform gefunden.')
      return
    }

    // Download starten
    this.showDownloadProgress(asset)
    this.downloadUpdate(asset.browser_download_url, asset.name)
  }

  detectPlatform() {
    const ua = navigator.userAgent.toLowerCase()
    
    if (window.Capacitor) {
      // Mobile App (Android/iOS)
      if (window.Capacitor.getPlatform() === 'android') return 'android'
      if (window.Capacitor.getPlatform() === 'ios') return 'ios'
    }

    // Desktop
    if (ua.includes('win')) return 'windows'
    if (ua.includes('mac')) return 'macos'
    if (ua.includes('linux')) return 'linux'

    return 'unknown'
  }

  findAssetForPlatform(assets, platform) {
    const patterns = {
      windows: /\.exe$/i,
      macos: /\.dmg$/i,
      linux: /\.AppImage$/i,
      android: /\.apk$/i
    }

    const pattern = patterns[platform]
    if (!pattern) return null

    return assets.find(asset => pattern.test(asset.name))
  }

  showDownloadProgress(asset) {
    const progress = document.createElement('div')
    progress.className = 'update-download-progress show'
    progress.innerHTML = `
      <div class="download-progress-content">
        <div class="download-progress-icon">⬇</div>
        <div class="download-progress-info">
          <div class="download-progress-title">Update wird heruntergeladen...</div>
          <div class="download-progress-filename">${asset.name}</div>
        </div>
      </div>
      <div class="download-progress-bar">
        <div class="download-progress-bar-fill" id="progress-bar-fill"></div>
      </div>
      <div class="download-progress-status" id="progress-status">0%</div>
    `

    document.body.appendChild(progress)
  }

  async downloadUpdate(url, filename) {
    try {
      // Für Desktop (Electron): Native Download
      if (window.electron) {
        window.electron.downloadUpdate(url, filename)
        return
      }

      // Für Web/Android: Browser-Download
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()

      // Benachrichtigung
      setTimeout(() => {
        const notification = document.createElement('div')
        notification.className = 'update-notification show'
        notification.innerHTML = `
          <div class="update-content">
            <div class="update-icon">✅</div>
            <div class="update-info">
              <div class="update-title">Download abgeschlossen!</div>
              <div class="update-version">Bitte installiere ${filename}</div>
            </div>
          </div>
          <button class="update-btn update-btn-close" onclick="this.parentElement.remove()">✕</button>
        `
        document.body.appendChild(notification)

        setTimeout(() => notification.remove(), 8000)
      }, 1000)

    } catch (error) {
      console.error('Download-Fehler:', error)
      alert('Download fehlgeschlagen. Bitte lade das Update manuell von GitHub herunter.')
    }
  }

  // Public API
  async checkNow() {
    return await this.checkForUpdates(true)
  }

  getUpdateInfo() {
    return {
      currentVersion: this.currentVersion,
      updateAvailable: this.updateAvailable,
      latestRelease: this.latestRelease
    }
  }

  enableAutoCheck() {
    this.autoCheckEnabled = true
  }

  disableAutoCheck() {
    this.autoCheckEnabled = false
  }
}

// ═══════════════════════════════════════════════════════════
// UPDATE-BADGE (in Menü anzeigen)
// ═══════════════════════════════════════════════════════════
class UpdateBadge {
  constructor(autoUpdater) {
    this.autoUpdater = autoUpdater
    this.badge = null
  }

  show() {
    if (this.badge) return

    this.badge = document.createElement('div')
    this.badge.className = 'update-badge'
    this.badge.innerHTML = '🎉 Update'
    this.badge.title = 'Neue Version verfügbar!'

    this.badge.addEventListener('click', () => {
      if (this.autoUpdater.latestRelease) {
        this.autoUpdater.showUpdateDetails(this.autoUpdater.latestRelease)
      }
    })

    // Badge zum Menü-Button hinzufügen
    const menuBtn = document.getElementById('btn-menu')
    if (menuBtn) {
      menuBtn.style.position = 'relative'
      menuBtn.appendChild(this.badge)
    }
  }

  hide() {
    if (this.badge) {
      this.badge.remove()
      this.badge = null
    }
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════
window.TechHelpAutoUpdater = new AutoUpdater()
window.TechHelpUpdateBadge = new UpdateBadge(window.TechHelpAutoUpdater)

// Event-Listener für Update-Events
window.addEventListener('update-available', (event) => {
  window.TechHelpUpdateBadge.show()
  console.log('📦 Update verfügbar:', event.detail.release.tag_name)
})

// Auto-Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.TechHelpAutoUpdater.initialize()
})

console.log('✅ Auto-Updater System geladen')
