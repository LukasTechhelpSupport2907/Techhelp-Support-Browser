/**
 * TechHelp Support Browser - Password Manager & Auto-Login
 * Copyright © 2026 TechHelp Support. All Rights Reserved.
 * 
 * PROPRIETARY SOFTWARE - Do not copy, modify, or distribute without permission.
 * See LICENSE file for full terms.
 * 
 * TechHelp Browser - Passwort-Manager & Auto-Login System
 * Features:
 * - Passwörter speichern (verschlüsselt)
 * - Zahlungsmethoden speichern
 * - Auto-Fill für Login-Formulare
 * - Google Sign-In Integration
 * - Cross-Device Sync (Cloud-basiert)
 * - Biometrische Authentifizierung (optional)
 */

'use strict'

// ═══════════════════════════════════════════════════════════
// VERSCHLÜSSELUNG
// ═══════════════════════════════════════════════════════════
class CryptoManager {
  constructor() {
    this.masterKey = null
    this.algorithm = 'AES-GCM'
  }

  async initialize(password) {
    // Master-Key aus Passwort ableiten
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    this.masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('techhelp-browser-salt-v1'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  async encrypt(data) {
    if (!this.masterKey) throw new Error('Master key not initialized')

    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      encoder.encode(JSON.stringify(data))
    )

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    }
  }

  async decrypt(encrypted) {
    if (!this.masterKey) throw new Error('Master key not initialized')

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
      this.masterKey,
      new Uint8Array(encrypted.data)
    )

    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(decrypted))
  }
}

// ═══════════════════════════════════════════════════════════
// PASSWORT-MANAGER
// ═══════════════════════════════════════════════════════════
class PasswordManager {
  constructor() {
    this.crypto = new CryptoManager()
    this.initialized = false
    this.credentials = []
    this.autoFillEnabled = true
  }

  async initialize(masterPassword) {
    await this.crypto.initialize(masterPassword)
    await this.loadCredentials()
    this.initialized = true
    console.log('✅ Passwort-Manager initialisiert')
  }

  async loadCredentials() {
    const encrypted = localStorage.getItem('techhelp_passwords')
    if (!encrypted) {
      this.credentials = []
      return
    }

    try {
      this.credentials = await this.crypto.decrypt(JSON.parse(encrypted))
    } catch (error) {
      console.error('Fehler beim Entschlüsseln der Passwörter:', error)
      this.credentials = []
    }
  }

  async saveCredentials() {
    const encrypted = await this.crypto.encrypt(this.credentials)
    localStorage.setItem('techhelp_passwords', JSON.stringify(encrypted))
  }

  async addCredential(url, username, password, options = {}) {
    const credential = {
      id: Date.now().toString(),
      url,
      domain: this.extractDomain(url),
      username,
      password,
      name: options.name || this.extractDomain(url),
      note: options.note || '',
      created: new Date().toISOString(),
      lastUsed: null,
      useCount: 0
    }

    this.credentials.push(credential)
    await this.saveCredentials()
    return credential
  }

  async updateCredential(id, updates) {
    const index = this.credentials.findIndex(c => c.id === id)
    if (index !== -1) {
      this.credentials[index] = { ...this.credentials[index], ...updates }
      await this.saveCredentials()
    }
  }

  async deleteCredential(id) {
    this.credentials = this.credentials.filter(c => c.id !== id)
    await this.saveCredentials()
  }

  getCredentialsForDomain(domain) {
    return this.credentials.filter(c => 
      c.domain === domain || c.url.includes(domain)
    )
  }

