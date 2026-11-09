/**
 * TechHelp Support Browser - Main Application
 * Copyright © 2026 TechHelp Support. All Rights Reserved.
 * 
 * PROPRIETARY SOFTWARE - Do not copy, modify, or distribute without permission.
 * See LICENSE file for full terms.
 */

'use strict'

// ── Capacitor Browser Plugin laden ─────────────────────────
// Öffnet URLs im nativen Android-Browser (In-App Browser)
let CapBrowser = null
try {
  // Capacitor v6 ES-Module Import
  const cap = await import('https://unpkg.com/@capacitor/browser@6/dist/esm/index.js')
    .catch(() => null)
  CapBrowser = cap?.Browser || null
} catch (e) {
  CapBrowser = null
}

// Fallback: window.Capacitor (wird von Capacitor automatisch gesetzt wenn die App nativ läuft)
if (!CapBrowser && window.Capacitor?.Plugins?.Browser) {
  CapBrowser = window.Capacitor.Plugins.Browser
}

// ── State ───────────────────────────────────────────────────
const SEARCH_ENGINE = 'https://www.google.com/search?q='
const HOME_URL      = ''
let currentUrl      = HOME_URL
let history         = []
let historyIndex    = -1

// ── DOM Elemente ────────────────────────────────────────────
const addressbar       = document.getElementById('addressbar')
const btnBack          = document.getElementById('btn-back')
const btnForward       = document.getElementById('btn-forward')
const btnReload        = document.getElementById('btn-reload')
const btnHome          = document.getElementById('btn-home')
const homePage         = document.getElementById('home-page')
const webviewContainer = document.getElementById('webview-container')
const loadingBar       = document.getElementById('loading-bar')
const loadingBarInner  = document.getElementById('loading-bar-inner')
const securityIcon     = document.getElementById('security-icon')
const homeSearchForm   = document.getElementById('home-search-form')
const homeSearchInput  = document.getElementById('home-search-input')

// ── URL normalisieren ────────────────────────────────────────
function normalizeUrl(input) {
  input = input.trim()
  if (!input) return ''
  // Sieht aus wie eine URL?
  if (/^https?:\/\//i.test(input)) return input
  if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(input) && !input.includes(' ')) {
    return 'https://' + input
  }
  // Suche
  return SEARCH_ENGINE + encodeURIComponent(input)
}

// ── Sicherheits-Icon aktualisieren ──────────────────────────
function updateSecurityIcon(url) {
  if (!securityIcon) return
  if (url.startsWith('https://')) {
    securityIcon.style.color = '#7df9d2'
    securityIcon.title = 'Sichere Verbindung (HTTPS)'
  } else {
    securityIcon.style.color = '#888'
    securityIcon.title = 'Ungesicherte Verbindung'
  }
}

// ── Navigation-Buttons aktualisieren ────────────────────────
function updateNavBtns() {
  if (btnBack)    btnBack.disabled    = historyIndex <= 0
  if (btnForward) btnForward.disabled = historyIndex >= history.length - 1
}

// ── Lade-Animation ──────────────────────────────────────────
function showLoading() {
  if (loadingBar) loadingBar.classList.add('active')
  if (loadingBarInner) {
    loadingBarInner.style.width = '0%'
    setTimeout(() => { if (loadingBarInner) loadingBarInner.style.width = '70%' }, 50)
  }
}
function hideLoading() {
  if (loadingBarInner) loadingBarInner.style.width = '100%'
  setTimeout(() => { if (loadingBar) loadingBar.classList.remove('active') }, 300)
}

