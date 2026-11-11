# TechHelp Browser - Update-Probleme beheben

## 🔍 Problem: Updates funktionieren nicht bei bereits installierten Versionen

Wenn du den Browser vorher schon heruntergeladen hast, können mehrere Probleme auftreten:

### Mögliche Ursachen:

1. ❌ **Alte Version zeigt auf falsches Repository**
2. ❌ **Keine Releases im öffentlichen Repository vorhanden**
3. ❌ **Cache-Probleme mit alter Installation**
4. ❌ **App-Daten zeigen auf alte Version**
5. ❌ **Update-Mechanismus war noch nicht implementiert**

---

## ✅ Lösung 1: Für Benutzer (Neu installieren)

### Windows:

1. **Alte Version deinstallieren:**
   ```powershell
   # In Systemsteuerung -> Programme und Features
   # Oder über PowerShell:
   Get-Package "TechHelp Browser" | Uninstall-Package
   ```

2. **App-Daten löschen:**
   ```powershell
   Remove-Item -Path "$env:APPDATA\techhelp-browser" -Recurse -Force -ErrorAction SilentlyContinue
   Remove-Item -Path "$env:LOCALAPPDATA\techhelp-browser" -Recurse -Force -ErrorAction SilentlyContinue
   ```

3. **Cache leeren:**
   ```powershell
   Remove-Item -Path "$env:TEMP\techhelp-browser*" -Recurse -Force -ErrorAction SilentlyContinue
   ```

4. **Neue Version herunterladen:**
   - Von: https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Browser/releases/latest
   - Installiere die neue .exe Datei

### Android:

1. **Alte APK deinstallieren:**
   - Einstellungen → Apps → TechHelp Browser → Deinstallieren

2. **App-Daten löschen** (automatisch beim Deinstallieren)

3. **Cache leeren:**
   - Einstellungen → Speicher → Cache leeren

4. **Neue APK installieren:**
   - Von: https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Browser/releases/latest

### Linux:

1. **Alte Version entfernen:**
   ```bash
   # Für AppImage:
   rm ~/Applications/TechHelp-Browser*.AppImage
   
   # Für .deb:
   sudo apt remove techhelp-browser
   ```

2. **Config löschen:**
   ```bash
   rm -rf ~/.config/techhelp-browser
   rm -rf ~/.local/share/techhelp-browser
   ```

3. **Neue Version installieren**

### macOS:

1. **Alte App löschen:**
   ```bash
   rm -rf /Applications/TechHelp\ Browser.app
   ```

2. **Preferences löschen:**
   ```bash
   rm -rf ~/Library/Application\ Support/techhelp-browser
   rm -rf ~/Library/Preferences/de.techhelp-support.browser.plist
   ```

3. **Neue Version installieren**

---

## ✅ Lösung 2: Automatisches Update aktivieren (wenn schon installiert)

Wenn du die App nicht neu installieren möchtest:

### Option A: Cache zurücksetzen im Browser

1. Öffne TechHelp Browser
2. Drücke `Ctrl + Shift + I` (oder `Cmd + Option + I` auf Mac)
3. Gehe zu **Console**
4. Führe aus:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

### Option B: Manuell Update erzwingen

1. Öffne Developer Console (`Ctrl + Shift + I`)
2. Führe aus:
   ```javascript
   // Force Update Check
   if (window.autoUpdater) {
     window.autoUpdater.forceUpdate = true
     window.autoUpdater.checkForUpdates(true)
   }
   ```

### Option C: App-Daten behalten, nur Update-Info zurücksetzen

**Windows:**
```powershell
# Nur Update-Cache löschen
Remove-Item -Path "$env:APPDATA\techhelp-browser\update-cache" -Recurse -Force -ErrorAction SilentlyContinue
```

**Linux/Mac:**
```bash
# Nur Update-Cache löschen
rm -rf ~/.config/techhelp-browser/update-cache
```

---

## ✅ Lösung 3: Für Entwickler (Fix implementiert)

Die folgenden Fixes wurden bereits implementiert:

### 1. **Repository-URLs korrigiert**
- ✅ `auto-updater.js` zeigt jetzt auf: `Techhelp-Support-Browser` (öffentlich)
- ✅ `package.json` publish config korrigiert

