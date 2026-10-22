import { Suspense, useEffect, useRef, useState } from 'react'
import { BatteryFull, ChevronLeft, Signal, Wifi } from 'lucide-react'
import { useWM } from '../store/windows'
import { useSettings } from '../store/settings'
import { STAGE, useSession } from '../store/session'
import { APPS, type AppId } from '../apps/registry'
import { profile } from '../config/profile'
import { links, type SocialLink } from '../config/links'
import { LinkGlyph } from '../lib/icons'
import { beep } from '../lib/sound'

// Shell mobile: home a griglia (layout stile iOS, linguaggio visivo del desktop), app a schermo intero.

type Tile = { kind: 'app'; id: AppId } | { kind: 'link'; link: SocialLink }

const emailLink = links.find((l) => l.icon === 'email')
const DOCK: Tile[] = [
  { kind: 'app', id: 'terminal' },
  { kind: 'app', id: 'cv' },
  { kind: 'app', id: 'socials' },
  ...(emailLink ? [{ kind: 'link' as const, link: emailLink }] : []),
]
const GRID: Tile[] = [
  { kind: 'app', id: 'about' },
  { kind: 'app', id: 'gallery' },
  { kind: 'app', id: 'videos' },
  { kind: 'app', id: 'settings' },
  { kind: 'app', id: 'help' },
  // YouTube ha già la sua app (Video): niente icona link doppia.
  ...links.filter((l) => l !== emailLink && l.icon !== 'youtube').map((link) => ({ kind: 'link' as const, link })),
]

/** Punto dell'ultimo tocco: origine dello zoom di apertura app. */
let tapOrigin = '50% 50%'

