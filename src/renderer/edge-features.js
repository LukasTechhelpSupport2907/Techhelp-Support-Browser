/**
 * TechHelp Support Browser - Edge-like Features
 * Copyright © 2026 TechHelp Support. All Rights Reserved.
 * 
 * PROPRIETARY SOFTWARE - Do not copy, modify, or distribute without permission.
 * See LICENSE file for full terms.
 * 
 * Edge-ähnliche Browser-Features für TechHelp Browser
 * - PDF-Viewer
 * - Sammlungen (Collections)
 * - Leseliste (Reading List)
 * - Vertikal Tabs Option
 * - Split-Screen Modus
 * - Intelligente Kopier-Funktion
 * - Web Capture (Screenshot)
 * - Shopping-Features (Preisvergleich)
 */

'use strict'

// ────────────────────────────────────────────────────────────
// 1. SAMMLUNGEN (Collections) - Wie Edge Collections
// ────────────────────────────────────────────────────────────
class Collections {
  constructor() {
    this.collections = this.loadCollections()
  }

  loadCollections() {
    const stored = localStorage.getItem('techhelp_collections')
    return stored ? JSON.parse(stored) : []
  }

  saveCollections() {
    localStorage.setItem('techhelp_collections', JSON.stringify(this.collections))
  }

  createCollection(name) {
    const collection = {
      id: Date.now().toString(),
      name,
      items: [],
      created: new Date().toISOString()
    }
    this.collections.push(collection)
    this.saveCollections()
    return collection
  }

  addToCollection(collectionId, item) {
    const collection = this.collections.find(c => c.id === collectionId)
    if (collection) {
      collection.items.push({
        id: Date.now().toString(),
        title: item.title,
        url: item.url,
        note: item.note || '',
        added: new Date().toISOString()
      })
      this.saveCollections()
    }
  }

  deleteCollection(collectionId) {
    this.collections = this.collections.filter(c => c.id !== collectionId)
    this.saveCollections()
  }

  getAllCollections() {
    return this.collections
  }
}

// ────────────────────────────────────────────────────────────
// 2. LESELISTE (Reading List)
// ────────────────────────────────────────────────────────────
class ReadingList {
  constructor() {
    this.items = this.loadItems()
  }

  loadItems() {
    const stored = localStorage.getItem('techhelp_reading_list')
    return stored ? JSON.parse(stored) : []
  }

  saveItems() {
    localStorage.setItem('techhelp_reading_list', JSON.stringify(this.items))
  }

  add(title, url, excerpt = '') {
    const item = {
      id: Date.now().toString(),
      title,
      url,
      excerpt,
      added: new Date().toISOString(),
      read: false
    }
    this.items.unshift(item)
    this.saveItems()
    return item
  }

  markAsRead(id) {
    const item = this.items.find(i => i.id === id)
    if (item) {
      item.read = true
      item.readAt = new Date().toISOString()
      this.saveItems()
    }
  }

  remove(id) {
    this.items = this.items.filter(i => i.id !== id)
    this.saveItems()
  }

  getAll() {
    return this.items
  }

  getUnread() {
    return this.items.filter(i => !i.read)
  }
}

// ────────────────────────────────────────────────────────────
// 3. WEB CAPTURE (Screenshot-Funktion)
// ────────────────────────────────────────────────────────────
class WebCapture {
  async captureVisible() {
    try {
      // Für Capacitor/Android: Nutze Screenshot-Plugin falls verfügbar
      if (window.Capacitor) {
        const { Screenshot } = window.Capacitor.Plugins
        if (Screenshot) {
          const result = await Screenshot.take()
          return result.path
        }
      }

      // Desktop: Nutze HTML2Canvas oder native Screen Capture API
      // Fallback: Nachricht an User
      return null
    } catch (error) {
      console.error('Screenshot capture failed:', error)
      return null
    }
  }

  async captureFull() {
    // Vollbild-Screenshot (ganze Seite)
    alert('Vollbild-Screenshot wird in einer zukünftigen Version unterstützt')
  }

  async captureSelection() {
    // Bereich-Screenshot
    alert('Bereichs-Screenshot wird in einer zukünftigen Version unterstützt')
  }
}

