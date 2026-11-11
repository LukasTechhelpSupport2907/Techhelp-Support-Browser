# ⚡ Techhelp Support Browser – Komplette Installations- und Build-Anleitung

> Hier steht ALLES was du brauchst. Schritt für Schritt, ohne Vorkenntnisse.

---

## Inhaltsverzeichnis

1. [Was du brauchst (Voraussetzungen)](#1-was-du-brauchst)
2. [Projekt herunterladen](#2-projekt-herunterladen)
3. [Browser starten (zum Testen)](#3-browser-starten)
4. [Windows-Installer bauen (.exe)](#4-windows-installer-bauen)
5. [Android APK bauen](#5-android-apk-bauen)
6. [macOS DMG bauen](#6-macos-dmg-bauen)
7. [Linux AppImage bauen](#7-linux-appimage-bauen)
8. [Automatisch via GitHub Actions (empfohlen)](#8-automatisch-via-github-actions)
9. [Häufige Probleme & Lösungen](#9-häufige-probleme)

---

## 1. Was du brauchst

### Für Windows-Installer (.exe) und Browser-Test:

| Was | Download | Hinweis |
|-----|----------|---------|
| **Node.js** (v20 oder neuer) | [nodejs.org](https://nodejs.org/de/download) | LTS-Version wählen! |
| **Git** | [git-scm.com](https://git-scm.com/download/win) | Wahrscheinlich schon installiert |

### Zusätzlich für die Android APK:

| Was | Download | Hinweis |
|-----|----------|---------|
| **Android Studio** | [developer.android.com/studio](https://developer.android.com/studio) | Groß (~1 GB), aber nötig |
| **Java JDK 17** | Kommt mit Android Studio | Nichts extra tun |

### Prüfen ob alles installiert ist:

Öffne PowerShell und tippe:
```powershell
node --version    # Muss v20.x.x oder höher zeigen
npm --version     # Muss 10.x oder höher zeigen
git --version     # Irgendeine Version reicht
```

---

## 2. Projekt herunterladen

### Option A – Mit Git (empfohlen):
```powershell
# Irgendwo auf deinem PC (z.B. Desktop)
git clone https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Webseite-u.-Bot.git
cd "Techhelp-Support-Webseite-u.-Bot"
git checkout techhelp-browser
cd Browser
```

### Option B – Als ZIP:
1. Gehe zu: https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Webseite-u.-Bot/tree/techhelp-browser
2. Klicke auf den grünen **"Code"** Button
3. Klicke **"Download ZIP"**
4. ZIP entpacken
5. In den `Browser/` Ordner wechseln

### Abhängigkeiten installieren:
```powershell
# Im Browser/ Ordner:
npm install
```
⏳ Das dauert 1-3 Minuten. Geduld haben.

---

## 3. Browser starten

```powershell
# Im Browser/ Ordner:
npm start
```

Ein Fenster öffnet sich – das ist der Techhelp Support Browser!

**Funktioniert nicht?** → Siehe [Abschnitt 9 – Häufige Probleme](#9-häufige-probleme)

---

## 4. Windows-Installer bauen

Damit bekommst du eine `.exe` Datei die du auf jedem Windows-PC installieren kannst.

```powershell
# Im Browser/ Ordner:
npm run build:win
```

⏳ Dauert 3-8 Minuten beim ersten Mal (lädt Electron-Binary herunter).

**Ergebnis:** `Browser/dist/Techhelp Support Browser Setup 1.0.0.exe`

### Installer weitergeben:
- Die `.exe` Datei kannst du einfach per Discord, WeTransfer, etc. teilen
- Empfänger führt die `.exe` aus und folgt dem Installer
- Bei SmartScreen-Warnung: "Weitere Informationen" → "Trotzdem ausführen"

---

## 5. Android APK bauen

### Schritt 1 – Android Studio installieren
1. Lade Android Studio von [developer.android.com/studio](https://developer.android.com/studio) herunter
2. Installieren und beim ersten Start durchklicken (Standard-Einstellungen sind ok)
3. Warte bis alles heruntergeladen ist (~20 Minuten)

### Schritt 2 – Android SDK einrichten
In Android Studio:
1. Oben: **Tools → SDK Manager**
2. Unter "SDK Platforms": **Android 14 (API 34)** anhaken und installieren
3. Unter "SDK Tools": **Android SDK Build-Tools 34.0.0** anhaken und installieren
4. **Apply** klicken

### Schritt 3 – ANDROID_HOME setzen
```powershell
# Pfad herausfinden (normalerweise so):
# C:\Users\DeinName\AppData\Local\Android\Sdk

# In PowerShell (einmalig, dauerhaft setzen):
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("PATH", "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
```
**Danach PowerShell neu starten!**

### Schritt 4 – APK bauen
```powershell
# Im Browser/ Ordner:

# Zuerst Web-Assets synchronisieren:
node node_modules\@capacitor\cli\bin\capacitor sync android

# Dann APK bauen:
cd android
.\gradlew.bat assembleDebug
cd ..
```

⏳ Dauert beim ersten Mal 10-20 Minuten (lädt Gradle und alle Android-Abhängigkeiten).

**Ergebnis:** `Browser/android/app/build/outputs/apk/debug/app-debug.apk`

### Schritt 5 – APK auf Android installieren
**Methode 1 – Per USB:**
1. Handy per USB anschließen
2. Am Handy: Einstellungen → Entwickleroptionen → USB-Debugging aktivieren
3. In PowerShell:
```powershell
# Prüfen ob Handy erkannt wird:
.\android\platform-tools\adb.exe devices

# APK installieren:
.\android\platform-tools\adb.exe install android\app\build\outputs\apk\debug\app-debug.apk
```

**Methode 2 – Per Datei-Transfer:**
1. `app-debug.apk` auf dein Handy kopieren (per USB, WhatsApp, etc.)
2. Am Handy die APK-Datei öffnen
3. Bei der Meldung "Unbekannte Apps": **Erlauben** tippen
4. Installieren und öffnen

---

## 6. macOS DMG bauen

⚠️ **Nur auf einem Mac möglich** (Apple-Einschränkung)

```bash
# Im Browser/ Ordner:
npm install
npm run build:mac
```

**Ergebnis:** `Browser/dist/Techhelp Support Browser-1.0.0.dmg`

---

## 7. Linux AppImage bauen

```bash
# Im Browser/ Ordner:
npm install
npm run build:linux
```

**Ergebnis:**
- `Browser/dist/Techhelp Support Browser-1.0.0.AppImage`
- `Browser/dist/techhelp-support-browser_1.0.0_amd64.deb`

---

## 8. Automatisch via GitHub Actions (empfohlen)

Das ist der einfachste Weg um alle Versionen auf einmal zu bauen.

### Schritt 1 – Secrets einrichten
Gehe zu: https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Webseite-u.-Bot/settings/secrets/actions

Klicke "New repository secret" und füge folgende Secrets hinzu:

| Secret-Name | Was eintragen |
|-------------|---------------|
| `BROWSER_SRC_TOKEN` | Dein GitHub Personal Access Token (PAT) mit `repo`-Scope |
| `BROWSER_WEB_TOKEN` | Gleicher oder anderer PAT mit `repo`-Scope |

**PAT erstellen:**
1. GitHub → Dein Profilbild → Settings
2. Links unten: **Developer settings**
3. **Personal access tokens → Tokens (classic)**
4. **Generate new token (classic)**
5. Note: "Browser Build", Expiration: 1 year, Scope: **repo** anhaken
6. **Generate token** → Token kopieren (wird nur einmal angezeigt!)

### Schritt 2 – Release triggern
```powershell
# Im Repo-Ordner (Techhelp-Support-Webseite-u.-Bot):
git tag v1.0.0
git push origin v1.0.0
```

GitHub baut dann **automatisch**:
- ✅ Windows .exe
- ✅ Linux .AppImage + .deb
- ✅ Android .apk
- ✅ Erstellt automatisch einen GitHub Release mit allen Dateien

Den fertigen Release findest du unter:
https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Webseite-u.-Bot/releases

---

## 9. Häufige Probleme

### "npm wird nicht erkannt"
```powershell
# PowerShell Execution Policy erlauben:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
# Dann neue PowerShell öffnen
```

### "electron kann nicht gefunden werden"
```powershell
# Direkt starten mit:
node_modules\electron\dist\electron.exe .
```

### "ANDROID_HOME nicht gesetzt" beim APK-Build
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:PATH;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"
```

### APK lässt sich nicht installieren ("Unbekannte Quelle")
- Android 8+: Einstellungen → Apps → Spezielle App-Zugriffe → Unbekannte Apps installieren → Datei-Manager erlauben
- Android 7: Einstellungen → Sicherheit → Unbekannte Quellen aktivieren

### "gradlew.bat wird nicht erkannt"
```powershell
# Sicherstellen dass du im android/ Unterordner bist:
cd "C:\...\Browser\android"
.\gradlew.bat assembleDebug
```

### Build schlägt mit "SDK not found" fehl
Android Studio öffnen → File → Project Structure → SDK Location → Pfad kopieren → als ANDROID_HOME setzen

---

## Schnellreferenz

```powershell
npm start              # Browser starten (zum Testen)
npm run build:win      # Windows .exe bauen
npm run build:linux    # Linux .AppImage + .deb bauen
npm run build:all      # Alle Desktop-Versionen auf einmal

# APK:
node node_modules\@capacitor\cli\bin\capacitor sync android
cd android && .\gradlew.bat assembleDebug && cd ..
```

---

**Support:** https://discord.gg/kDAPDXdC7q
**Website:** https://techhelp-support.de
**GitHub:** https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Browser
