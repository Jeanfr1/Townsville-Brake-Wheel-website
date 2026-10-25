// Page vs approved board: render the static page at 1600 px, crop the centred board
// frame and scale it to 2x the board width (1514 px), then build side-by-side + 50%
// blend sheets per section and print the mean difference (scripts/compare-board.py).
// Needs `npm run build && npm run preview` (port 4319) and Google Chrome.
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const BASE = process.env.QA_BASE || 'http://localhost:4319/'
const OUT = 'scripts/out/compare'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
await page.goto(`${BASE}?static&nosmooth`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
// walk the page once so lazy images load, then back to the top; hide the compact bar
for (let y = 0; y < 9000; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120) }
await page.waitForLoadState('networkidle')
await page.evaluate(() => window.scrollTo(0, 0))
await page.addStyleTag({ content: '.topbar{display:none!important}' })
await page.waitForTimeout(500)
const f = await page.evaluate(() => { const r = document.querySelector('.hero .frame').getBoundingClientRect(); return { x: r.left, w: r.width, h: document.querySelector('main').getBoundingClientRect().height } })
await page.screenshot({ path: `${OUT}/page-frame.png`, fullPage: true, clip: { x: Math.round(f.x), y: 0, width: Math.round(f.w), height: Math.round(f.h) } })
await browser.close()
console.log('frame', Math.round(f.w), 'x', Math.round(f.h), '-> scaled to 1514 wide')
execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${OUT}/page-frame.png'); im.resize((1514, 4156), Image.LANCZOS).save('${OUT}/page.png')`])
execFileSync('python3', ['scripts/compare-board.py', `${OUT}/page.png`, OUT], { stdio: 'inherit' })
