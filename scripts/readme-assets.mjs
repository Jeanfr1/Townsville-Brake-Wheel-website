// README captures from the production build (npm run build && npm run preview).
// Output: scripts/out/readme/ (raw frames), then scripts/readme-composite.py builds .github/assets/.
import { chromium } from 'playwright-core'
import { mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = process.env.QA_BASE || 'http://localhost:4319/'
const OUT = 'scripts/out/readme'
rmSync(OUT, { recursive: true, force: true })
mkdirSync(`${OUT}/gif`, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const raf2 = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))

// ---- hero scroll GIF frames (1440 x 900)
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${BASE}?nosmooth`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3800)
  const end = await page.evaluate(() => { const h = document.querySelector('.hero'); return h.getBoundingClientRect().top + scrollY + h.offsetHeight - innerHeight })
  const N = 58
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(end * t))
    await page.waitForTimeout(i === N - 1 ? 1800 : 350); await raf2(page)
    await page.screenshot({ path: `${OUT}/gif/f_${String(i).padStart(4, '0')}.png` })
  }
  await page.close()
}

// ---- desktop sections (1440 x 900), final states (?static) so no scene is caught mid-move
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${BASE}?static&nosmooth`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/d-hero.png` })
  for (const [name, sel, off] of [['alignment', '#alignment', -64], ['services', '#services', -64], ['local', '#local', -64], ['contact', '.finale', -64]]) {
    await page.evaluate(([s, o]) => { const el = document.querySelector(s); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + o, behavior: 'instant' }) }, [sel, off])
    await page.waitForTimeout(2600); await raf2(page)
    await page.screenshot({ path: `${OUT}/d-${name}.png` })
  }
  await page.close()
}

// ---- phone (390 x 844, 2x)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.goto(`${BASE}?nosmooth`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/m-hero.png` })
  for (const [name, sel, off] of [['alignment', '#alignment-title', -330], ['services', '.svc-list', -380], ['contact', '#contact-title', -300]]) {
    await page.evaluate(([s, o]) => { const el = document.querySelector(s); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + o, behavior: 'instant' }) }, [sel, off])
    await page.waitForTimeout(2200); await raf2(page)
    await page.screenshot({ path: `${OUT}/m-${name}.png` })
  }
  await ctx.close()
}

// ---- banner rendered with the site's own fonts and plate
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 520 }, deviceScaleFactor: 1 })
  await page.goto('file://' + resolve('scripts/banner.html'))
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/banner.png` })
  await page.close()
}
await browser.close()
console.log('captures in', OUT)
