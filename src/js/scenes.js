// One distinct move per section, one thread through the page (the wheel):
//  alignment  copy is typeset in as the close-up docks; the photo drifts
//  services   a roller door lifts on the yellow bay; the index draws itself; the wheel turns with the scroll
//  local      the photo slides open from the right; LOCAL rises letter by letter
//  contact    the workshop photo pans; headline stamps in; footer seal turns into place
import { addScene, smooth, lerp, docTop } from './engine.js'

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const OUT = 'cubic-bezier(.16,1,.3,1)'

// Animations are created paused at their first frame (the hidden state belongs to
// this module, so a failed bundle leaves everything visible) and played on reveal.
function staged(list) {
  const anims = list.filter(Boolean).map(([el, frames, o]) => {
    const a = el.animate(frames, { fill: 'both', easing: OUT, ...o })
    a.pause()
    return a
  })
  return () => anims.forEach((a) => a.play())
}

function onEnter(el, play, threshold = 0.3) {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); play() }
  }, { threshold })
  io.observe(el)
}

const lines = (els, base, gap, frames, o = {}) => els.map((el, n) => [el, frames, { duration: 900, delay: base + n * gap, ...o }])
const draw = (el) => { el.setAttribute('pathLength', '1'); return el }

export function initScenes({ desktopMotion }) {
  const isDesk = () => matchMedia('(min-width: 900px)').matches

  // ---------- 2 · alignment ----------
  const al = $('#alignment')
  const playAl = staged([
    ...lines($$('.al-title .ln', al), 0, 110, [{ clipPath: 'inset(0 -5% 100% 0)', translate: '0 .45em' }, { clipPath: 'inset(0 -5% -10% 0)', translate: '0 0' }]),
    ...lines($$('.al-lead .ln', al), 420, 260, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 700, easing: 'steps(16, end)' }),
    [$('.al-bar', al), [{ transform: 'scaleY(0)', transformOrigin: 'top' }, { transform: 'scaleY(1)', transformOrigin: 'top' }], { duration: 900, delay: 700 }],
    ...lines($$('.al-list li', al), 780, 90, [{ opacity: 0, translate: '-.8em 0' }, { opacity: 1, translate: '0 0' }], { duration: 700 }),
    ...lines($$('.al-side .ln', al), 500, 80, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 }),
    [$('.al-marks', al), [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1400, delay: 300, easing: 'cubic-bezier(.45,0,.2,1)' }],
  ])
  if (desktopMotion && isDesk()) al.addEventListener('docked', playAl, { once: true })
  else onEnter(al, playAl, 0.35)
  // the photo drifts as the section leaves (starts at 0, so the hand-off stays pixel-identical)
  const alMedia = $('.al-media', al)
  addScene({
    range: () => { const t = docTop(al); return [t + al.offsetHeight - innerHeight, t + al.offsetHeight] },
    update: (p) => { alMedia.style.translate = isDesk() ? `calc(${lerp(0, -12, p)} * var(--u)) 0` : '' },
  })

  // ---------- 3 · services ----------
  const sv = $('#services')
  const door = document.createElement('div')
  door.className = 'sv-door'
  door.setAttribute('aria-hidden', 'true')
  sv.prepend(door)
  addScene({
    range: () => { const t = docTop(sv); return [t - innerHeight, t - innerHeight * 0.3] },
    update: (p) => {
      const e = smooth(0, 1, p)
      door.style.transform = `translateY(${-101 * e}%)`
      door.style.visibility = e >= 1 ? 'hidden' : 'visible'
    },
  })
  const wheel = $('.wheel-rot', sv)
  addScene({
    range: () => { const t = docTop(sv); return [t - innerHeight, t + sv.offsetHeight] },
    update: (p) => { wheel.style.transform = `rotate(${lerp(24, -24, p)}deg)` },
  })
  const icoShapes = $$('.svc .ico :is(path, rect, circle, ellipse):not(.fill)', sv).map(draw)
  const playSv = staged([
    [$('.sv-eyebrow', sv), [{ opacity: 0, translate: '0 .6em' }, { opacity: 1, translate: '0 0' }], { duration: 700 }],
    [$('.sv-rule', sv), [{ transform: 'scaleX(0)', transformOrigin: 'left' }, { transform: 'scaleX(1)', transformOrigin: 'left' }], { duration: 800, delay: 200 }],
    ...lines($$('.sv-title .ln', sv), 120, 120, [{ clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% -5% -10% 0)' }], { duration: 1000, easing: 'cubic-bezier(.65,0,.2,1)' }),
    ...lines($$('.sv-note .ln', sv), 650, 90, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 }),
    [$('.sv-grid .gv', sv), [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 1100, delay: 250, easing: 'cubic-bezier(.65,0,.2,1)' }],
    [$('.sv-grid .gh', sv), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1100, delay: 250, easing: 'cubic-bezier(.65,0,.2,1)' }],
    [$('.sv-grid .gp', sv), [{ opacity: 0, transform: 'rotate(-90deg)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 150 }],
    ...icoShapes.map((s, n) => [s, [{ strokeDasharray: '1', strokeDashoffset: '1' }, { strokeDasharray: '1', strokeDashoffset: '0' }], { duration: 1100, delay: 500 + Math.floor(n / 4) * 30, easing: 'cubic-bezier(.45,0,.2,1)' }]),
    ...$$('.svc .ico .fill', sv).map((s) => [s, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 1200 }]),
    ...lines($$('.svc h3', sv), 650, 110, [{ opacity: 0, translate: '0 .5em' }, { opacity: 1, translate: '0 0' }], { duration: 800 }),
    ...lines($$('.svc p', sv), 850, 110, [{ opacity: 0 }, { opacity: 1 }], { duration: 700 }),
  ])
  onEnter(sv, playSv, 0.45)

  // ---------- 4 · local ----------
  const lo = $('#local')
  const word = $('.lo-word .sx', lo)
  const text = word.textContent
  word.innerHTML = `<span class="sr-only">${text}</span><span aria-hidden="true">${[...text].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`
  const loMedia = $('.lo-media', lo)
  addScene({
    range: () => { const t = docTop(lo); return [t - innerHeight, t - innerHeight * 0.35] },
    update: (p) => {
      const e = smooth(0, 1, p)
      loMedia.style.clipPath = `inset(0 0 0 ${100 * (1 - e)}%)`
      loMedia.style.translate = isDesk() ? `calc(${lerp(18, 0, e)} * var(--u)) 0` : ''
    },
  })
  const playLo = staged([
    ...lines($$('.lo-word .ch', lo), 0, 85, [{ translate: '0 105%' }, { translate: '0 0' }], { duration: 1000, easing: 'cubic-bezier(.65,0,.2,1)' }),
    ...lines($$('.lo-copy .ln', lo), 520, 90, [{ opacity: 0, translate: '0 .7em' }, { opacity: 1, translate: '0 0' }], { duration: 800 }),
    [$('.lo-dash', lo), [{ transform: 'scaleX(0)', transformOrigin: 'left' }, { transform: 'scaleX(1)', transformOrigin: 'left' }], { duration: 800, delay: 900 }],
  ])
  onEnter(lo, playLo, 0.4)

  // ---------- 5 · contact + footer ----------
  const fin = $('.finale')
  const coImg = $('.co-media img', fin)
  addScene({
    range: () => { const t = docTop(fin); return [t - innerHeight, t + fin.offsetHeight] },
    update: (p) => { coImg.style.translate = isDesk() ? `0 calc(${lerp(34, -40, p)} * var(--u))` : `0 ${lerp(-4, 4, p)}%` },
  })
  const playCo = staged([
    ...lines($$('.co-title .ln', fin), 0, 130, [{ opacity: 0, transform: 'scale(1.07)', transformOrigin: 'left bottom', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', transformOrigin: 'left bottom', filter: 'blur(0)' }], { duration: 900 }),
    ...lines($$('.co-ico', fin), 450, 140, [{ opacity: 0, transform: 'scale(.4)', transformOrigin: 'center' }, { opacity: 1, transform: 'none', transformOrigin: 'center' }], { duration: 700, easing: 'cubic-bezier(.34,1.56,.64,1)' }),
    ...lines($$('.co-call .txt, .co-addr .txt', fin), 520, 140, [{ opacity: 0, translate: '-.8em 0' }, { opacity: 1, translate: '0 0' }], { duration: 800 }),
  ])
  onEnter($('.co-title', fin), playCo, 0.6)
  const foot = $('.site-foot', fin)
  const playFoot = staged([
    [$('.foot-brand', foot), [{ opacity: 0, transform: 'rotate(-7deg) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 1100 }],
    [$('.foot-rule', foot), [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 800, delay: 250 }],
    ...lines($$('.nav-foot a', foot), 300, 80, [{ opacity: 0, translate: '0 .6em' }, { opacity: 1, translate: '0 0' }], { duration: 700 }),
    [$('.btn-foot', foot), [{ opacity: 0, translate: '1em 0' }, { opacity: 1, translate: '0 0' }], { duration: 800, delay: 480 }],
  ])
  onEnter($('.foot-brand', foot), playFoot, 0.5)
}
