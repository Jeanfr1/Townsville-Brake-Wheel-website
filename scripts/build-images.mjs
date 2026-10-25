// Encode assets-src/ plates into public/img as AVIF + WebP at several widths.
// File names carry a version (-v1-) because /img is served with an immutable
// cache: bump V when a plate changes, never overwrite a published name.
import sharp from 'sharp'
import { mkdir, copyFile, access } from 'node:fs/promises'
import { join } from 'node:path'

const V = 'v1'
// per-plate bumps (a changed plate gets a new name; old names stay valid for cached pages)
const BUMP = { local: 'v2' }
const ver = (name) => BUMP[name] || V
const SRC = 'assets-src'
const OUT = 'public/img'
await mkdir(OUT, { recursive: true })
await mkdir('public/media', { recursive: true })

const exists = (p) => access(p).then(() => true, () => false)

const plates = [
  // name, widths, avif quality, webp quality
  ['hero-covered', [1280, 1920, 2560], 52, 74],
  ['hero-mid', [1280, 1920, 2560], 52, 74],
  ['hero-lifted', [1280, 1920, 2560], 52, 74],
  ['hero-revealed', [1280, 1920, 2560], 52, 74],
  ['hero-mobile', [720, 1080, 1440], 52, 74],
  ['alignment', [1280, 1920, 2880], 50, 72],
  ['local', [960, 1600, 2400], 52, 74],
  ['contact', [800, 1300, 1890], 52, 74],
]

const only = process.argv.slice(2)
for (const [name, widths, qa, qw] of plates) {
  if (only.length && !only.includes(name)) continue
  const src = join(SRC, `${name}.png`)
  if (!(await exists(src))) { console.warn('skip (missing)', src); continue }
  for (const w of widths) {
    const base = sharp(src).resize({ width: w, withoutEnlargement: true })
    await base.clone().avif({ quality: qa, effort: 6 }).toFile(join(OUT, `${name}-${ver(name)}-${w}.avif`))
    await base.clone().webp({ quality: qw, effort: 6 }).toFile(join(OUT, `${name}-${ver(name)}-${w}.webp`))
  }
  console.log('ok', name, widths.join('/'))
}

// foreground cut-outs (car + cover) for the depth effect behind CONTROL
for (const state of ['covered', 'mid', 'lifted', 'revealed']) {
  const src = join(SRC, `hero-${state}-fg.png`)
  if (!(await exists(src))) continue
  for (const w of [1280, 1920, 2560]) {
    await sharp(src).resize({ width: w }).webp({ quality: 76, alphaQuality: 90, effort: 6 })
      .toFile(join(OUT, `hero-${state}-fg-${V}-${w}.webp`))
  }
  console.log('ok fg', state)
}

// logo A seal (dark oval fill, as on the approved board)
const logo = join(SRC, 'logo-seal.png')
for (const w of [400, 800]) {
  await sharp(logo).resize({ width: w }).webp({ quality: 90, alphaQuality: 100 }).toFile(join(OUT, `logo-seal-${V}-${w}.webp`))
  await sharp(logo).resize({ width: w }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(join(OUT, `logo-seal-${V}-${w}.png`))
}

// icons: seal centred on the brand black
const square = async (size, file, pad = 0.08) => {
  const inner = Math.round(size * (1 - pad * 2))
  const mark = await sharp(logo).resize({ width: inner, height: inner, fit: 'inside' }).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: '#111111' } })
    .composite([{ input: mark, gravity: 'center' }]).png().toFile(file)
}
await square(32, 'public/favicon-32.png', 0.02)
await square(180, 'public/apple-touch-icon.png')
await square(512, 'public/icon-512.png')

// social card: approved hero state + seal
if (await exists(join(SRC, 'hero-mid.png'))) {
  const mark = await sharp(logo).resize({ width: 300 }).toBuffer()
  await sharp(join(SRC, 'hero-mid.png'))
    .extract({ left: 0, top: 820, width: 2560, height: 1344 })
    .resize(1200, 630)
    .composite([{ input: mark, left: 36, top: 30 }])
    .jpeg({ quality: 82, mozjpeg: true }).toFile(join('public', `og-${V}.jpg`))
}

// campaign film for the viewer (loaded only when the visitor opens it)
await copyFile('site/assets/hero-reveal-720.mp4', 'public/media/hero-reveal-720.mp4')
console.log('done')
