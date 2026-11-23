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
