'use strict'

/* ══════════════════════════════════════════════════════
   KONFIGURATION & STATE
══════════════════════════════════════════════════════ */
const SEARCH_ENGINES = {
  google:     q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  bing:       q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  duckduckgo: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  ecosia:     q => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}`,
  brave:      q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
}
const SEARCH_BADGES = { google:'G', bing:'B', duckduckgo:'D', ecosia:'E', brave:'🦁' }

let tabs       = []      // Array von Tab-Objekten
let activeTabId = null   // ID des aktiven Tabs
let tabCounter  = 0      // Eindeutige Tab-IDs
let downloads   = []     // Download-Einträge
let bookmarks   = []
let settings    = { homepage:'https://techhelp-support.de', searchEngine:'google', adblockEnabled:true }
let openPanel   = null   // Aktuell geöffnetes Panel

/* ══════════════════════════════════════════════════════
   DOM-REFERENZEN
══════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id)
const dom = {
  tabBar:         $('tab-bar'),
  btnNewTab:      $('btn-new-tab'),
  wcMin:          $('wc-min'),
  wcMax:          $('wc-max'),
  wcClose:        $('wc-close'),
  btnBack:        $('btn-back'),
  btnForward:     $('btn-forward'),
  btnReload:      $('btn-reload'),
  btnHome:        $('btn-home'),
  addressbar:     $('addressbar'),
  addressbarWrap: $('addressbar-wrap'),
  addressbarClear:$('addressbar-clear'),
  securityIcon:   $('security-icon'),
  btnBookmark:    $('btn-bookmark'),
  btnDownloads:   $('btn-downloads'),
  btnMenu:        $('btn-menu'),
  contentArea:    $('content-area'),
  newtabPage:     $('newtab-page'),
  webviewContainer:$('webview-container'),
  loadingBar:     $('loading-bar'),
  loadingBarInner:$('loading-bar-inner'),
  newtabGreeting: $('newtab-greeting'),
  newtabSearch:   $('newtab-search-input'),
  searchBadge:    $('search-engine-badge'),
  shortcuts:      $('newtab-shortcuts'),
  recentGrid:     $('recent-grid'),
  bookmarksList:  $('bookmarks-list'),
  downloadsList:  $('downloads-list'),
  historyList:    $('history-list'),
  historySearch:  $('history-search'),
  historyClearBtn:$('history-clear-btn'),
  menuVersion:    $('menu-version'),
  settingsVersion:$('settings-version'),
  settingHomepage:$('setting-homepage'),
  settingSearchEngine:$('setting-search-engine'),
  settingAdblock: $('setting-adblock'),
  backdrop:       $('panel-backdrop'),
  contextMenu:    $('context-menu'),
}

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
async function init() {
  // Einstellungen laden
  settings.homepage     = await window.thBrowser.storeGet('homepage')
  settings.searchEngine = await window.thBrowser.storeGet('searchEngine')
  settings.adblockEnabled = await window.thBrowser.storeGet('adblockEnabled')
  bookmarks = await window.thBrowser.bookmarksGet()

  // UI vorbereiten
  updateGreeting()
  updateSearchBadge()
  renderShortcuts()
  renderRecentHistory()

  // Version
  const ver = await window.thBrowser.appVersion()
  dom.menuVersion.textContent = `Techhelp Support Browser v${ver}`
  dom.settingsVersion.textContent = ver

  // Einstellungs-Felder füllen
  dom.settingHomepage.value = settings.homepage
  dom.settingSearchEngine.value = settings.searchEngine
  dom.settingAdblock.checked = settings.adblockEnabled

  // Ersten Tab öffnen (Startseite = New-Tab-Seite)
  createTab()

  // Event-Listener registrieren
  bindEvents()
  bindDownloadEvents()

  // Fenster-Maximiert-Status
  const max = await window.thBrowser.isMaximized()
  dom.wcMax.title = max ? 'Wiederherstellen' : 'Maximieren'
}

/* ══════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════ */
function createTab(url = null) {
  const id = ++tabCounter
  const tab = { id, url: null, title: 'Neuer Tab', favicon: null, loading: false, webview: null }
  tabs.push(tab)

  // WebView erzeugen
  const wv = document.createElement('webview')
  wv.id = `wv-${id}`
  wv.setAttribute('partition', `persist:tab${id}`)
  wv.setAttribute('allowpopups', 'false')
  wv.setAttribute('webpreferences', 'contextIsolation=yes')
  dom.webviewContainer.appendChild(wv)
  tab.webview = wv

  // WebView-Events
  wv.addEventListener('did-start-loading',  () => onLoadStart(id))
  wv.addEventListener('did-stop-loading',   () => onLoadStop(id))
  wv.addEventListener('did-fail-load',      (e) => onLoadFail(id, e))
  wv.addEventListener('page-title-updated', (e) => onTitleUpdate(id, e.title))
  wv.addEventListener('page-favicon-updated',(e) => onFaviconUpdate(id, e.favicons))
  wv.addEventListener('did-navigate',       (e) => onNavigate(id, e.url))
  wv.addEventListener('did-navigate-in-page',(e) => onNavigate(id, e.url))
  wv.addEventListener('new-window',         (e) => createTab(e.url))
  wv.addEventListener('context-menu',       (e) => showContextMenu(e))
  wv.addEventListener('update-target-url',  (e) => {
    // Status-Leiste (nur visuell in Adressleiste zeigen wenn Hover)
  })

  // Tab-Leiste rendern
  renderTabBar()
  activateTab(id)

  // URL laden
  if (url) {
    navigateTo(url, id)
  }

  return id
}

function activateTab(id) {
  activeTabId = id

  // Alle WebViews ausblenden, aktiven einblenden
  tabs.forEach(t => {
    if (t.webview) t.webview.classList.toggle('active', t.id === id)
  })

  // Tab-Leiste aktualisieren
  renderTabBar()

  const tab = getTab(id)
  if (!tab) return

  // Adressleiste aktualisieren
  updateAddressbar(tab.url)
  updateNavButtons(id)

  // New-Tab-Seite vs WebView
  if (!tab.url) {
    dom.newtabPage.classList.remove('hidden')
    dom.webviewContainer.classList.remove('visible')
    renderRecentHistory()
    renderShortcuts()
  } else {
    dom.newtabPage.classList.add('hidden')
    dom.webviewContainer.classList.add('visible')
  }
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id)
  if (idx === -1) return

  // WebView entfernen
  const tab = tabs[idx]
  if (tab.webview) tab.webview.remove()
  tabs.splice(idx, 1)

  // Letzten Tab schließen → Browser schließen
  if (tabs.length === 0) {
    window.thBrowser.close()
    return
  }

  // Nächsten Tab aktivieren
  const nextIdx = Math.min(idx, tabs.length - 1)
  activateTab(tabs[nextIdx].id)
  renderTabBar()
}

function getTab(id) { return tabs.find(t => t.id === id) }

function renderTabBar() {
  dom.tabBar.innerHTML = ''
  tabs.forEach(tab => {
    const el = document.createElement('div')
    el.className = `tab${tab.id === activeTabId ? ' active' : ''}`
    el.setAttribute('role', 'tab')
    el.setAttribute('aria-selected', tab.id === activeTabId)
    el.dataset.tabId = tab.id

    // Favicon / Ladeanimation
    if (tab.loading) {
      const spinner = document.createElement('div')
      spinner.className = 'tab-loading'
      el.appendChild(spinner)
    } else if (tab.favicon) {
      const img = document.createElement('img')
      img.className = 'tab-favicon'
      img.src = tab.favicon
      img.alt = ''
      img.onerror = () => img.remove()
      el.appendChild(img)
    } else {
      const icon = document.createElement('span')
      icon.textContent = '🌐'
      icon.style.cssText = 'font-size:11px;flex-shrink:0'
      el.appendChild(icon)
    }

    // Titel
    const title = document.createElement('span')
    title.className = 'tab-title'
    title.textContent = tab.title || 'Neuer Tab'
    el.appendChild(title)

    // Schließen-Button
    const close = document.createElement('button')
    close.className = 'tab-close'
    close.textContent = '✕'
    close.setAttribute('aria-label', `Tab "${tab.title}" schließen`)
    close.addEventListener('click', e => { e.stopPropagation(); closeTab(tab.id) })
    el.appendChild(close)

    // Tab aktivieren per Klick
    el.addEventListener('click', () => activateTab(tab.id))

    // Mittlere Maustaste → Tab schließen
    el.addEventListener('mousedown', e => { if (e.button === 1) { e.preventDefault(); closeTab(tab.id) } })

    dom.tabBar.appendChild(el)
  })
}

/* ══════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════ */
function navigateTo(input, tabId = activeTabId) {
  const tab = getTab(tabId)
  if (!tab) return

  const url = resolveInput(input)
  tab.url = url

  dom.newtabPage.classList.add('hidden')
  dom.webviewContainer.classList.add('visible')

  if (tab.webview) {
    tab.webview.src = url
  }

  if (tabId === activeTabId) {
    updateAddressbar(url)
    updateNavButtons(tabId)
  }
}

function resolveInput(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return settings.homepage

  // Schon eine URL?
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[a-z0-9]([a-z0-9\-]*\.)+[a-z]{2,}/i.test(trimmed) && !trimmed.includes(' ')) {
    return 'https://' + trimmed
  }

  // Suchmaschine
  const engine = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.google
  return engine(trimmed)
}

function updateAddressbar(url) {
  if (document.activeElement !== dom.addressbar) {
    dom.addressbar.value = url || ''
  }
  updateSecurityIcon(url)
}

function updateSecurityIcon(url) {
  const si = dom.securityIcon
  if (!url) { si.className = 'security-icon insecure'; return }
  if (url.startsWith('https://')) {
    si.className = 'security-icon'
    si.title = 'Sichere Verbindung (HTTPS)'
  } else {
    si.className = 'security-icon insecure'
    si.title = 'Unsichere Verbindung (HTTP)'
  }
}

function updateNavButtons(tabId) {
  const tab = getTab(tabId)
  if (!tab?.webview) { dom.btnBack.disabled = true; dom.btnForward.disabled = true; return }
  try {
    dom.btnBack.disabled    = !tab.webview.canGoBack()
    dom.btnForward.disabled = !tab.webview.canGoForward()
  } catch { dom.btnBack.disabled = true; dom.btnForward.disabled = true }
}

/* ══════════════════════════════════════════════════════
   WEBVIEW-EVENTS
══════════════════════════════════════════════════════ */
function onLoadStart(id) {
  const tab = getTab(id)
  if (!tab) return
  tab.loading = true
  renderTabBar()
  if (id === activeTabId) showLoadingBar()
}

function onLoadStop(id) {
  const tab = getTab(id)
  if (!tab) return
  tab.loading = false
  renderTabBar()
  if (id === activeTabId) {
    hideLoadingBar()
    updateNavButtons(id)
  }
}

function onLoadFail(id, e) {
  if (e.errorCode === -3) return // Abbruch durch Benutzer
  const tab = getTab(id)
  if (!tab) return
  tab.loading = false
  renderTabBar()
  if (id === activeTabId) hideLoadingBar()
}

function onTitleUpdate(id, title) {
  const tab = getTab(id)
  if (!tab) return
  tab.title = title
  renderTabBar()
  if (id === activeTabId && document.title !== title) document.title = title
}

function onFaviconUpdate(id, favicons) {
  const tab = getTab(id)
  if (!tab) return
  tab.favicon = favicons?.[0] || null
  renderTabBar()
}

async function onNavigate(id, url) {
  const tab = getTab(id)
  if (!tab) return
  tab.url = url
  if (id === activeTabId) {
    updateAddressbar(url)
    updateNavButtons(id)
  }
  // Verlauf speichern
  if (url && !url.startsWith('about:')) {
    await window.thBrowser.historyAdd({ url, title: tab.title || url })
  }
}

/* ══════════════════════════════════════════════════════
   LADE-BALKEN
══════════════════════════════════════════════════════ */
let loadProgress = 0
let loadTimer = null
function showLoadingBar() {
  clearInterval(loadTimer)
  loadProgress = 0
  dom.loadingBar.classList.add('visible')
  dom.loadingBarInner.style.width = '0%'
  // Fake-Fortschritt
  loadTimer = setInterval(() => {
    loadProgress = Math.min(loadProgress + (Math.random() * 8), 85)
    dom.loadingBarInner.style.width = loadProgress + '%'
  }, 200)
}
function hideLoadingBar() {
  clearInterval(loadTimer)
  dom.loadingBarInner.style.width = '100%'
  setTimeout(() => {
    dom.loadingBar.classList.remove('visible')
    dom.loadingBarInner.style.width = '0%'
  }, 300)
}

/* ══════════════════════════════════════════════════════
   NEW-TAB-SEITE
══════════════════════════════════════════════════════ */
function updateGreeting() {
  const h = new Date().getHours()
  let greeting = 'Guten Tag!'
  if (h < 5)       greeting = 'Gute Nacht!'
  else if (h < 12) greeting = 'Guten Morgen!'
  else if (h < 17) greeting = 'Guten Tag!'
  else if (h < 22) greeting = 'Guten Abend!'
  else              greeting = 'Gute Nacht!'
  dom.newtabGreeting.textContent = greeting
}

function updateSearchBadge() {
  dom.searchBadge.textContent = SEARCH_BADGES[settings.searchEngine] || 'G'
}

async function renderShortcuts() {
  bookmarks = await window.thBrowser.bookmarksGet()
  dom.shortcuts.innerHTML = ''
  bookmarks.slice(0, 8).forEach(bm => {
    const el = document.createElement('div')
    el.className = 'shortcut-item'
    el.setAttribute('role', 'button')
    el.setAttribute('tabindex', '0')
    el.setAttribute('aria-label', `${bm.title} öffnen`)

    const letter = (bm.title || bm.url).charAt(0).toUpperCase()
    el.innerHTML = `
      <div class="shortcut-favicon-placeholder" aria-hidden="true">${letter}</div>
      <span class="shortcut-title">${escapeHtml(bm.title || bm.url)}</span>
    `
    el.addEventListener('click', () => navigateTo(bm.url))
    el.addEventListener('keydown', e => { if (e.key === 'Enter') navigateTo(bm.url) })
    dom.shortcuts.appendChild(el)
  })
}

async function renderRecentHistory() {
  const history = await window.thBrowser.historyGet()
  dom.recentGrid.innerHTML = ''
  if (history.length === 0) {
    dom.recentGrid.innerHTML = '<p style="color:var(--text3);font-size:.85rem;text-align:center;padding:16px 0">Noch kein Verlauf</p>'
    return
  }
  history.slice(0, 6).forEach(entry => {
    const el = document.createElement('div')
    el.className = 'recent-item'
    el.setAttribute('role', 'button')
    el.setAttribute('tabindex', '0')
    el.setAttribute('aria-label', `${entry.title || entry.url} öffnen`)
    el.innerHTML = `
      <span class="recent-favicon" aria-hidden="true">🌐</span>
      <span class="recent-title">${escapeHtml(entry.title || entry.url)}</span>
      <span class="recent-url">${escapeHtml(formatUrl(entry.url))}</span>
      <span class="recent-time">${formatTime(entry.timestamp)}</span>
    `
    el.addEventListener('click', () => navigateTo(entry.url))
    el.addEventListener('keydown', e => { if (e.key === 'Enter') navigateTo(entry.url) })
    dom.recentGrid.appendChild(el)
  })
}

/* ══════════════════════════════════════════════════════
   PANELS
══════════════════════════════════════════════════════ */
function togglePanel(name) {
  if (openPanel === name) {
    closeAllPanels()
    return
  }
  closeAllPanels(false)
  const el = document.getElementById(`panel-${name}`)
  if (!el) return
  el.classList.add('open')
  el.setAttribute('aria-hidden', 'false')
  dom.backdrop.classList.add('visible')
  openPanel = name

  // Inhalte laden
  if (name === 'bookmarks') renderBookmarksPanel()
  if (name === 'history')   renderHistoryPanel()
  if (name === 'settings')  loadSettingsPanel()
}

function closeAllPanels(clearState = true) {
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.remove('open')
    p.setAttribute('aria-hidden', 'true')
  })
  dom.backdrop.classList.remove('visible')
  if (clearState) openPanel = null
}

async function renderBookmarksPanel() {
  bookmarks = await window.thBrowser.bookmarksGet()
  dom.bookmarksList.innerHTML = ''
  if (bookmarks.length === 0) {
    dom.bookmarksList.innerHTML = '<p class="panel-empty">Keine Lesezeichen</p>'
    return
  }
  bookmarks.forEach(bm => {
    const el = document.createElement('div')
    el.className = 'bookmark-item'
    const letter = (bm.title || bm.url).charAt(0).toUpperCase()
    el.innerHTML = `
      <div class="bookmark-favicon" style="background:var(--surface2);border-radius:3px;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--accent)">${letter}</div>
      <div class="bookmark-info">
        <div class="bookmark-title">${escapeHtml(bm.title || bm.url)}</div>
        <div class="bookmark-url">${escapeHtml(formatUrl(bm.url))}</div>
      </div>
      <button class="bookmark-delete" aria-label="${escapeHtml(bm.title)} entfernen" data-url="${escapeHtml(bm.url)}">✕</button>
    `
    el.querySelector('.bookmark-info').addEventListener('click', () => {
      navigateTo(bm.url); closeAllPanels()
    })
    el.querySelector('.bookmark-delete').addEventListener('click', async (e) => {
      e.stopPropagation()
      bookmarks = await window.thBrowser.bookmarksRemove(bm.url)
      await renderBookmarksPanel()
      await renderShortcuts()
    })
    dom.bookmarksList.appendChild(el)
  })
}

async function renderHistoryPanel(filter = '') {
  const history = await window.thBrowser.historyGet()
  dom.historyList.innerHTML = ''

  const filtered = filter
    ? history.filter(e => (e.title + e.url).toLowerCase().includes(filter.toLowerCase()))
    : history

  if (filtered.length === 0) {
    dom.historyList.innerHTML = '<p class="panel-empty">Kein Verlauf</p>'
    return
  }

  // Nach Datum gruppieren
  let lastDate = null
  filtered.forEach(entry => {
    const date = new Date(entry.timestamp)
    const dateStr = date.toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long' })
    if (dateStr !== lastDate) {
      const group = document.createElement('div')
      group.className = 'history-date-group'
      group.textContent = dateStr
      dom.historyList.appendChild(group)
      lastDate = dateStr
    }
    const el = document.createElement('div')
    el.className = 'history-item'
    el.setAttribute('role', 'button')
    el.setAttribute('tabindex', '0')
    el.innerHTML = `
      <span class="history-favicon" aria-hidden="true">🌐</span>
      <div class="history-info">
        <div class="history-title">${escapeHtml(entry.title || entry.url)}</div>
        <div class="history-url">${escapeHtml(formatUrl(entry.url))}</div>
      </div>
      <span class="history-time">${formatTime(entry.timestamp)}</span>
    `
    el.addEventListener('click', () => { navigateTo(entry.url); closeAllPanels() })
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { navigateTo(entry.url); closeAllPanels() } })
    dom.historyList.appendChild(el)
  })
}

function loadSettingsPanel() {
  dom.settingHomepage.value = settings.homepage
  dom.settingSearchEngine.value = settings.searchEngine
  dom.settingAdblock.checked = settings.adblockEnabled
}

/* ══════════════════════════════════════════════════════
   LESEZEICHEN HINZUFÜGEN
══════════════════════════════════════════════════════ */
async function addCurrentBookmark() {
  const tab = getTab(activeTabId)
  if (!tab?.url) return
  bookmarks = await window.thBrowser.bookmarksAdd({ title: tab.title || tab.url, url: tab.url, favicon: tab.favicon })
  dom.btnBookmark.classList.add('active')
  setTimeout(() => dom.btnBookmark.classList.remove('active'), 1500)
  await renderShortcuts()
}

/* ══════════════════════════════════════════════════════
   DOWNLOADS
══════════════════════════════════════════════════════ */
function bindDownloadEvents() {
  window.thBrowser.on('download-progress', ({ filename, received, total, url }) => {
    let entry = downloads.find(d => d.filename === filename)
    if (!entry) {
      entry = { filename, received, total, url, done: false }
      downloads.unshift(entry)
    } else {
      entry.received = received
      entry.total = total
    }
    renderDownloadsPanel()
  })

  window.thBrowser.on('download-done', ({ filename, state, path }) => {
    const entry = downloads.find(d => d.filename === filename)
    if (entry) { entry.done = true; entry.state = state; entry.path = path }
    renderDownloadsPanel()
  })
}

function renderDownloadsPanel() {
  dom.downloadsList.innerHTML = ''
  if (downloads.length === 0) {
    dom.downloadsList.innerHTML = '<p class="panel-empty">Keine Downloads</p>'
    return
  }
  downloads.forEach(dl => {
    const pct = dl.total > 0 ? Math.round((dl.received / dl.total) * 100) : 0
    const el = document.createElement('div')
    el.className = 'download-item'
    el.innerHTML = `
      <div class="download-filename" title="${escapeHtml(dl.filename)}">${escapeHtml(dl.filename)}</div>
      ${!dl.done ? `
        <div class="download-progress-bar"><div class="download-progress-fill" style="width:${pct}%"></div></div>
        <div class="download-meta">${formatBytes(dl.received)} / ${formatBytes(dl.total)} (${pct}%)</div>
      ` : `
        <div class="download-meta download-done">
          ${dl.state === 'completed' ? '✓ Abgeschlossen' : '✗ Abgebrochen'}
          ${dl.path ? ` — ${dl.path}` : ''}
        </div>
      `}
    `
    dom.downloadsList.appendChild(el)
  })
}

/* ══════════════════════════════════════════════════════
   CONTEXT MENU
══════════════════════════════════════════════════════ */
function showContextMenu(e) {
  const menu = dom.contextMenu
  menu.style.left = `${e.x}px`
  menu.style.top  = `${e.y}px`
  menu.classList.add('visible')
  menu.setAttribute('aria-hidden', 'false')
}
function hideContextMenu() {
  dom.contextMenu.classList.remove('visible')
  dom.contextMenu.setAttribute('aria-hidden', 'true')
}

/* ══════════════════════════════════════════════════════
   EVENT-LISTENER
══════════════════════════════════════════════════════ */
function bindEvents() {
  // Fenster
  dom.wcMin.addEventListener('click',   () => window.thBrowser.minimize())
  dom.wcMax.addEventListener('click',   async () => {
    await window.thBrowser.maximize()
    const max = await window.thBrowser.isMaximized()
    dom.wcMax.title = max ? 'Wiederherstellen' : 'Maximieren'
  })
  dom.wcClose.addEventListener('click', () => window.thBrowser.close())

  // Neuer Tab
  dom.btnNewTab.addEventListener('click', () => createTab())

  // Navigations-Buttons
  dom.btnBack.addEventListener('click', () => {
    const tab = getTab(activeTabId)
    if (tab?.webview?.canGoBack()) tab.webview.goBack()
  })
  dom.btnForward.addEventListener('click', () => {
    const tab = getTab(activeTabId)
    if (tab?.webview?.canGoForward()) tab.webview.goForward()
  })
  dom.btnReload.addEventListener('click', () => {
    const tab = getTab(activeTabId)
    if (!tab?.url) return
    if (tab.loading) tab.webview?.stop()
    else tab.webview?.reload()
  })
  dom.btnHome.addEventListener('click', () => {
    // Zur New-Tab-Seite zurück
    const tab = getTab(activeTabId)
    if (!tab) return
    tab.url = null; tab.title = 'Neuer Tab'; tab.favicon = null
    tab.webview?.stop()
    dom.newtabPage.classList.remove('hidden')
    dom.webviewContainer.classList.remove('visible')
    updateAddressbar(null)
    renderTabBar()
    renderRecentHistory()
    renderShortcuts()
  })

  // Adressleiste
  dom.addressbar.addEventListener('focus', () => {
    dom.addressbar.select()
  })
  dom.addressbar.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = dom.addressbar.value.trim()
      if (val) { navigateTo(val); dom.addressbar.blur() }
    }
    if (e.key === 'Escape') {
      const tab = getTab(activeTabId)
      dom.addressbar.value = tab?.url || ''
      dom.addressbar.blur()
    }
  })
  dom.addressbarClear.addEventListener('click', () => {
    dom.addressbar.value = ''
    dom.addressbar.focus()
  })

  // New-Tab-Suche
  dom.newtabSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = dom.newtabSearch.value.trim()
      if (val) { navigateTo(val); dom.newtabSearch.value = '' }
    }
  })

  // Lesezeichen
  dom.btnBookmark.addEventListener('click', addCurrentBookmark)

  // Downloads-Panel
  dom.btnDownloads.addEventListener('click', () => togglePanel('downloads'))

  // Hauptmenü
  dom.btnMenu.addEventListener('click', () => {
    const expanded = dom.btnMenu.getAttribute('aria-expanded') === 'true'
    dom.btnMenu.setAttribute('aria-expanded', !expanded)
    togglePanel('menu')
  })

  // Backdrop → alles schließen
  dom.backdrop.addEventListener('click', closeAllPanels)

  // Panel-Schließen-Buttons
  document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.panel
      if (openPanel === name) closeAllPanels()
    })
  })

  // Menü-Items
  $('menu-newtab').addEventListener('click',     () => { createTab(); closeAllPanels() })
  $('menu-history').addEventListener('click',    () => { closeAllPanels(false); togglePanel('history') })
  $('menu-bookmarks').addEventListener('click',  () => { closeAllPanels(false); togglePanel('bookmarks') })
  $('menu-downloads').addEventListener('click',  () => { closeAllPanels(false); togglePanel('downloads') })
  $('menu-devtools').addEventListener('click',   () => { getTab(activeTabId)?.webview?.openDevTools(); closeAllPanels() })
  $('menu-settings').addEventListener('click',   () => { closeAllPanels(false); togglePanel('settings') })
  $('menu-zoomin').addEventListener('click',     () => {
    const wv = getTab(activeTabId)?.webview
    if (wv) wv.setZoomFactor((wv.getZoomFactor() || 1) + 0.1)
  })
  $('menu-zoomout').addEventListener('click',    () => {
    const wv = getTab(activeTabId)?.webview
    if (wv) wv.setZoomFactor(Math.max(0.3, (wv.getZoomFactor() || 1) - 0.1))
  })
  $('menu-zoomreset').addEventListener('click',  () => {
    getTab(activeTabId)?.webview?.setZoomFactor(1)
  })

  // Verlauf
  dom.historySearch.addEventListener('input', e => renderHistoryPanel(e.target.value))
  dom.historyClearBtn.addEventListener('click', async () => {
    await window.thBrowser.historyClear()
    await renderHistoryPanel()
    await renderRecentHistory()
  })

  // Einstellungen speichern
  dom.settingHomepage.addEventListener('change', async () => {
    settings.homepage = dom.settingHomepage.value || 'https://techhelp-support.de'
    await window.thBrowser.storeSet('homepage', settings.homepage)
  })
  dom.settingSearchEngine.addEventListener('change', async () => {
    settings.searchEngine = dom.settingSearchEngine.value
    await window.thBrowser.storeSet('searchEngine', settings.searchEngine)
    updateSearchBadge()
  })
  dom.settingAdblock.addEventListener('change', async () => {
    settings.adblockEnabled = dom.settingAdblock.checked
    await window.thBrowser.storeSet('adblockEnabled', settings.adblockEnabled)
  })
  $('setting-clear-history').addEventListener('click', async () => {
    await window.thBrowser.historyClear()
    await renderRecentHistory()
  })
  $('setting-clear-cookies').addEventListener('click', () => {
    // Cookies der Session löschen
    const wv = getTab(activeTabId)?.webview
    wv?.clearHistory()
    alert('Cookies wurden geleert (Session-Tab).')
  })
  $('settings-website-link').addEventListener('click', e => {
    e.preventDefault()
    navigateTo('https://techhelp-support.de')
    closeAllPanels()
  })

  // Context-Menu
  $('ctx-back').addEventListener('click',    () => { dom.btnBack.click();    hideContextMenu() })
  $('ctx-forward').addEventListener('click', () => { dom.btnForward.click(); hideContextMenu() })
  $('ctx-reload').addEventListener('click',  () => { dom.btnReload.click();  hideContextMenu() })
  $('ctx-bookmark').addEventListener('click',() => { addCurrentBookmark();   hideContextMenu() })
  $('ctx-newtab').addEventListener('click',  () => { createTab();            hideContextMenu() })
  $('ctx-devtools').addEventListener('click',() => {
    getTab(activeTabId)?.webview?.openDevTools()
    hideContextMenu()
  })

  document.addEventListener('click',     e => { if (!dom.contextMenu.contains(e.target)) hideContextMenu() })
  document.addEventListener('keydown',   e => {
    if (e.key === 'Escape') { closeAllPanels(); hideContextMenu() }
    // Tastenkürzel
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 't') { e.preventDefault(); createTab() }
      if (e.key === 'w') { e.preventDefault(); closeTab(activeTabId) }
      if (e.key === 'l') { e.preventDefault(); dom.addressbar.focus(); dom.addressbar.select() }
      if (e.key === 'r') { e.preventDefault(); dom.btnReload.click() }
      if (e.key === 'd') { e.preventDefault(); addCurrentBookmark() }
      if (e.key === 'h') { e.preventDefault(); togglePanel('history') }
      if (e.key === 'j') { e.preventDefault(); togglePanel('downloads') }
      // Tab wechseln mit Ctrl+Tab / Ctrl+Shift+Tab
      if (e.key === 'Tab') {
        e.preventDefault()
        const idx = tabs.findIndex(t => t.id === activeTabId)
        const next = e.shiftKey
          ? (idx - 1 + tabs.length) % tabs.length
          : (idx + 1) % tabs.length
        activateTab(tabs[next].id)
      }
    }
  })
}

/* ══════════════════════════════════════════════════════
   HILFSFUNKTIONEN
══════════════════════════════════════════════════════ */
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatUrl(url) {
  if (!url) return ''
  try { return new URL(url).hostname } catch { return url }
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' })
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

/* ══════════════════════════════════════════════════════
   START
══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init)
