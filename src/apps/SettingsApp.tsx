import { useEffect, useId } from 'react'
import { Check } from 'lucide-react'
import { themes, wallpapers } from '../config/themes'
import { useSettings } from '../store/settings'
import { beep } from '../lib/sound'
import { APP_ORDER } from './registry'
import { useIsMobile } from '../lib/useMediaQuery'
import { profile } from '../config/profile'
import { fonts } from '../config/fonts'
import { loadFont } from '../lib/fonts'
import { useSession } from '../store/session'
import { useWM } from '../store/windows'

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <fieldset className="border-b border-surface0 py-3 last:border-0">
    <legend className="mb-2 block text-xs text-overlay">
      <span className="text-accent" aria-hidden="true">
        #
      </span>{' '}
      {label}
    </legend>
    {children}
  </fieldset>
)

const SAMPLE = `${profile.user}@${profile.host}:~$ 0O il1 {}`

/** Elenco font, ognuno scritto con sé stesso. */
function FontList({ mobile = false }: { mobile?: boolean }) {
  const font = useSettings((s) => s.font)
  const setFont = useSettings((s) => s.setFont)
  return (
    <>
      {fonts.map((f) => {
        const on = font === f.id
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={on}
            onClick={() => {
              setFont(f.id)
              beep('click')
            }}
            style={{ fontFamily: `"${f.family}", monospace` }}
            className={
              mobile
                ? `${ROW} py-2 transition-colors active:bg-surface0 ${on ? 'bg-surface0/50' : ''}`
                : `flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${on ? 'border-accent bg-surface0/60' : 'border-surface0 hover:border-surface1'}`
            }
          >
            <span className="min-w-0 flex-1">
              <span className={`block truncate ${on ? 'text-text' : 'text-subtext'}`}>{f.label}</span>
              <span className="block truncate text-xs text-overlay">{SAMPLE}</span>
            </span>
            {on && <Check size={mobile ? 18 : 14} className="shrink-0 text-accent" />}
          </button>
        )
      })}
    </>
  )
}

export default function SettingsApp() {
  const isMobile = useIsMobile()
  // Precarica i font per le anteprime (pochi KB ciascuno, solo quando le Impostazioni sono aperte).
  useEffect(() => {
    for (const f of fonts) void loadFont(f.id)
  }, [])
  return isMobile ? <MobileSettings /> : <DesktopSettings />
}

