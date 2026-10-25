// End-to-end checks on the production build (npm run build && npm run preview).
// QA_BASE=<url> npm run qa   to run against the live site.
// Writes captures to scripts/out/qa/ and exits 1 on any failure.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = (process.env.QA_BASE || 'http://localhost:4319/').replace(/\/?$/, '/')
const OUT = 'scripts/out/qa'
mkdirSync(OUT, { recursive: true })
const results = []
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? `  (${info})` : ''}`) }
const frames = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const PROCESS_WORDS = /\b(conceptual|generated|edited|original photo|campaign|mock-?up|illustrative|placeholder|lorem|todo|ai[- ]generated|screenshot)\b/i

const browser = await chromium.launch({ channel: 'chrome', headless: true })

async function open(viewport, query = '', opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...opts })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  let bytes = 0
  page.on('response', async (r) => { try { const b = await r.body(); bytes += b.length } catch {} })
  await page.goto(BASE + query, { waitUntil: 'networkidle' })
  return { ctx, page, errors, bytes: () => bytes }
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)

// ---------------------------------------------------------------- desktop, motion
{
  const { ctx, page, errors, bytes } = await open({ width: 1440, height: 900 }, '?nosmooth')
  await page.waitForTimeout(3600)
  check('desktop: first load bytes < 3.5 MB', bytes() < 3.5e6, `${(bytes() / 1e6).toFixed(2)} MB`)
  await page.screenshot({ path: `${OUT}/d-00-top.png` })
  check('desktop: intro finished (no intro-wait)', !(await page.evaluate(() => document.documentElement.classList.contains('intro-wait'))))
  check('desktop: motion mode on', await page.evaluate(() => document.documentElement.classList.contains('motion')))
  check('desktop: no horizontal overflow at top', (await overflow(page)) === 0)
  check('desktop: compact bar hidden at top', await page.evaluate(() => !document.querySelector('.topbar').classList.contains('is-shown')))

  // hero pin sequence
  const pin = await page.evaluate(() => {
    const hero = document.querySelector('.hero'); const stage = document.querySelector('.hero-stage')
    const top = hero.getBoundingClientRect().top + scrollY
    return { start: top + Math.max(0, stage.offsetHeight - innerHeight), end: top + hero.offsetHeight - innerHeight }
  })
  const marks = [0, 0.12, 0.24, 0.36, 0.5, 0.62, 0.74, 0.86, 0.995, 1]
  for (const [n, f] of marks.entries()) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(pin.start + (pin.end - pin.start) * f))
    await page.waitForTimeout(250); await frames(page)
    await page.screenshot({ path: `${OUT}/d-pin-${String(n).padStart(2, '0')}.png` })
  }
  const p = await page.evaluate(() => document.querySelector('[data-hero]').dataset.p)
  check('desktop: hero progress reaches 1', Number(p) === 1, `p=${p}`)
  check('desktop: alignment docked at pin end', await page.evaluate(() => document.querySelector('#alignment').classList.contains('is-docked')))
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.end + 500)
  await page.waitForTimeout(400)
  check('desktop: compact bar shown once the hero header has gone', await page.evaluate(() => document.querySelector('.topbar').classList.contains('is-shown')))
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.end)
  await page.waitForTimeout(300)

  // hand-off must be pixel-identical: iris layer just before vs docked section just after
  // compare the wheel area only (copy and marks animate in after the dock)
  const box = await page.evaluate(() => { const r = document.querySelector('#alignment .frame').getBoundingClientRect(); const u = r.width / 757; return { x: Math.round(r.left + 330 * u), y: Math.round(r.top), width: Math.round(220 * u), height: Math.round(r.height) } })
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.end - 1)
  await page.waitForTimeout(200); await frames(page)
  const before = await page.screenshot({ clip: box })
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), pin.end)
  await page.waitForTimeout(200); await frames(page)
  const after = await page.screenshot({ clip: box })
  // best match over a +-1 px vertical shift (sticky release rounds sub-pixel positions)
  const diffPct = await page.evaluate(async ([a, b]) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s })
    const [ia, ib] = await Promise.all([load(a), load(b)])
    const W = ia.width, H = ia.height
    const px = (img) => { const c = new OffscreenCanvas(W, H); const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, W, H).data }
    const da = px(ia), db = px(ib)
    let best = Infinity
    for (const dy of [-1, 0, 1]) {
      let s = 0, n = 0
      for (let y = 2; y < H - 2; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, j = ((y + dy) * W + x) * 4
        s += Math.abs(da[i] - db[j]) + Math.abs(da[i + 1] - db[j + 1]) + Math.abs(da[i + 2] - db[j + 2]); n += 3
      }
      best = Math.min(best, s / n)
    }
    return best
  }, [before.toString('base64'), after.toString('base64')])
  check('desktop: hand-off iris -> docked section is seamless', diffPct < 3, `mean |diff| ${diffPct.toFixed(2)}`)

  // sections, natural order
  const ids = ['#alignment', '#services', '#local', '#contact']
  for (const [n, id] of ids.entries()) {
    await page.evaluate((s) => { const el = document.querySelector(s); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 40, behavior: 'instant' }) }, id)
    await page.waitForTimeout(1900); await frames(page)
    await page.screenshot({ path: `${OUT}/d-sec-${n + 1}.png` })
  }
  check('desktop: no horizontal overflow after scenes', (await overflow(page)) === 0, `${await overflow(page)} px`)
  check('desktop: services door opened', await page.evaluate(() => { const d = document.querySelector('.sv-door'); return !d || getComputedStyle(d).visibility === 'hidden' }))
  check('desktop: LOCAL split letters', await page.evaluate(() => document.querySelectorAll('.lo-word .ch').length === 5))
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${OUT}/d-sec-5-bottom.png` })

  // real clicks
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(400)
  await page.click('.btn-hero')
  check('click: hero Enquire opens the enquiry dialog', await page.evaluate(() => document.querySelector('#enquiry').open))
  await page.click('#enquiry button[type=submit]')
  check('form: empty submit shows the error and keeps the dialog', await page.evaluate(() => !document.querySelector('.form-error').hidden && document.querySelector('#enquiry').open))
  await page.keyboard.press('Escape')
  check('dialog: Escape closes', await page.evaluate(() => !document.querySelector('#enquiry').open))
  await page.click('.film-link')
  await page.waitForTimeout(500)
  check('click: Watch the reveal loads the film only on demand', await page.evaluate(() => { const v = document.querySelector('#film video'); return document.querySelector('#film').open && /hero-reveal-720\.mp4$/.test(v.currentSrc || v.src) }))
  await page.keyboard.press('Escape')
  await page.click('.nav-main a[href="#services"]')
  await page.waitForTimeout(1500)
  const svTop = await page.evaluate(() => document.querySelector('#services').getBoundingClientRect().top)
  check('nav: Services link lands on the section', Math.abs(svTop - 64) < 30, `top=${Math.round(svTop)}`)
  await page.click('.svc-2 button')
  check('click: service cell opens its detail', await page.evaluate(() => document.querySelector('#service').open && /Brake/.test(document.querySelector('#service-title').textContent)))
  await page.click('#service [data-from-service]')
  check('service -> enquiry carries the service', await page.evaluate(() => document.querySelector('#enquiry').open && document.querySelector('[data-enquiry] select').value === 'Brake repairs'))
  await page.keyboard.press('Escape')
  await page.click('.topbar .btn')
  check('click: compact bar Enquire works', await page.evaluate(() => document.querySelector('#enquiry').open))
  await page.keyboard.press('Escape')
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(1500)
  await page.click('.btn-foot')
  check('click: footer Enquire works', await page.evaluate(() => document.querySelector('#enquiry').open))
  await page.keyboard.press('Escape')
  const tel = await page.getAttribute('.co-call', 'href')
  check('contact: phone link', tel === 'tel:+61747756161', tel)

  // copy hygiene: visible text + alt attributes
  const text = await page.evaluate(() => document.body.innerText + ' ' + [...document.images].map((i) => i.alt).join(' '))
  const hit = text.match(PROCESS_WORDS)
  check('copy: no production notes in text or alt', !hit, hit ? hit[0] : '')
  check('desktop: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------- scale (no "super zoom")
for (const vp of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1280, height: 800 }]) {
  const { ctx, page } = await open(vp, '?static&nosmooth')
  const m = await page.evaluate(() => {
    const vh = innerHeight, q = (s) => document.querySelector(s)
    const h = (s) => q(s).getBoundingClientRect().height / vh
    const fs = (s) => Math.max(...[...document.querySelectorAll(s)].map((e) => parseFloat(getComputedStyle(e).fontSize)))
    const small = [...document.querySelectorAll('.hero-side, .al-lead, .al-list, .al-side, .sv-note, .svc p, .nav-main a')].map((e) => parseFloat(getComputedStyle(e).fontSize))
    return { hero: h('.hero'), al: h('#alignment'), sv: h('#services'), lo: h('#local'), fin: h('.finale'), titles: fs('.al-title .ln, .sv-title .ln, .co-title .ln'), smallMin: Math.min(...small), frame: q('.hero .frame').getBoundingClientRect().width / innerWidth }
  })
  const tag = `scale ${vp.width}`
  check(`${tag}: hero fits about one screen (<= 1.05 vh)`, m.hero <= 1.05, `${m.hero.toFixed(2)} vh`)
  check(`${tag}: sections stay under 0.8 vh`, Math.max(m.al, m.sv, m.lo, m.fin) <= 0.8, [m.al, m.sv, m.lo, m.fin].map((v) => v.toFixed(2)).join('/'))
  check(`${tag}: section titles <= 7.5% of the width (earlier sites: 4.9-8.5%)`, m.titles <= vp.width * 0.075, `${Math.round(m.titles)} px`)
  check(`${tag}: small text >= 11 px`, m.smallMin >= 11, `${m.smallMin.toFixed(1)} px`)
  await ctx.close()
}

