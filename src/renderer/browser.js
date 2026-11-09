/**
 * TechHelp Support Browser - Electron WebView Logic
 * Copyright © 2026 TechHelp Support. All Rights Reserved.
 */

'use strict'

// DOM Elements
const addressbar = document.getElementById('addressbar')
const btnBack = document.getElementById('btn-back')
const btnForward = document.getElementById('btn-forward')
const btnReload = document.getElementById('btn-reload')
const btnHome = document.getElementById('btn-home')
const btnMenu = document.getElementById('btn-menu')
const homePage = document.getElementById('home-page')
const webviewContainer = document.getElementById('webview-container')
const webview = document.getElementById('browser-webview')
const loadingBar = document.getElementById('loading-bar')
const securityIcon = document.getElementById('security-icon')
const homeSearchForm = document.getElementById('home-search-form')
const homeSearchInput = document.getElementById('home-search-input')

const SEARCH_ENGINE = 'https://www.google.com/search?q='
const HOME_URL = 'https://techhelp-support.de'

// Normalize URL
function normalizeUrl(input) {
  input = input.trim()
  if (!input) return HOME_URL
  
  if (/^https?:\/\//i.test(input)) return input
  if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(input) && !input.includes(' ')) {
    return 'https://' + input
  }
  return SEARCH_ENGINE + encodeURIComponent(input)
}

// Update security icon
function updateSecurityIcon(url) {
  if (url.startsWith('https://')) {
    securityIcon.style.color = '#7df9d2'
    securityIcon.title = 'Sichere Verbindung (HTTPS)'
  } else {
    securityIcon.style.color = '#888'
    securityIcon.title = 'Ungesicherte Verbindung'
  }
}

// Navigate to URL
function navigate(url) {
  url = normalizeUrl(url)
  
  // Show webview, hide home
  homePage.style.display = 'none'
  webviewContainer.style.display = 'block'
  webview.style.display = 'block'
  
  // Load URL
  webview.src = url
  addressbar.value = url
  updateSecurityIcon(url)
}

// Show home page
function showHome() {
  homePage.style.display = 'flex'
  webviewContainer.style.display = 'none'
  webview.style.display = 'none'
  addressbar.value = ''
}

// Event Listeners
addressbar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    navigate(addressbar.value)
  }
})

btnBack.addEventListener('click', () => {
  if (webview.canGoBack()) webview.goBack()
})

btnForward.addEventListener('click', () => {
  if (webview.canGoForward()) webview.goForward()
})

btnReload.addEventListener('click', () => {
  if (webview.src && webview.src !== 'about:blank') {
    webview.reload()
  }
})

btnHome.addEventListener('click', () => {
  showHome()
})

btnMenu.addEventListener('click', () => {
  if (window.togglePanel) {
    window.togglePanel('panel-edge-features')
  } else {
    // Fallback wenn edge-features.js noch nicht geladen
    const panel = document.getElementById('panel-edge-features')
    if (panel) {
      const isHidden = panel.style.display === 'none' || !panel.style.display
      panel.style.display = isHidden ? 'block' : 'none'
      panel.setAttribute('aria-hidden', isHidden ? 'false' : 'true')
    }
  }
})

// Home search
homeSearchForm?.addEventListener('submit', (e) => {
  e.preventDefault()
  const query = homeSearchInput.value
  if (query) navigate(query)
})

// Shortcut buttons
document.querySelectorAll('.shortcut-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const url = btn.dataset.url
    if (url) navigate(url)
  })
})

// Webview events
webview.addEventListener('did-start-loading', () => {
  loadingBar.classList.add('active')
  btnBack.disabled = !webview.canGoBack()
  btnForward.disabled = !webview.canGoForward()
})

webview.addEventListener('did-stop-loading', () => {
  loadingBar.classList.remove('active')
  btnBack.disabled = !webview.canGoBack()
  btnForward.disabled = !webview.canGoForward()
})

webview.addEventListener('did-navigate', (e) => {
  addressbar.value = e.url
  updateSecurityIcon(e.url)
})

webview.addEventListener('did-navigate-in-page', (e) => {
  addressbar.value = e.url
  updateSecurityIcon(e.url)
})

webview.addEventListener('page-title-updated', (e) => {
  document.title = e.title + ' - TechHelp Browser'
})

// Initialize - show home page
showHome()

// Window Controls
if (window.thBrowser) {
  const btnMinimize = document.getElementById('btn-minimize')
  const btnMaximize = document.getElementById('btn-maximize')
  const btnClose = document.getElementById('btn-close')

  btnMinimize?.addEventListener('click', () => {
    window.thBrowser.minimize()
  })

  btnMaximize?.addEventListener('click', async () => {
    const isMaximized = await window.thBrowser.isMaximized()
    if (isMaximized) {
      window.thBrowser.maximize() // Unmaximize
    } else {
      window.thBrowser.maximize()
    }
  })

  btnClose?.addEventListener('click', () => {
    window.thBrowser.close()
  })
}

console.log('✅ Browser WebView initialized')
