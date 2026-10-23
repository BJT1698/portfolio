import { ArrowUpRight, ChevronRight, Circle, CircleHelp, MapPin, Settings } from 'lucide-react'
import { APPS, type AppId } from './registry'
import { profile } from '../config/profile'
import { WORK, PERSONAL, type WelcomeItem as Item } from './welcomeItems'
import { LinkGlyph } from '../lib/icons'
import { moveFocus, useWM } from '../store/windows'
import { useSettings } from '../store/settings'
import { beep } from '../lib/sound'

// App di benvenuto stile "welcome" delle distro: presentazione e scorciatoie alle sezioni,
// divise tra parte professionale e personale.

function open(id: AppId) {
  beep('open')
  useWM.getState().open(id)
  moveFocus()
}

export default function WelcomeApp() {
  const showWelcome = useSettings((s) => s.showWelcome)

  return (
    <div className="@container flex h-full min-h-0 flex-col bg-base">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 @lg:p-6">
        <p className="mb-4 text-xs text-overlay">
          <span className="text-accent" aria-hidden="true">
            $
          </span>{' '}
          welcome
        </p>

        <header className="flex flex-col items-center gap-4 text-center @lg:flex-row @lg:items-center @lg:text-left">
          <img src={profile.avatar} alt={profile.name} width={112} height={112} className="size-24 shrink-0 rounded-md border border-surface1 object-cover @lg:size-28" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-balance text-text @lg:text-2xl">
              Ciao, sono <span className="text-accent">{profile.name.split(' ')[0]}</span>.
            </h1>
            <p className="mt-0.5 text-accent">{profile.role}</p>
            <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-subtext @lg:justify-start">
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
        </header>

        <p className="mt-5 leading-relaxed text-subtext">
          Benvenuto nel mio portfolio. Funziona come un desktop Linux: ogni sezione è un’app, le finestre si spostano e si ridimensionano. Da qui
          puoi aprire tutto con un click.
        </p>

        <div className="mt-6 grid gap-5 @2xl:grid-cols-2">
          <Group title="lavoro" items={WORK} />
          <Group title="personale" items={PERSONAL} />
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface0 bg-mantle px-4 text-xs">
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-subtext select-none">
          <input
            type="checkbox"
            checked={showWelcome}
            onChange={() => {
              beep('click')
              useSettings.getState().toggleShowWelcome()
            }}
            className="size-3.5 accent-[var(--accent)]"
          />
          mostra all’avvio
        </label>
        <span className="-mr-1 ml-auto flex items-center gap-1">
          <button type="button" onClick={() => open('help')} className="flex min-h-10 items-center gap-1 px-1 text-subtext hover:text-accent">
            <CircleHelp size={13} /> guida
          </button>
          <button type="button" onClick={() => open('settings')} className="flex min-h-10 items-center gap-1 px-1 text-subtext hover:text-accent">
            <Settings size={13} /> impostazioni
          </button>
        </span>
      </footer>
    </div>
  )
}

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="min-w-0">
      <h2 className="mb-2 flex items-center gap-2 text-xs text-overlay">
        <span className="text-accent" aria-hidden="true">
          ##
        </span>{' '}
        {title}
        <span className="h-px flex-1 bg-surface0" />
      </h2>
      <ul className="grid grid-cols-1 gap-1.5">
        {items.map((item) => (
          <li key={item.kind === 'app' ? item.id : item.link.id}>
            <Quick item={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Quick({ item }: { item: Item }) {
  const cls =
    'group flex min-h-14 w-full items-center gap-3 rounded-md border border-surface0 bg-mantle/70 px-3 py-2 text-left transition-colors hover:border-accent focus-visible:border-accent active:bg-surface0'
  const body = (icon: React.ReactNode, title: string, external: boolean) => (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-md border border-surface1 text-subtext transition-colors group-hover:border-accent group-hover:text-accent">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-text">{title}</span>
        <span className="block truncate text-xs text-overlay">{item.desc}</span>
        {external && <span className="sr-only">(si apre in una nuova scheda)</span>}
      </span>
      {external ? (
        <ArrowUpRight size={15} className="shrink-0 text-overlay group-hover:text-accent" />
      ) : (
        <ChevronRight size={15} className="shrink-0 text-overlay transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
      )}
    </>
  )

  if (item.kind === 'app') {
    const Icon = APPS[item.id].icon
    return (
      <button type="button" onClick={() => open(item.id)} className={cls}>
        {body(<Icon size={18} strokeWidth={1.7} />, item.title, false)}
      </button>
    )
  }

  const { link } = item
  const external = !link.url.startsWith('mailto:')
  return (
    <a href={link.url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} onClick={() => beep('open')} className={cls}>
      {body(<LinkGlyph icon={link.icon} size={17} />, link.label, external)}
    </a>
  )
}
