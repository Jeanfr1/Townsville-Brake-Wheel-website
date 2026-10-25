// One rAF loop for every scroll-linked scene. Scroll position is eased toward
// the real one (?nosmooth turns easing off for captures); long jumps snap.
const scenes = []
const query = location.search
const EASE = /[?&]nosmooth\b/.test(query) ? 1 : 0.16
let current = window.scrollY
let raf = 0

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const easeOut = (t) => 1 - Math.pow(1 - t, 3)

// scene: { range(): [startScroll, endScroll], update(progress, scroll) }
export function addScene(scene) {
  scene.p = -1
  scenes.push(scene)
  measureScene(scene)
  render(true)
  return scene
}

function measureScene(s) {
  const [a, b] = s.range()
  s.a = a
  s.b = Math.max(a + 1, b)
}

export function measure() {
  scenes.forEach(measureScene)
  render(true)
}

function render(force) {
  for (const s of scenes) {
    const p = clamp((current - s.a) / (s.b - s.a))
    if (force || p !== s.p) {
      s.p = p
      s.update(p, current)
    }
  }
}

function tick() {
  const target = window.scrollY
  const diff = target - current
  current = Math.abs(diff) > window.innerHeight * 1.5 || Math.abs(diff) < 0.2 ? target : current + diff * EASE
  render(false)
  raf = current !== target ? requestAnimationFrame(tick) : 0
}

const wake = () => { if (!raf) raf = requestAnimationFrame(tick) }
addEventListener('scroll', wake, { passive: true })
let rto
addEventListener('resize', () => { clearTimeout(rto); rto = setTimeout(measure, 120) })
new ResizeObserver(() => { clearTimeout(rto); rto = setTimeout(measure, 120) }).observe(document.body)

// document-space top of an element (unaffected by transforms of the element itself)
export function docTop(el) {
  let y = 0
  for (let n = el; n; n = n.offsetParent) y += n.offsetTop
  return y
}