function DesktopSettings() {
  const { theme, wallpaper, sound, kbLayout, setTheme, setWallpaper, toggleSound, toggleKbLayout } = useSettings()

  return (
    <div className="@container h-full overflow-y-auto overscroll-contain px-4 py-1">
      <h1 className="sr-only">Impostazioni</h1>
      <Row label="theme">
        <div className="grid gap-2 @md:grid-cols-2">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={theme === t.id}
              onClick={() => {
                setTheme(t.id)
                beep('click')
              }}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                theme === t.id ? 'border-accent bg-surface0/60' : 'border-surface0 hover:border-surface1'
              }`}
            >
              <span className="flex overflow-hidden rounded-sm">
                {t.swatch.map((c) => (
                  <span key={c} className="size-4" style={{ background: c }} />
                ))}
              </span>
              <span className="flex-1">{t.label}</span>
              {theme === t.id && <Check size={14} className="text-accent" />}
            </button>
          ))}
        </div>
      </Row>
      <Row label="font">
        <div className="grid gap-2 @md:grid-cols-2">
          <FontList />
        </div>
      </Row>
      <Row label="wallpaper">
        <div className="flex gap-2">
          {wallpapers.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={wallpaper === w}
              onClick={() => {
                setWallpaper(w)
                beep('click')
              }}
              className={`wallpaper-${w} h-14 flex-1 rounded-md border text-xs ${wallpaper === w ? 'border-accent text-accent' : 'border-surface0 text-overlay hover:border-surface1'}`}
            >
              {w}
            </button>
          ))}
        </div>
      </Row>
      <Row label="system">
        <Toggle
          label="Retro beep sui click"
          on={sound}
          state={sound ? 'on' : 'off'}
          onChange={() => {
            toggleSound()
            beep('click')
          }}
        />
        <KbLayout value={kbLayout} onToggle={toggleKbLayout} />
      </Row>
      <p className="py-3 text-xs text-overlay">
        Scorciatoie: <kbd className="text-accent">alt+1…{APP_ORDER.length}</kbd> app · <kbd className="text-accent">alt+f</kbd> massimizza · <kbd className="text-accent">alt+q</kbd> chiudi
      </p>
    </div>
  )
}

function Toggle({ label, on, state, onChange }: { label: string; on: boolean; state: string; onChange: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onChange} className="group flex w-full items-center justify-between py-1 text-left">
      <span className="transition-colors group-hover:text-accent">{label}</span>
      <span className={`whitespace-pre ${on ? 'text-green' : 'text-overlay'}`}>[ {state.padEnd(3)} ]</span>
    </button>
  )
}

const LAYOUTS = ['it', 'us'] as const

/** Layout tastiera: radio nativi (frecce gratis), nascosti dentro etichette stilizzate. */
function KbLayout({ value, onToggle, mobile = false }: { value: 'it' | 'us'; onToggle: () => void; mobile?: boolean }) {
  const id = useId()
  const radios = LAYOUTS.map((k) => {
    const on = value === k
    return (
      <label
        key={k}
        className={
          mobile
            ? `relative grid h-11 w-12 cursor-pointer place-items-center text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-accent ${on ? 'bg-accent font-bold text-crust' : 'text-subtext active:bg-surface0'}`
            : `relative cursor-pointer rounded-sm px-1 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${on ? 'text-green' : 'text-overlay hover:text-text'}`
        }
      >
        <input
          type="radio"
          name={`${id}-kb`}
          value={k}
          checked={on}
          onChange={() => {
            onToggle()
            beep('click')
          }}
          className="sr-only"
        />
        {k}
      </label>
    )
  })

  if (mobile)
    return (
      <div className={ROW}>
        <span className="min-w-0 flex-1">
          <span className="block text-text" id={id}>
            Layout tastiera
          </span>
          <span className="block text-xs text-overlay">per il terminale</span>
        </span>
        <div role="radiogroup" aria-labelledby={id} className="flex shrink-0 overflow-hidden rounded-md border border-surface1">
          {radios}
        </div>
      </div>
    )

  return (
    <div className="flex w-full items-center justify-between py-1">
      <span id={id}>Layout tastiera</span>
      <span role="radiogroup" aria-labelledby={id} className="flex items-center whitespace-pre text-overlay">
        [ {radios[0]}|{radios[1]} ]
      </span>
    </div>
  )
}

// --- Telefono: lista raggruppata stile impostazioni, sempre in chiave terminale ---

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h2 className="mb-2 px-1 text-xs text-overlay">
        <span className="text-accent" aria-hidden="true">
          ##
        </span>{' '}
        {title}
      </h2>
      <div className="divide-y divide-surface0 overflow-hidden rounded-md border border-surface0 bg-mantle">{children}</div>
    </section>
  )
}

const ROW = 'flex min-h-[52px] w-full items-center gap-3 px-3 text-left focus-visible:-outline-offset-2'

function MobileSettings() {
  const { theme, wallpaper, sound, kbLayout, setTheme, setWallpaper, toggleSound, toggleKbLayout } = useSettings()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
      <h1 className="sr-only">Impostazioni</h1>
      <Group title="tema">
        {themes.map((t) => {
          const on = theme === t.id
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setTheme(t.id)
                beep('click')
              }}
              className={`${ROW} transition-colors active:bg-surface0 ${on ? 'bg-surface0/50' : ''}`}
            >
              <span className="flex shrink-0 overflow-hidden rounded-sm border border-surface1">
                {t.swatch.map((c) => (
                  <span key={c} className="h-5 w-3.5" style={{ background: c }} />
                ))}
              </span>
              <span className={`flex-1 truncate ${on ? 'text-text' : 'text-subtext'}`}>{t.label}</span>
              {on ? <Check size={18} className="shrink-0 text-accent" /> : <span className="size-[18px] shrink-0" />}
            </button>
          )
        })}
      </Group>

      <Group title="font">
        <FontList mobile />
      </Group>

      <Group title="sfondo">
        <div className="grid grid-cols-3 gap-2 p-2">
          {wallpapers.map((w) => {
            const on = wallpaper === w
            return (
              <button
                key={w}
                type="button"
                aria-pressed={on}
                aria-label={`Sfondo ${w}`}
                onClick={() => {
                  setWallpaper(w)
                  beep('click')
                }}
                className="flex flex-col gap-1.5"
              >
                <span
                  className={`wallpaper-${w} relative block h-24 w-full rounded-md border-2 transition-colors ${on ? 'border-accent' : 'border-surface0 active:border-surface1'}`}
                >
                  {on && (
                    <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-sm bg-accent text-crust">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className={`text-center text-xs ${on ? 'text-accent' : 'text-overlay'}`}>{on ? `[${w}]` : w}</span>
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="sistema">
        <div className={ROW}>
          <span className="min-w-0 flex-1">
            <span className="block text-text" id="set-sound">Retro beep</span>
            <span className="block text-xs text-overlay">suono sui tocchi</span>
          </span>
          <Switch
            on={sound}
            labelledBy="set-sound"
            onChange={() => {
              toggleSound()
              beep('click')
            }}
          />
        </div>
        <KbLayout mobile value={kbLayout} onToggle={toggleKbLayout} />
        <WelcomeRow />
      </Group>

      <Group title="info">
        <dl className="px-3 py-2.5 text-xs leading-6">
          <div className="flex justify-between gap-3">
            <dt className="text-overlay">host</dt>
            <dd>
              <span className="text-green">{profile.user}</span>
              <span className="text-overlay">@</span>
              <span className="text-blue">{profile.host}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-overlay">tema</dt>
            <dd className="text-subtext">{theme}</dd>
          </div>
        </dl>
      </Group>
    </div>
  )
}

/** Interruttore vero: traccia + pomello, area di tocco 44px. */
/** Guida di benvenuto: attivabile all'avvio e riapribile subito (chiude l'app e la mostra). */
function WelcomeRow() {
  const on = useSettings((s) => s.showWelcome)
  const toggle = useSettings((s) => s.toggleShowWelcome)
  return (
    <div className={ROW}>
      <span className="min-w-0 flex-1">
        <span className="block text-text" id="set-welcome">Guida di benvenuto</span>
        <button
          type="button"
          onClick={() => {
            beep('open')
            useWM.getState().closeAll()
            useSession.getState().openSetup()
          }}
          className="-ml-1 rounded-sm px-1 text-xs text-accent active:bg-surface0"
        >
          rivedila ora ›
        </button>
      </span>
      <Switch
        on={on}
        labelledBy="set-welcome"
        onChange={() => {
          toggle()
          beep('click')
        }}
      />
    </div>
  )
}

function Switch({ on, labelledBy, onChange }: { on: boolean; labelledBy: string; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-labelledby={labelledBy} onClick={onChange} className="-mr-1 grid h-11 w-16 shrink-0 place-items-center">
      <span className={`relative h-6 w-11 rounded-sm border transition-colors ${on ? 'border-accent bg-accent' : 'border-surface1 bg-surface1'}`}>
        <span
          className={`absolute top-0.5 left-0.5 size-[18px] rounded-[3px] transition-transform ${on ? 'translate-x-5 bg-crust' : 'bg-overlay'}`}
        />
      </span>
    </button>
  )
}