  async markUsed(id) {
    const credential = this.credentials.find(c => c.id === id)
    if (credential) {
      credential.lastUsed = new Date().toISOString()
      credential.useCount = (credential.useCount || 0) + 1
      await this.saveCredentials()
    }
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  getAllCredentials() {
    return this.credentials
  }

  async exportData() {
    // Export im CSV-Format
    const csv = [
      'Name,URL,Benutzername,Passwort,Notiz',
      ...this.credentials.map(c => 
        `"${c.name}","${c.url}","${c.username}","${c.password}","${c.note}"`
      )
    ].join('\n')
    return csv
  }

  async importData(csvData) {
    // CSV-Import
    const lines = csvData.split('\n').slice(1) // Skip header
    for (const line of lines) {
      const match = line.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]*)"/
      )
      if (match) {
        const [, name, url, username, password, note] = match
        await this.addCredential(url, username, password, { name, note })
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// ZAHLUNGSMETHODEN-MANAGER
// ═══════════════════════════════════════════════════════════
class PaymentManager {
  constructor() {
    this.crypto = new CryptoManager()
    this.initialized = false
    this.cards = []
    this.addresses = []
  }

  async initialize(masterPassword) {
    await this.crypto.initialize(masterPassword)
    await this.loadData()
    this.initialized = true
    console.log('✅ Zahlungsmethoden-Manager initialisiert')
  }

  async loadData() {
    const encryptedCards = localStorage.getItem('techhelp_payment_cards')
    const encryptedAddresses = localStorage.getItem('techhelp_payment_addresses')

    try {
      this.cards = encryptedCards 
        ? await this.crypto.decrypt(JSON.parse(encryptedCards))
        : []
      this.addresses = encryptedAddresses
        ? await this.crypto.decrypt(JSON.parse(encryptedAddresses))
        : []
    } catch (error) {
      console.error('Fehler beim Laden der Zahlungsdaten:', error)
      this.cards = []
      this.addresses = []
    }
  }

  async saveData() {
    const encryptedCards = await this.crypto.encrypt(this.cards)
    const encryptedAddresses = await this.crypto.encrypt(this.addresses)
    
    localStorage.setItem('techhelp_payment_cards', JSON.stringify(encryptedCards))
    localStorage.setItem('techhelp_payment_addresses', JSON.stringify(encryptedAddresses))
  }

  async addCard(cardData) {
    const card = {
      id: Date.now().toString(),
      type: cardData.type || 'credit', // credit, debit, paypal
      cardholderName: cardData.cardholderName,
      cardNumber: cardData.cardNumber,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      cvv: cardData.cvv,
      nickname: cardData.nickname || `Karte ${this.cards.length + 1}`,
      created: new Date().toISOString()
    }

    this.cards.push(card)
    await this.saveData()
    return card
  }

  async addAddress(addressData) {
    const address = {
      id: Date.now().toString(),
      type: addressData.type || 'billing', // billing, shipping
      fullName: addressData.fullName,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state || '',
      zipCode: addressData.zipCode,
      country: addressData.country || 'Deutschland',
      phone: addressData.phone || '',
      nickname: addressData.nickname || `Adresse ${this.addresses.length + 1}`,
      created: new Date().toISOString()
    }

    this.addresses.push(address)
    await this.saveData()
    return address
  }

  async deleteCard(id) {
    this.cards = this.cards.filter(c => c.id !== id)
    await this.saveData()
  }

  async deleteAddress(id) {
    this.addresses = this.addresses.filter(a => a.id !== id)
    await this.saveData()
  }

  getCards() {
    return this.cards.map(card => ({
      ...card,
      cardNumber: this.maskCardNumber(card.cardNumber)
    }))
  }

  getCardById(id) {
    return this.cards.find(c => c.id === id)
  }

  getAddresses() {
    return this.addresses
  }

  maskCardNumber(number) {
    if (!number || number.length < 4) return '****'
    return '**** **** **** ' + number.slice(-4)
  }
}

// ═══════════════════════════════════════════════════════════
// AUTO-FILL SYSTEM
// ═══════════════════════════════════════════════════════════
class AutoFillManager {
  constructor(passwordManager, paymentManager) {
    this.passwordManager = passwordManager
    this.paymentManager = paymentManager
    this.enabled = true
  }

  enable() {
    this.enabled = true
    this.observeForms()
  }

  disable() {
    this.enabled = false
  }

  observeForms() {
    // Formular-Erkennung per MutationObserver
    const observer = new MutationObserver(() => {
      if (!this.enabled) return
      this.detectLoginForms()
      this.detectPaymentForms()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Initial scan
    this.detectLoginForms()
    this.detectPaymentForms()
  }

  detectLoginForms() {
    const forms = document.querySelectorAll('form')
    
    forms.forEach(form => {
      const usernameField = form.querySelector('input[type="email"], input[type="text"][name*="user"], input[name*="email"]')
      const passwordField = form.querySelector('input[type="password"]')

      if (usernameField && passwordField && !form.dataset.techHelpFilled) {
        this.showAutoFillPrompt(form, usernameField, passwordField)
      }
    })
  }

  detectPaymentForms() {
    const cardInputs = document.querySelectorAll('input[name*="card"], input[autocomplete="cc-number"]')
    
    cardInputs.forEach(input => {
      if (!input.dataset.techHelpPayment) {
        input.dataset.techHelpPayment = 'true'
        this.showPaymentAutoFillPrompt(input)
      }
    })
  }

  showAutoFillPrompt(form, usernameField, passwordField) {
    const domain = window.location.hostname
    const credentials = this.passwordManager.getCredentialsForDomain(domain)

    if (credentials.length === 0) return

    // Auto-Fill Icon hinzufügen
    const icon = document.createElement('div')
    icon.className = 'techhelp-autofill-icon'
    icon.innerHTML = '🔑'
    icon.title = `${credentials.length} gespeicherte Anmeldedaten`
    
    usernameField.parentElement.style.position = 'relative'
    usernameField.parentElement.appendChild(icon)

    icon.addEventListener('click', () => {
      this.showCredentialPicker(credentials, (credential) => {
        usernameField.value = credential.username
        passwordField.value = credential.password
        form.dataset.techHelpFilled = 'true'
        this.passwordManager.markUsed(credential.id)
      })
    })

    // Auto-Fill beim ersten Credential
    if (credentials.length === 1) {
      usernameField.value = credentials[0].username
      passwordField.value = credentials[0].password
      form.dataset.techHelpFilled = 'true'
    }
  }

  showCredentialPicker(credentials, onSelect) {
    // Credential-Auswahl anzeigen
    const picker = document.createElement('div')
    picker.className = 'techhelp-credential-picker'
    picker.innerHTML = `
      <div class="credential-picker-header">
        <h3>Gespeicherte Anmeldedaten</h3>
        <button class="close-btn">✕</button>
      </div>
      <div class="credential-list">
        ${credentials.map(c => `
          <button class="credential-item" data-id="${c.id}">
            <div class="credential-icon">👤</div>
            <div class="credential-info">
              <div class="credential-username">${c.username}</div>
              <div class="credential-domain">${c.domain}</div>
            </div>
          </button>
        `).join('')}
      </div>
    `

    document.body.appendChild(picker)

    picker.querySelector('.close-btn').addEventListener('click', () => picker.remove())
    
    picker.querySelectorAll('.credential-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const credential = credentials.find(c => c.id === btn.dataset.id)
        if (credential) {
          onSelect(credential)
          picker.remove()
        }
      })
    })
  }

  showPaymentAutoFillPrompt(input) {
    const cards = this.paymentManager.getCards()
    if (cards.length === 0) return

    const icon = document.createElement('div')
    icon.className = 'techhelp-autofill-icon'
    icon.innerHTML = '💳'
    icon.title = `${cards.length} gespeicherte Zahlungsmethoden`
    
    input.parentElement.style.position = 'relative'
    input.parentElement.appendChild(icon)

    icon.addEventListener('click', () => {
      this.showPaymentPicker(cards, (card) => {
        this.fillPaymentForm(card)
      })
    })
  }

  showPaymentPicker(cards, onSelect) {
    // Payment-Auswahl anzeigen
    const picker = document.createElement('div')
    picker.className = 'techhelp-payment-picker'
    picker.innerHTML = `
      <div class="payment-picker-header">
        <h3>Zahlungsmethoden</h3>
        <button class="close-btn">✕</button>
      </div>
      <div class="payment-list">
        ${cards.map(c => `
          <button class="payment-item" data-id="${c.id}">
            <div class="payment-icon">💳</div>
            <div class="payment-info">
              <div class="payment-nickname">${c.nickname}</div>
              <div class="payment-number">${c.cardNumber}</div>
            </div>
          </button>
        `).join('')}
      </div>
    `

    document.body.appendChild(picker)

    picker.querySelector('.close-btn').addEventListener('click', () => picker.remove())
    
    picker.querySelectorAll('.payment-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = this.paymentManager.getCardById(btn.dataset.id)
        if (card) {
          onSelect(card)
          picker.remove()
        }
      })
    })
  }

  fillPaymentForm(card) {
    // Kartenfelder finden und ausfüllen
    const cardNumber = document.querySelector('input[name*="card"], input[autocomplete="cc-number"]')
    const cardName = document.querySelector('input[name*="name"], input[autocomplete="cc-name"]')
    const expiryMonth = document.querySelector('input[name*="month"], select[name*="month"]')
    const expiryYear = document.querySelector('input[name*="year"], select[name*="year"]')
    const cvv = document.querySelector('input[name*="cvv"], input[name*="cvc"]')

    if (cardNumber) cardNumber.value = card.cardNumber
    if (cardName) cardName.value = card.cardholderName
    if (expiryMonth) expiryMonth.value = card.expiryMonth
    if (expiryYear) expiryYear.value = card.expiryYear
    if (cvv) cvv.value = card.cvv
  }
}

