import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Circle, MapPin } from 'lucide-react'
import { APPS, type AppId } from '../apps/registry'
import { PERSONAL, WORK, type WelcomeItem } from '../apps/welcomeItems'
import { profile } from '../config/profile'
import { LinkGlyph } from '../lib/icons'
import { beep } from '../lib/sound'
import { useSession } from '../store/session'
import { useSettings } from '../store/settings'
import { useWM } from '../store/windows'

// Benvenuto su mobile in stile configurazione iniziale di Android/iOS: un passo per schermata,
// titolo grande, pulsante principale in basso, indicatore di avanzamento. Swipe orizzontale tra i passi.

const STEPS = ['hello', 'tour', 'done'] as const
type Step = (typeof STEPS)[number]

/** Saluto che cambia lingua, come la schermata "Hello" di iOS. */
const GREETINGS = ['Ciao', 'Hello', 'Hola', 'Bonjour', 'Hallo', 'Olá']

function close(open?: AppId) {
  beep(open ? 'open' : 'close')
  useSession.getState().closeSetup()
  if (open) useWM.getState().open(open)
}

export function SetupWizard() {
  const [index, setIndex] = useState(0)
  const step: Step = STEPS[index]
  const last = index === STEPS.length - 1
  const headingRef = useRef<HTMLHeadingElement>(null)
  const touchX = useRef<number | null>(null)

  // A ogni passo il focus va sul titolo: lettori di schermo e tastiera ripartono da lì.
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), [index])

  const go = (d: number) => {
    const next = index + d
    if (next < 0) return
    if (next >= STEPS.length) return close()
    beep('click')
    setIndex(next)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Benvenuto"
      className="absolute inset-0 z-30 flex animate-fade-in flex-col bg-base pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <div className="flex h-10 shrink-0 items-center justify-between px-4 text-sm">
        {index > 0 ? (
          <button type="button" onClick={() => go(-1)} className="-ml-2 flex min-h-10 items-center gap-0.5 rounded-sm px-2 text-accent active:bg-surface0">
            <ChevronLeft size={16} /> indietro
          </button>
        ) : (
          <span />
        )}
        {!last && (
          <button type="button" onClick={() => close()} className="flex min-h-10 items-center rounded-sm px-2 text-overlay active:bg-surface0">
            salta
          </button>
        )}
      </div>

      <div key={step} className="flex min-h-0 flex-1 animate-fade-in flex-col overflow-y-auto overscroll-contain px-6">
        {step === 'hello' && <Hello headingRef={headingRef} />}
        {step === 'tour' && <TourStep headingRef={headingRef} />}
        {step === 'done' && <DoneStep headingRef={headingRef} />}
      </div>

      <div className="shrink-0 px-6 pt-4">
        <div className="mb-4 flex justify-center gap-2" aria-label={`Passo ${index + 1} di ${STEPS.length}`} role="img">
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${i === index ? 'w-6 bg-accent' : 'w-1.5 bg-surface1'}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="flex h-12 w-full items-center justify-center gap-1 rounded-md bg-accent font-bold text-crust active:brightness-90"
        >
          {index === 0 ? 'Inizia' : last ? 'Vai alla home' : 'Avanti'}
          {!last && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  )
}

type StepProps = { headingRef: React.RefObject<HTMLHeadingElement | null> }

function Title({ headingRef, children, sub }: StepProps & { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-6 text-center">
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-balance text-text outline-none">
        {children}
      </h1>
      {sub && <p className="mt-2 text-sm text-subtext">{sub}</p>}
    </div>
  )
}

function Hello({ headingRef }: StepProps) {
  const [g, setG] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setG((i) => (i + 1) % GREETINGS.length), 1400)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <img src={profile.avatar} alt={profile.name} width={112} height={112} className="mb-8 size-28 rounded-md border border-surface1 object-cover" />
      {/* Il saluto animato è decorativo: il titolo per i lettori di schermo resta fisso. */}
      <p aria-hidden="true" key={g} className="animate-fade-in text-5xl font-bold text-accent">
        {GREETINGS[g]}
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-xl font-bold text-text outline-none">
        Sono {profile.name.split(' ')[0]}.
      </h1>
      <p className="mt-1 text-accent">{profile.role}</p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-subtext">
        <span className="flex items-center gap-1">
          <MapPin size={12} className="text-peach" /> {profile.location}
        </span>
        {profile.openToOffers && (
          <span className="flex items-center gap-1 text-green">
            <Circle size={7} fill="currentColor" /> aperto a proposte
          </span>
        )}
      </p>
    </div>
  )
}

function TourStep({ headingRef }: StepProps) {
  return (
    <>
      <Title headingRef={headingRef} sub="Tocca una voce per aprirla subito, oppure vai avanti.">
        Cosa trovi qui
      </Title>
      <TourGroup title="lavoro" items={WORK} />
      <TourGroup title="personale" items={PERSONAL} />
    </>
  )
}

function TourGroup({ title, items }: { title: string; items: WelcomeItem[] }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 px-1 text-xs text-overlay">
        <span className="text-accent" aria-hidden="true">
          ##
        </span>{' '}
        {title}
      </h2>
      <ul className="divide-y divide-surface0 overflow-hidden rounded-md border border-surface0 bg-mantle">
        {items.map((item) => (
          <li key={item.kind === 'app' ? item.id : item.link.id}>
            <TourRow item={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function TourRow({ item }: { item: WelcomeItem }) {
  const cls = 'flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left active:bg-surface0 focus-visible:-outline-offset-2'
  const body = (icon: React.ReactNode, title: string, external: boolean) => (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-surface1 text-subtext">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-text">{title}</span>
        <span className="block truncate text-xs text-overlay">{item.desc}</span>
      </span>
      {external ? <ArrowUpRight size={15} className="shrink-0 text-overlay" /> : <ChevronRight size={15} className="shrink-0 text-overlay" />}
    </>
  )
  if (item.kind === 'app') {
    const Icon = APPS[item.id].icon
    return (
      <button type="button" onClick={() => close(item.id)} className={cls}>
        {body(<Icon size={18} strokeWidth={1.7} />, item.title, false)}
      </button>
    )
  }
  const { link } = item
  const external = !link.url.startsWith('mailto:')
  return (
    <a href={link.url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} onClick={() => beep('open')} className={cls}>
      {body(<LinkGlyph icon={link.icon} size={17} />, link.label, external)}
      {external && <span className="sr-only">(si apre in una nuova scheda)</span>}
    </a>
  )
}

function DoneStep({ headingRef }: StepProps) {
  const showWelcome = useSettings((s) => s.showWelcome)
  const toggle = useSettings((s) => s.toggleShowWelcome)
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span className="mb-6 grid size-20 place-items-center rounded-full border-2 border-accent text-accent">
        <Check size={40} strokeWidth={2.5} />
      </span>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-text outline-none">
        Tutto pronto
      </h1>
      <p className="mt-2 max-w-xs text-sm text-subtext">
        Tocca le icone nella home per aprire le app. Dentro un’app, «‹ home» o la barra in basso ti riportano qui.
      </p>
      <label className="mt-8 flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-surface0 bg-mantle px-4 text-sm text-subtext">
        <input
          type="checkbox"
          checked={showWelcome}
          onChange={() => {
            toggle()
            beep('click')
          }}
          className="size-4 accent-[var(--accent)]"
        />
        mostra questa guida all’avvio
      </label>
    </div>
  )
}
