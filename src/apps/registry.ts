import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { CircleHelp, Clapperboard, FileText, House, Images, Settings, Share2, SquareTerminal, UserRound, type LucideIcon } from 'lucide-react'
import CvApp from './CvApp'
import WelcomeApp from './WelcomeApp'

export type AppId = 'welcome' | 'terminal' | 'cv' | 'about' | 'socials' | 'gallery' | 'videos' | 'settings' | 'help'

export interface AppDef {
  id: AppId
  /** Nome "binario" mostrato nella title bar e nella status bar. */
  title: string
  label: string
  icon: LucideIcon
  component: ComponentType | LazyExoticComponent<ComponentType>
  size: { w: number; h: number }
  minSize: { w: number; h: number }
  /** Posizione iniziale come frazione dell'area libera (0-1). */
  anchor: { x: number; y: number }
}

// L'ordine definisce dock, icone desktop e scorciatoie Alt+1..N (la guida resta fuori: si apre da Welcome o dalla home mobile).
export const APP_ORDER: AppId[] = ['welcome', 'terminal', 'cv', 'about', 'socials', 'gallery', 'videos', 'settings']

export const APPS: Record<AppId, AppDef> = {
  welcome: {
    id: 'welcome',
    title: 'welcome',
    label: 'Welcome',
    icon: House,
    // Import diretto: è la prima finestra all'avvio, niente fallback di Suspense.
    component: WelcomeApp,
    size: { w: 780, h: 700 },
    minSize: { w: 360, h: 320 },
    anchor: { x: 0.5, y: 0.4 },
  },
  terminal: {
    id: 'terminal',
    title: 'terminal.app',
    label: 'Terminal',
    icon: SquareTerminal,
    component: lazy(() => import('./TerminalApp')),
    size: { w: 760, h: 470 },
    minSize: { w: 360, h: 220 },
    anchor: { x: 0.92, y: 0.12 },
  },
  cv: {
    id: 'cv',
    title: 'cv.viewer',
    label: 'Curriculum',
    icon: FileText,
    // Import diretto: si apre all'avvio se Welcome è disattivata.
    component: CvApp,
    size: { w: 920, h: 640 },
    minSize: { w: 420, h: 320 },
    anchor: { x: 0.3, y: 0.08 },
  },
  about: {
    id: 'about',
    title: 'about.sys',
    label: 'About & Skills',
    icon: UserRound,
    component: lazy(() => import('./AboutApp')),
    size: { w: 760, h: 540 },
    minSize: { w: 380, h: 300 },
    anchor: { x: 0.35, y: 0.2 },
  },
  socials: {
    id: 'socials',
    title: 'links.conf',
    label: 'Social & Links',
    icon: Share2,
    component: lazy(() => import('./SocialsApp')),
    size: { w: 560, h: 460 },
    minSize: { w: 320, h: 260 },
    anchor: { x: 0.6, y: 0.3 },
  },
  gallery: {
    id: 'gallery',
    title: 'gallery.img',
    label: 'Gallery',
    icon: Images,
    component: lazy(() => import('./GalleryApp')),
    size: { w: 820, h: 600 },
    minSize: { w: 360, h: 300 },
    anchor: { x: 0.7, y: 0.25 },
  },
  videos: {
    id: 'videos',
    title: 'videos.mp4',
    label: 'Video',
    icon: Clapperboard,
    component: lazy(() => import('./VideosApp')),
    size: { w: 820, h: 580 },
    minSize: { w: 360, h: 300 },
    anchor: { x: 0.8, y: 0.35 },
  },
  settings: {
    id: 'settings',
    title: 'settings',
    label: 'Settings',
    icon: Settings,
    component: lazy(() => import('./SettingsApp')),
    size: { w: 500, h: 460 },
    minSize: { w: 320, h: 280 },
    anchor: { x: 0.5, y: 0.5 },
  },
  help: {
    id: 'help',
    title: 'help.man',
    label: 'Guida',
    icon: CircleHelp,
    component: lazy(() => import('./HelpApp')),
    size: { w: 680, h: 580 },
    minSize: { w: 340, h: 280 },
    anchor: { x: 0.55, y: 0.3 },
  },
}
