# 🔐 TechHelp Browser - Passwort-Manager & Auto-Login

Ein vollständiges Passwort- und Zahlungsmethoden-Management-System mit Cloud-Sync und Google Sign-In Integration.

## ✨ Features

### 🔐 Passwort-Manager
- **Sichere Speicherung**: Alle Passwörter werden mit AES-256-GCM verschlüsselt
- **Master-Passwort**: Ein Master-Passwort schützt alle gespeicherten Daten
- **Auto-Fill**: Automatisches Ausfüllen von Login-Formularen
- **Import/Export**: CSV-Export für Backup und Migration
- **Domain-Erkennung**: Intelligente Zuordnung zu Websites

### 💳 Zahlungsmethoden
- **Kreditkarten**: Sichere Speicherung von Kartendaten
- **Adressen**: Rechnungs- und Versandadressen speichern
- **Auto-Fill**: Automatisches Ausfüllen bei Checkout
- **Verschlüsselt**: Alle Daten sind verschlüsselt gespeichert

### 👤 Google Sign-In & Cloud-Sync
- **Google-Anmeldung**: Mit Google-Konto anmelden
- **Cloud-Synchronisation**: Passwörter auf allen Geräten verfügbar
- **Cross-Device**: Melde dich auf einem Gerät an, nutze es überall
- **Backup**: Automatisches Cloud-Backup

### 🎯 Auto-Fill System
- **Formular-Erkennung**: Erkennt Login- und Zahlungsformulare automatisch
- **Ein-Klick-Login**: Gespeicherte Anmeldedaten mit einem Klick ausfüllen
- **Mehrere Accounts**: Unterstützt mehrere Accounts pro Website
- **Smart-Matching**: Intelligente Zuordnung zur aktuellen Website

## 🚀 Verwendung

### Erstmalige Einrichtung

1. **Browser öffnen**
2. **Master-Passwort festlegen**: Beim ersten Start wirst du aufgefordert, ein Master-Passwort zu erstellen
3. **Passwort wählen**: Wähle ein starkes Passwort (mindestens 8 Zeichen)
4. **Fertig!** Der Passwort-Manager ist nun aktiv

### Passwort speichern

**Automatisch:**
- Gib auf einer Website deine Anmeldedaten ein
- Beim Login wird automatisch angeboten, das Passwort zu speichern
- Klicke auf "Speichern"

**Manuell:**
1. Menü öffnen → Browser-Features → Passwörter
2. "Passwort hinzufügen" klicken
3. Website-URL, Benutzername und Passwort eingeben
4. Speichern

### Passwort verwenden (Auto-Fill)

1. Besuche eine Website mit Login
2. Ein 🔑-Symbol erscheint im Benutzername-Feld
3. Klicke darauf und wähle das Konto aus
4. Anmeldedaten werden automatisch eingefügt

### Zahlungsmethoden hinzufügen

1. Menü → Browser-Features → Zahlungsmethoden
2. "Karte hinzufügen" klicken
3. Kartendaten eingeben:
   - Karteninhaber
   - Kartennummer
   - Ablaufdatum (MM/YYYY)
   - CVV
   - Spitzname (optional)
4. Speichern

### Google Sign-In einrichten

1. Menü → Browser-Features → Google Sign-In
2. "Mit Google anmelden" klicken
3. Google-Konto auswählen
4. "Cloud-Sync aktivieren" klicken
5. Fertig! Deine Daten werden nun synchronisiert

## 🔒 Sicherheit

### Verschlüsselung
- **Algorithmus**: AES-256-GCM (Advanced Encryption Standard)
- **Key-Derivation**: PBKDF2 mit 100.000 Iterationen
- **Master-Passwort**: Niemals im Klartext gespeichert
- **Lokale Speicherung**: Alle Daten verschlüsselt im LocalStorage

