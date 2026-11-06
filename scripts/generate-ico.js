'use strict'
/**
 * Generiert icon.ico (Windows) und icon.icns (macOS) aus icon.png
 * Nutzt nur sharp + raw Buffer-Manipulation (kein externes Tool nötig)
 */
const sharp  = require('sharp')
const fs     = require('fs')
const path   = require('path')

const ICONS_DIR = path.join(__dirname, '..', 'assets', 'icons')
const SRC_PNG   = path.join(ICONS_DIR, 'icon.png')
const SRC_SVG   = path.join(ICONS_DIR, 'icon.svg')
const SRC       = fs.existsSync(SRC_PNG) ? SRC_PNG : SRC_SVG

// ── ICO bauen (Windows) ──────────────────────────────────────────────────────
// ICO Format: Header + Directory + Bitmap-Daten
// Wir bauen ein Multi-Size ICO mit 16, 32, 48, 64, 128, 256px
async function buildIco() {
  const sizes = [16, 32, 48, 64, 128, 256]
  const pngBuffers = await Promise.all(
    sizes.map(s => sharp(SRC).resize(s, s).png({ compressionLevel: 9 }).toBuffer())
  )

  const count = sizes.length
  // ICO Header: 6 bytes
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)     // Reserved
  header.writeUInt16LE(1, 2)     // Type: 1 = ICO
  header.writeUInt16LE(count, 4) // Count

  // Directory: 16 bytes pro Eintrag
  const dirSize   = count * 16
  let dataOffset  = 6 + dirSize
  const dirs      = []
  const dataChunks = []

  for (let i = 0; i < count; i++) {
    const s   = sizes[i]
    const buf = pngBuffers[i]
    const dir = Buffer.alloc(16)
    dir.writeUInt8(s === 256 ? 0 : s, 0)   // Width  (0 = 256)
    dir.writeUInt8(s === 256 ? 0 : s, 1)   // Height (0 = 256)
    dir.writeUInt8(0, 2)                   // Color count (0 = >256)
    dir.writeUInt8(0, 3)                   // Reserved
    dir.writeUInt16LE(1, 4)                // Planes
    dir.writeUInt16LE(32, 6)               // Bit count
    dir.writeUInt32LE(buf.length, 8)       // Size of image data
    dir.writeUInt32LE(dataOffset, 12)      // Offset
    dirs.push(dir)
    dataChunks.push(buf)
    dataOffset += buf.length
  }

  const ico = Buffer.concat([header, ...dirs, ...dataChunks])
  const outPath = path.join(ICONS_DIR, 'icon.ico')
  fs.writeFileSync(outPath, ico)
  console.log(`✓ icon.ico (${(ico.length / 1024).toFixed(0)} KB)`)
}

// ── ICNS bauen (macOS) ───────────────────────────────────────────────────────
// ICNS Format: Header + Icon-Blöcke
// Wir bauen mit: ic07(128), ic08(256), ic09(512), ic10(1024)
async function buildIcns() {
  // ICNS Typ-Codes nach Größe
  const entries = [
    { type: 'icp4', size: 16   },
    { type: 'icp5', size: 32   },
    { type: 'icp6', size: 64   },
    { type: 'ic07', size: 128  },
    { type: 'ic08', size: 256  },
    { type: 'ic09', size: 512  },
    { type: 'ic10', size: 1024 },
  ]

  const chunks = await Promise.all(
    entries.map(async ({ type, size }) => {
      const src = size > 512
        ? (fs.existsSync(path.join(ICONS_DIR, 'icon-1024.png'))
            ? path.join(ICONS_DIR, 'icon-1024.png') : SRC)
        : SRC
      const png  = await sharp(src).resize(size, size).png({ compressionLevel: 9 }).toBuffer()
      const header = Buffer.alloc(8)
      header.write(type, 0, 4, 'ascii')
      header.writeUInt32BE(png.length + 8, 4)
      return Buffer.concat([header, png])
    })
  )

  const body       = Buffer.concat(chunks)
  const fileHeader = Buffer.alloc(8)
  fileHeader.write('icns', 0, 4, 'ascii')
  fileHeader.writeUInt32BE(body.length + 8, 4)

  const icns    = Buffer.concat([fileHeader, body])
  const outPath = path.join(ICONS_DIR, 'icon.icns')
  fs.writeFileSync(outPath, icns)
  console.log(`✓ icon.icns (${(icns.length / 1024).toFixed(0)} KB)`)
}

async function main() {
  console.log('\n⚡ Generating .ico and .icns...\n')
  await buildIco()
  await buildIcns()
  console.log('\n✅ Done!\n')
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
