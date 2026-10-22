import { ArrowUpRight } from 'lucide-react'
import { beep } from '../lib/sound'

/** Pulsante/link verso un sito esterno, nello stile dei pulsanti della toolbar. */
export const SiteButton = ({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    onClick={() => beep('open')}
    className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-sm border px-3 text-xs transition-colors ${
      primary ? 'border-accent bg-accent text-crust hover:brightness-110' : 'border-surface1 text-text hover:border-accent hover:text-accent'
    }`}
  >
    {children}
    <ArrowUpRight size={14} aria-hidden />
    <span className="sr-only"> (si apre in una nuova scheda)</span>
  </a>
)
