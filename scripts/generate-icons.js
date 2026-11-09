'use strict'
/**
 * generate-icons.js
 * Generiert alle App-Icon-Größen aus icon.svg für:
 *  - Electron (Windows .ico via PNG, macOS .icns via PNG, Linux .png)
 *  - Android Mipmap (mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi)
 *  - Splash Screens (portrait + landscape, alle Dichten)
 */

const sharp  = require('sharp')
const path   = require('path')
const fs     = require('fs')

const ROOT    = path.join(__dirname, '..')
const SRC_SVG = path.join(ROOT, 'assets', 'icons', 'icon.svg')
const ANDROID = path.join(ROOT, 'android', 'app', 'src', 'main', 'res')

// ── Icon-Größen ──────────────────────────────────────────────────────────────

const ELECTRON_SIZES = [16, 24, 32, 48, 64, 96, 128, 256, 512, 1024]

const ANDROID_MIPMAP = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
]

// Splash: breite × höhe
const ANDROID_SPLASH_PORT = [
  { dir: 'drawable-port-mdpi',    w: 320,  h: 480  },
  { dir: 'drawable-port-hdpi',    w: 480,  h: 800  },
  { dir: 'drawable-port-xhdpi',   w: 720,  h: 1280 },
  { dir: 'drawable-port-xxhdpi',  w: 960,  h: 1600 },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
]
const ANDROID_SPLASH_LAND = [
  { dir: 'drawable-land-mdpi',    w: 480,  h: 320  },
  { dir: 'drawable-land-hdpi',    w: 800,  h: 480  },
  { dir: 'drawable-land-xhdpi',   w: 1280, h: 720  },
  { dir: 'drawable-land-xxhdpi',  w: 1600, h: 960  },
  { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
]

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

async function svgToPng(svgPath, outPath, width, height) {
  await sharp(svgPath)
    .resize(width, height || width, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9 })
    .toFile(outPath)
  console.log(`  ✓ ${path.relative(ROOT, outPath)} (${width}×${height || width})`)
}

// Splash: zentriertes Logo auf einfarbigem Hintergrund (#0d1117 = sehr dunkles Grün)
async function makeSplash(svgPath, outPath, w, h) {
  const logoSize = Math.min(w, h) * 0.35
  const logo = await sharp(svgPath)
    .resize(Math.round(logoSize), Math.round(logoSize))
    .png()
    .toBuffer()

  // Hintergrund
  const bg = {
    create: {
      width:    w,
      height:   h,
      channels: 4,
      background: { r: 5, g: 46, b: 22, alpha: 255 } // #052e16 (dunkelgrün)
    }
  }

  await sharp(bg)
    .composite([{
      input:     logo,
      gravity:   'center',
    }])
    .png({ compressionLevel: 9 })
    .toFile(outPath)
  console.log(`  ✓ ${path.relative(ROOT, outPath)} (${w}×${h})`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n⚡ TechHelp Support Browser – Icon Generator\n')

  // 1. Electron PNG-Größen
  console.log('📦 Electron Icons (assets/icons/)...')
  const electronDir = path.join(ROOT, 'assets', 'icons')
  ensureDir(electronDir)
  for (const size of ELECTRON_SIZES) {
    await svgToPng(SRC_SVG, path.join(electronDir, `icon-${size}.png`), size)
  }
  // Hauptdatei für electron-builder (256px)
  await svgToPng(SRC_SVG, path.join(electronDir, 'icon.png'), 256)
  // 512px für Linux
  await svgToPng(SRC_SVG, path.join(electronDir, 'icon-512.png'), 512)

  // 2. Android Launcher Icons
  console.log('\n📱 Android Launcher Icons...')
  for (const { dir, size } of ANDROID_MIPMAP) {
    const outDir = path.join(ANDROID, dir)
    ensureDir(outDir)
    await svgToPng(SRC_SVG, path.join(outDir, 'ic_launcher.png'),       size)
    await svgToPng(SRC_SVG, path.join(outDir, 'ic_launcher_round.png'), size)
    await svgToPng(SRC_SVG, path.join(outDir, 'ic_launcher_foreground.png'), size)
  }

  // 3. Android Splash Screens (Portrait)
  console.log('\n🖼  Android Splash – Portrait...')
  for (const { dir, w, h } of ANDROID_SPLASH_PORT) {
    const outDir = path.join(ANDROID, dir)
    ensureDir(outDir)
    await makeSplash(SRC_SVG, path.join(outDir, 'splash.png'), w, h)
  }

  // 4. Android Splash Screens (Landscape)
  console.log('\n🖼  Android Splash – Landscape...')
  for (const { dir, w, h } of ANDROID_SPLASH_LAND) {
    const outDir = path.join(ANDROID, dir)
    ensureDir(outDir)
    await makeSplash(SRC_SVG, path.join(outDir, 'splash.png'), w, h)
  }

  // 5. drawable/splash.png (Standard, 1080×1920)
  console.log('\n🖼  Android Splash – Default (drawable)...')
  const drawableDir = path.join(ANDROID, 'drawable')
  ensureDir(drawableDir)
  await makeSplash(SRC_SVG, path.join(drawableDir, 'splash.png'), 1080, 1920)

  console.log('\n✅ Alle Icons erfolgreich generiert!\n')
}

main().catch(e => { console.error('Fehler:', e); process.exit(1) })