### 2. **Force-Update für alte Versionen**
```javascript
// Erkennt alte Installationen automatisch
if (!installDate) {
  localStorage.setItem('browserInstallDate', new Date().toISOString())
  this.forceUpdate = true
}
```

### 3. **Update-Benachrichtigung beim Start**
```javascript
// Zeigt Update-Hinweis sofort beim ersten Start
await this.checkForUpdates(true)
```

### 4. **localStorage-Tracking**
```javascript
// Speichert letzte Update-Prüfung
localStorage.setItem('lastUpdateCheck', new Date().toISOString())
localStorage.setItem('latestVersion', latestVersion)
```

---

## 🚀 Für neue Releases

### Schritt 1: Erstelle Release im öffentlichen Repo

```bash
# Tag erstellen
git tag v1.0.1
git push origin v1.0.1

# Oder über GitHub UI:
# https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Browser/releases/new
```

### Schritt 2: GitHub Actions erstellt automatisch:
- ✅ Windows Installer (.exe)
- ✅ macOS DMG
- ✅ Linux AppImage + .deb
- ✅ Android APK

### Schritt 3: Alte Versionen erkennen Update automatisch

Wenn ein Benutzer eine alte Version öffnet:
1. Browser prüft auf Updates (beim Start)
2. Zeigt Benachrichtigung "Update verfügbar"
3. Benutzer klickt "Jetzt aktualisieren"
4. Download startet automatisch
5. Installation (je nach Plattform)

---

## 🔧 Troubleshooting

### Problem: "Keine Verbindung zum Update-Server"

**Ursache:** GitHub API Limit oder Netzwerkproblem

**Lösung:**
```javascript
// Prüfe ob GitHub erreichbar ist
fetch('https://api.github.com/repos/LukasTechhelpSupport2907/Techhelp-Support-Browser/releases/latest')
  .then(r => r.json())
  .then(data => console.log('Latest:', data.tag_name))
  .catch(err => console.error('Fehler:', err))
```

### Problem: "Update wird nicht angezeigt"

**Ursache:** Cache oder alte Version

**Lösung:**
1. Lösche Browser-Cache (siehe Option A oben)
2. Oder neu installieren (siehe Lösung 1)

### Problem: "Download schlägt fehl"

**Ursache:** Keine Berechtigung oder kein Speicherplatz

**Lösung:**
- Windows: Als Administrator ausführen
- Android: Speicher-Berechtigung prüfen
- Linux: Schreibrechte für ~/Downloads prüfen

### Problem: "Update installiert sich nicht"

**Ursache:** Plattform-spezifisch

**Lösung:**
- **Windows**: Manuell installieren aus Downloads
- **Android**: APK manuell installieren (Unbekannte Quellen erlauben)
- **macOS**: DMG öffnen und App in Programme ziehen
- **Linux**: AppImage ausführbar machen: `chmod +x *.AppImage`

---

## 📋 Checkliste vor neuem Release

- [ ] Version in `package.json` erhöhen
- [ ] Git Tag erstellen (`git tag v1.0.1`)
- [ ] Tag pushen (`git push origin v1.0.1`)
- [ ] GitHub Actions laufen lassen (automatisch)
- [ ] Release-Artefakte prüfen
- [ ] Update-Mechanismus testen mit alter Version

---

## 📞 Support

Wenn nichts funktioniert:

1. **GitHub Issue erstellen:**
   https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Browser/issues/new

2. **E-Mail Support:**
   support@techhelp-support.de

3. **Debug-Info sammeln:**
   - Welche Version ist installiert?
   - Welches Betriebssystem?
   - Fehlermeldung (Screenshot)?
   - Console-Log (F12 → Console)

---

**Zusammenfassung:**

✅ **Beste Lösung für Benutzer:** Alte Version deinstallieren, neue installieren  
✅ **Schnelle Lösung:** Cache zurücksetzen (Option A)  
✅ **Für Entwickler:** Fixes sind bereits implementiert, erstelle neuen Release

*Letzte Aktualisierung: November 2026*
