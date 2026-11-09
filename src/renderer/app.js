/**
 * TechHelp Browser — Renderer (Desktop / Electron)
 * Copyright © 2026 TechHelp Support. All Rights Reserved.
 *
 * Eine einzige, saubere Datei — kein Capacitor, keine Kollisionen.
 */
'use strict';

// ─────────────────────────────────────────────────────────────
// 1. DOM-REFERENZEN
// ─────────────────────────────────────────────────────────────
const addressbar       = document.getElementById('addressbar');
const btnBack          = document.getElementById('btn-back');
const btnForward       = document.getElementById('btn-forward');
const btnReload        = document.getElementById('btn-reload');
const btnHome          = document.getElementById('btn-home');
const btnMenu          = document.getElementById('btn-menu');
const homePage         = document.getElementById('home-page');
const webviewContainer = document.getElementById('webview-container');
const webview          = document.getElementById('browser-webview');
const loadingBar       = document.getElementById('loading-bar');
const securityIcon     = document.getElementById('security-icon');
const homeSearchForm   = document.getElementById('home-search-form');
const homeSearchInput  = document.getElementById('home-search-input');
const btnMinimize      = document.getElementById('btn-minimize');
const btnMaximize      = document.getElementById('btn-maximize');
const btnClose         = document.getElementById('btn-close');

// ─────────────────────────────────────────────────────────────
// 2. HILFSFUNKTIONEN
// ─────────────────────────────────────────────────────────────
function normalizeUrl(raw) {
  raw = (raw || '').trim();
  if (!raw) return 'https://techhelp-support.de';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9-]+(\.[a-z]{2,})+/i.test(raw) && !raw.includes(' '))
    return 'https://' + raw;
  return 'https://www.google.com/search?q=' + encodeURIComponent(raw);
}

function setSecurityIcon(url) {
  if (!securityIcon) return;
  const secure = /^https:/i.test(url);
  securityIcon.style.color = secure ? '#3ecf8e' : '#888';
  securityIcon.title = secure ? 'Sichere Verbindung (HTTPS)' : 'Ungesicherte Verbindung';
}

function updateNavButtons() {
  if (btnBack)    btnBack.disabled    = !webview.canGoBack();
  if (btnForward) btnForward.disabled = !webview.canGoForward();
}

function showLoading() { loadingBar?.classList.add('active'); }
function hideLoading()  { loadingBar?.classList.remove('active'); }

function showNotification(msg) {
  let el = document.getElementById('th-notif');
  if (!el) {
    el = document.createElement('div');
    el.id = 'th-notif';
    el.style.cssText = [
      'position:fixed','bottom:24px','left:50%',
      'transform:translateX(-50%) translateY(20px)',
      'background:#1e1e1e','color:#f0f0f0',
      'padding:10px 20px','border-radius:8px',
      'box-shadow:0 4px 20px rgba(0,0,0,.5)',
      'font-size:14px','z-index:9999',
      'transition:opacity .3s, transform .3s',
      'opacity:0','pointer-events:none'
    ].join(';');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}
window.showNotification = showNotification;

// ─────────────────────────────────────────────────────────────
// 3. NAVIGATION
// ─────────────────────────────────────────────────────────────
function navigate(raw) {
  const url = normalizeUrl(raw);
  homePage.style.display         = 'none';
  webviewContainer.style.display = 'block';
  webview.style.display          = 'block';
  webview.src      = url;
  addressbar.value = url;
  setSecurityIcon(url);
  if (window.thBrowser)
    window.thBrowser.historyAdd({ title: url, url });
}

function goHome() {
  homePage.style.display         = 'flex';
  webviewContainer.style.display = 'none';
  webview.style.display          = 'none';
  addressbar.value               = '';
  setSecurityIcon('');
}

// ─────────────────────────────────────────────────────────────
// 4. TOOLBAR-EVENTS
// ─────────────────────────────────────────────────────────────
btnBack?.addEventListener('click',   () => { if (webview.canGoBack())    webview.goBack();    });
btnForward?.addEventListener('click',() => { if (webview.canGoForward()) webview.goForward(); });
btnReload?.addEventListener('click', () => { if (webview.src && webview.src !== 'about:blank') webview.reload(); });
btnHome?.addEventListener('click',   goHome);

addressbar?.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); navigate(addressbar.value); }
});
addressbar?.addEventListener('focus', () => addressbar.select());