// ── URL öffnen ───────────────────────────────────────────────
async function openUrl(url) {
  if (!url) return
  url = normalizeUrl(url)

  // Adressleiste aktualisieren
  if (addressbar) addressbar.value = url
  updateSecurityIcon(url)
  showLoading()

  // Startseite verstecken
  if (homePage) homePage.classList.add('hidden')
  if (webviewContainer) webviewContainer.classList.remove('hidden')

  // History
  if (history[historyIndex] !== url) {
    history = history.slice(0, historyIndex + 1)
    history.push(url)
    historyIndex = history.length - 1
  }
  updateNavBtns()
  currentUrl = url

  // Capacitor In-App Browser öffnen (native Android WebView)
  if (CapBrowser) {
    try {
      await CapBrowser.open({
        url,
        presentationStyle: 'fullscreen',
        toolbarColor: '#0e0e0e',
      })
      hideLoading()
      return
    } catch (e) {
      console.warn('Capacitor Browser plugin error:', e)
    }
  }

  // Fallback: window.open (öffnet externen Browser auf Android)
  window.open(url, '_system') || window.open(url, '_blank')
  hideLoading()
}

// ── Startseite anzeigen ──────────────────────────────────────
function showHome() {
  if (homePage) homePage.classList.remove('hidden')
  if (webviewContainer) webviewContainer.classList.add('hidden')
  if (addressbar) addressbar.value = ''
  updateSecurityIcon('')
  currentUrl = HOME_URL
  hideLoading()
}

// ── Event Listener ───────────────────────────────────────────

// Adressleiste — Enter
addressbar?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault()
    const url = addressbar.value.trim()
    if (url) openUrl(url)
  }
})

// Adressleiste — Fokus: ganzen Text markieren
addressbar?.addEventListener('focus', () => addressbar.select())

// Zurück
btnBack?.addEventListener('click', () => {
  if (historyIndex > 0) {
    historyIndex--
    const url = history[historyIndex]
    if (url) {
      if (addressbar) addressbar.value = url
      updateSecurityIcon(url)
      updateNavBtns()
      currentUrl = url
      openUrl(url)
    }
  }
})

// Vor
btnForward?.addEventListener('click', () => {
  if (historyIndex < history.length - 1) {
    historyIndex++
    const url = history[historyIndex]
    if (url) {
      if (addressbar) addressbar.value = url
      updateSecurityIcon(url)
      updateNavBtns()
      currentUrl = url
      openUrl(url)
    }
  }
})

// Neu laden
btnReload?.addEventListener('click', () => {
  if (currentUrl) openUrl(currentUrl)
})

// Startseite
btnHome?.addEventListener('click', showHome)

// Startseiten-Suche
homeSearchForm?.addEventListener('submit', e => {
  e.preventDefault()
  const query = homeSearchInput?.value.trim()
  if (query) openUrl(query)
})

// Schnellzugriff-Buttons
document.querySelectorAll('.shortcut-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const url = btn.dataset.url
    if (url) openUrl(url)
  })
})

// ── Initialisierung ──────────────────────────────────────────
updateNavBtns()


// ═══════════════════════════════════════════════════════════
// EDGE FEATURES INTEGRATION
// ═══════════════════════════════════════════════════════════

