// Serializzazione del CV in markdown / testo semplice.
// Import con estensione .ts: questo file gira anche sotto Node (scripts/gen-cv.ts).
import { cv } from '../config/cv.ts'
import { profile } from '../config/profile.ts'
import { cvLinks } from '../config/links.ts'

const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

export function formatYm(ym: string | null): string {
  if (!ym) return 'oggi'
  const [y, m] = ym.split('-')
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y
}

export function period(start: string, end: string | null): string {
  return `${formatYm(start)} — ${formatYm(end)}`
}

export function cvToMarkdown(): string {
  const out: string[] = []
  out.push(`# ${profile.name}`, '', `**${profile.role}** · ${profile.location} · ${profile.email}`, '', cv.summary, '')

  out.push('## Esperienza', '')
  for (const e of cv.experience) {
    out.push(`### ${e.role} — ${e.company}`, `_${period(e.start, e.end)}${e.location ? ` · ${e.location}` : ''}_`, '', e.summary, '')
    for (const h of e.highlights) out.push(`- ${h}`)
    if (e.highlights.length) out.push('')
    if (e.tags.length) out.push(`\`${e.tags.join('` `')}\``, '')
  }

  out.push('## Competenze', '')
  for (const c of cv.skills) out.push(`- **${c.label}:** ${c.skills.map((s) => s.name).join(', ')}`)
  out.push('')

  out.push('## Formazione', '')
  for (const ed of cv.education) out.push(`- **${ed.title}** — ${ed.institution} (${period(ed.start, ed.end)})${ed.notes ? `. ${ed.notes}` : ''}`)
  out.push('')

  if (cv.certifications.length) {
    out.push('## Certificazioni', '')
    for (const c of cv.certifications) out.push(`- ${c.name} — ${c.issuer}, ${c.year}${c.status === 'in-progress' ? ' (in corso)' : ''}`)
    out.push('')
  }

  out.push('## Lingue', '')
  for (const l of profile.languages) out.push(`- ${l.name}: ${l.level}`)
  out.push('')

  out.push('## Link', '')
  for (const l of cvLinks) out.push(`- ${l.label}: ${l.url}`)
  out.push('')

  return out.join('\n')
}

export function cvToText(): string {
  return cvToMarkdown()
    .replace(/^#+ /gm, '')
    .replace(/\*\*|`|_/g, '')
}