homeSearchForm?.addEventListener('submit', e => {
  e.preventDefault();
  const q = homeSearchInput?.value.trim();
  if (q) navigate(q);
});

document.querySelectorAll('.shortcut-item').forEach(btn =>
  btn.addEventListener('click', () => { if (btn.dataset.url) navigate(btn.dataset.url); })
);

// ─────────────────────────────────────────────────────────────
// 5. WEBVIEW-EVENTS
// ─────────────────────────────────────────────────────────────
webview?.addEventListener('did-start-loading',    () => { showLoading(); updateNavButtons(); });
webview?.addEventListener('did-stop-loading',     () => { hideLoading(); updateNavButtons(); });
webview?.addEventListener('did-fail-load',        () =>   hideLoading());
webview?.addEventListener('did-navigate',         e  => { addressbar.value = e.url; setSecurityIcon(e.url); updateNavButtons(); });
webview?.addEventListener('did-navigate-in-page', e  => { addressbar.value = e.url; setSecurityIcon(e.url); });
webview?.addEventListener('page-title-updated',   e  => {
  document.title = e.title ? e.title + ' — TechHelp Browser' : 'TechHelp Browser';
});

// ─────────────────────────────────────────────────────────────
// 6. WINDOW-CONTROLS (via preload.js / window.thBrowser)
// ─────────────────────────────────────────────────────────────
if (window.thBrowser) {
  btnMinimize?.addEventListener('click', () => window.thBrowser.minimize());
  btnMaximize?.addEventListener('click', async () => {
    window.thBrowser.maximize();
    const isMax = await window.thBrowser.isMaximized();
    if (btnMaximize) {
      btnMaximize.innerHTML = isMax
        ? '<svg viewBox="0 0 12 12"><path d="M3,1h8v8M1,3v8h8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'
        : '<svg viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
    }
  });
  btnClose?.addEventListener('click', () => window.thBrowser.close());
}

// ─────────────────────────────────────────────────────────────
// 7. PANEL-SYSTEM
// ─────────────────────────────────────────────────────────────
function openPanel(id) {
  document.querySelectorAll('.panel').forEach(p => {
    p.style.display = 'none';
    p.setAttribute('aria-hidden', 'true');
  });
  const p = document.getElementById(id);
  if (p) { p.style.display = 'block'; p.setAttribute('aria-hidden', 'false'); }
}
function closePanel(id) {
  const p = document.getElementById(id);
  if (p) { p.style.display = 'none'; p.setAttribute('aria-hidden', 'true'); }
}
function togglePanel(id) {
  const p = document.getElementById(id);
  if (!p) return;
  const visible = p.style.display === 'block';
  openPanel('__none__'); // schließe alle
  if (!visible) openPanel(id);
}
window.openPanel  = openPanel;
window.closePanel = closePanel;
window.togglePanel = togglePanel;

// Panel-Close-Buttons
document.querySelectorAll('.panel-close').forEach(btn =>
  btn.addEventListener('click', () => {
    const p = btn.closest('.panel');
    if (p) { p.style.display = 'none'; p.setAttribute('aria-hidden', 'true'); }
  })
);

// Menü-Button öffnet Haupt-Feature-Panel
btnMenu?.addEventListener('click', () => togglePanel('panel-edge-features'));

// Sub-Panel-Links im Feature-Panel
const subPanelMap = {
  'menu-passwords':          () => { openPanel('panel-passwords');    renderPasswords(); },
  'menu-payments':           () => { openPanel('panel-payments');     renderCards(); },
  'menu-google-signin':      () =>   openPanel('panel-google-signin'),
  'menu-collections':        () => { openPanel('panel-collections');  renderCollections(); },
  'menu-reading-list':       () => { openPanel('panel-reading-list'); renderReadingList(); },
  'menu-price-tracker-open': () => { openPanel('panel-price-tracker');renderPriceTracker(); },
  'menu-split-screen': () => {
    window.TechHelpEdgeFeatures?.splitScreen.enable();
    closePanel('panel-edge-features');
    showNotification('Split-Screen aktiviert');
  },
  'menu-web-capture': async () => {
    await window.TechHelpEdgeFeatures?.webCapture.captureVisible();
    closePanel('panel-edge-features');
    showNotification('Screenshot aufgenommen');
  },
};
Object.entries(subPanelMap).forEach(([id, fn]) =>
  document.getElementById(id)?.addEventListener('click', fn)
);