// ═══════════════════════════════════════════════════════════
// GOOGLE SIGN-IN INTEGRATION
// ═══════════════════════════════════════════════════════════
class GoogleAuthManager {
  constructor() {
    this.clientId = null
    this.user = null
  }

  async initialize(clientId) {
    this.clientId = clientId
    await this.loadGoogleAPI()
  }

  async loadGoogleAPI() {
    return new Promise((resolve) => {
      if (window.google) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = resolve
      document.head.appendChild(script)
    })
  }

  async signIn() {
    if (!window.google) {
      console.error('Google Sign-In API nicht geladen')
      return null
    }

    return new Promise((resolve, reject) => {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response) => {
          this.handleCredentialResponse(response)
          resolve(this.user)
        }
      })

      window.google.accounts.id.prompt()
    })
  }

  handleCredentialResponse(response) {
    const decoded = this.parseJwt(response.credential)
    this.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture
    }
    localStorage.setItem('techhelp_google_user', JSON.stringify(this.user))
    console.log('✅ Google Sign-In erfolgreich:', this.user.email)
  }

  parseJwt(token) {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(base64))
  }

  async signOut() {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect()
    }
    this.user = null
    localStorage.removeItem('techhelp_google_user')
    console.log('✅ Google Sign-Out erfolgreich')
  }

  getUser() {
    if (!this.user) {
      const stored = localStorage.getItem('techhelp_google_user')
      if (stored) {
        this.user = JSON.parse(stored)
      }
    }
    return this.user
  }

  isSignedIn() {
    return this.getUser() !== null
  }
}

