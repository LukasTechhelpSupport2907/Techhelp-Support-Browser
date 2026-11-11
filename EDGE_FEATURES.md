# 🚀 TechHelp Browser - Edge-Features

Der TechHelp Browser wurde mit zahlreichen Features erweitert, die von Microsoft Edge inspiriert sind und ein modernes Browser-Erlebnis bieten.

## 📱 Android Internet-Zugriff (BEHOBEN)

**Problem:** Der Browser hatte auf Android keinen Internetzugang.

**Lösung:**
- ✅ `usesCleartextTraffic="true"` in AndroidManifest.xml aktiviert
- ✅ Network Security Config erstellt (`network_security_config.xml`)
- ✅ Capacitor Config erweitert mit `cleartext: true` und `allowMixedContent: true`
- ✅ Volle HTTPS + HTTP Unterstützung
- ✅ System-Zertifikate und User-Zertifikate werden akzeptiert

## 🎨 TechHelp Support Branding

- ✅ **Icon/Logo bleibt TechHelp Support** (rotes Blitz-Logo, keine Electron-Standardicons)
- ✅ Eigenes SVG-Icon: `Browser/www/icon.svg`
- ✅ Konsistentes Design über alle Plattformen

## ⚡ Neue Edge-Features

### 1. 📚 Sammlungen (Collections)
Organisiere Webseiten in thematischen Sammlungen - wie in Edge.

**Funktionen:**
- Sammlungen erstellen und benennen
- Webseiten zu Sammlungen hinzufügen
- Notizen zu einzelnen Einträgen
- Sammlungen durchsuchen und verwalten

**Zugriff:** Menü → Browser-Features → Sammlungen

### 2. 📖 Leseliste (Reading List)
Speichere Artikel zum späteren Lesen.

**Funktionen:**
- Artikel zur Leseliste hinzufügen
- Als gelesen markieren
- Automatische Excerpts
- Offline-Zugriff (geplant)

**Zugriff:** Menü → Browser-Features → Leseliste

### 3. ⚏ Split-Screen Modus
Zwei Webseiten nebeneinander anzeigen.

**Funktionen:**
- Bildschirm horizontal teilen
- Größenverhältnis anpassbar (Drag-Divider)
- Unabhängige Navigation
- Perfekt für Recherche oder Vergleiche

**Zugriff:** Menü → Browser-Features → Split-Screen Modus

### 4. 📐 Vertikale Tabs
Tabs in einer Seitenleiste statt oben.

**Funktionen:**
- Platz sparen bei vielen Tabs
- Bessere Übersicht
- Touch-optimiert für Tablets
- Toggle: An/Aus

**Zugriff:** Menü → Browser-Features → Vertikale Tabs (Toggle)

### 5. 💰 Preis-Tracker (Shopping)
Preise von Produkten verfolgen - wie Edge Shopping.

**Funktionen:**
- Produkte zur Preisverfolgung hinzufügen
- Preisverlauf (UI vorhanden, API-Anbindung folgt)
- Benachrichtigungen bei Preisänderungen (geplant)
- Multi-Shop Vergleich (geplant)

**Zugriff:** Menü → Browser-Features → Preis-Tracker

### 6. 📸 Web Capture (Screenshots)
Bildschirmfotos von Webseiten aufnehmen.

**Funktionen:**
- Sichtbarer Bereich
- Ganze Seite (geplant)
- Bereich auswählen (geplant)
- Automatisch speichern

**Zugriff:** Menü → Browser-Features → Screenshot aufnehmen

### 7. 📋 Smart Copy
Intelligentes Kopieren mit Formatierung.

**Funktionen:**
- HTML + Plain Text gleichzeitig
- Markdown-Support
- Link-Formatierung
- Automatische Format-Erkennung

**Verwendung:** Automatisch beim Kopieren (Ctrl+C / Cmd+C)

### 8. 📄 PDF-Viewer
PDFs direkt im Browser anzeigen (Basis vorhanden).

**Status:** UI vorbereitet, vollständige Integration folgt

## 🔧 Technische Details

### Dateien
```
Browser/
  www/
    edge-features.js     - Feature-Implementierung
    edge-features.css    - Feature-Styles
    app.js               - Integration & Event-Handler
    index.html           - UI-Panels
  
  android/
    app/src/main/
      AndroidManifest.xml              - Internet-Berechtigungen
      res/xml/network_security_config.xml - Netzwerk-Sicherheit
```

### API
Alle Features sind über `window.TechHelpEdgeFeatures` zugänglich:

```javascript
// Beispiel: Zur Leseliste hinzufügen
window.TechHelpEdgeFeatures.readingList.add(
  'Artikel-Titel',
  'https://example.com',
  'Kurze Beschreibung...'
)

// Sammlung erstellen
window.TechHelpEdgeFeatures.collections.createCollection('Meine Favoriten')

// Split-Screen aktivieren
window.TechHelpEdgeFeatures.splitScreen.enable()
```

### LocalStorage
Alle Daten werden lokal gespeichert:
- `techhelp_collections` - Sammlungen
- `techhelp_reading_list` - Leseliste
- `techhelp_price_tracker` - Preis-Tracker

## 🚧 Roadmap / Geplante Features

### Kurzfristig
- [ ] PDF.js Integration für vollständigen PDF-Viewer
- [ ] Screenshot Full-Page Funktion
- [ ] Preis-Tracker API-Anbindung

### Mittelfristig
- [ ] Cloud-Sync für Sammlungen
- [ ] Leseliste Offline-Modus
- [ ] Erweitertes Tab-Management (Gruppen, Farben)
- [ ] KI-Assistent (wie Edge Copilot)

### Langfristig
- [ ] Shopping-Cashback Integration
- [ ] Automatische Coupon-Erkennung
- [ ] Immersive Reader Modus
- [ ] Sidebar Apps (Mini-Apps wie in Edge)

## 🎯 Vergleich mit Edge

| Feature | TechHelp Browser | Microsoft Edge |
|---------|------------------|----------------|
| Sammlungen | ✅ Implementiert | ✅ |
| Leseliste | ✅ Implementiert | ✅ |
| Split-Screen | ✅ Implementiert | ✅ |
| Vertikale Tabs | ✅ Implementiert | ✅ |
| Shopping/Preis-Tracker | ⚠️ UI fertig, API folgt | ✅ |
| Web Capture | ⚠️ Basis vorhanden | ✅ |
| Smart Copy | ✅ Implementiert | ✅ |
| PDF-Viewer | ⚠️ Vorbereitet | ✅ |
| Copilot/KI | ❌ Geplant | ✅ |
| Sidebar Apps | ❌ Geplant | ✅ |

**Legende:**
- ✅ Voll funktional
- ⚠️ Teilweise / in Arbeit
- ❌ Geplant

## 📝 Nutzungshinweise

### Desktop (Electron)
Alle Features sind vollständig verfügbar und optimiert.

### Android (Capacitor)
- Internet-Zugriff funktioniert jetzt vollständig
- Touch-Optimierungen für alle Features
- Split-Screen im Landscape-Modus empfohlen
- Screenshots nutzen native Android-APIs

### iOS (geplant)
Features werden mit iOS-Build verfügbar.

## 🤝 Beitragen

Feedback und Feature-Requests sind willkommen!

- **GitHub:** [Issues](https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Browser/issues)
- **Discord:** [TechHelp Support Server](https://discord.gg/kDAPDXdC7q)

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** November 2026  
**Entwickler:** TechHelp Support Team