// Warte bis Edge Features geladen sind
document.addEventListener('DOMContentLoaded', () => {
  if (!window.TechHelpEdgeFeatures) {
    console.warn('Edge Features nicht geladen')
    return
  }

  const features = window.TechHelpEdgeFeatures

  // ── Vertikale Tabs Toggle ──────────────────────────────────
  const toggleVerticalTabs = document.getElementById('toggle-vertical-tabs')
  toggleVerticalTabs?.addEventListener('change', (e) => {
    if (e.target.checked) {
      features.verticalTabs.enable()
    } else {
      features.verticalTabs.disable()
    }
  })

  // ── Split-Screen ───────────────────────────────────────────
  const btnSplitScreen = document.getElementById('menu-split-screen')
  let splitScreenActive = false
  btnSplitScreen?.addEventListener('click', () => {
    if (splitScreenActive) {
      features.splitScreen.disable()
      btnSplitScreen.textContent = '⚏ Split-Screen aktivieren'
      splitScreenActive = false
    } else {
      features.splitScreen.enable()
      btnSplitScreen.textContent = '⚏ Split-Screen beenden'
      splitScreenActive = true
    }
  })

  // ── Web Capture (Screenshot) ───────────────────────────────
  const btnWebCapture = document.getElementById('menu-web-capture')
  btnWebCapture?.addEventListener('click', async () => {
    const path = await features.webCapture.captureVisible()
    if (path) {
      showNotification('Screenshot gespeichert: ' + path)
    } else {
      showNotification('Screenshot-Funktion wird auf dieser Plattform noch nicht unterstützt')
    }
  })

  // ── Sammlungen ─────────────────────────────────────────────
  const btnCollections = document.getElementById('menu-collections')
  const panelCollections = document.getElementById('panel-collections')
  const collectionsListEl = document.getElementById('collections-list')

  btnCollections?.addEventListener('click', () => {
    if (panelCollections) {
      panelCollections.style.display = 'block'
      panelCollections.setAttribute('aria-hidden', 'false')
      renderCollections()
    }
  })

  function renderCollections() {
    const collections = features.collections.getAllCollections()
    if (!collectionsListEl) return

    if (collections.length === 0) {
      collectionsListEl.innerHTML = '<p class="panel-empty">Keine Sammlungen vorhanden</p>'
      return
    }

    collectionsListEl.innerHTML = collections.map(col => `
      <div class="collection-item" data-id="${col.id}">
        <div class="collection-icon">📚</div>
        <div class="collection-content">
          <div class="collection-name">${col.name}</div>
          <div class="collection-count">${col.items.length} Elemente</div>
        </div>
        <div class="collection-actions">
          <button class="collection-btn" onclick="deleteCollection('${col.id}')" aria-label="Löschen">🗑</button>
        </div>
      </div>
    `).join('')
  }

  // Neue Sammlung erstellen
  const btnNewCollection = document.getElementById('btn-new-collection')
  btnNewCollection?.addEventListener('click', () => {
    const name = prompt('Name der neuen Sammlung:')
    if (name && name.trim()) {
      features.collections.createCollection(name.trim())
      renderCollections()
    }
  })

  // Global für onclick handler
  window.deleteCollection = (id) => {
    if (confirm('Sammlung wirklich löschen?')) {
      features.collections.deleteCollection(id)
      renderCollections()
    }
  }

  // ── Leseliste ──────────────────────────────────────────────
  const btnReadingList = document.getElementById('menu-reading-list')
  const panelReadingList = document.getElementById('panel-reading-list')
  const readingListContent = document.getElementById('reading-list-content')

  btnReadingList?.addEventListener('click', () => {
    if (panelReadingList) {
      panelReadingList.style.display = 'block'
      panelReadingList.setAttribute('aria-hidden', 'false')
      renderReadingList()
    }
  })

  function renderReadingList() {
    const items = features.readingList.getAll()
    if (!readingListContent) return

    if (items.length === 0) {
      readingListContent.innerHTML = '<p class="panel-empty">Leseliste ist leer</p>'
      return
    }

    readingListContent.innerHTML = items.map(item => `
      <div class="reading-item ${item.read ? 'read' : ''}" data-id="${item.id}">
        <div class="reading-favicon">📄</div>
        <div class="reading-content">
          <div class="reading-title">${item.title}</div>
          ${item.excerpt ? `<div class="reading-excerpt">${item.excerpt}</div>` : ''}
          <div class="reading-meta">${new Date(item.added).toLocaleDateString('de-DE')}</div>
        </div>
        <div class="reading-actions">
          <button class="collection-btn" onclick="markAsRead('${item.id}')" aria-label="Als gelesen markieren">✓</button>
          <button class="collection-btn" onclick="removeFromReadingList('${item.id}')" aria-label="Entfernen">🗑</button>
        </div>
      </div>
    `).join('')
  }

  window.markAsRead = (id) => {
    features.readingList.markAsRead(id)
    renderReadingList()
  }

  window.removeFromReadingList = (id) => {
    features.readingList.remove(id)
    renderReadingList()
  }

  // Zur Leseliste hinzufügen (Kontextmenü-Integration)
  window.addToReadingList = (title, url) => {
    features.readingList.add(title, url)
    showNotification('Zur Leseliste hinzugefügt')
  }

  // ── Preis-Tracker ──────────────────────────────────────────
  const btnPriceTracker = document.getElementById('menu-price-tracker-open')
  const panelPriceTracker = document.getElementById('panel-price-tracker')
  const priceTrackerList = document.getElementById('price-tracker-list')

  btnPriceTracker?.addEventListener('click', () => {
    if (panelPriceTracker) {
      panelPriceTracker.style.display = 'block'
      panelPriceTracker.setAttribute('aria-hidden', 'false')
      renderPriceTracker()
    }
  })

  function renderPriceTracker() {
    const items = features.priceTracker.getTracked()
    if (!priceTrackerList) return

    if (items.length === 0) {
      priceTrackerList.innerHTML = '<p class="panel-empty">Keine verfolgten Produkte</p>'
      return
    }

    priceTrackerList.innerHTML = items.map(item => `
      <div class="price-item" data-id="${item.id}">
        <div class="price-image" style="background-image:url('https://via.placeholder.com/60')"></div>
        <div class="price-content">
          <div class="price-product">${item.productName}</div>
          <div class="price-current">${item.currentPrice || 'Lädt...'} ${item.currency}</div>
        </div>
        <button class="collection-btn" onclick="untrackPrice('${item.id}')" aria-label="Entfernen">🗑</button>
      </div>
    `).join('')
  }

  window.untrackPrice = (id) => {
    features.priceTracker.untrack(id)
    renderPriceTracker()
  }

  // ── Panel-Close Handlers ───────────────────────────────────
  document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel
      const panelEl = document.getElementById(`panel-${panel}`)
      if (panelEl) {
        panelEl.style.display = 'none'
        panelEl.setAttribute('aria-hidden', 'true')
      }
    })
  })

  // ── Benachrichtigungs-System ───────────────────────────────
  function showNotification(message) {
    let notif = document.querySelector('.copy-notification')
    if (!notif) {
      notif = document.createElement('div')
      notif.className = 'copy-notification'
      notif.innerHTML = `
        <svg class="copy-notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span class="copy-notification-text"></span>
      `
      document.body.appendChild(notif)
    }

    const text = notif.querySelector('.copy-notification-text')
    if (text) text.textContent = message

    notif.classList.add('show')
    setTimeout(() => notif.classList.remove('show'), 3000)
  }

  window.showNotification = showNotification

  console.log('✅ Edge Features UI integriert')
})