// ═══════════════════════════════════════════════════════════
// CLOUD-SYNC (Firebase/Backend-Integration)
// ═══════════════════════════════════════════════════════════
class CloudSyncManager {
  constructor(passwordManager, paymentManager) {
    this.passwordManager = passwordManager
    this.paymentManager = paymentManager
    this.syncEnabled = false
    this.apiEndpoint = 'https://api.techhelp-support.de/browser/sync'
  }

  async enable(userId, authToken) {
    this.userId = userId
    this.authToken = authToken
    this.syncEnabled = true
    await this.syncFromCloud()
    this.startAutoSync()
  }

  disable() {
    this.syncEnabled = false
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }

  async syncFromCloud() {
    if (!this.syncEnabled) return

    try {
      const response = await fetch(`${this.apiEndpoint}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Merge mit lokalen Daten
        await this.mergeData(data)
        console.log('✅ Cloud-Sync: Daten geladen')
      }
    } catch (error) {
      console.error('Cloud-Sync Fehler:', error)
    }
  }

  async syncToCloud() {
    if (!this.syncEnabled) return

    const data = {
      passwords: this.passwordManager.credentials,
      cards: this.paymentManager.cards,
      addresses: this.paymentManager.addresses,
      timestamp: new Date().toISOString()
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        console.log('✅ Cloud-Sync: Daten hochgeladen')
      }
    } catch (error) {
      console.error('Cloud-Sync Upload Fehler:', error)
    }
  }

  async mergeData(cloudData) {
    // Smart Merge: Neueste Einträge bevorzugen
    // Implementierung würde Konflikte auflösen
    console.log('Merge Cloud-Daten...', cloudData)
  }

  startAutoSync() {
    // Auto-Sync alle 5 Minuten
    this.syncInterval = setInterval(() => {
      this.syncToCloud()
    }, 5 * 60 * 1000)
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORT: Global verfügbar machen
// ═══════════════════════════════════════════════════════════
window.TechHelpSecurityManager = {
  passwordManager: new PasswordManager(),
  paymentManager: new PaymentManager(),
  autoFillManager: null, // Wird nach Initialisierung erstellt
  googleAuth: new GoogleAuthManager(),
  cloudSync: null, // Wird nach Initialisierung erstellt
  
  async initialize(masterPassword) {
    await this.passwordManager.initialize(masterPassword)
    await this.paymentManager.initialize(masterPassword)
    
    this.autoFillManager = new AutoFillManager(
      this.passwordManager,
      this.paymentManager
    )
    
    this.cloudSync = new CloudSyncManager(
      this.passwordManager,
      this.paymentManager
    )
    
    this.autoFillManager.enable()
    console.log('✅ Security-Manager vollständig initialisiert')
  }
}

console.log('✅ Passwort-Manager & Auto-Login System geladen')
