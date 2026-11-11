# 🔄 TechHelp Browser - Automatisches Update-System

Ein vollständiges Auto-Update-System für Desktop (Windows/macOS/Linux) und Android.

## ✨ Features

### 🔍 Automatische Update-Erkennung
- **Beim Start**: Prüft automatisch nach Updates beim Browser-Start
- **Regelmäßig**: Alle 3 Stunden automatische Hintergrund-Prüfung
- **Manuell**: Über Menü → "Nach Updates suchen"
- **GitHub Releases**: Prüft gegen neueste GitHub-Releases

### 📦 Smart Download
- **Platform-Erkennung**: Erkennt automatisch Windows/macOS/Linux/Android
- **Passender Download**: Lädt automatisch die richtige Datei herunter
- **Progress-Anzeige**: Zeigt Download-Fortschritt an
- **Hintergrund-Download**: Download läuft im Hintergrund

### 🎉 Update-Benachrichtigungen
- **Popup-Notification**: Elegante Benachrichtigung bei neuer Version
- **Badge im Menü**: 🎉-Badge am Menü-Button bei verfügbarem Update
- **Release Notes**: Zeigt Changelog der neuen Version
- **Ein-Klick-Update**: "Jetzt aktualisieren" Button

### 💻 Plattform-Spezifisch

**Desktop (Electron):**
- Native Auto-Update mit `electron-updater`
- Automatischer Download
- Neustart zum Installieren
- Delta-Updates (nur Unterschiede laden)

**Android (Capacitor):**
- APK-Download über GitHub Releases
- Installation per APK-Installer
- Update-Benachrichtigung in der App

**Web/Progressive:**
- Service Worker Update
- App-Cache Refresh
- Reload-Prompt

## 🚀 Verwendung

### Für Benutzer

**Automatisch:**
1. Browser öffnen
2. Bei verfügbarem Update erscheint automatisch eine Benachrichtigung
3. Auf "Jetzt aktualisieren" klicken
4. Fertig!

**Manuell:**
1. Menü öffnen (☰)
2. Browser-Features → "Nach Updates suchen" (🔄)
3. Warten auf Ergebnis
4. Bei Update verfügbar: "Jetzt aktualisieren"

### Versions-Info anzeigen
- Menü → Browser-Features
- Aktuelle Version wird unten angezeigt
- Bei verfügbarem Update: Hinweis mit neuer Versionsnummer

## 🔧 Für Entwickler

### Installation

```bash
cd Browser
npm install electron-updater electron-log --save
```

### Konfiguration

#### 1. package.json erweitern

```json
{
  "version": "1.0.1",
  "build": {
    "appId": "de.techhelp-support.browser",
    "publish": {
      "provider": "github",
      "owner": "LukasTechhelpSupport2907",
      "repo": "Techhelp-Support-Webseite-u.-Bot"
    }
  }
}
```

#### 2. GitHub Release erstellen

```bash
# Version erhöhen
npm version patch  # oder minor/major

# Release erstellen (über GitHub Actions oder manuell)
git tag v1.0.1
git push origin v1.0.1
```

#### 3. GitHub Token setzen (optional)

Für private Repos:

```bash
export GH_TOKEN="ghp_..."
```

### API-Nutzung

#### JavaScript (Renderer)

```javascript
// Auto-Updater Zugriff
const updater = window.TechHelpAutoUpdater

// Manuell nach Updates suchen
await updater.checkNow()

// Update-Info abrufen
const info = updater.getUpdateInfo()
console.log('Aktuelle Version:', info.currentVersion)
console.log('Update verfügbar:', info.updateAvailable)
console.log('Neueste Version:', info.latestRelease?.tag_name)

// Auto-Check deaktivieren/aktivieren
updater.disableAutoCheck()
updater.enableAutoCheck()

// Event-Listener
window.addEventListener('update-available', (event) => {
  const release = event.detail.release
  console.log('Update:', release.tag_name)
  console.log('Release Notes:', release.body)
})
```

#### Electron (Main Process)

```javascript
const ElectronAutoUpdater = require('./auto-updater')

// Initialisieren
const autoUpdater = new ElectronAutoUpdater(mainWindow)

// Nach Updates suchen
autoUpdater.checkForUpdates()

// Update herunterladen
autoUpdater.downloadUpdate()

// Installieren und neu starten
autoUpdater.quitAndInstall()
```

### GitHub Actions Workflow