// ────────────────────────────────────────────────────────────
// 4. SPLIT-SCREEN MODUS
// ────────────────────────────────────────────────────────────
class SplitScreen {
  constructor() {
    this.enabled = false
    this.splitContainer = null
  }

  enable() {
    if (this.enabled) return

    const contentArea = document.getElementById('content-area')
    if (!contentArea) return

    // Split-Screen Container erstellen
    this.splitContainer = document.createElement('div')
    this.splitContainer.id = 'split-screen-container'
    this.splitContainer.innerHTML = `
      <div class="split-pane split-pane-left" id="split-left">
        <iframe class="split-webview" id="split-webview-left"></iframe>
      </div>
      <div class="split-divider" id="split-divider"></div>
      <div class="split-pane split-pane-right" id="split-right">
        <iframe class="split-webview" id="split-webview-right"></iframe>
      </div>
    `

    contentArea.appendChild(this.splitContainer)
    this.enabled = true
    this.initResizer()
  }

  disable() {
    if (!this.enabled || !this.splitContainer) return
    this.splitContainer.remove()
    this.splitContainer = null
    this.enabled = false
  }

  initResizer() {
    const divider = document.getElementById('split-divider')
    const leftPane = document.getElementById('split-left')

    if (!divider || !leftPane) return

    let isResizing = false

    divider.addEventListener('mousedown', (e) => {
      isResizing = true
      e.preventDefault()
    })

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return
      const containerWidth = this.splitContainer.offsetWidth
      const leftWidth = (e.clientX / containerWidth) * 100
      if (leftWidth > 20 && leftWidth < 80) {
        leftPane.style.width = leftWidth + '%'
      }
    })

    document.addEventListener('mouseup', () => {
      isResizing = false
    })
  }

  loadUrl(pane, url) {
    const iframe = document.getElementById(`split-webview-${pane}`)
    if (iframe) iframe.src = url
  }
}

// ────────────────────────────────────────────────────────────
// 5. INTELLIGENTE KOPIER-FUNKTION
// ────────────────────────────────────────────────────────────
class SmartCopy {
  async copyWithFormatting(selection) {
    const html = this.getSelectionHTML()
    const text = selection.toString()

    try {
      // Clipboard API mit HTML und Plain Text
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        })
      ])
      return true
    } catch (error) {
      // Fallback: nur Text
      await navigator.clipboard.writeText(text)
      return false
    }
  }

  getSelectionHTML() {
    const selection = window.getSelection()
    if (!selection.rangeCount) return ''

    const range = selection.getRangeAt(0)
    const div = document.createElement('div')
    div.appendChild(range.cloneContents())
    return div.innerHTML
  }

  async copyLink(url, title) {
    const markdown = `[${title}](${url})`
    const html = `<a href="${url}">${title}</a>`

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([markdown], { type: 'text/plain' })
        })
      ])
    } catch {
      await navigator.clipboard.writeText(url)
    }
  }
}

// ────────────────────────────────────────────────────────────
// 6. VERTIKAL TABS (Sidebar Tabs)
// ────────────────────────────────────────────────────────────
class VerticalTabs {
  constructor() {
    this.enabled = false
  }

  enable() {
    if (this.enabled) return

    const tabBar = document.querySelector('.tab-bar-wrap')
    if (!tabBar) return

    // Tab-Leiste nach links verschieben
    tabBar.style.position = 'fixed'
    tabBar.style.left = '0'
    tabBar.style.top = 'var(--toolbar-h)'
    tabBar.style.width = '200px'
    tabBar.style.height = 'calc(100vh - var(--toolbar-h))'
    tabBar.style.flexDirection = 'column'
    tabBar.style.overflowY = 'auto'
    tabBar.style.overflowX = 'hidden'
    tabBar.style.borderRight = '1px solid var(--border)'
    tabBar.style.borderBottom = 'none'

    // Content verschieben
    const contentArea = document.getElementById('content-area')
    if (contentArea) {
      contentArea.style.marginLeft = '200px'
    }

    this.enabled = true
  }

