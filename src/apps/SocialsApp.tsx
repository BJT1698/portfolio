import { ArrowUpRight } from 'lucide-react'
import { links } from '../config/links'
import { LinkGlyph } from '../lib/icons'
import { beep } from '../lib/sound'

export default function SocialsApp() {
  return (
    <div className="@container h-full overflow-y-auto overscroll-contain p-4">
      <h1 className="sr-only">Link e contatti</h1>
      <p className="mb-3 text-xs text-overlay">
        <span className="text-accent" aria-hidden="true">
          $
        </span>{' '}
        cat ~/.config/links.conf
      </p>
      <ul className="grid gap-2 @md:grid-cols-2">
        {links.map((l) => {
          const external = !l.url.startsWith('mailto:')
          return (
            <li key={l.id}>
              <a
                href={l.url}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                onClick={() => beep('open')}
                className="group flex h-full items-start gap-3 rounded-md border border-surface0 bg-mantle/60 p-3 transition-colors hover:border-accent hover:bg-surface0/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-base text-subtext transition-colors group-hover:text-accent">
                  <LinkGlyph icon={l.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-text">
                    {l.label}
                    {external && (
                      <ArrowUpRight size={13} className="text-overlay transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
                    )}
                  </span>
                  <span className="block truncate text-xs text-accent">{l.handle}</span>
                  {l.description && <span className="mt-1 block text-xs text-overlay">{l.description}</span>}
                  {external && <span className="sr-only">(si apre in una nuova scheda)</span>}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