### Datenschutz
- **Keine Telemetrie**: Keine Datenerfassung
- **Lokale Speicherung**: Standardmäßig alles lokal gespeichert
- **Cloud optional**: Cloud-Sync nur mit expliziter Zustimmung
- **Open Source**: Code ist öffentlich einsehbar

### Best Practices
1. **Starkes Master-Passwort**: Mindestens 12 Zeichen, mit Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen
2. **Einzigartiges Master-Passwort**: Nutze es nirgendwo anders
3. **Regelmäßige Backups**: Exportiere deine Passwörter regelmäßig (CSV)
4. **Master-Passwort merken**: Es kann NICHT wiederhergestellt werden!

## 📚 API-Dokumentation

### JavaScript-API

```javascript
// Passwort-Manager initialisieren
await window.TechHelpSecurityManager.initialize('mein-master-passwort')

// Passwort hinzufügen
await window.TechHelpSecurityManager.passwordManager.addCredential(
  'https://example.com',
  'benutzer@email.com',
  'geheimes-passwort',
  { name: 'Mein Account', note: 'Optionale Notiz' }
)

// Alle Passwörter abrufen
const credentials = window.TechHelpSecurityManager.passwordManager.getAllCredentials()

// Passwörter für Domain abrufen
const creds = window.TechHelpSecurityManager.passwordManager.getCredentialsForDomain('example.com')

// Passwort löschen
await window.TechHelpSecurityManager.passwordManager.deleteCredential('credential-id')

// Kreditkarte hinzufügen
await window.TechHelpSecurityManager.paymentManager.addCard({
  cardholderName: 'Max Mustermann',
  cardNumber: '1234567812345678',
  expiryMonth: '12',
  expiryYear: '2027',
  cvv: '123',
  nickname: 'Meine Kreditkarte'
})

// Alle Karten abrufen (maskiert)
const cards = window.TechHelpSecurityManager.paymentManager.getCards()

// Google Sign-In
await window.TechHelpSecurityManager.googleAuth.initialize('YOUR_CLIENT_ID')
await window.TechHelpSecurityManager.googleAuth.signIn()

// Cloud-Sync aktivieren
const user = window.TechHelpSecurityManager.googleAuth.getUser()
await window.TechHelpSecurityManager.cloudSync.enable(user.id, 'auth-token')

// Auto-Fill aktivieren/deaktivieren
window.TechHelpSecurityManager.autoFillManager.enable()
window.TechHelpSecurityManager.autoFillManager.disable()
```

## 🗂️ Datenstruktur

### LocalStorage-Keys
```
techhelp_has_master_password  - Boolean (ob Master-Passwort gesetzt)
techhelp_passwords            - Verschlüsselte Passwörter
techhelp_payment_cards        - Verschlüsselte Kreditkarten
techhelp_payment_addresses    - Verschlüsselte Adressen
techhelp_google_user          - Google-User-Info (nicht verschlüsselt)
```

### Credential-Objekt
```javascript
{
  id: "1636473847362",
  url: "https://example.com",
  domain: "example.com",
  username: "user@email.com",
  password: "secret123",
  name: "Mein Account",
  note: "Optionale Notiz",
  created: "2024-11-09T10:30:47.362Z",
  lastUsed: "2024-11-09T12:15:23.122Z",
  useCount: 5
}
```

### Card-Objekt
```javascript
{
  id: "1636473847363",
  type: "credit",
  cardholderName: "Max Mustermann",
  cardNumber: "1234567812345678",
  expiryMonth: "12",
  expiryYear: "2027",
  cvv: "123",
  nickname: "Meine Visa",
  created: "2024-11-09T10:30:47.363Z"
}
```

## 🔧 Konfiguration

### Google Sign-In einrichten (für Entwickler)

1. **Google Cloud Console öffnen**: https://console.cloud.google.com
2. **Projekt erstellen** oder bestehendes auswählen
3. **OAuth 2.0 Client-ID erstellen**:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized JavaScript origins: `https://browser.techhelp-support.de`
4. **Client-ID kopieren**
5. **In Code eintragen**: `password-manager.js` → `initialize()` Funktion

