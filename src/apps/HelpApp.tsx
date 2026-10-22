import { APPS, APP_ORDER, type AppId } from './registry'
import { moveFocus, useWM } from '../store/windows'
import { beep } from '../lib/sound'
import { useIsMobile } from '../lib/useMediaQuery'

const DESCRIPTIONS: Record<AppId, string> = {
  welcome: 'benvenuto e scorciatoie a tutte le sezioni',
  terminal: 'shell interattiva: prova help, cat cv.txt, skills, socials',
  cv: 'curriculum con filtro per tag ed export in PDF',
  about: 'chi sono, competenze e interessi',
  socials: 'LinkedIn, GitHub, YouTube ed email',
  gallery: 'anteprima del mio sito di fotografia',
  videos: 'i miei giri in moto su YouTube',
  settings: 'tema colori, sfondo e suoni',
  help: 'questa guida',
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-4">
    <h2 className="mb-1.5 font-bold text-accent uppercase">{title}</h2>
    <div className="space-y-1 pl-4 text-subtext">{children}</div>
  </section>
)

const K = ({ children }: { children: React.ReactNode }) => (
  <kbd className="rounded-sm border border-surface1 bg-surface0 px-1 text-xs text-text">{children}</kbd>
)

const Item = ({ k, children }: { k: React.ReactNode; children: React.ReactNode }) => (
  <div className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-3">
    <dt className="text-text">{k}</dt>
    <dd>{children}</dd>
  </div>
)

const Items = ({ children }: { children: React.ReactNode }) => <dl className="space-y-1">{children}</dl>

const Doc = ({ href }: { href: string }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-accent hover:underline">
    {href}
    <span className="sr-only"> (si apre in una nuova scheda)</span>
  </a>
)

export default function HelpApp() {
  const mobile = useIsMobile()
  return (
    <div className="h-full overflow-y-auto overscroll-contain p-4 leading-relaxed">
      <h1 className="sr-only">Guida</h1>
      <div className="mb-4 flex justify-between text-xs text-overlay" aria-hidden="true">
        <span>PORTFOLIO(1)</span>
        <span className="hidden sm:inline">Guida utente</span>
        <span>PORTFOLIO(1)</span>
      </div>

      <Section title="Nome">
        <p>portfolio — il sito di Lorenzo Vicentini, fatto come un desktop Linux.</p>
      </Section>

      <Section title="Applicazioni">
        {APP_ORDER.map((id, i) => {
          const { icon: Icon, label } = APPS[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                beep('open')
                useWM.getState().open(id)
                moveFocus()
              }}
              className={`group grid w-full grid-cols-[auto_minmax(7rem,auto)_1fr] items-baseline gap-3 text-left ${mobile ? 'py-2' : ''}`}
            >
              <Icon size={14} className="translate-y-0.5 text-overlay group-hover:text-accent" />
              <span className="text-text group-hover:text-accent group-hover:underline">
                {label} {!mobile && <span className="text-xs text-overlay">alt+{i + 1}</span>}
              </span>
              <span>{DESCRIPTIONS[id]}</span>
            </button>
          )
        })}
        <p className="pt-1 text-xs text-overlay">{mobile ? 'Tocca' : 'Clicca'} un nome per aprire l’app.</p>
      </Section>

      {mobile ? (
        <Section title="Navigazione">
          <Items>
            <Item k="apri">tocca un’icona nella home: ogni app si apre a schermo intero</Item>
            <Item k="torna">‹ Home in alto, oppure tocca o scorri verso l’alto la barra in fondo</Item>
            <Item k="profilo">il riquadro con la foto apre About</Item>
            <Item k="link">LinkedIn, GitHub, YouTube ed email si aprono direttamente</Item>
          </Items>
        </Section>
      ) : (
        <>
          <Section title="Finestre">
            <Items>
              <Item k="apri">click su un’icona del dock, oppure doppio click su un’icona del desktop</Item>
              <Item k="sposta">trascina la barra del titolo</Item>
              <Item k="ridimensiona">trascina bordi e angoli</Item>
              <Item
                k={
                  <>
                    <span aria-hidden="true">– □ ×</span>
                    <span className="sr-only">pulsanti minimizza, massimizza, chiudi</span>
                  </>
                }
              >
                minimizza, massimizza, chiudi (doppio click sul titolo = massimizza)
              </Item>
              <Item k="dock">un click sull’app in primo piano la minimizza, un altro la riporta su</Item>
            </Items>
          </Section>

          <Section title="Scorciatoie">
            <Items>
              <Item k={<><K>alt</K>+<K>1</K>…<K>{APP_ORDER.length}</K></>}>apre o porta in primo piano l’app</Item>
              <Item k={<><K>alt</K>+<K>f</K></>}>massimizza la finestra attiva</Item>
              <Item k={<><K>alt</K>+<K>q</K></>}>chiude la finestra attiva</Item>
              <Item k={<><K>1</K> <K>2</K> <K>3</K></>}>nel CV, cambia scheda</Item>
              <Item k={<><K>tab</K> <K>↑</K> <K>↓</K></>}>nel terminale: completamento e cronologia</Item>
            </Items>
          </Section>
        </>
      )}

      <Section title="Curriculum">
        <p>
          Nel CV il pulsante <span className="text-text">Scarica PDF</span> genera la versione stampabile.
        </p>
      </Section>

      <Section title="Per agenti AI">
        <p>
          Il profilo è disponibile anche in formato leggibile dalle macchine: <Doc href="/llms.txt" />, <Doc href="/cv.md" /> e <Doc href="/resume.json" /> (JSON
          Resume).
        </p>
      </Section>
    </div>
  )
}