Automatische Releases bei git tag:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Build
        run: |
          cd Browser
          npm ci
          npm run build:all
      
      - name: Release
        uses: softprops/action-gh-release@v2
        with:
          files: Browser/dist/*
          generate_release_notes: true
```

## 🗂️ Dateistruktur

```
Browser/
├── www/
│   ├── auto-updater.js      # Update-Logik (Renderer)
│   ├── auto-updater.css     # Update-UI Styles
│   └── app.js               # Integration
├── src/
│   └── main/
│       ├── auto-updater.js  # Electron Auto-Updater
│       ├── main.js          # Integration
│       └── preload.js       # IPC-Bridge
└── package.json             # Build-Config
```

## 🔐 Sicherheit

### Signierte Updates
```json
{
  "build": {
    "win": {
      "certificateFile": "./cert.p12",
      "certificatePassword": "..."
    },
    "mac": {
      "identity": "Developer ID Application: ..."
    }
  }
}
```

### Update-Server Validierung
- HTTPS-only
- SHA512-Checksummen
- Code-Signing Validierung
- GitHub Release Authentifizierung

## 📊 Update-Strategie

### Semantic Versioning
```
v1.2.3
│ │ │
│ │ └─ Patch (Bug-Fixes)
│ └─── Minor (neue Features, rückwärtskompatibel)
└───── Major (Breaking Changes)
```

### Update-Kanäle
```json
{
  "publish": [
    {
      "provider": "github",
      "channel": "latest"
    },
    {
      "provider": "github",
      "channel": "beta"
    }
  ]
}
```

Beta-Kanal nutzen:
```javascript
autoUpdater.channel = 'beta'
autoUpdater.checkForUpdates()
```

## 🎯 Update-Flow

### Desktop (Electron)

```
1. App Start
   ↓
2. Check GitHub Releases
   ↓
3. Neue Version?
   ↓ Ja
4. Benachrichtigung zeigen
   ↓
5. User klickt "Aktualisieren"
   ↓
6. Download im Hintergrund
   ↓
7. "Neustart erforderlich"
   ↓
8. Neustart → Update installiert
```

### Android (Capacitor)

```
1. App Start
   ↓
2. Check GitHub Releases
   ↓
3. Neue APK?
   ↓ Ja
4. Benachrichtigung zeigen
   ↓
5. User klickt "Herunterladen"
   ↓
6. APK-Download
   ↓
7. Android-Installer öffnen
   ↓
8. User installiert manuell
```

## ⚙️ Konfiguration

### Update-Intervall ändern

```javascript
// In auto-updater.js
this.checkInterval = 1 * 60 * 60 * 1000  // 1 Stunde statt 3
```

### Auto-Check deaktivieren

```javascript
// In auto-updater.js
this.autoCheckEnabled = false
```

### Update-URL ändern

```javascript
// In auto-updater.js
this.updateCheckUrl = 'https://api.github.com/repos/OWNER/REPO/releases/latest'
```

## 📝 Release-Workflow

### 1. Version erhöhen
```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

### 2. Changelog erstellen
```bash
# CHANGELOG.md aktualisieren
## v1.0.1 (2026-11-09)
- Fixed: Bug XYZ
- Added: Feature ABC
```

### 3. Build erstellen
```bash
npm run build:all
```

### 4. Tag erstellen und pushen
```bash
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### 5. GitHub Actions erstellt automatisch Release
- Workflow läuft
- Builds werden erstellt
- Release wird veröffentlicht
- Users werden benachrichtigt!

## 🐛 Troubleshooting

### Update-Check schlägt fehl
```javascript
// Console öffnen (F12)
window.TechHelpAutoUpdater.checkNow()
// Fehler wird im Console-Log angezeigt
```

### Electron-Updates funktionieren nicht
```javascript
// Main Process Log prüfen
// %APPDATA%/TechHelp Browser/logs/main.log
```

### APK-Download startet nicht
- Browser-Berechtigungen prüfen
- Download-Verzeichnis prüfen
- GitHub API-Limit erreicht? (60 Requests/Stunde ohne Auth)

## 📚 Weiterführende Dokumentation

- [electron-updater Docs](https://www.electron.build/auto-update)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Capacitor Updates](https://capacitorjs.com/docs/guides/live-updates)

---

**Version:** 1.0.0  
**Stand:** November 2026  
**Entwickler:** TechHelp Support Team
