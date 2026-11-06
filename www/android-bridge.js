'use strict'
/**
 * android-bridge.js
 * Stellt die gleiche window.thBrowser API wie der Electron-Preload bereit,
 * aber auf Basis von localStorage + iframe (kein IPC).
 * Wird nur in der www/-Version (Android/Capacitor) geladen.
 */

;(function () {
  if (window.thBrowser) return // Electron-Preload bereits vorhanden → nichts tun

  // ── Persistenz via localStorage ──
  const STORE_KEY = 'thbrowser_store'

  function storeLoad () {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {} } catch { return {} }
  }
  function storeSave (data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)) } catch {}
  }

  const defaults = {
    windowBounds:   { width: window.innerWidth, height: window.innerHeight },
    homepage:       'https://techhelp-support.de',
    bookmarks: [
      { title: 'TechHelp Support', url: 'https://techhelp-support.de',     favicon: null },
      { title: 'TechHelp Bot',     url: 'https://bot.techhelp-support.de', favicon: null },
      { title: 'Discord',          url: 'https://discord.gg/kDAPDXdC7q',   favicon: null },
    ],
    history:         [],
    downloads:       [],
    theme:           'dark',
    searchEngine:    'google',
    adblockEnabled:  true,
  }

  function storeGet (key) {
    const data = storeLoad()
    return key in data ? data[key] : defaults[key]
  }
  function storeSet (key, value) {
    const data = storeLoad()
    data[key] = value
    storeSave(data)
  }

  // ── Android-Navigation (WebView via iframe) ──
  // Auf Android öffnen wir URLs in einem Vollbild-iframe
  let currentIframe = null
  function getCurrentIframe () { return currentIframe }

  // ── thBrowser API (identisch zum Electron-Preload) ──
  window.thBrowser = {
    // Fenstersteuerung → auf Android no-ops
    minimize:    () => Promise.resolve(),
    maximize:    () => Promise.resolve(),
    close:       () => { if (window.Capacitor?.App) window.Capacitor.App.exitApp(); else window.close() },
    isMaximized: () => Promise.resolve(true),

    // Store
    storeGet:    (key)        => Promise.resolve(storeGet(key)),
    storeSet:    (key, value) => { storeSet(key, value); return Promise.resolve() },

    // Verlauf
    historyAdd: async (entry) => {
      const history = storeGet('history') || []
      if (history.length > 0 && history[0].url === entry.url) return
      history.unshift({ ...entry, timestamp: Date.now() })
      if (history.length > 1000) history.pop()
      storeSet('history', history)
    },
    historyGet:   () => Promise.resolve(storeGet('history') || []),
    historyClear: () => { storeSet('history', []); return Promise.resolve() },

    // Lesezeichen
    bookmarksGet: () => Promise.resolve(storeGet('bookmarks') || []),
    bookmarksAdd: async (bookmark) => {
      const bms = storeGet('bookmarks') || []
      if (!bms.find(b => b.url === bookmark.url)) bms.push(bookmark)
      storeSet('bookmarks', bms)
      return bms
    },
    bookmarksRemove: async (url) => {
      const bms = (storeGet('bookmarks') || []).filter(b => b.url !== url)
      storeSet('bookmarks', bms)
      return bms
    },

    // Dialoge (Android: kein nativer Dialog → Fallback)
    showSaveDialog: () => Promise.resolve({ canceled: true }),

    // App-Info
    appVersion: () => Promise.resolve('1.0.0'),

    // Event-System (no-op auf Android – Downloads werden anders behandelt)
    on:  () => {},
    off: () => {},

    // Android-spezifisch: gibt aktuellen iframe zurück
    getCurrentIframe,
  }

  // ── iframe-Navigation für Android ──
  // browser.js ruft navigateTo() → webview.src = url
  // Auf Android patchen wir <webview> durch <iframe>
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('webview-container')
    if (!container) return

    // Beobachte wenn eine webview eingefügt wird und ersetze sie durch iframe
    const mo = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.tagName === 'WEBVIEW') {
            const iframe = document.createElement('iframe')
            iframe.id        = node.id
            iframe.className = node.className
            iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none'
            iframe.setAttribute('sandbox',
              'allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation')
            iframe.setAttribute('allow', 'autoplay; fullscreen; geolocation')
            // Alle Attribute übernehmen
            Array.from(node.attributes).forEach(a => {
              if (!['src','partition','allowpopups','webpreferences'].includes(a.name)) {
                iframe.setAttribute(a.name, a.value)
              }
            })
            node.replaceWith(iframe)
            currentIframe = iframe

            // Methoden-Shim (werden von browser.js aufgerufen)
            iframe.canGoBack    = () => false
            iframe.canGoForward = () => false
            iframe.goBack       = () => history.back()
            iframe.goForward    = () => history.forward()
            iframe.reload       = () => { iframe.src = iframe.src }
            iframe.stop         = () => {}
            iframe.getZoomFactor     = () => 1
            iframe.setZoomFactor     = () => {}
            iframe.openDevTools      = () => {}
            iframe.clearHistory      = () => {}

            // Lade-Events simulieren
            iframe.addEventListener('load', () => {
              iframe.dispatchEvent(new CustomEvent('did-stop-loading'))
              try {
                iframe.dispatchEvent(new CustomEvent('page-title-updated',
                  { detail: { title: iframe.contentDocument?.title || iframe.src } }))
              } catch {}
            })
          }
        })
      })
    })
    mo.observe(container, { childList: true })
  })

  // ── Android Back-Button → Tab zurück oder App schließen ──
  document.addEventListener('backbutton', (e) => {
    e.preventDefault()
    const iframe = currentIframe
    if (iframe?.canGoBack && iframe.canGoBack()) {
      iframe.goBack()
    } else {
      // Signal an browser.js: aktiven Tab schließen oder App schließen
      document.dispatchEvent(new CustomEvent('android-back'))
    }
  })

  console.log('[Techhelp Support Browser] Android-Bridge initialisiert')
})()
