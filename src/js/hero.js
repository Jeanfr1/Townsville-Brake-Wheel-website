// CONTROL hero (desktop, motion on):
//  intro   the cover slides off the Falcon (covered -> mid, the approved board state),
//          CONTROL rises from behind the bodywork, header and notes set in
//  scroll  the hero scrolls to ground level, then pins: the cover lifts and flies
//          (mid -> lifted -> revealed) and the front wheel opens onto the alignment
//          close-up, which docks into the next section
import { addScene, smooth, clamp, lerp, easeOut, docTop } from './engine.js'

const root = document.documentElement
const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]

// board geometry (board px): hero front-wheel hub and tyre radius, alignment hub and tyre radius
const HERO_HUB = [412, 235]      // in the 757 x 353 hand-off box at the bottom of the hero
const AL_HUB = [437.5, 171]      // in the alignment section
const HERO_TYRE = 65
const AL_TYRE = 150
const IRIS_MAX = 485

const unit = () => Math.min(document.querySelector('main').clientWidth, 1920) / 757

function loadSrcset(scope) {
  $$('[data-srcset]', scope).forEach((el) => {
    el.setAttribute('srcset', el.dataset.srcset)
    el.removeAttribute('data-srcset')
  })
}

const decoded = (img, ms) => Promise.race([
  (img.complete && img.naturalWidth > 1 ? Promise.resolve() : new Promise((r) => img.addEventListener('load', r, { once: true }))).then(() => img.decode?.()).then(() => true, () => false),
  new Promise((r) => setTimeout(() => r(false), ms)),
])

