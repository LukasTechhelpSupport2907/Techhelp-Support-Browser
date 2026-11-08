# ⚡ TechHelp Browser

Ein vollständiger, installierbarer Desktop-Browser auf Basis von Electron – entwickelt von TechHelp Support.

## Features

- **Multi-Tab-Browsing** mit Tab-Leiste, Schließen per Mitteklick
- **Custom Titlebar** – schlankes, dunkles Design ohne nativen Chrome
- **Adressleiste** mit URL-Erkennung, Suche und HTTPS-Indikator
- **Neue-Tab-Seite** mit Schnellzugriff, Verlauf und Suche
- **Lesezeichen** – persistiert über Neustarts
- **Verlauf** mit Suche und Lösch-Funktion
- **Downloads** mit Fortschrittsanzeige
- **Einstellungen** – Startseite, Suchmaschine (Google, Bing, DuckDuckGo, Ecosia, Brave), Werbeblocker
- **Entwicklertools** per Menü oder Tastenkürzel
- **Zoom** + / − / Reset
- **Tastenkürzel**: Ctrl+T (neuer Tab), Ctrl+W (Tab schließen), Ctrl+L (Adressleiste), Ctrl+R (Neu laden), Ctrl+D (Lesezeichen), Ctrl+H (Verlauf), Ctrl+Tab (Tab wechseln)

## Installation & Start

### Voraussetzungen

1. **Node.js 20+** installieren: https://nodejs.org/
2. Ins Verzeichnis wechseln und Abhängigkeiten installieren:

```bash
cd "Techhelp Support/Browser"
npm install
```

### Entwicklung (direkt starten)

```bash
npm start
```

### Als Installer bauen

```bash
# Windows (.exe Installer)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage + .deb)
npm run build:linux
```

Der fertige Installer liegt danach in `dist/`.

## Struktur

```
Browser/
├── src/
│   ├── main/
│   │   ├── main.js        # Electron Main-Process
│   │   └── preload.js     # Sichere IPC-Brücke
│   └── renderer/
│       ├── index.html     # Browser-UI
│       ├── style.css      # Styles (Techhelp-Design)
│       └── browser.js     # Browser-Logik (Tabs, Navigation, etc.)
├── assets/
│   └── icons/
│       └── icon.svg       # App-Icon
├── package.json
└── README.md
```