// Toggles
document.getElementById('toggle-vertical-tabs')?.addEventListener('change', e => {
  e.target.checked
    ? window.TechHelpEdgeFeatures?.verticalTabs.enable()
    : window.TechHelpEdgeFeatures?.verticalTabs.disable();
});
document.getElementById('toggle-autofill')?.addEventListener('change', e => {
  e.target.checked
    ? window.TechHelpSecurityManager?.autoFillManager.enable()
    : window.TechHelpSecurityManager?.autoFillManager.disable();
});

// ─────────────────────────────────────────────────────────────
// 8. COLLECTIONS
// ─────────────────────────────────────────────────────────────
function renderCollections() {
  const el = document.getElementById('collections-list');
  if (!el) return;
  const f = window.TechHelpEdgeFeatures;
  if (!f) return;
  const cols = f.collections.getAllCollections();
  el.innerHTML = cols.length
    ? cols.map(c => `
        <div class="collection-item">
          <div class="collection-icon">📚</div>
          <div class="collection-content">
            <div class="collection-name">${c.name}</div>
            <div class="collection-count">${c.items.length} Elemente</div>
          </div>
          <button class="collection-btn" onclick="window.deleteCollection('${c.id}')">🗑</button>
        </div>`).join('')
    : '<p class="panel-empty">Keine Sammlungen vorhanden</p>';
}
window.deleteCollection = id => {
  if (confirm('Sammlung löschen?')) {
    window.TechHelpEdgeFeatures?.collections.deleteCollection(id);
    renderCollections();
  }
};
document.getElementById('btn-new-collection')?.addEventListener('click', () => {
  const name = prompt('Name der Sammlung:');
  if (name?.trim()) {
    window.TechHelpEdgeFeatures?.collections.createCollection(name.trim());
    renderCollections();
    showNotification('Sammlung erstellt');
  }
});

// ─────────────────────────────────────────────────────────────
// 9. LESELISTE
// ─────────────────────────────────────────────────────────────
function renderReadingList() {
  const el = document.getElementById('reading-list-content');
  if (!el) return;
  const f = window.TechHelpEdgeFeatures;
  if (!f) return;
  const items = f.readingList.getAll();
  el.innerHTML = items.length
    ? items.map(i => `
        <div class="reading-item ${i.read ? 'read' : ''}">
          <div class="reading-content">
            <div class="reading-title">${i.title}</div>
            <div class="reading-meta">${new Date(i.added).toLocaleDateString('de-DE')}</div>
          </div>
          <div class="reading-actions">
            <button class="collection-btn" onclick="window.markAsRead('${i.id}')" title="Gelesen">✓</button>
            <button class="collection-btn" onclick="window.removeFromReadingList('${i.id}')" title="Entfernen">🗑</button>
          </div>
        </div>`).join('')
    : '<p class="panel-empty">Leseliste ist leer</p>';
}
window.markAsRead = id => {
  window.TechHelpEdgeFeatures?.readingList.markAsRead(id);
  renderReadingList();
};
window.removeFromReadingList = id => {
  window.TechHelpEdgeFeatures?.readingList.remove(id);
  renderReadingList();
};

// ─────────────────────────────────────────────────────────────
// 10. PREIS-TRACKER
// ─────────────────────────────────────────────────────────────
function renderPriceTracker() {
  const el = document.getElementById('price-tracker-list');
  if (!el) return;
  const f = window.TechHelpEdgeFeatures;
  if (!f) return;
  const items = f.priceTracker.getTracked();
  el.innerHTML = items.length
    ? items.map(i => `
        <div class="price-item">
          <div class="price-content">
            <div class="price-product">${i.productName}</div>
            <div class="price-current">${i.currentPrice || '—'} ${i.currency || ''}</div>
          </div>
          <button class="collection-btn" onclick="window.untrackPrice('${i.id}')">🗑</button>
        </div>`).join('')
    : '<p class="panel-empty">Keine verfolgten Produkte</p>';
}
window.untrackPrice = id => {
  window.TechHelpEdgeFeatures?.priceTracker.untrack(id);
  renderPriceTracker();
};

