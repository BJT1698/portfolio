import type { AppId } from './registry'
import { cvLinks, type SocialLink } from '../config/links'

// Voci di benvenuto condivise da Welcome (desktop) e dalla configurazione iniziale (mobile),
// divise tra parte professionale e personale.

export type WelcomeItem = { kind: 'app'; id: AppId; title: string; desc: string } | { kind: 'link'; link: SocialLink; desc: string }

export const WORK: WelcomeItem[] = [
  { kind: 'app', id: 'cv', title: 'Curriculum', desc: 'esperienza, competenze e formazione · PDF scaricabile' },
  { kind: 'app', id: 'about', title: 'Chi sono', desc: 'profilo, stack e contatti' },
  { kind: 'app', id: 'terminal', title: 'Terminale', desc: 'il CV da riga di comando: prova help' },
  ...cvLinks.map((link): WelcomeItem => ({ kind: 'link', link, desc: link.icon === 'email' ? link.handle : 'profilo professionale' })),
]

export const PERSONAL: WelcomeItem[] = [
  { kind: 'app', id: 'gallery', title: 'Gallery', desc: 'le mie foto, da gallery.bjt1698.it' },
  { kind: 'app', id: 'videos', title: 'Video', desc: 'giri in moto su YouTube' },
  { kind: 'app', id: 'socials', title: 'Social & link', desc: 'GitHub, Instagram e tutti gli altri link' },
]
