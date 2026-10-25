import { site, services } from '../data/site.js'

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]

export function initUI() {
  // ---------- dialogs ----------
  let opener = null
  const open = (id, from) => {
    const d = document.getElementById(id)
    if (!d) return
    document.querySelectorAll('dialog[open]').forEach((o) => o !== d && o.close())
    opener = from || document.activeElement
    if (id === 'film') {
      const v = $('video', d)
      if (v.dataset.src) {
        v.poster = v.dataset.poster
        v.src = v.dataset.src
        delete v.dataset.src
      }
      d.addEventListener('close', () => v.pause(), { once: true })
      d.showModal()
      v.play().catch(() => {})
      return
    }
    d.showModal()
  }
  $$('dialog').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d) d.close() })   // backdrop
    d.addEventListener('close', () => { if (opener && document.contains(opener)) opener.focus({ preventScroll: true }) })
  })
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open], [data-close], [data-service]')
    if (!t) return
    if (t.matches('[data-close]')) { t.closest('dialog').close(); return }
    if (t.matches('[data-service]')) {
      const s = services[t.dataset.service]
      const d = $('#service')
      $('#service-title', d).textContent = s.title
      $('[data-service-text]', d).textContent = s.text
      d.dataset.service = s.title
      open('service', t)
      return
    }
    if (t.matches('[data-from-service]')) {
      const chosen = $('#service').dataset.service
      const sel = $('[data-enquiry] select')
      if (chosen) sel.value = chosen
    }
    open(t.dataset.open, t)
  })

  // ---------- enquiry: compose an email in the visitor's own app ----------
  const form = $('[data-enquiry]')
  const err = $('.form-error', form)
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = new FormData(form)
    const bad = ['name', 'vehicle', 'message'].filter((k) => !String(f.get(k) || '').trim())
    form.querySelectorAll('[name]').forEach((el) => el.setAttribute('aria-invalid', String(bad.includes(el.name))))
    err.hidden = !bad.length
    if (bad.length) { form.querySelector(`[name="${bad[0]}"]`).focus(); return }
    const subject = `${f.get('service')} enquiry: ${f.get('vehicle')}`
    const body = `Name: ${f.get('name')}\nVehicle: ${f.get('vehicle')}\nService: ${f.get('service')}\n\n${f.get('message')}`
    location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  })

  // ---------- phone menu ----------
  const toggle = $('.menu-toggle')
  const menu = $('#menu')
  const setMenu = (on) => { toggle.setAttribute('aria-expanded', String(on)); menu.hidden = !on }
  toggle.addEventListener('click', () => setMenu(menu.hidden))
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false) })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus() } })

  // ---------- desktop: compact bar once the hero header has scrolled away ----------
  const bar = $('[data-topbar]')
  const head = $('.hero-head .brand')
  new IntersectionObserver(([e]) => bar.classList.toggle('is-shown', !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 }).observe(head)
}
