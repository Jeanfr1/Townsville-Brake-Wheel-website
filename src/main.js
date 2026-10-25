import '@fontsource/anton/400.css'
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import './styles/base.css'
import './styles/board.css'
import './styles/board-fit.css'
import './styles/phone.css'
import './styles/motion.css'

import { initUI } from './js/ui.js'
import { initHero, introPhone } from './js/hero.js'
import { initScenes } from './js/scenes.js'

const root = document.documentElement
const isStatic = root.classList.contains('is-static')
const desktop = matchMedia('(min-width: 900px)').matches
const desktopMotion = desktop && !isStatic

if (desktopMotion) root.classList.add('motion')

initUI()
if (desktop) initHero({ motion: desktopMotion })
else introPhone()
if (!isStatic) initScenes({ desktopMotion })
