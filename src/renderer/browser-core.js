/**
 * TechHelp Browser — Core (Electron Desktop)
 * Copyright © 2026 TechHelp Support. All Rights Reserved.
 *
 * Sauber, kein Capacitor, keine Konflikte.
 */
'use strict';

// ═══════════════════════════════════════════════════════════
// 1. DOM
// ═══════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

const addressbar   = $('addressbar');
const btnBack      = $('btn-back');
const btnForward   = $('btn-forward');
const btnReload    = $('btn-reload');
const btnHome      = $('btn-home');
const btnBookmark  = $('btn-bookmark');
const btnMenu      = $('btn-menu');
const btnMin       = $('btn-min');
const btnMax       = $('btn-max');
const btnClose     = $('btn-close');
const webview      = $('webview');
const homePage     = $('home-page');
const progressBar  = $('progress-bar');
const progressInner= $('progress-bar-inner');
const securityIcon = $('security-icon');
const homeSearch   = $('home-search');
const homeForm     = $('home-search-form');
const dropdown     = $('dropdown-menu');
const sidePanel    = $('side-panel');
const panelTitle   = $('side-panel-title');
const panelBody    = $('side-panel-body');
const panelClose   = $('side-panel-close');
const notification = $('notification');

// ═══════════════════════════════════════════════════════════
// 2. UTILS
// ═══════════════════════════════════════════════════════════
function normalizeUrl(raw) {
  raw = (raw || '').trim();
  if (!raw) return 'https://techhelp-support.de';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9-]+(\.[a-z]{2,})+/i.test(raw) && !raw.includes(' '))
    return 'https://' + raw;
  return 'https://www.google.com/search?q=' + encodeURIComponent(raw);
}

let _notifTimer;
function notify(msg, duration = 3000) {
  notification.textContent = msg;
  notification.classList.remove('hidden');
  clearTimeout(_notifTimer);
  _notifTimer = setTimeout(() => notification.classList.add('hidden'), duration);
}

// ═══════════════════════════════════════════════════════════
// 3. NAVIGATION
// ═══════════════════════════════════════════════════════════
function navigate(raw) {
  const url = normalizeUrl(raw);
  homePage.classList.add('hidden');
  webview.classList.add('visible');
  webview.src      = url;
  addressbar.value = url;
  updateSecurity(url);
  hideDropdown();
  if (window.thBrowser) window.thBrowser.historyAdd({ title: url, url });
}

function goHome() {
  homePage.classList.remove('hidden');
  webview.classList.remove('visible');
  webview.src      = 'about:blank';
  addressbar.value = '';
  updateSecurity('');
  hideDropdown();
}

function updateSecurity(url) {
  const secure = /^https:/i.test(url);
  securityIcon.classList.toggle('insecure', !secure && !!url);
  securityIcon.title = secure ? 'Sichere Verbindung' : url ? 'Ungesicherte Verbindung' : '';
}

function updateNav() {
  btnBack.disabled    = !webview.canGoBack();
  btnForward.disabled = !webview.canGoForward();
}

// ═══════════════════════════════════════════════════════════
// 4. TOOLBAR EVENTS
// ═══════════════════════════════════════════════════════════
btnBack.addEventListener('click',    () => webview.canGoBack()    && webview.goBack());
btnForward.addEventListener('click', () => webview.canGoForward() && webview.goForward());
btnReload.addEventListener('click',  () => {
  if (webview.classList.contains('visible')) webview.reload();
});
btnHome.addEventListener('click', goHome);

addressbar.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); navigate(addressbar.value); }
});
addressbar.addEventListener('focus', () => addressbar.select());

homeForm.addEventListener('submit', e => {
  e.preventDefault();
  const q = homeSearch.value.trim();
  if (q) navigate(q);
});

document.querySelectorAll('.shortcut').forEach(btn =>
  btn.addEventListener('click', () => navigate(btn.dataset.url))
);

// ═══════════════════════════════════════════════════════════
// 5. WEBVIEW EVENTS
// ═══════════════════════════════════════════════════════════
webview.addEventListener('did-start-loading', () => {
  progressBar.classList.add('active');
  progressInner.style.width = '30%';
  updateNav();
});