// ═══════════════════════════════════════════════════════════
// PASSWORT-MANAGER INTEGRATION
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.TechHelpSecurityManager) {
    console.warn('Passwort-Manager nicht geladen')
    return
  }

  const security = window.TechHelpSecurityManager

  // ── Master-Passwort Setup ──────────────────────────────────
  const masterPasswordPanel = document.getElementById('panel-master-password')
  const masterPasswordInput = document.getElementById('master-password-input')
  const masterPasswordConfirm = document.getElementById('master-password-confirm')
  const masterPasswordSave = document.getElementById('master-password-save')
  const passwordStrengthBar = document.getElementById('password-strength-bar')

  // Master-Passwort Stärke anzeigen
  masterPasswordInput?.addEventListener('input', () => {
    const password = masterPasswordInput.value
    const strength = calculatePasswordStrength(password)
    
    passwordStrengthBar.className = 'password-strength-bar ' + strength
  })

  function calculatePasswordStrength(password) {
    if (password.length < 8) return 'weak'
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 'medium'
    return 'strong'
  }

  // Master-Passwort speichern
  masterPasswordSave?.addEventListener('click', async () => {
    const password = masterPasswordInput.value
    const confirm = masterPasswordConfirm.value

    if (password !== confirm) {
      alert('Passwörter stimmen nicht überein!')
      return
    }

    if (password.length < 8) {
      alert('Passwort muss mindestens 8 Zeichen lang sein!')
      return
    }

    localStorage.setItem('techhelp_has_master_password', 'true')
    await security.initialize(password)
    
    masterPasswordPanel.style.display = 'none'
    showNotification('Master-Passwort erfolgreich festgelegt!')
  })

  // Prüfen ob Master-Passwort bereits existiert
  const hasMasterPassword = localStorage.getItem('techhelp_has_master_password')
  if (!hasMasterPassword) {
    // Erstes Mal - Master-Passwort einrichten
    setTimeout(() => {
      if (masterPasswordPanel) {
        masterPasswordPanel.style.display = 'block'
        masterPasswordPanel.setAttribute('aria-hidden', 'false')
      }
    }, 1000)
  } else {
    // Master-Passwort abfragen
    const password = prompt('Bitte Master-Passwort eingeben:')
    if (password) {
      try {
        await security.initialize(password)
      } catch (error) {
        alert('Falsches Master-Passwort!')
      }
    }
  }

  // ── Passwörter Panel ───────────────────────────────────────
  const btnPasswords = document.getElementById('menu-passwords')
  const panelPasswords = document.getElementById('panel-passwords')
  const passwordsContent = document.getElementById('passwords-content')

  btnPasswords?.addEventListener('click', () => {
    if (panelPasswords) {
      panelPasswords.style.display = 'block'
      panelPasswords.setAttribute('aria-hidden', 'false')
      renderPasswords()
    }
  })

  function renderPasswords() {
    const credentials = security.passwordManager.getAllCredentials()
    if (!passwordsContent) return

    if (credentials.length === 0) {
      passwordsContent.innerHTML = `
        <div class="pm-empty">
          <div class="pm-empty-icon">🔐</div>
          <div class="pm-empty-title">Keine gespeicherten Passwörter</div>
          <div class="pm-empty-desc">Passwörter werden automatisch beim Login angeboten</div>
        </div>
      `
      return
    }

    passwordsContent.innerHTML = credentials.map(cred => `
      <div class="password-item" data-id="${cred.id}">
        <div class="password-item-icon">🌐</div>
        <div class="password-item-content">
          <div class="password-item-name">${cred.name}</div>
          <div class="password-item-username">${cred.username}</div>
          <div class="password-item-url">${cred.url}</div>
        </div>
        <div class="password-item-actions">
          <button class="password-action-btn" onclick="copyPassword('${cred.id}')" title="Kopieren">📋</button>
          <button class="password-action-btn danger" onclick="deletePassword('${cred.id}')" title="Löschen">🗑</button>
        </div>
      </div>
    `).join('')
  }

  // Passwort kopieren
  window.copyPassword = async (id) => {
    const cred = security.passwordManager.getAllCredentials().find(c => c.id === id)
    if (cred) {
      await navigator.clipboard.writeText(cred.password)
      showNotification('Passwort kopiert!')
    }
  }

  // Passwort löschen
  window.deletePassword = async (id) => {
    if (confirm('Passwort wirklich löschen?')) {
      await security.passwordManager.deleteCredential(id)
      renderPasswords()
      showNotification('Passwort gelöscht')
    }
  }

  // Passwort hinzufügen
  const btnAddPassword = document.getElementById('pm-add-password-btn')
  btnAddPassword?.addEventListener('click', () => {
    const url = prompt('Website-URL:')
    if (!url) return

    const username = prompt('Benutzername / E-Mail:')
    if (!username) return

    const password = prompt('Passwort:')
    if (!password) return

    security.passwordManager.addCredential(url, username, password)
    renderPasswords()
    showNotification('Passwort gespeichert!')
  })

  // Export
  const btnExport = document.getElementById('pm-export-btn')
  btnExport?.addEventListener('click', async () => {
    const csv = await security.passwordManager.exportData()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'techhelp-passwords-export.csv'
    a.click()
    showNotification('Passwörter exportiert!')
  })

  // ── Zahlungsmethoden Panel ────────────────────────────────
  const btnPayments = document.getElementById('menu-payments')
  const panelPayments = document.getElementById('panel-payments')
  const cardsList = document.getElementById('cards-list')

  btnPayments?.addEventListener('click', () => {
    if (panelPayments) {
      panelPayments.style.display = 'block'
      panelPayments.setAttribute('aria-hidden', 'false')
      renderCards()
    }
  })

  function renderCards() {
    const cards = security.paymentManager.getCards()
    if (!cardsList) return

    if (cards.length === 0) {
      cardsList.innerHTML = `
        <div class="pm-empty">
          <div class="pm-empty-icon">💳</div>
          <div class="pm-empty-title">Keine Karten gespeichert</div>
        </div>
      `
      return
    }

    cardsList.innerHTML = cards.map(card => `
      <div class="card-item" data-id="${card.id}">
        <div class="card-icon">💳</div>
        <div class="card-content">
          <div class="card-nickname">${card.nickname}</div>
          <div class="card-number">${card.cardNumber}</div>
          <div class="card-expiry">Gültig bis ${card.expiryMonth}/${card.expiryYear}</div>
        </div>
        <button class="password-action-btn danger" onclick="deleteCard('${card.id}')" title="Löschen">🗑</button>
      </div>
    `).join('')
  }

  window.deleteCard = async (id) => {
    if (confirm('Karte wirklich löschen?')) {
      await security.paymentManager.deleteCard(id)
      renderCards()
      showNotification('Karte gelöscht')
    }
  }

  // Karte hinzufügen
  const btnAddCard = document.getElementById('pm-add-card-btn')
  btnAddCard?.addEventListener('click', () => {
    const cardData = {
      cardholderName: prompt('Karteninhaber:'),
      cardNumber: prompt('Kartennummer:'),
      expiryMonth: prompt('Ablaufmonat (MM):'),
      expiryYear: prompt('Ablaufjahr (YYYY):'),
      cvv: prompt('CVV:'),
      nickname: prompt('Spitzname (optional):') || undefined
    }

    if (cardData.cardholderName && cardData.cardNumber) {
      security.paymentManager.addCard(cardData)
      renderCards()
      showNotification('Karte gespeichert!')
    }
  })

  // ── Google Sign-In ─────────────────────────────────────────
  const btnGoogleSignIn = document.getElementById('menu-google-signin')
  const panelGoogleSignIn = document.getElementById('panel-google-signin')
  const googleSignInContent = document.getElementById('google-signin-content')
  const googleSignInAction = document.getElementById('google-signin-action')

  btnGoogleSignIn?.addEventListener('click', () => {
    if (panelGoogleSignIn) {
      panelGoogleSignIn.style.display = 'block'
      panelGoogleSignIn.setAttribute('aria-hidden', 'false')
      updateGoogleSignInUI()
    }
  })

  function updateGoogleSignInUI() {
    const user = security.googleAuth.getUser()
    
    if (user) {
      // Angemeldet
      googleSignInContent.innerHTML = `
        <div class="user-profile">
          <img class="user-avatar" src="${user.picture}" alt="${user.name}">
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-email">${user.email}</div>
          </div>
        </div>
        <div class="pm-form">
          <button class="pm-btn pm-btn-primary" id="google-sync-btn">Cloud-Sync aktivieren</button>
          <button class="pm-btn pm-btn-secondary" id="google-signout-btn">Abmelden</button>
        </div>
      `

      document.getElementById('google-sync-btn')?.addEventListener('click', () => {
        security.cloudSync.enable(user.id, 'demo-token')
        showNotification('Cloud-Sync aktiviert!')
      })

      document.getElementById('google-signout-btn')?.addEventListener('click', async () => {
        await security.googleAuth.signOut()
        updateGoogleSignInUI()
        showNotification('Abgemeldet')
      })
    } else {
      // Nicht angemeldet - Original Button wiederherstellen
      if (!googleSignInAction) return
      googleSignInAction.onclick = async () => {
        // Google Client ID (muss in production ersetzt werden)
        await security.googleAuth.initialize('YOUR_GOOGLE_CLIENT_ID')
        await security.googleAuth.signIn()
        updateGoogleSignInUI()
        showNotification('Anmeldung erfolgreich!')
      }
    }
  }

  // ── Auto-Fill Toggle ───────────────────────────────────────
  const toggleAutoFill = document.getElementById('toggle-autofill')
  toggleAutoFill?.addEventListener('change', (e) => {
    if (e.target.checked) {
      security.autoFillManager.enable()
      showNotification('Auto-Fill aktiviert')
    } else {
      security.autoFillManager.disable()
      showNotification('Auto-Fill deaktiviert')
    }
  })

  console.log('✅ Passwort-Manager UI integriert')
})