  disable() {
    if (!this.enabled) return

    const tabBar = document.querySelector('.tab-bar-wrap')
    if (tabBar) {
      tabBar.style = ''
    }

    const contentArea = document.getElementById('content-area')
    if (contentArea) {
      contentArea.style.marginLeft = ''
    }

    this.enabled = false
  }

  toggle() {
    this.enabled ? this.disable() : this.enable()
  }
}

// ────────────────────────────────────────────────────────────
// 7. PREIS-TRACKER (Shopping Feature wie Edge)
// ────────────────────────────────────────────────────────────
class PriceTracker {
  constructor() {
    this.trackedItems = this.loadTracked()
  }

  loadTracked() {
    const stored = localStorage.getItem('techhelp_price_tracker')
    return stored ? JSON.parse(stored) : []
  }

  saveTracked() {
    localStorage.setItem('techhelp_price_tracker', JSON.stringify(this.trackedItems))
  }

  async trackPrice(url, productName) {
    // In einer vollständigen Implementierung würde hier eine API
    // den Preis crawlen/abfragen
    const item = {
      id: Date.now().toString(),
      url,
      productName,
      initialPrice: null,
      currentPrice: null,
      currency: 'EUR',
      tracked: new Date().toISOString(),
      priceHistory: []
    }

    this.trackedItems.push(item)
    this.saveTracked()
    return item
  }

  untrack(id) {
    this.trackedItems = this.trackedItems.filter(i => i.id !== id)
    this.saveTracked()
  }

  getTracked() {
    return this.trackedItems
  }

  async checkPrices() {
    // Würde in Produktion Preise aktualisieren
    console.log('Checking prices for', this.trackedItems.length, 'items')
  }
}

// ────────────────────────────────────────────────────────────
// 8. PDF-VIEWER (Inline PDF Viewer)
// ────────────────────────────────────────────────────────────
class PDFViewer {
  constructor() {
    this.pdfContainer = null
  }

  async openPDF(url) {
    // Nutze PDF.js oder native PDF viewer
    // Für jetzt: öffne im neuen Tab
    window.open(url, '_blank')
  }

  closePDF() {
    if (this.pdfContainer) {
      this.pdfContainer.remove()
      this.pdfContainer = null
    }
  }
}

// ────────────────────────────────────────────────────────────
// EXPORT: Global verfügbar machen
// ────────────────────────────────────────────────────────────
window.TechHelpEdgeFeatures = {
  collections: new Collections(),
  readingList: new ReadingList(),
  webCapture: new WebCapture(),
  splitScreen: new SplitScreen(),
  smartCopy: new SmartCopy(),
  verticalTabs: new VerticalTabs(),
  priceTracker: new PriceTracker(),
  pdfViewer: new PDFViewer()
}

console.log('✅ TechHelp Browser - Edge Features geladen')


// ────────────────────────────────────────────────────────────
// PANEL MANAGEMENT
// ────────────────────────────────────────────────────────────
function openPanel(panelId) {
  // Alle Panels schließen
  document.querySelectorAll('.panel').forEach(p => {
    p.style.display = 'none'
    p.setAttribute('aria-hidden', 'true')
  })
  
  // Gewähltes Panel öffnen
  const panel = document.getElementById(panelId)
  if (panel) {
    panel.style.display = 'block'
    panel.setAttribute('aria-hidden', 'false')
  }
}

function closePanel(panelId) {
  const panel = document.getElementById(panelId)
  if (panel) {
    panel.style.display = 'none'
    panel.setAttribute('aria-hidden', 'true')
  }
}

function togglePanel(panelId) {
  const panel = document.getElementById(panelId)
  if (panel) {
    if (panel.style.display === 'none' || !panel.style.display) {
      openPanel(panelId)
    } else {
      closePanel(panelId)
    }
  }
}

// Panel-Close-Buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = 'panel-' + btn.dataset.panel
      closePanel(panelId)
    })
  })
})

// Export für browser.js
window.togglePanel = togglePanel
window.openPanel = openPanel
window.closePanel = closePanel

console.log('✅ Edge Features & Panel System loaded')