export function initHero({ motion }) {
  const stage = $('[data-hero]')
  const hero = stage.closest('.hero')
  const plate = (s) => $(`.plate[data-state="${s}"]`, stage)
  const fg = (s) => $(`.fg-plate[data-state="${s}"]`, stage)
  const word = $('.hero-word', stage)
  const iris = $('.iris', stage)
  const irisMedia = $('.iris-media', stage)
  const ring = $('.iris-ring circle', stage)
  const fades = $$('.hero-tag, .hero-dash, .hero-side, .film-link', stage)
  const dim = $('.hero-dim', stage)
  const alignment = $('#alignment')

  if (!motion) {
    loadSrcset(fg('mid').parentElement)   // static desktop keeps the depth cut-out
    root.classList.remove('intro-wait')
    return
  }

  // desktop-only layers: later states, cut-outs, hand-off media
  loadSrcset(stage)
  setVar(stage, '--c', 1)

  intro()

  // ---------- scroll ----------
  let docked = false
  addScene({
    range() {
      const top = docTop(hero)
      const H = stage.offsetHeight
      return [top + Math.max(0, H - innerHeight), top + hero.offsetHeight - innerHeight]
    },
    update(p) {
      const l = smooth(0.04, 0.3, p)
      const r = smooth(0.26, 0.5, p)
      setVar(stage, '--l', l)
      setVar(stage, '--r', r)
      // light sweep rides the active edge
      const active = p < 0.28 ? l : r
      setVar(stage, '--sp', active)
      setVar(stage, '--so', Math.sin(Math.PI * active) * (p < 0.52 ? 0.9 : 0))
      stage.dataset.sa = p < 0.28 ? 'lift' : 'fly'

      const f = 1 - smooth(0.42, 0.58, p)
      fades.forEach((el) => { el.style.opacity = f })
      word.style.setProperty('--wy', `${lerp(0, 14, smooth(0, 0.6, p))}`)

      // iris: wheel -> alignment close-up (scale only ever grows toward 1)
      const i = smooth(0.54, 1, p)
      const e = easeOut(i)
      const radius = i <= 0 ? 0 : lerp(HERO_TYRE * 0.9, IRIS_MAX, Math.pow(i, 1.35))
      setVar(stage, '--ir', radius)
      const k = lerp(HERO_TYRE / AL_TYRE, 1, e)
      const tx = lerp(HERO_HUB[0] - AL_HUB[0], 0, e)
      const ty = lerp(HERO_HUB[1] - AL_HUB[1], 0, e)
      irisMedia.style.transform = `translate(calc(${tx} * var(--u)), calc(${ty} * var(--u))) scale(${k})`
      ring.style.opacity = i > 0 ? String(1 - smooth(0.15, 0.55, i)) : '0'
      ring.setAttribute('r', String(radius))
      iris.style.visibility = i > 0 ? 'visible' : 'hidden'
      dim.style.opacity = String(0.82 * smooth(0.35, 1, i))

      const dock = p >= 0.999
      if (dock !== docked) {
        docked = dock
        alignment.classList.toggle('is-docked', dock)
        if (dock) alignment.dispatchEvent(new CustomEvent('docked'))
      }
      stage.dataset.p = p.toFixed(3)
    },
  })

  // pre-pin: CONTROL lags behind the page (depth)
  addScene({
    range() {
      const top = docTop(hero)
      return [top, top + Math.max(1, stage.offsetHeight - innerHeight)]
    },
    update(q) { word.style.setProperty('--wq', `${q * 10}`) },
  })

  async function intro() {
    const covered = $('img', plate('covered'))
    const ok = await Promise.all([decoded(covered, 1400), document.fonts?.load('400 1em Anton').catch(() => {})])
    const withCover = ok[0]
    root.classList.remove('intro-wait')
    if (root.classList.contains('is-static')) return
    const u = unit()
    const T = (el, frames, o) => el && el.animate(frames, { fill: 'backwards', easing: 'cubic-bezier(.16,1,.3,1)', ...o })

    if (withCover) {
      plate('covered').style.opacity = '1'
      stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' })
      const t0 = performance.now() + 380
      const D = 1500
      const step = (now) => {
        const t = clamp((now - t0) / D)
        const c = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        setVar(stage, '--c', c)
        setVar(stage, '--sp', c)
        setVar(stage, '--so', Math.sin(Math.PI * c) * 0.8)
        stage.dataset.sa = 'pull'
        if (t < 1) requestAnimationFrame(step)
        else { plate('covered').style.opacity = ''; setVar(stage, '--so', 0) }
      }
      setVar(stage, '--c', 0)
      requestAnimationFrame(step)
    }
    const d0 = withCover ? 1150 : 150

    // CONTROL rises from behind the car
    T($('.sx', word), [{ translate: `0 ${1.08 * 220 * u}px` }, { translate: '0 0' }], { duration: 1400, delay: d0 })
    // header
    T($('.brand', stage), [{ opacity: 0, transform: 'translateY(-10px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: d0 - 250 })
    $$('.nav-main a', stage).forEach((a, n) => T(a, [{ opacity: 0, translate: '0 -8px' }, { opacity: 1, translate: '0 0' }], { duration: 700, delay: d0 - 150 + n * 70 }))
    T($('.btn-hero', stage), [{ opacity: 0, translate: '14px 0' }, { opacity: 1, translate: '0 0' }], { duration: 800, delay: d0 + 60 })
    // notes
    $$('.hero-tag .ln', stage).forEach((l, n) => T(l, [{ clipPath: 'inset(0 0 100% 0)', translate: '0 0.5em' }, { clipPath: 'inset(0 0 0 0)', translate: '0 0' }], { duration: 800, delay: d0 + 700 + n * 110 }))
    T($('.hero-dash', stage), [{ transform: 'scaleX(0)', transformOrigin: 'left' }, { transform: 'scaleX(1)', transformOrigin: 'left' }], { duration: 700, delay: d0 + 950 })
    $$('.hero-side .ln', stage).forEach((l, n) => T(l, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 520, delay: d0 + 600 + n * 120, easing: 'steps(12, end)' }))
    T($('.hero-marks .cross', stage), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: d0 + 400 })
    $$('.hero-marks .contours path', stage).forEach((p, n) => {
      const len = p.getTotalLength()
      T(p, [{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: '0' }], { duration: 1600, delay: d0 + 300 + n * 90, easing: 'cubic-bezier(.45,0,.2,1)' })
    })
    T($('.film-link', stage), [{ opacity: 0 }, { opacity: 0.86 }], { duration: 800, delay: d0 + 1300 })
  }
}

function setVar(el, k, v) { el.style.setProperty(k, typeof v === 'number' ? v.toFixed(4) : v) }

// phones: CONTROL and the tagline set in over the static poster
export function introPhone() {
  root.classList.remove('intro-wait')
  if (root.classList.contains('is-static')) return
  const stage = $('[data-hero]')
  const o = { fill: 'backwards', easing: 'cubic-bezier(.16,1,.3,1)' }
  $('.hero-word .sx', stage).animate([{ translate: '0 40%', opacity: 0 }, { translate: '0 0', opacity: 1 }], { ...o, duration: 1200, delay: 150 })
  $('.hero-tag', stage).animate([{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }], { ...o, duration: 900, delay: 650 })
  $('.plate.is-base img', stage).animate([{ opacity: 0.4 }, { opacity: 1 }], { ...o, duration: 1400 })
}
