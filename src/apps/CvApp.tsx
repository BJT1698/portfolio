import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, Download, MapPin, Search, X } from 'lucide-react'
import { allTags, cv, type Experience, type SkillCategory } from '../config/cv'
import { profile } from '../config/profile'
import { cvLinks } from '../config/links'
import { period } from '../lib/cvMarkdown'
import { beep } from '../lib/sound'
import { LinkGlyph } from '../lib/icons'
import { PrintCv } from '../components/PrintCv'
import { useIsMobile } from '../lib/useMediaQuery'

const TABS = [
  { id: 'experience', label: 'experience' },
  { id: 'skills', label: 'skills' },
  { id: 'education', label: 'education' },
] as const

type TabId = (typeof TABS)[number]['id']

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Evidenzia i termini cercati dentro un testo. */
function Hl({ text, re }: { text: string; re: RegExp | null }): ReactNode {
  if (!re) return text
  const parts = text.split(re)
  if (parts.length === 1) return text
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-accent/25 text-accent">
        {p}
      </mark>
    ) : (
      p
    ),
  )
}

function TagChip({
  tag,
  active,
  onToggle,
  re,
  touch = false,
}: {
  tag: string
  active: boolean
  onToggle: (t: string) => void
  re: RegExp | null
  touch?: boolean
}) {
  // touch: niente hover, area di tocco più alta (mobile)
  const look = touch
    ? `min-h-8 rounded-sm px-2 ${active ? 'border-accent bg-accent text-crust' : 'border-surface1 bg-base text-subtext active:border-accent active:text-accent'}`
    : `px-1.5 py-px ${active ? 'border-accent bg-accent text-crust' : 'border-surface1 text-subtext hover:border-accent hover:text-accent'}`
  return (
    <button type="button" onClick={() => onToggle(tag)} aria-pressed={active} className={`shrink-0 border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-text ${look}`}>
      {active ? tag : <Hl text={tag} re={re} />}
    </button>
  )
}


type ExpProps = {
  selected: Set<string>
  onToggle: (t: string) => void
  re: RegExp | null
}

function CurrentBadge() {
  return <span className="border border-green px-1 text-[10px] leading-4 text-green uppercase">current</span>
}

