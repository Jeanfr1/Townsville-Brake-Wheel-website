// Page vs approved board: render the static page at 2x the board width (1514 px,
// so 1 board px = 2 css px), then build side-by-side + 50% blend sheets per section
// and print the mean difference (scripts/compare-board.py).
// Needs `npm run build && npm run preview` (port 4319) and Google Chrome.
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const BASE = process.env.QA_BASE || 'http://localhost:4319/'
const OUT = 'scripts/out/compare'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1514, height: 1000 }, deviceScaleFactor: 1 })
await page.goto(`${BASE}?static&nosmooth`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
// walk the page once so lazy images load, then back to the top; hide the compact bar
for (let y = 0; y < 9000; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120) }
await page.waitForLoadState('networkidle')
await page.evaluate(() => window.scrollTo(0, 0))
await page.addStyleTag({ content: '.topbar{display:none!important}' })
await page.waitForTimeout(500)
const height = await page.evaluate(() => document.querySelector('main').getBoundingClientRect().height)
await page.screenshot({ path: `${OUT}/page.png`, fullPage: true, clip: { x: 0, y: 0, width: 1514, height: Math.round(height) } })
await browser.close()
console.log('page height', height, '(board x2 =', 2078 * 2, ')')
execFileSync('python3', ['scripts/compare-board.py', `${OUT}/page.png`, OUT], { stdio: 'inherit' })
