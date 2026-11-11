# TechHelp Support Browser

![TechHelp Browser Logo](assets/icons/icon.png)

**Copyright © 2026 TechHelp Support. All Rights Reserved.**

## 🔒 Copyright & License

This software is proprietary and protected by copyright law. See [LICENSE](LICENSE) file for full terms.

**IMPORTANT:** Unauthorized copying, distribution, modification, or use of this software is strictly prohibited and may result in severe civil and criminal penalties.

## 📖 About

TechHelp Support Browser ist ein leistungsstarker, moderner Web-Browser mit erweiterten Features:

### 🚀 Hauptfunktionen

- **Passwort-Manager**: Sichere Verschlüsselung mit AES-256-GCM
- **Zahlungsmethoden**: Speichere Kreditkarten & Adressen sicher
- **Auto-Fill**: Automatisches Ausfüllen von Login-Formularen
- **Google Sign-In**: Zentrale Anmeldung mit Google-Account
- **Cloud-Sync**: Synchronisiere Daten über alle Geräte
- **Automatische Updates**: Bleib immer auf dem neuesten Stand

### 🎯 Edge-ähnliche Features

- **Collections**: Organisiere Webseiten in thematischen Sammlungen
- **Leseliste**: Speichere Artikel zum späteren Lesen
- **Split-Screen**: Zwei Webseiten nebeneinander anzeigen
- **Vertikale Tabs**: Platzsparende Tab-Anordnung
- **Web Capture**: Screenshots von Webseiten erstellen
- **Smart Copy**: Intelligente Zwischenablage-Funktion
- **Preis-Tracker**: Verfolge Preise von Produkten
- **PDF-Viewer**: Integrierter PDF-Betrachter

## 💻 Plattformen

- **Desktop**: Windows, macOS, Linux (Electron-basiert)
- **Android**: Native APK mit Capacitor

## 🔐 Sicherheit

- AES-256-GCM Verschlüsselung
- PBKDF2 Key-Derivation (100.000 Iterationen)
- Master-Passwort-Schutz
- Verschlüsselte lokale Speicherung
- Keine Passwörter im Klartext

## 📦 Installation

### Desktop (Electron)

```bash
cd Browser
npm install
npm start
```

### Android (Capacitor)

```bash
cd Browser
npx cap sync android
npx cap open android
```

## 🛠️ Build

### Desktop Builds

```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
npm run build:all    # Alle Plattformen
```

### Android Build

1. Öffne in Android Studio: `npx cap open android`
2. Build > Build Bundle(s) / APK(s) > Build APK(s)

## 📱 Auto-Update

Der Browser prüft automatisch auf Updates und benachrichtigt dich:

- **Desktop**: Electron Auto-Updater (GitHub Releases)
- **Android**: APK-Download-Link

## 🔗 Links

- **Website**: https://techhelp-support.de
- **Support**: support@techhelp-support.de

## ⚖️ Legal

**TechHelp Support Browser** ist proprietäre Software.

- Alle Rechte vorbehalten
- Keine Weitergabe oder Vervielfältigung ohne Genehmigung
- Siehe [LICENSE](LICENSE) für vollständige Bedingungen
- Reverse Engineering ist untersagt

---

**Made with ❤️ by TechHelp Support**

*Dieser Browser darf nicht ohne explizite Genehmigung kopiert, modifiziert oder verbreitet werden.*