function Highlights({ items, re, className }: { items: string[]; re: RegExp | null; className: string }) {
  return (
    <ul className={className}>
      {items.map((h) => (
        <li key={h} className="flex gap-2">
          <span className="text-accent" aria-hidden>
            ▸
          </span>
          <span>
            <Hl text={h} re={re} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Mobile: quanti punti mostrare prima di "mostra altri". */
const PEEK = 3

/** Scheda esperienza per telefono: dati impilati, punti comprimibili. */
function ExperienceCard({ e, selected, onToggle, re }: ExpProps & { e: Experience }) {
  const [open, setOpen] = useState(false)
  const current = e.end === null
  // Con un filtro attivo mostro tutto, così le evidenziazioni non restano nascoste.
  const all = open || re !== null
  const hidden = e.highlights.length - PEEK
  const shown = all ? e.highlights : e.highlights.slice(0, PEEK)
  return (
    <li className={`rounded-md border bg-mantle ${current ? 'border-green/50' : 'border-surface0'}`}>
      <div className="border-b border-surface0 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-text">{e.role}</h3>
          {current && (
            <span className="mt-0.5 shrink-0">
              <CurrentBadge />
            </span>
          )}
        </div>
        <div className="mt-0.5 text-accent">@ {e.company}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-subtext">
          <span className="tabular-nums">{period(e.start, e.end)}</span>
          {e.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="text-overlay" aria-hidden />
              {e.location}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2.5 px-3 py-3">
        <p className="text-subtext">{e.summary}</p>
        {shown.length > 0 && <Highlights items={shown} re={re} className="space-y-1.5 leading-snug" />}
        {hidden > 0 && re === null && (
          <button
            type="button"
            onClick={() => {
              beep('click')
              setOpen((o) => !o)
            }}
            aria-expanded={open}
            className="-mx-1 inline-flex min-h-10 items-center gap-1.5 rounded-sm px-1 text-sm text-accent active:bg-surface0"
          >
            {open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
            {open ? 'mostra meno' : `mostra altri ${hidden}`}
          </button>
        )}
        {e.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-dashed border-surface0 pt-2.5">
            {e.tags.map((t) => (
              <TagChip key={t} tag={t} active={selected.has(t)} onToggle={onToggle} re={re} touch />
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

function ExperienceTab({ items, selected, onToggle, re, mobile }: ExpProps & { items: Experience[]; mobile: boolean }) {
  if (!items.length) return <Empty />
  if (mobile)
    return (
      <ol className="space-y-3">
        {items.map((e) => (
          <ExperienceCard key={e.role + e.start} e={e} selected={selected} onToggle={onToggle} re={re} />
        ))}
      </ol>
    )
  return (
    <ol className="relative ml-1.5 border-l border-surface1">
      {items.map((e) => {
        const current = e.end === null
        return (
          <li key={e.role + e.start} className="relative pb-6 pl-5 last:pb-1">
            <span
              className={`absolute top-1 -left-[5px] size-[9px] border ${
                current ? 'border-green bg-green shadow-[0_0_0_3px_var(--base)]' : 'border-surface1 bg-base'
              }`}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="font-bold text-text">{e.role}</h3>
              {current && <CurrentBadge />}
            </div>
            <div className="flex flex-wrap gap-x-2 text-xs text-subtext">
              <span className="text-accent">@ {e.company}</span>
              <span className="text-overlay" aria-hidden>
                │
              </span>
              <span className="tabular-nums">{period(e.start, e.end)}</span>
              {e.location && (
                <>
                  <span className="text-overlay" aria-hidden>
                    │
                  </span>
                  <span>{e.location}</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-subtext">{e.summary}</p>
            <Highlights items={e.highlights} re={re} className="mt-1.5 space-y-0.5" />
            <div className="mt-2 flex flex-wrap gap-1">
              {e.tags.map((t) => (
                <TagChip key={t} tag={t} active={selected.has(t)} onToggle={onToggle} re={re} />
              ))}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-2 text-sm font-bold text-accent">
    <span className="text-overlay" aria-hidden>
      ##{' '}
    </span>
    {children}
  </h3>
)

function SkillsTab({ groups, re, mobile }: { groups: SkillCategory[]; re: RegExp | null; mobile: boolean }) {
  if (!groups.length) return <Empty />
  if (mobile)
    return (
      <div className="space-y-5">
        {groups.map((c) => (
          <section key={c.id}>
            <H3>
              {c.label} <span className="font-normal text-overlay">({c.skills.length})</span>
            </H3>
            <ul className="flex flex-wrap gap-2 rounded-md border border-surface0 bg-mantle p-3">
              {c.skills.map((s) => (
                <li key={s.name} className="rounded-sm border border-surface1 px-2.5 py-1 text-sm">
                  <Hl text={s.name} re={re} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    )
  return (
    <div className="grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-3">
      {groups.map((c) => (
        <section key={c.id} className="border border-surface0 bg-mantle p-3">
          <H3>{c.label}</H3>
          <ul className="flex flex-wrap gap-1.5">
            {c.skills.map((s) => (
              <li key={s.name} className="border border-surface1 px-2 py-0.5 text-sm">
                <Hl text={s.name} re={re} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function EducationTab({ mobile }: { mobile: boolean }) {
  return (
    <div className={mobile ? 'space-y-6' : 'space-y-5'}>
      <section>
        <H3>Formazione</H3>
        <ul className={mobile ? 'space-y-4' : 'space-y-2'}>
          {cv.education.map((ed) => (
            <li key={ed.title} className="border-l-2 border-surface1 pl-3">
              <div className="font-bold">{ed.title}</div>
              <div className={mobile ? 'mt-0.5 text-xs leading-5 text-subtext' : 'text-xs text-subtext'}>
                {ed.institution}{' '}
                <span className="text-overlay" aria-hidden>
                  │
                </span>{' '}
                {period(ed.start, ed.end)}
              </div>
              {ed.notes && <p className="mt-1 text-subtext">{ed.notes}</p>}
            </li>
          ))}
        </ul>
      </section>

      {cv.certifications.length > 0 && (
        <section>
          <H3>Certificazioni</H3>
          <ul className="grid gap-2 @lg:grid-cols-2">
            {cv.certifications.map((c) => {
              const done = c.status === 'done'
              const body = (
                <>
                  <span className={`w-4 shrink-0 text-center ${done ? 'text-green' : 'text-yellow'}`} aria-hidden>
                    {done ? '✓' : '◐'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-bold ${mobile ? '' : 'truncate'}`} title={mobile ? undefined : c.name}>
                      {c.name}
                    </span>
                    <span className="block text-xs text-subtext">
                      {c.issuer} · {c.year}
                    </span>
                  </span>
                  <span className={`shrink-0 border px-1 text-[10px] leading-4 uppercase ${done ? 'border-green text-green' : 'border-yellow text-yellow'}`}>
                    {done ? 'ok' : 'in corso'}
                  </span>
                </>
              )
              return (
                <li key={c.name}>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-2 border border-surface0 bg-mantle ${mobile ? 'min-h-12 rounded-md px-3 py-2.5 active:border-accent' : 'p-2 hover:border-accent'}`}
                    >
                      {body}
                    </a>
                  ) : (
                    <div className={`flex items-center gap-2 border border-surface0 bg-mantle ${mobile ? 'min-h-12 rounded-md px-3 py-2.5' : 'p-2'}`}>{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section>
        <H3>Lingue</H3>
        <ul className={mobile ? 'space-y-1.5' : 'space-y-0.5'}>
          {profile.languages.map((l) => (
            <li key={l.name} className="flex gap-2">
              <span className="text-accent" aria-hidden>
                ▸
              </span>
              <span className="w-20 shrink-0">{l.name}</span>
              <span className="text-subtext">{l.level}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Empty() {
  return <p className="py-6 text-center text-overlay">-- nessun risultato per il filtro corrente --</p>
}

export default function CvApp() {
  const [tab, setTab] = useState<TabId>('experience')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [printing, setPrinting] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const mobile = useIsMobile()
  const scrollRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const filterBtnRef = useRef<HTMLButtonElement>(null)
  const filterInputRef = useRef<HTMLInputElement>(null)
  const summaryRef = useRef<HTMLParagraphElement>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryClamped, setSummaryClamped] = useState(false)

  const deferredQuery = useDeferredValue(query)
  const q = deferredQuery.trim().toLowerCase()
  const filtering = q.length > 0 || selected.size > 0

  const toggleTag = useCallback((t: string) => {
    beep('click')
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }, [])

  // Il bottone "pulisci" sparisce: il focus torna all'input.
  const clear = () => {
    beep('click')
    setQuery('')
    setSelected(new Set())
    filterInputRef.current?.focus()
  }

  // Chiudendo il pannello il focus torna sul toggle "filtra" (non sul body).
  const toggleFilter = () => {
    beep('click')
    if (filterOpen) filterBtnRef.current?.focus()
    setFilterOpen((o) => !o)
  }

  // Desktop: il riassunto è troncato a 3 righe nelle finestre strette; "altro" solo se serve davvero.
  useEffect(() => {
    const el = summaryRef.current
    if (!el || summaryOpen) return
    const check = () => setSummaryClamped(el.scrollHeight > el.clientHeight + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [summaryOpen, mobile])

  // Regex unica per evidenziare tag selezionati + testo libero.
  const re = useMemo(() => {
    const terms = [...selected, ...(q ? [q] : [])].filter(Boolean).sort((a, b) => b.length - a.length)
    return terms.length ? new RegExp(`(${terms.map(escapeRe).join('|')})`, 'gi') : null
  }, [selected, q])

  const { experience, skills, count } = useMemo(() => {
    if (!filtering) return { experience: cv.experience, skills: cv.skills, count: 0 }
    const experience = cv.experience.filter(
      (e) =>
        e.tags.some((t) => selected.has(t)) ||
        (q !== '' && (e.highlights.some((h) => h.toLowerCase().includes(q)) || e.tags.some((t) => t.toLowerCase().includes(q)))),
    )
    const skills = cv.skills
      .map((c) => ({ ...c, skills: c.skills.filter((s) => selected.has(s.name) || (q !== '' && s.name.toLowerCase().includes(q))) }))
      .filter((c) => c.skills.length > 0)
    const count = experience.length + skills.reduce((n, c) => n + c.skills.length, 0)
    return { experience, skills, count }
  }, [filtering, selected, q])

  const visibleTags = useMemo(() => (q ? allTags.filter((t) => selected.has(t) || t.toLowerCase().includes(q)) : allTags), [q, selected])

  // Stampa: monta il portale, attende un frame, stampa, smonta su afterprint.
  // Fallback: alcuni browser mobile non emettono afterprint; print() su desktop è bloccante,
  // quindi quando ritorna il dialogo è chiuso e si può smontare poco dopo.
  useEffect(() => {
    if (!printing) return
    const done = () => setPrinting(false)
    let timer = 0
    window.addEventListener('afterprint', done)
    const raf = requestAnimationFrame(() => {
      window.print()
      timer = window.setTimeout(done, 1500)
    })
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener('afterprint', done)
    }
  }, [printing])

  const selectTab = (id: TabId, focus = false) => {
    if (id !== tab) beep('click')
    setTab(id)
    // Mobile: se l'hero è già scrollato via, il nuovo tab parte dal suo inizio (sotto la barra sticky).
    const sc = scrollRef.current
    const top = heroRef.current?.offsetHeight ?? 0
    if (mobile && sc && sc.scrollTop > top) sc.scrollTop = top
    if (focus) tabRefs.current[TABS.findIndex((t) => t.id === id)]?.focus()
  }

  const onRootKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement
    if (el.closest('input, textarea, [contenteditable="true"]') || e.ctrlKey || e.metaKey || e.altKey) return
    const i = ['1', '2', '3'].indexOf(e.key)
    if (i >= 0) {
      e.preventDefault()
      selectTab(TABS[i].id)
    }
  }

  const onTabsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === tab)
    let n = -1
    if (e.key === 'ArrowRight') n = (i + 1) % TABS.length
    else if (e.key === 'ArrowLeft') n = (i - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = TABS.length - 1
    if (n < 0) return
    e.preventDefault()
    selectTab(TABS[n].id, true)
  }

  const tabCount = (id: TabId) =>
    !filtering ? null : id === 'experience' ? experience.length : id === 'skills' ? skills.reduce((a, c) => a + c.skills.length, 0) : null

  const badge = (id: TabId) => {
    const n = tabCount(id)
    return n === null ? null : <span className="ml-1 text-xs text-overlay">({n})</span>
  }

  // Attributi ARIA/handler comuni ai tab desktop e mobile.
  const tabProps = (id: TabId, i: number) => ({
    ref: (el: HTMLButtonElement | null) => {
      tabRefs.current[i] = el
    },
    id: `cv-tab-${id}`,
    role: 'tab',
    type: 'button' as const,
    'aria-selected': id === tab,
    // Solo il pannello selezionato è renderizzato
    'aria-controls': id === tab ? `cv-panel-${id}` : undefined,
    tabIndex: id === tab ? 0 : -1,
    onClick: () => selectTab(id),
  })

  const panel = (
    <>
      {tab === 'experience' && <ExperienceTab items={experience} selected={selected} onToggle={toggleTag} re={re} mobile={mobile} />}
      {tab === 'skills' && <SkillsTab groups={skills} re={re} mobile={mobile} />}
      {tab === 'education' && <EducationTab mobile={mobile} />}
    </>
  )

  const exportPdf = () => {
    beep('click')
    setPrinting(true)
  }

  const printPortal = printing && createPortal(<PrintCv />, document.body)
  const activeFilters = selected.size + (q ? 1 : 0)
  const countText = `${count} ${count === 1 ? 'risultato' : 'risultati'}`
  // Live region sempre montata (fuori dal pannello, che può essere inert/smontato).
  const status = (
    <div role="status" className="sr-only">
      {filtering ? countText : ''}
    </div>
  )

  if (mobile) {
    const canFilter = tab !== 'education'
    const showFilter = filterOpen && canFilter
    const active = activeFilters
    return (
      <div tabIndex={-1} onKeyDown={onRootKey} className="@container flex h-full min-h-0 flex-col bg-base text-text outline-none">
        {/* Un solo contenitore di scroll: l'hero scorre via, la barra dei tab resta in alto. */}
        {/* scroll-pt: il focus da tastiera non finisce sotto la barra sticky */}
        <div ref={scrollRef} className="min-h-0 flex-1 scroll-pt-16 overflow-y-auto overscroll-contain">
          <header ref={heroRef} className="border-b border-surface0 bg-mantle px-4 pt-4 pb-4">
            <div className="text-xs text-overlay">
              <span className="text-green">$</span> cat cv.txt
            </div>
            <div className="mt-3 flex items-center gap-3">
              <img src={profile.avatar} alt="" width={64} height={64} className="size-16 shrink-0 rounded-md border border-surface1 object-cover" />
              <div className="min-w-0">
                <h2 className="text-lg leading-tight font-bold text-text">{profile.name}</h2>
                <div className="mt-0.5 text-sm leading-snug text-accent">{profile.role}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-subtext">
                  <MapPin size={12} className="shrink-0 text-overlay" aria-hidden />
                  {profile.location}
                </div>
              </div>
            </div>
            <p className="mt-3 text-subtext">{cv.summary}</p>
            <div className="mt-3 flex items-center gap-2">
              <a
                href={`mailto:${profile.email}`}
                className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-surface1 px-3 text-sm text-subtext active:border-accent active:text-accent"
              >
                <LinkGlyph icon="email" size={14} />
                <span className="truncate">{profile.email}</span>
              </a>
              {cvLinks
                .filter((l) => l.icon !== 'email')
                .map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={l.label}
                    className="grid size-10 shrink-0 place-items-center rounded-md border border-surface1 text-subtext active:border-accent active:text-accent"
                  >
                    <LinkGlyph icon={l.icon} size={16} />
                  </a>
                ))}
            </div>
          </header>

          {/* Barra sticky: tab a segmenti + toggle filtro */}
          <div className="sticky top-0 z-10 border-b border-surface0 bg-mantle">
            <div className="flex items-stretch gap-1.5 p-1.5">
              <div
                role="tablist"
                aria-label="Sezioni del CV"
                onKeyDown={onTabsKey}
                className="grid min-w-0 flex-1 grid-cols-3 gap-px overflow-hidden rounded-md border border-surface1 bg-surface1"
              >
                {TABS.map((t, i) => {
                  const on = t.id === tab
                  const n = tabCount(t.id)
                  return (
                    <button
                      key={t.id}
                      {...tabProps(t.id, i)}
                      className={`relative flex min-h-11 min-w-0 items-center justify-center gap-1 px-1 text-[13px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-text ${
                        on ? 'bg-accent font-bold text-crust' : 'bg-base text-subtext active:bg-surface0'
                      }`}
                    >
                      <span aria-hidden className={`max-[379px]:hidden ${on ? '' : 'text-accent'}`}>
                        [{i + 1}]
                      </span>
                      <span className="truncate">{t.label}</span>
                      {n !== null && (
                        <span className={`absolute top-0.5 right-1 text-[10px] leading-none tabular-nums ${on ? 'text-crust/70' : 'text-overlay'}`}>{n}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <button
                ref={filterBtnRef}
                type="button"
                onClick={toggleFilter}
                disabled={!canFilter}
                aria-expanded={showFilter}
                aria-controls="cv-filter"
                aria-label={active ? `Filtro (${active} attivi)` : 'Filtro'}
                className={`relative grid w-11 shrink-0 place-items-center rounded-md border transition-colors disabled:opacity-30 ${
                  showFilter ? 'border-accent bg-accent/15 text-accent' : active ? 'border-accent text-accent' : 'border-surface1 text-subtext active:border-accent'
                }`}
              >
                {showFilter ? <X size={18} aria-hidden /> : <Search size={18} aria-hidden />}
                {active > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-sm bg-accent px-0.5 text-[10px] leading-none font-bold text-crust tabular-nums">
                    {active}
                  </span>
                )}
              </button>
            </div>

            {/* Pannello filtro: si apre sotto la barra */}
            <div
              id="cv-filter"
              inert={!showFilter}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${showFilter ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="space-y-2 border-t border-surface0 px-1.5 pt-2 pb-2">
                  <div className="flex h-10 items-center rounded-md border border-surface1 bg-base px-3 focus-within:border-accent">
                    <label className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="text-accent" aria-hidden>
                        /
                      </span>
                      <input
                        ref={filterInputRef}
                        type="search"
                        name="cv-filter"
                        autoComplete="off"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="filtra per tag o testo…"
                        aria-label="Filtra per tag o testo"
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        enterKeyHint="search"
                        className="min-w-0 flex-1 bg-transparent text-[16px] text-text outline-none placeholder:text-overlay [&::-webkit-search-cancel-button]:hidden"
                      />
                    </label>
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('')
                          filterInputRef.current?.focus()
                        }}
                        aria-label="Svuota testo"
                        className="-mr-2 ml-2 grid size-9 place-items-center text-overlay active:text-red"
                      >
                        <X size={16} aria-hidden />
                      </button>
                    )}
                  </div>
                  <div role="group" className="-mx-1.5 flex gap-1.5 overflow-x-auto px-1.5 pb-0.5 [scrollbar-width:none]" aria-label="Tag">
                    {visibleTags.map((t) => (
                      <TagChip key={t} tag={t} active={selected.has(t)} onToggle={toggleTag} re={selected.has(t) ? null : re} touch />
                    ))}
                  </div>
                  {filtering && (
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span aria-hidden className={count ? 'text-green' : 'text-red'}>
                        {countText}
                      </span>
                      <button type="button" onClick={clear} className="-my-1 inline-flex min-h-9 items-center gap-1 rounded-sm px-2 text-subtext active:text-red">
                        <X size={13} aria-hidden /> pulisci
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            role="tabpanel"
            id={`cv-panel-${tab}`}
            aria-labelledby={`cv-tab-${tab}`}
            tabIndex={0}
            className="px-3 pt-4 pb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
          >
            {panel}
          </div>
        </div>

        {/* Azione di export in fondo */}
        <div className="grid shrink-0 border-t border-surface0 bg-mantle p-2">
          <button
            type="button"
            onClick={exportPdf}
            disabled={printing}
            aria-describedby="cv-pdf-hint"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-accent bg-accent font-bold text-crust active:opacity-80 disabled:opacity-50"
          >
            <Download size={16} aria-hidden /> Scarica PDF
          </button>
          <span id="cv-pdf-hint" className="sr-only">
            apre la stampa: scegli Salva come PDF
          </span>
        </div>

        {status}
        {printPortal}
      </div>
    )
  }

  return (
    <div tabIndex={-1} onKeyDown={onRootKey} className="@container flex h-full min-h-0 flex-col bg-base text-text outline-none">
      {/* Header */}
      <header className="flex shrink-0 gap-3 border-b border-surface0 bg-mantle px-3 py-2.5 @lg:px-4">
        <img src={profile.avatar} alt="" width={56} height={56} className="size-12 shrink-0 rounded-md border border-surface1 object-cover @md:size-14" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="text-base font-bold text-text @lg:text-lg">{profile.name}</h2>
            <span className="text-accent">{profile.role}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-subtext">
            <span>
              <span className="text-overlay">loc:</span> {profile.location}
            </span>
            <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1 hover:text-accent">
              <LinkGlyph icon="email" size={12} />
              {profile.email}
            </a>
            {cvLinks
              .filter((l) => l.icon !== 'email')
              .map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer" title={l.label} aria-label={l.label} className="-m-1 p-1 hover:text-accent">
                  <LinkGlyph icon={l.icon} size={12} />
                </a>
              ))}
          </div>
          <p ref={summaryRef} id="cv-summary" className={`mt-1.5 text-sm text-subtext @lg:line-clamp-none ${summaryOpen ? '' : 'line-clamp-3'}`}>
            {cv.summary}
          </p>
          {(summaryClamped || summaryOpen) && (
            <button
              type="button"
              onClick={() => setSummaryOpen((o) => !o)}
              aria-expanded={summaryOpen}
              aria-controls="cv-summary"
              className="text-xs text-accent hover:underline @lg:hidden"
            >
              {summaryOpen ? 'meno' : 'altro'}
            </button>
          )}
        </div>
      </header>

      {/* Tab + azioni: una riga sola, il filtro si apre a richiesta */}
      <div className="flex shrink-0 items-center gap-2 border-b border-surface0 px-2 py-1.5 @lg:px-3">
        <div role="tablist" aria-label="Sezioni del CV" onKeyDown={onTabsKey} className="flex min-w-0 gap-1 overflow-x-auto">
          {TABS.map((t, i) => {
            const active = t.id === tab
            return (
              <button
                key={t.id}
                {...tabProps(t.id, i)}
                className={`shrink-0 px-1.5 py-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-text ${
                  active ? 'bg-accent text-crust' : 'text-subtext hover:text-text'
                }`}
              >
                <span aria-hidden className={active ? '' : 'text-accent'}>
                  [{i + 1}]
                </span>{' '}
                {t.label}
                {badge(t.id)}
              </button>
            )
          })}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {tab !== 'education' && (
            <button
              ref={filterBtnRef}
              type="button"
              onClick={toggleFilter}
              aria-expanded={filterOpen}
              aria-controls="cv-filter-desktop"
              title="Filtra per tag o testo"
              className={`relative inline-flex h-7 items-center gap-1 rounded-sm border px-2 text-xs transition-colors ${
                filterOpen || filtering ? 'border-accent text-accent' : 'border-surface1 text-subtext hover:border-accent hover:text-accent'
              }`}
            >
              {filterOpen ? <X size={13} aria-hidden /> : <Search size={13} aria-hidden />}
              filtra
              {activeFilters > 0 && <span className="rounded-sm bg-accent px-1 text-[10px] font-bold text-crust tabular-nums">{activeFilters}</span>}
            </button>
          )}
          <button
            type="button"
            onClick={exportPdf}
            disabled={printing}
            className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-accent px-3 text-xs font-bold text-crust transition-[filter] hover:brightness-110 disabled:opacity-50"
            title="Stampa o salva il CV come PDF"
          >
            <Download size={14} aria-hidden /> Scarica PDF
          </button>
        </div>
      </div>

      {/* Filtro (chiuso di default) */}
      {filterOpen && tab !== 'education' && (
        <div
          id="cv-filter-desktop"
          // Esc: prima svuota il testo, poi chiude il pannello (anche col focus su un tag).
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            e.stopPropagation()
            if (query) setQuery('')
            else {
              filterBtnRef.current?.focus()
              setFilterOpen(false)
            }
          }}
          className="shrink-0 space-y-1.5 border-b border-surface0 bg-mantle/50 px-2 py-2 @lg:px-3"
        >
          <div className="flex items-center gap-1.5 border border-surface1 bg-mantle px-2 py-0.5 focus-within:border-accent">
            <label className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="text-accent" aria-hidden>
                /
              </span>
              <input
                ref={filterInputRef}
                autoFocus
                type="search"
                name="cv-filter"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="filtra per tag o testo…"
                aria-label="Filtra per tag o testo"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-overlay [&::-webkit-search-cancel-button]:hidden"
              />
            </label>
            {filtering && (
              <>
                <span aria-hidden className={`shrink-0 text-xs ${count ? 'text-green' : 'text-red'}`}>
                  {countText}
                </span>
                <button type="button" onClick={clear} className="inline-flex shrink-0 items-center gap-0.5 text-xs text-subtext hover:text-red">
                  <X size={12} aria-hidden /> pulisci
                </button>
              </>
            )}
          </div>
          <div role="group" className="flex max-h-16 flex-wrap gap-1 overflow-y-auto" aria-label="Tag">
            {visibleTags.map((t) => (
              <TagChip key={t} tag={t} active={selected.has(t)} onToggle={toggleTag} re={selected.has(t) ? null : re} />
            ))}
          </div>
        </div>
      )}

      {/* Contenuto */}
      <div
        role="tabpanel"
        id={`cv-panel-${tab}`}
        aria-labelledby={`cv-tab-${tab}`}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent @lg:px-4"
      >
        {panel}
      </div>

      {status}
      {printPortal}
    </div>
  )
}