// ---------------------------------------------------------------- deep link
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, '?nosmooth#contact')
  await page.waitForTimeout(2500)
  const t = await page.evaluate(() => document.querySelector('#contact-title').getBoundingClientRect().top)
  check('hash: #contact opens on the contact headline', t > 0 && t < 900, `top=${Math.round(t)}`)
  await ctx.close()
}

// ---------------------------------------------------------------- phone
for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 780 }]) {
  const { ctx, page, errors, bytes } = await open(vp, '?nosmooth', { isMobile: true, hasTouch: true })
  await page.waitForTimeout(2200)
  const tag = `m${vp.width}`
  check(`${tag}: first load bytes < 1.6 MB`, bytes() < 1.6e6, `${(bytes() / 1e6).toFixed(2)} MB`)
  const desktopPlates = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /hero-(covered|lifted|revealed|mid)-v1|fg-v1/.test(e.name)).map((e) => e.name.split('/').pop()))
  check(`${tag}: desktop hero plates not downloaded`, desktopPlates.length === 0, desktopPlates.join(','))
  await page.screenshot({ path: `${OUT}/${tag}-00.png` })
  const h = await page.evaluate(() => document.body.scrollHeight)
  for (let i = 1, y = vp.height; y < h; y += vp.height, i++) {
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y)
    await page.waitForTimeout(1300)
    await page.screenshot({ path: `${OUT}/${tag}-${String(i).padStart(2, '0')}.png` })
    check(`${tag}: no overflow at ${y}`, (await overflow(page)) === 0)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.tap('.menu-toggle')
  check(`${tag}: menu opens`, await page.evaluate(() => !document.querySelector('#menu').hidden))
  await page.tap('#menu a[href="#local"]')
  await page.waitForTimeout(900)
  check(`${tag}: menu link closes menu and scrolls`, await page.evaluate(() => document.querySelector('#menu').hidden && document.querySelector('#local').getBoundingClientRect().top < 200))
  const small = await page.evaluate(() => [...document.querySelectorAll('a, button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== 'hidden' && (r.height < 40) && !e.closest('dialog') && !e.closest('.legal') && !e.closest('.nav-foot') }).map((e) => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().height)))
  check(`${tag}: tap targets >= 40 px`, small.length === 0, small.join(', '))
  check(`${tag}: no console errors`, errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------- no JS + reduced motion
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, '', { javaScriptEnabled: false })
  const t = await page.evaluate(() => document.body.innerText)
  check('no-JS: phone and address in the HTML', /\(07\) 4775 6161/.test(t) && /Pilkington Street/i.test(t))
  check('no-JS: hero text visible', await page.evaluate(() => getComputedStyle(document.querySelector('.hero-word')).visibility === 'visible'))
  await page.screenshot({ path: `${OUT}/nojs-top.png` })
  await ctx.close()
}
{
  const { ctx, page, errors } = await open({ width: 1440, height: 900 }, '', { reducedMotion: 'reduce' })
  await page.waitForTimeout(600)
  check('reduced motion: static mode, no pin', await page.evaluate(() => document.documentElement.classList.contains('is-static') && !document.documentElement.classList.contains('motion')))
  check('reduced motion: alignment visible without hand-off', await page.evaluate(() => getComputedStyle(document.querySelector('#alignment')).visibility === 'visible'))
  check('reduced motion: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