function openApp(id: AppId, e: React.MouseEvent<HTMLElement>) {
  // Da tastiera (detail 0) le coordinate sono 0,0: si usa il centro del pulsante.
  if (e.detail === 0) {
    const r = e.currentTarget.getBoundingClientRect()
    tapOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`
  } else tapOrigin = `${e.clientX}px ${e.clientY}px`
  beep('open')
  useWM.getState().open(id)
}

export function MobileShell() {
  const focused = useWM((s) => s.focused)
  const [closing, setClosing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const goHome = () => {
    if (closing) return
    beep('close')
    setClosing(true)
    timer.current = setTimeout(() => {
      useWM.getState().closeAll()
      setClosing(false)
    }, 220)
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-crust">
      {/* Con un'app aperta la home resta sotto: fuori da Tab e screen reader. */}
      <Home inert={!!focused} />
      {focused && <AppView key={focused} id={focused} closing={closing} onHome={goHome} />}
    </div>
  )
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(t)
  }, [])
  return now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

/** Stessa barra del desktop, ridotta: utente@host a sinistra, indicatori e ora a destra. */
function PhoneStatusBar({ className = '' }: { className?: string }) {
  const time = useClock()
  return (
    <div className={`flex shrink-0 items-center justify-between border-b border-surface0 bg-mantle px-3 pt-[env(safe-area-inset-top)] text-xs ${className}`}>
      <span className="flex h-8 items-center">
        <span className="text-green">{profile.user}</span>
        <span className="text-overlay">@</span>
        <span className="text-blue">{profile.host}</span>
      </span>
      <span className="flex items-center gap-2 text-subtext">
        <Signal size={12} />
        <Wifi size={12} />
        <BatteryFull size={15} />
        <span className="text-accent tabular-nums">{time}</span>
      </span>
    </div>
  )
}

function Home({ inert }: { inert: boolean }) {
  const stage = useSession((s) => s.stage)
  const wallpaper = useSettings((s) => s.wallpaper)
  const bars = stage >= STAGE.bars
  const icons = stage >= STAGE.icons

  return (
    <div className="absolute inset-0 flex flex-col" inert={inert}>
      <div className={`absolute inset-0 wallpaper-${wallpaper} transition-opacity duration-700 ${stage >= STAGE.wallpaper ? 'opacity-100' : 'opacity-0'}`} />
      <PhoneStatusBar className={`relative transition-[transform,opacity] duration-300 ease-out ${bars ? '' : '-translate-y-full opacity-0'}`} />

      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pt-4">
        <ProfileWidget visible={icons} />
        <div className="mt-5 grid grid-cols-4 gap-x-3 gap-y-4">
          {GRID.map((t, i) => (
            <TileButton key={tileKey(t)} tile={t} visible={icons} delay={120 + i * 50} withLabel />
          ))}
        </div>
      </div>

      <nav
        aria-label="Dock"
        className={`relative mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] grid grid-cols-4 gap-3 rounded-lg border border-surface1 bg-mantle/85 p-2.5 shadow-xl shadow-black/40 backdrop-blur-md transition-[transform,opacity] duration-300 ease-out ${
          bars ? '' : 'translate-y-28 opacity-0'
        }`}
      >
        {DOCK.map((t) => (
          <TileButton key={tileKey(t)} tile={t} visible />
        ))}
      </nav>
    </div>
  )
}

const tileKey = (t: Tile) => (t.kind === 'app' ? t.id : `link-${t.link.id}`)

const ICON_BOX =
  'grid aspect-square w-full place-items-center rounded-md border border-surface1 bg-mantle/80 text-subtext transition-colors group-active:border-accent group-active:text-accent'
const LABEL = 'w-full truncate text-center text-[11px] text-subtext'

function TileButton({ tile, visible, delay = 0, withLabel = false }: { tile: Tile; visible: boolean; delay?: number; withLabel?: boolean }) {
  const pop = `group flex flex-col items-center gap-1.5 transition-[transform,opacity] duration-300 ease-out ${visible ? '' : 'scale-75 opacity-0'}`
  const style = { transitionDelay: visible ? `${delay}ms` : '0ms' }

  if (tile.kind === 'app') {
    const { icon: Icon, label, title } = APPS[tile.id]
    return (
      <button type="button" aria-label={withLabel ? undefined : label} onClick={(e) => openApp(tile.id, e)} className={pop} style={style}>
        <span className={ICON_BOX}>
          <Icon className="size-[44%]" strokeWidth={1.6} />
        </span>
        {withLabel && <span className={LABEL}>{title}</span>}
      </button>
    )
  }

  const { link } = tile
  const external = !link.url.startsWith('mailto:')
  return (
    <a
      href={link.url}
      aria-label={withLabel ? undefined : link.label}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      onClick={() => beep('open')}
      className={pop}
      style={style}
    >
      <span className={ICON_BOX}>
        <LinkGlyph icon={link.icon} size={22} />
      </span>
      {withLabel && <span className={LABEL}>{link.label.toLowerCase()}</span>}
    </a>
  )
}

function ProfileWidget({ visible }: { visible: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => openApp('about', e)}
      className={`w-full rounded-md border border-surface0 bg-mantle/80 text-left transition-[transform,opacity,border-color] duration-300 ease-out active:border-accent ${
        visible ? '' : 'scale-95 opacity-0'
      }`}
    >
      <span className="block border-b border-surface0 px-3 py-1.5 text-xs text-overlay">
        <span className="text-accent">##</span> whoami
      </span>
      <span className="flex items-center gap-3 p-3">
        <img src={profile.avatar} alt="" width={56} height={56} className="size-14 shrink-0 rounded-md border border-surface1 object-cover" />
        <span className="min-w-0">
          <span className="block truncate font-bold text-text">{profile.name}</span>
          <span className="block text-xs text-accent">{profile.role}</span>
          <span className="mt-1 flex items-center gap-1.5 text-xs text-subtext">
            {profile.openToOffers && (
              <>
                <span className="size-1.5 rounded-full bg-green" title="aperto a proposte" />
                <span className="sr-only">aperto a proposte,</span>
              </>
            )}
            {profile.location}
          </span>
        </span>
      </span>
    </button>
  )
}

function AppView({ id, closing, onHome }: { id: AppId; closing: boolean; onHome: () => void }) {
  const app = APPS[id]
  const Body = app.component
  const Icon = app.icon
  const startY = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)
  // La home diventa inert: il focus da tastiera entra nell'app appena aperta.
  useEffect(() => rootRef.current?.focus({ preventScroll: true }), [])

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className={`absolute inset-0 z-10 flex flex-col overflow-hidden bg-base outline-none ${closing ? 'animate-app-close' : 'animate-app-open'}`}
      style={{ transformOrigin: tapOrigin }}
    >
      <PhoneStatusBar />
      {/* Come la title bar delle finestre desktop. */}
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-surface1 bg-mantle px-2 text-xs">
        <button type="button" onClick={onHome} className="flex items-center gap-0.5 rounded-sm px-1 py-1 text-accent active:bg-surface0">
          <ChevronLeft size={16} />
          home
        </button>
        <span className="text-overlay">│</span>
        <Icon size={14} className="text-accent" />
        <h1 className="truncate text-text">{app.title}</h1>
      </header>
      <main className="relative flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<p role="status" className="p-4 text-overlay">loading {app.title}…</p>}>
          <Body />
        </Suspense>
      </main>
      {/* Home indicator: tocco o swipe verso l'alto tornano alla home. */}
      <button
        type="button"
        aria-label="Torna alla home"
        onPointerDown={(e) => (startY.current = e.clientY)}
        onPointerUp={(e) => {
          const dy = e.clientY - startY.current
          if (Math.abs(dy) < 10 || dy < -15) onHome()
        }}
        // Il puntatore è gestito sopra (tap e swipe): il click serve solo a Invio/Spazio.
        onClick={(e) => e.detail === 0 && onHome()}
        className="flex h-6 w-full shrink-0 cursor-pointer touch-none items-center justify-center border-t border-surface0 bg-mantle pb-[env(safe-area-inset-bottom)]"
      >
        <span className="h-1 w-28 rounded-full bg-overlay" />
      </button>
    </div>
  )
}