// ─────────────────────────────────────────────────────────────
// 11. PASSWORT-MANAGER
// ─────────────────────────────────────────────────────────────
function renderPasswords() {
  const el = document.getElementById('passwords-content');
  if (!el) return;
  const sec = window.TechHelpSecurityManager;
  if (!sec) return;
  const creds = sec.passwordManager.getAllCredentials();
  el.innerHTML = creds.length
    ? creds.map(c => `
        <div class="password-item">
          <div class="password-item-icon">🌐</div>
          <div class="password-item-content">
            <div class="password-item-name">${c.name || c.url}</div>
            <div class="password-item-username">${c.username}</div>
          </div>
          <div class="password-item-actions">
            <button class="password-action-btn" onclick="window.copyPassword('${c.id}')" title="Kopieren">📋</button>
            <button class="password-action-btn danger" onclick="window.deletePassword('${c.id}')" title="Löschen">🗑</button>
          </div>
        </div>`).join('')
    : `<div class="pm-empty">
         <div class="pm-empty-icon">🔐</div>
         <div class="pm-empty-title">Keine Passwörter gespeichert</div>
         <div class="pm-empty-desc">Passwörter werden beim Login automatisch angeboten</div>
       </div>`;
}
window.copyPassword = async id => {
  const c = window.TechHelpSecurityManager?.passwordManager.getAllCredentials().find(x => x.id === id);
  if (c) { await navigator.clipboard.writeText(c.password); showNotification('Passwort kopiert!'); }
};
window.deletePassword = async id => {
  if (confirm('Passwort löschen?')) {
    await window.TechHelpSecurityManager?.passwordManager.deleteCredential(id);
    renderPasswords();
    showNotification('Passwort gelöscht');
  }
};
document.getElementById('pm-add-password-btn')?.addEventListener('click', async () => {
  const url      = prompt('Website-URL:');           if (!url) return;
  const username = prompt('Benutzername / E-Mail:'); if (!username) return;
  const password = prompt('Passwort:');              if (!password) return;
  await window.TechHelpSecurityManager?.passwordManager.addCredential(url, username, password);
  renderPasswords();
  showNotification('Passwort gespeichert!');
});
document.getElementById('pm-export-btn')?.addEventListener('click', async () => {
  const csv = await window.TechHelpSecurityManager?.passwordManager.exportData();
  if (!csv) return;
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: 'techhelp-passwords.csv'
  });
  a.click();
  showNotification('Passwörter exportiert');
});

// ─────────────────────────────────────────────────────────────
// 12. ZAHLUNGSMETHODEN
// ─────────────────────────────────────────────────────────────
function renderCards() {
  const el = document.getElementById('cards-list');
  if (!el) return;
  const sec = window.TechHelpSecurityManager;
  if (!sec) return;
  const cards = sec.paymentManager.getCards();
  el.innerHTML = cards.length
    ? cards.map(c => `
        <div class="card-item">
          <div class="card-icon">💳</div>
          <div class="card-content">
            <div class="card-nickname">${c.nickname || c.cardholderName}</div>
            <div class="card-number">${c.cardNumber}</div>
            <div class="card-expiry">Bis ${c.expiryMonth}/${c.expiryYear}</div>
          </div>
          <button class="password-action-btn danger" onclick="window.deleteCard('${c.id}')">🗑</button>
        </div>`).join('')
    : `<div class="pm-empty">
         <div class="pm-empty-icon">💳</div>
         <div class="pm-empty-title">Keine Karten gespeichert</div>
       </div>`;
}
window.deleteCard = async id => {
  if (confirm('Karte löschen?')) {
    await window.TechHelpSecurityManager?.paymentManager.deleteCard(id);
    renderCards();
    showNotification('Karte gelöscht');
  }
};
document.getElementById('pm-add-card-btn')?.addEventListener('click', async () => {
  const data = {
    cardholderName: prompt('Karteninhaber:'),
    cardNumber:     prompt('Kartennummer:'),
    expiryMonth:    prompt('Ablaufmonat (MM):'),
    expiryYear:     prompt('Ablaufjahr (YYYY):'),
    cvv:            prompt('CVV:'),
  };
  if (data.cardholderName && data.cardNumber) {
    await window.TechHelpSecurityManager?.paymentManager.addCard(data);
    renderCards();
    showNotification('Karte gespeichert!');
  }
});