webview.addEventListener('did-stop-loading', () => {
  progressInner.style.width = '100%';
  setTimeout(() => {
    progressBar.classList.remove('active');
    progressInner.style.width = '0%';
  }, 300);
  updateNav();
});

webview.addEventListener('did-fail-load', () => {
  progressBar.classList.remove('active');
  progressInner.style.width = '0%';
});

webview.addEventListener('did-navigate', e => {
  addressbar.value = e.url;
  updateSecurity(e.url);
  updateNav();
});

webview.addEventListener('did-navigate-in-page', e => {
  addressbar.value = e.url;
  updateSecurity(e.url);
});

webview.addEventListener('page-title-updated', e => {
  if (e.title) document.title = e.title + ' — TechHelp Browser';
});

// ═══════════════════════════════════════════════════════════
// 6. WINDOW CONTROLS
// ═══════════════════════════════════════════════════════════
if (window.thBrowser) {
  btnMin.addEventListener('click', () => window.thBrowser.minimize());
  btnMax.addEventListener('click', async () => {
    window.thBrowser.maximize();
    const max = await window.thBrowser.isMaximized();
    btnMax.textContent = max ? '❐' : '□';
  });
  btnClose.addEventListener('click', () => window.thBrowser.close());
}

// ═══════════════════════════════════════════════════════════
// 7. DROPDOWN MENÜ
// ═══════════════════════════════════════════════════════════
function showDropdown() { dropdown.classList.remove('hidden'); }
function hideDropdown() { dropdown.classList.add('hidden'); }

btnMenu.addEventListener('click', e => {
  e.stopPropagation();
  dropdown.classList.contains('hidden') ? showDropdown() : hideDropdown();
});

document.addEventListener('click', e => {
  if (!dropdown.contains(e.target) && e.target !== btnMenu) hideDropdown();
});

// Menü-Aktionen
dropdown.querySelectorAll('.menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    hideDropdown();
    handleMenuAction(btn.dataset.action);
  });
});

function handleMenuAction(action) {
  switch (action) {
    case 'passwords':     openPanel('Passwörter',       renderPasswordPanel());     break;
    case 'payments':      openPanel('Zahlungsmethoden', renderPaymentsPanel());     break;
    case 'collections':   openPanel('Sammlungen',       renderCollectionsPanel());  break;
    case 'reading-list':  openPanel('Leseliste',        renderReadingListPanel());  break;
    case 'history':       openPanel('Verlauf',          renderHistoryPanel());      break;
    case 'downloads':     openPanel('Downloads',        renderDownloadsPanel());    break;
    case 'bookmarks':     openPanel('Lesezeichen',      renderBookmarksPanel());    break;
    case 'settings':      openPanel('Einstellungen',    renderSettingsPanel());     break;
    case 'check-updates': checkUpdates();                                           break;
    case 'zoom-in':       if (webview.classList.contains('visible')) webview.setZoomLevel(webview.getZoomLevel()+1); break;
    case 'zoom-out':      if (webview.classList.contains('visible')) webview.setZoomLevel(webview.getZoomLevel()-1); break;
    case 'fullscreen':    document.body.requestFullscreen?.(); break;
  }
}

// ═══════════════════════════════════════════════════════════
// 8. SEITEN-PANEL
// ═══════════════════════════════════════════════════════════
function openPanel(title, html) {
  panelTitle.textContent = title;
  panelBody.innerHTML    = html;
  sidePanel.classList.remove('hidden');
  // Panel-Buttons aktivieren
  panelBody.querySelectorAll('[data-panel-action]').forEach(btn =>
    btn.addEventListener('click', () => handlePanelAction(btn.dataset.panelAction, btn.dataset))
  );
}
function closePanel() { sidePanel.classList.add('hidden'); }
panelClose.addEventListener('click', closePanel);

btnBookmark.addEventListener('click', () => {
  const url   = addressbar.value;
  const title = document.title.replace(' — TechHelp Browser', '') || url;
  if (url && window.thBrowser) {
    window.thBrowser.bookmarksAdd({ title, url, favicon: null });
    notify('🔖 Lesezeichen gespeichert');
  }
});