// ═══════════════════════════════════════════════════════════
// AUTO-UPDATER INTEGRATION
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  if (!window.TechHelpAutoUpdater) {
    console.warn('Auto-Updater nicht geladen')
    return
  }

  const updater = window.TechHelpAutoUpdater

  // ── Manueller Update-Check ─────────────────────────────────
  const btnCheckUpdates = document.getElementById('menu-check-updates')
  btnCheckUpdates?.addEventListener('click', async () => {
    // Loading-Anzeige
    const originalText = btnCheckUpdates.innerHTML
    btnCheckUpdates.innerHTML = '<span class="menu-icon">⏳</span> Prüfe...'
    btnCheckUpdates.disabled = true

    await updater.checkNow()

    // Zurücksetzen
    setTimeout(() => {
      btnCheckUpdates.innerHTML = originalText
      btnCheckUpdates.disabled = false
    }, 1000)
  })

  // ── Version im Menü anzeigen ───────────────────────────────
  const updateVersionInfo = () => {
    const info = updater.getUpdateInfo()
    const versionElement = document.getElementById('menu-version')
    
    if (versionElement) {
      if (info.updateAvailable) {
        versionElement.innerHTML = `
          TechHelp Browser v${info.currentVersion}
          <br><span style="color: var(--accent); font-size: 11px;">
            🎉 Update ${info.latestRelease.tag_name} verfügbar!
          </span>
        `
      } else {
        versionElement.textContent = `TechHelp Browser v${info.currentVersion}`
      }
    }
  }

  // Initial und bei Update-Events
  updateVersionInfo()
  window.addEventListener('update-available', updateVersionInfo)

  // ── Electron-Integration (wenn verfügbar) ──────────────────
  if (window.electron) {
    // Electron IPC für native Updates
    window.electron.onUpdateAvailable((info) => {
      console.log('Update verfügbar (Electron):', info)
      updater.latestRelease = info
      updater.updateAvailable = true
      updater.showUpdateNotification(info)
    })

    window.electron.onUpdateDownloaded(() => {
      const notification = document.createElement('div')
      notification.className = 'update-notification show'
      notification.innerHTML = `
        <div class="update-content">
          <div class="update-icon">✅</div>
          <div class="update-info">
            <div class="update-title">Update bereit!</div>
            <div class="update-version">Neustart zum Installieren</div>
          </div>
        </div>
        <div class="update-actions">
          <button class="update-btn update-btn-primary" onclick="window.electron.restartApp()">
            Jetzt neu starten
          </button>
          <button class="update-btn update-btn-secondary" onclick="this.parentElement.parentElement.remove()">
            Später
          </button>
        </div>
      `
      document.body.appendChild(notification)
    })
  }

  console.log('✅ Auto-Updater UI integriert')
})