// ─────────────────────────────────────────────────────────────
// 13. MASTER-PASSWORT (erster Start)
// ─────────────────────────────────────────────────────────────
(async function initSecurity() {
  if (!window.TechHelpSecurityManager) return;
  const hasMaster = localStorage.getItem('techhelp_has_master_password');
  if (!hasMaster) setTimeout(() => openPanel('panel-master-password'), 1000);

  document.getElementById('master-password-save')?.addEventListener('click', async () => {
    const pw  = document.getElementById('master-password-input')?.value  || '';
    const pw2 = document.getElementById('master-password-confirm')?.value || '';
    if (pw.length < 8) { alert('Mindestens 8 Zeichen!'); return; }
    if (pw !== pw2)    { alert('Passwörter stimmen nicht überein!'); return; }
    await window.TechHelpSecurityManager.initialize(pw);
    localStorage.setItem('techhelp_has_master_password', '1');
    closePanel('panel-master-password');
    showNotification('Master-Passwort gesetzt!');
  });

  // Passwort-Stärke-Anzeige
  document.getElementById('master-password-input')?.addEventListener('input', e => {
    const bar = document.getElementById('password-strength-bar');
    if (!bar) return;
    const v = e.target.value;
    const strength = v.length < 8 ? 'weak' : (v.length < 12 || !/[A-Z0-9!@#$]/.test(v)) ? 'medium' : 'strong';
    bar.className = 'password-strength-bar ' + strength;
  });
}());

// ─────────────────────────────────────────────────────────────
// 14. GOOGLE SIGN-IN
// ─────────────────────────────────────────────────────────────
document.getElementById('google-signin-action')?.addEventListener('click', async () => {
  const sec = window.TechHelpSecurityManager;
  if (!sec) { showNotification('Sicherheits-Manager nicht verfügbar'); return; }
  try {
    await sec.googleAuth.initialize('YOUR_GOOGLE_CLIENT_ID');
    await sec.googleAuth.signIn();
    showNotification('Google-Konto verbunden!');
  } catch (e) {
    showNotification('Google Sign-In: ' + e.message);
  }
});

// ─────────────────────────────────────────────────────────────
// 15. AUTO-UPDATER
// ─────────────────────────────────────────────────────────────
document.getElementById('menu-check-updates')?.addEventListener('click', async () => {
  const btn = document.getElementById('menu-check-updates');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="menu-icon">⏳</span> Prüfe...';
  btn.disabled = true;
  if (window.TechHelpAutoUpdater) await window.TechHelpAutoUpdater.checkNow();
  setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 1500);
});

if (window.electron) {
  window.electron.onUpdateAvailable(info =>
    showNotification('🎉 Update ' + info.version + ' verfügbar!')
  );
  window.electron.onUpdateDownloaded(() => {
    const div = document.createElement('div');
    div.className = 'update-notification show';
    div.innerHTML = `
      <div class="update-content">
        <div class="update-icon">✅</div>
        <div class="update-info">
          <div class="update-title">Update bereit!</div>
          <div class="update-version">Neustart zum Installieren</div>
        </div>
      </div>
      <div class="update-actions">
        <button class="update-btn update-btn-primary"
          onclick="window.electron.restartApp()">Jetzt neu starten</button>
        <button class="update-btn update-btn-secondary"
          onclick="this.closest('.update-notification').remove()">Später</button>
      </div>`;
    document.body.appendChild(div);
  });
}

// ─────────────────────────────────────────────────────────────
// 16. INIT
// ─────────────────────────────────────────────────────────────
goHome();
updateNavButtons();
console.log('✅ TechHelp Browser bereit');