// ═══════════════════════════════════════════════════════════
// 9. PANEL-INHALTE
// ═══════════════════════════════════════════════════════════

// ── PASSWÖRTER ─────────────────────────────────────────────
function renderPasswordPanel() {
  const sec = window.TechHelpSecurityManager;
  if (!sec) return emptyPanel('🔐', 'Passwort-Manager nicht verfügbar');
  const creds = sec.passwordManager.getAllCredentials();
  return `
    ${creds.length === 0 ? emptyPanel('🔐', 'Keine Passwörter gespeichert') : ''}
    ${creds.map(c => `
      <div class="pw-item">
        <div class="pw-item-icon">🌐</div>
        <div class="pw-item-info">
          <div class="pw-item-name">${escHtml(c.name || c.url)}</div>
          <div class="pw-item-user">${escHtml(c.username)}</div>
        </div>
        <div class="pw-item-actions">
          <button onclick="copyPw('${c.id}')" title="Kopieren">📋</button>
          <button onclick="deletePw('${c.id}')" title="Löschen">🗑</button>
        </div>
      </div>`).join('')}
    <button class="panel-add-btn" onclick="addPw()">+ Passwort hinzufügen</button>`;
}

window.copyPw = async id => {
  const c = window.TechHelpSecurityManager?.passwordManager.getAllCredentials().find(x => x.id === id);
  if (c) { await navigator.clipboard.writeText(c.password); notify('📋 Passwort kopiert'); }
};
window.deletePw = async id => {
  if (!confirm('Passwort löschen?')) return;
  await window.TechHelpSecurityManager?.passwordManager.deleteCredential(id);
  openPanel('Passwörter', renderPasswordPanel());
  notify('🗑 Passwort gelöscht');
};
window.addPw = async () => {
  const url = prompt('Website:');      if (!url) return;
  const user= prompt('Benutzername:'); if (!user) return;
  const pw  = prompt('Passwort:');     if (!pw) return;
  await window.TechHelpSecurityManager?.passwordManager.addCredential(url, user, pw);
  openPanel('Passwörter', renderPasswordPanel());
  notify('✅ Passwort gespeichert');
};

// ── ZAHLUNGSMETHODEN ───────────────────────────────────────
function renderPaymentsPanel() {
  const sec = window.TechHelpSecurityManager;
  if (!sec) return emptyPanel('💳', 'Zahlungs-Manager nicht verfügbar');
  const cards = sec.paymentManager.getCards();
  return `
    ${cards.length === 0 ? emptyPanel('💳', 'Keine Karten gespeichert') : ''}
    ${cards.map(c => `
      <div class="pw-item">
        <div class="pw-item-icon">💳</div>
        <div class="pw-item-info">
          <div class="pw-item-name">${escHtml(c.nickname || c.cardholderName)}</div>
          <div class="pw-item-user">•••• ${escHtml(c.cardNumber.slice(-4))} · ${c.expiryMonth}/${c.expiryYear}</div>
        </div>
        <div class="pw-item-actions">
          <button onclick="deleteCard('${c.id}')" title="Löschen">🗑</button>
        </div>
      </div>`).join('')}
    <button class="panel-add-btn" onclick="addCard()">+ Karte hinzufügen</button>`;
}

window.deleteCard = async id => {
  if (!confirm('Karte löschen?')) return;
  await window.TechHelpSecurityManager?.paymentManager.deleteCard(id);
  openPanel('Zahlungsmethoden', renderPaymentsPanel());
  notify('🗑 Karte gelöscht');
};
window.addCard = async () => {
  const d = {
    cardholderName: prompt('Karteninhaber:'),
    cardNumber:     prompt('Kartennummer:'),
    expiryMonth:    prompt('Ablaufmonat (MM):'),
    expiryYear:     prompt('Ablaufjahr (YYYY):'),
    cvv:            prompt('CVV:'),
  };
  if (d.cardholderName && d.cardNumber) {
    await window.TechHelpSecurityManager?.paymentManager.addCard(d);
    openPanel('Zahlungsmethoden', renderPaymentsPanel());
    notify('✅ Karte gespeichert');
  }
};