### Cloud-Sync Backend (Optional)

Für Cloud-Sync wird ein Backend-API-Endpoint benötigt:

**Endpoint:** `https://api.techhelp-support.de/browser/sync`

**Methoden:**
- `GET /download` - Daten vom Cloud laden
- `POST /upload` - Daten in Cloud speichern

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

## ❓ FAQ

### Wie sicher ist der Passwort-Manager?
Sehr sicher! Alle Daten werden mit AES-256-GCM verschlüsselt. Das ist der gleiche Standard, den auch Banken nutzen. Dein Master-Passwort wird niemals gespeichert und kann nicht wiederhergestellt werden.

### Was passiert, wenn ich mein Master-Passwort vergesse?
Ohne Master-Passwort können die Daten nicht entschlüsselt werden. Es gibt KEINE Wiederherstellungsmöglichkeit. Daher ist es wichtig, das Master-Passwort gut zu merken und regelmäßig Backups zu erstellen (CSV-Export).

### Werden meine Passwörter in die Cloud hochgeladen?
Nein, nicht automatisch. Cloud-Sync ist optional und muss explizit aktiviert werden (Google Sign-In → Cloud-Sync aktivieren). Standardmäßig bleiben alle Daten lokal auf deinem Gerät.

### Kann ich meine Passwörter exportieren?
Ja! Gehe zu Passwörter → Export. Du erhältst eine CSV-Datei mit allen Passwörtern im Klartext. Bewahre diese Datei sicher auf!

### Funktioniert Auto-Fill auf allen Websites?
Auto-Fill funktioniert auf den meisten Websites. Die Formular-Erkennung erkennt Standard-Login-Felder automatisch. Manche Websites mit ungewöhnlichen Formularen werden möglicherweise nicht erkannt.

### Ist das sicherer als Browser-eingebaute Passwort-Manager?
Die Sicherheit ist vergleichbar. Unser Passwort-Manager nutzt die gleichen Verschlüsselungsstandards wie Chrome, Firefox, Edge etc. Der Vorteil: Du hast volle Kontrolle über deine Daten.

## 🐛 Bekannte Einschränkungen

- **Cloud-Sync Backend**: Aktuell ist kein Live-Backend verfügbar (Demo-Modus)
- **Google Client-ID**: Muss für Production ersetzt werden
- **Formular-Erkennung**: Funktioniert nicht auf allen exotischen Websites
- **Biometrische Authentifizierung**: Noch nicht implementiert (geplant)
- **Browser-Erweiterungen**: Keine Integration mit Browser-Extensions

## 🚧 Roadmap

### Kurzfristig
- [ ] Biometrische Authentifizierung (Fingerabdruck, Face-ID)
- [ ] Passwort-Generator
- [ ] Sicherheitscheck (kompromittierte Passwörter)
- [ ] Notfall-Zugang

### Mittelfristig
- [ ] Cloud-Sync Backend implementieren
- [ ] Ende-zu-Ende-Verschlüsselung für Cloud-Sync
- [ ] Familie/Team-Funktionen (Passwörter teilen)
- [ ] Auto-Fill für mehr Formular-Typen

### Langfristig
- [ ] Hardware-Token Support (YubiKey)
- [ ] Browser-Extension für Firefox/Chrome
- [ ] 2FA/TOTP Generator
- [ ] Passwort-Audit & Sicherheits-Dashboard

## 🤝 Beitragen

Feedback und Vorschläge sind willkommen!

- **GitHub Issues**: [Report Bugs](https://github.com/LukasTechhelpSupport2907/Techhelp-Support-Browser/issues)
- **Discord**: [TechHelp Support Server](https://discord.gg/kDAPDXdC7q)

## 📄 Lizenz

MIT License - frei verwendbar!

---

**Version:** 1.0.0  
**Stand:** November 2026  
**Entwickler:** TechHelp Support Team
