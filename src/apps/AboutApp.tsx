import { useState } from 'react'
import { MapPin, Mail, Circle, ChevronRight } from 'lucide-react'
import { profile } from '../config/profile'
import { cv, type SkillCategory } from '../config/cv'
import { links } from '../config/links'
import { LinkGlyph } from '../lib/icons'
import { useIsMobile } from '../lib/useMediaQuery'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-md border border-surface0 bg-mantle/60">
    <h2 className="border-b border-surface0 px-3 py-1.5 text-xs text-overlay">
      <span className="text-accent" aria-hidden="true">
        ##
      </span>{' '}
      {title}
    </h2>
    <div className="p-3">{children}</div>
  </section>
)

export default function AboutApp() {
  return useIsMobile() ? <MobileAbout /> : <DesktopAbout />
}

function DesktopAbout() {
  return (
    <div className="@container h-full overflow-y-auto overscroll-contain p-4">
      <div className="grid gap-3 @2xl:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-3">
          <Section title="whoami">
            <div className="flex items-center gap-3">
              <img src={profile.avatar} alt={profile.name} width={64} height={64} className="size-16 shrink-0 rounded-md border border-surface1 object-cover" />
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-text">{profile.name}</h1>
                <p className="text-accent">{profile.role}</p>
              </div>
            </div>
            <p className="mt-2 text-subtext italic">“{profile.tagline}”</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtext">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-peach" /> {profile.location}
              </span>
              <a href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:text-accent">
                <Mail size={12} className="text-blue" /> {profile.email}
              </a>
              {profile.openToOffers && (
                <span className="flex items-center gap-1 text-green">
                  <Circle size={8} fill="currentColor" /> aperto a proposte
                </span>
              )}
            </div>
          </Section>
          <Section title="bio">
            <div className="space-y-2 leading-relaxed text-subtext">
              {profile.bio.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Section>
        </div>
        <div className="flex flex-col gap-3">
          <Section title="stack">
            <div className="space-y-3">
              {cv.skills.map((cat) => (
                <div key={cat.id}>
                  <h3 className="mb-1.5 text-xs text-overlay">{cat.label}</h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {cat.skills.map((s) => (
                      <li key={s.name} className="rounded-sm border border-surface1 px-2 py-0.5 text-text">
                        {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
          <Section title="interessi">
            <ul className="flex flex-wrap gap-1.5">
              {profile.interests.map((i) => (
                <li key={i} className="rounded-sm border border-surface1 px-2 py-0.5 text-xs text-subtext">
                  {i}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}

// --- Mobile: profilo verticale, contatti tappabili, stack ad accordion ---

/** Contatti: email per prima (dal profilo), poi gli altri link. */
const CONTACTS = [
  { id: 'email', label: 'email', handle: profile.email, url: `mailto:${profile.email}`, icon: 'email' as const },
  ...links.filter((l) => l.icon !== 'email').map((l) => ({ ...l, label: l.label.toLowerCase() })),
]

const MobileHeading = ({ title, aside }: { title: string; aside?: string }) => (
  <h2 className="mb-2.5 flex items-center gap-2 text-xs text-overlay">
    <span className="text-accent" aria-hidden="true">
      ##
    </span>
    <span>{title}</span>
    <span className="h-px flex-1 bg-surface0" />
    {aside && <span className="text-overlay/70">{aside}</span>}
  </h2>
)

function MobileAbout() {
  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="flex flex-col gap-7 px-4 pt-5 pb-8">
        <header className="flex flex-col items-center text-center">
          <p className="mb-3 self-start text-xs text-overlay">
            <span className="text-green" aria-hidden="true">
              $
            </span>{' '}
            whoami
          </p>
          <img src={profile.avatar} alt={profile.name} width={96} height={96} className="size-24 rounded-md border border-surface1 object-cover" />
          <h1 className="mt-3 text-xl font-bold text-text">{profile.name}</h1>
          <p className="mt-0.5 text-sm text-accent">{profile.role}</p>
          <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-subtext italic">“{profile.tagline}”</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            {profile.openToOffers && (
              <span className="flex items-center gap-1.5 rounded-sm border border-green/40 bg-green/10 px-2 py-1 text-green">
                <Circle size={7} fill="currentColor" className="animate-pulse" /> aperto a proposte
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-sm border border-surface1 px-2 py-1 text-subtext">
              <MapPin size={12} className="text-peach" /> {profile.location}
            </span>
          </div>
        </header>

        <section>
          <MobileHeading title="contatti" />
          <ul className="divide-y divide-surface0 overflow-hidden rounded-md border border-surface0 bg-mantle/60">
            {CONTACTS.map((c) => (
              <li key={c.id}>
                <a
                  href={c.url}
                  target={c.url.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noreferrer"
                  className="flex min-h-12 items-center gap-3 px-3 text-sm active:bg-surface0 focus-visible:-outline-offset-2"
                >
                  <span className="text-accent" aria-hidden="true">
                    &gt;
                  </span>
                  <LinkGlyph icon={c.icon} size={16} className="shrink-0 text-subtext" />
                  <span className="min-w-[4.5rem] shrink-0 text-text">{c.label}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-overlay">{c.handle}</span>
                  {!c.url.startsWith('mailto:') && <span className="sr-only">(si apre in una nuova scheda)</span>}
                  <ChevronRight size={16} className="shrink-0 text-overlay" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <MobileHeading title="bio" />
          <div className="space-y-3 text-[15px] leading-relaxed text-subtext">
            {profile.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section>
          <MobileHeading title="stack" aside={`${cv.skills.length} categorie`} />
          <MobileStack />
        </section>

        <section>
          <MobileHeading title="interessi" />
          <ul className="flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <li key={i} className="rounded-sm border border-surface1 bg-mantle/60 px-2.5 py-1.5 text-sm text-subtext">
                <span className="text-accent" aria-hidden="true">
                  #
                </span>
                {i}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function MobileStack() {
  const [open, setOpen] = useState<Set<string>>(() => new Set(cv.skills.slice(0, 1).map((c) => c.id)))
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="divide-y divide-surface0 overflow-hidden rounded-md border border-surface0 bg-mantle/60">
      {cv.skills.map((cat) => (
        <StackGroup key={cat.id} cat={cat} open={open.has(cat.id)} onToggle={() => toggle(cat.id)} />
      ))}
    </div>
  )
}

function StackGroup({ cat, open, onToggle }: { cat: SkillCategory; open: boolean; onToggle: () => void }) {
  const panelId = `about-stack-${cat.id}`
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="flex min-h-12 w-full items-center gap-2 px-3 text-left text-sm active:bg-surface0 focus-visible:-outline-offset-2"
      >
        <span className={open ? 'text-accent' : 'text-overlay'} aria-hidden="true">
          [{open ? '-' : '+'}]
        </span>
        <span className={`min-w-0 flex-1 truncate ${open ? 'text-text' : 'text-subtext'}`}>{cat.label}</span>
        <span className="text-xs text-overlay">
          {cat.skills.length}
          <span className="sr-only"> competenze</span>
        </span>
      </button>
      {open && (
        <ul id={panelId} className="flex flex-wrap gap-2 border-t border-surface0 bg-crust/40 p-3">
          {cat.skills.map((s) => (
            <li key={s.name} className="rounded-sm border border-surface1 px-2.5 py-1 text-sm text-text">
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