// ── SAMMLUNGEN ─────────────────────────────────────────────
function renderCollectionsPanel() {
  const f = window.TechHelpEdgeFeatures;
  if (!f) return emptyPanel('📚', 'Collections nicht verfügbar');
  const cols = f.collections.getAllCollections();
  return `
    ${cols.length === 0 ? emptyPanel('📚', 'Keine Sammlungen') : ''}
    ${cols.map(c => `
      <div class="pw-item">
        <div class="pw-item-icon">📚</div>
        <div class="pw-item-info">
          <div class="pw-item-name">${escHtml(c.name)}</div>
          <div class="pw-item-user">${c.items.length} Elemente</div>
        </div>
        <div class="pw-item-actions">
          <button onclick="deleteCollection('${c.id}')" title="Löschen">🗑</button>
        </div>
      </div>`).join('')}
    <button class="panel-add-btn" onclick="addCollection()">+ Neue Sammlung</button>`;
}
window.deleteCollection = id => {
  if (!confirm('Sammlung löschen?')) return;
  window.TechHelpEdgeFeatures?.collections.deleteCollection(id);
  openPanel('Sammlungen', renderCollectionsPanel());
};
window.addCollection = () => {
  const name = prompt('Name der Sammlung:');
  if (name?.trim()) {
    window.TechHelpEdgeFeatures?.collections.createCollection(name.trim());
    openPanel('Sammlungen', renderCollectionsPanel());
    notify('✅ Sammlung erstellt');
  }
};

// ── LESELISTE ──────────────────────────────────────────────
function renderReadingListPanel() {
  const f = window.TechHelpEdgeFeatures;
  if (!f) return emptyPanel('📖', 'Leseliste nicht verfügbar');
  const items = f.readingList.getAll();
  return `
    ${items.length === 0 ? emptyPanel('📖', 'Leseliste ist leer') : ''}
    ${items.map(i => `
      <div class="pw-item ${i.read ? 'read' : ''}">
        <div class="pw-item-icon">📄</div>
        <div class="pw-item-info">
          <div class="pw-item-name">${escHtml(i.title)}</div>
          <div class="pw-item-user">${new Date(i.added).toLocaleDateString('de-DE')}</div>
        </div>
        <div class="pw-item-actions">
          <button onclick="navigate('${i.url}')" title="Öffnen">↗</button>
          <button onclick="removeReading('${i.id}')" title="Entfernen">🗑</button>
        </div>
      </div>`).join('')}
    <button class="panel-add-btn" onclick="addCurrentToReading()">+ Aktuelle Seite hinzufügen</button>`;
}
window.removeReading = id => {
  window.TechHelpEdgeFeatures?.readingList.remove(id);
  openPanel('Leseliste', renderReadingListPanel());
};
window.addCurrentToReading = () => {
  const url = addressbar.value;
  if (!url) { notify('Keine Seite geöffnet'); return; }
  window.TechHelpEdgeFeatures?.readingList.add(document.title, url);
  openPanel('Leseliste', renderReadingListPanel());
  notify('📖 Zur Leseliste hinzugefügt');
};

// ── VERLAUF ────────────────────────────────────────────────
async function renderHistoryPanel() {
  if (!window.thBrowser) return emptyPanel('🕐', 'Verlauf nicht verfügbar');
  const history = await window.thBrowser.historyGet();
  if (!history?.length) return emptyPanel('🕐', 'Verlauf ist leer');
  return history.slice(0, 50).map(h => `
    <div class="pw-item" style="cursor:pointer" onclick="navigate('${escHtml(h.url)}')">
      <div class="pw-item-icon">🕐</div>
      <div class="pw-item-info">
        <div class="pw-item-name">${escHtml(h.title || h.url)}</div>
        <div class="pw-item-user">${new Date(h.timestamp).toLocaleString('de-DE')}</div>
      </div>
    </div>`).join('');
}

// ── LESEZEICHEN ────────────────────────────────────────────
async function renderBookmarksPanel() {
  if (!window.thBrowser) return emptyPanel('🔖', 'Lesezeichen nicht verfügbar');
  const bm = await window.thBrowser.bookmarksGet();
  if (!bm?.length) return emptyPanel('🔖', 'Keine Lesezeichen');
  return bm.map(b => `
    <div class="pw-item">
      <div class="pw-item-icon">🔖</div>
      <div class="pw-item-info" style="cursor:pointer" onclick="navigate('${escHtml(b.url)}')">
        <div class="pw-item-name">${escHtml(b.title)}</div>
        <div class="pw-item-user">${escHtml(b.url)}</div>
      </div>
      <div class="pw-item-actions">
        <button onclick="removeBookmark('${escHtml(b.url)}')" title="Entfernen">🗑</button>
      </div>
    </div>`).join('');
}
window.removeBookmark = async url => {
  await window.thBrowser?.bookmarksRemove(url);
  openPanel('Lesezeichen', await renderBookmarksPanel());
  notify('🗑 Lesezeichen entfernt');
};

// ── DOWNLOADS ──────────────────────────────────────────────
function renderDownloadsPanel() {
  return emptyPanel('⬇', 'Downloads werden hier angezeigt');
}

// ── EINSTELLUNGEN ──────────────────────────────────────────
function renderSettingsPanel() {
  return `
    <div class="panel-section">
      <div class="panel-section-title">Startseite</div>
      <div class="pw-item">
        <div class="pw-item-info">
          <div class="pw-item-name">Homepage</div>
          <input id="settings-homepage" style="
            background:#2a2a2a; border:1px solid rgba(255,255,255,.1);
            border-radius:6px; padding:6px 10px; color:#f0f0f0;
            font-size:12px; width:100%; margin-top:4px;"
            value="https://techhelp-support.de">
        </div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Version</div>
      <div class="pw-item">
        <div class="pw-item-info">
          <div class="pw-item-name">TechHelp Browser</div>
          <div class="pw-item-user" id="settings-version">1.0.6</div>
        </div>
      </div>
    </div>
    <button class="panel-add-btn" onclick="checkUpdates()">🔄 Nach Updates suchen</button>`;
}

// ═══════════════════════════════════════════════════════════
// 10. AUTO-UPDATER
// ═══════════════════════════════════════════════════════════
async function checkUpdates() {
  notify('🔄 Suche nach Updates…');
  if (window.TechHelpAutoUpdater) {
    const result = await window.TechHelpAutoUpdater.checkNow();
    if (!result?.updateAvailable) notify('✅ Du hast die neueste Version');
  } else if (window.electron) {
    window.electron.checkForUpdates?.();
  }
}

if (window.electron) {
  window.electron.onUpdateAvailable?.(info =>
    notify('🎉 Update ' + info.version + ' verfügbar!')
  );
  window.electron.onUpdateDownloaded?.(() => {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position:fixed; bottom:0; left:0; right:0;
      background:#1a1a1a; border-top:1px solid rgba(255,255,255,.1);
      padding:14px 20px; display:flex; align-items:center; justify-content:space-between;
      z-index:9999; gap:12px;`;
    banner.innerHTML = `
      <span style="font-size:14px">✅ Update heruntergeladen — Neustart zum Installieren</span>
      <div style="display:flex;gap:8px">
        <button style="background:#ff4444;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px"
          onclick="window.electron.restartApp()">Jetzt neu starten</button>
        <button style="background:rgba(255,255,255,.1);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px"
          onclick="this.closest('div').remove()">Später</button>
      </div>`;
    document.body.appendChild(banner);
  });
}

// ═══════════════════════════════════════════════════════════
// 11. HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════
function emptyPanel(icon, msg) {
  return `<div class="panel-empty"><div class="panel-empty-icon">${icon}</div>${msg}</div>`;
}
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════════════════════
// 12. INIT
// ═══════════════════════════════════════════════════════════
goHome();
updateNav();
// KEIN automatischer Master-Passwort-Prompt beim Start
console.log('✅ TechHelp Browser bereit');
