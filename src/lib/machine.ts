// Versioni "per macchine" del profilo: agenti AI, crawler, ATS e motori di ricerca.
// Tutto è derivato da config/ (profile, cv, links, site): nessun dato duplicato a mano.
// Usato da scripts/gen-cv.ts (file in public/) e da vite.config.ts (meta tag e HTML statico in index.html).
// Import con estensione .ts: gira anche sotto Node.
import { cv } from '../config/cv.ts'
import { profile } from '../config/profile.ts'
import { cvLinks } from '../config/links.ts'
import { site } from '../config/site.ts'
import { cvToMarkdown, formatYm, period } from './cvMarkdown.ts'

/** URL assoluto se il dominio è configurato, altrimenti relativo. */
export const abs = (path: string) => (site.url ? `${site.url}${path}` : path)

const web = cvLinks.filter((l) => !l.url.startsWith('mailto:'))
const current = cv.experience.find((e) => !e.end)
const description = `${profile.role} ad ${profile.location}. ${cv.summary}`
const OPEN_IT = 'attualmente occupato, aperto a valutare nuove proposte'
const OPEN_EN = 'currently employed, open to new opportunities'

const FILES = [
  { path: '/cv.md', title: 'CV in Markdown', desc: 'esperienza, competenze, formazione e lingue' },
  { path: '/resume.json', title: 'CV in JSON Resume', desc: 'formato strutturato (jsonresume.org), adatto ad ATS e parser' },
  { path: '/llms-full.txt', title: 'Contenuto completo', desc: 'profilo e CV in un unico file di testo' },
]

/** /llms.txt secondo la proposta llmstxt.org: indice in markdown per gli LLM. */
export function llmsTxt(): string {
  return [
    `# ${profile.name}`,
    '',
    `> ${profile.role} — ${profile.place.city} (${profile.place.province}), ${profile.place.region}, Italia. ${cv.summary}`,
    '',
    `English: ${profile.role} based in ${profile.place.city}, ${profile.place.region}, Italy. ${cv.summaryEn}`,
    '',
    'Il sito è un portfolio interattivo in JavaScript; lo stesso contenuto è disponibile in formato testuale qui sotto.',
    '',
    '## Profilo',
    '',
    current && `- Ruolo attuale: ${current.role} presso ${current.company} (da ${formatYm(current.start)})`,
    `- Località: ${profile.place.city} (${profile.place.province}), ${profile.place.region}, Italia`,
    `- Lingue: ${profile.languages.map((l) => `${l.name} (${l.level})`).join(', ')}`,
    profile.openToOffers ? `- Disponibilità: ${OPEN_IT} / ${OPEN_EN}` : undefined,
    ...cv.skills.map((c) => `- ${c.label}: ${c.skills.map((s) => s.name).join(', ')}`),
    '',
    '## Curriculum',
    '',
    ...FILES.map((f) => `- [${f.title}](${abs(f.path)}): ${f.desc}`),
    '',
    '## Contatti',
    '',
    `- Email: ${profile.email}`,
    ...web.map((l) => `- [${l.label}](${l.url})`),
    '',
  ]
    .filter((l): l is string => l !== undefined)
    .join('\n')
}

/** /llms-full.txt: indice + CV completo, per chi vuole tutto in una sola richiesta. */
export function llmsFullTxt(): string {
  return `${llmsTxt()}\n---\n\n${cvToMarkdown()}`
}

/** /resume.json nel formato JSON Resume (https://jsonresume.org/schema). */
export function jsonResume() {
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: profile.name,
      label: profile.role,
      image: abs(profile.avatar),
      email: profile.email,
      ...(site.url && { url: site.url }),
      summary: cv.summary,
      location: { city: profile.place.city, region: profile.place.region, countryCode: profile.place.countryCode },
      profiles: web.map((l) => ({ network: l.label, username: l.handle.replace(/^(@|in\/)/, ''), url: l.url })),
    },
    work: cv.experience.map((e) => ({
      name: e.company,
      position: e.role,
      ...(e.location && { location: e.location }),
      startDate: e.start,
      ...(e.end && { endDate: e.end }),
      summary: e.summary,
      highlights: e.highlights,
    })),
    education: cv.education.map((ed) => ({
      institution: ed.institution,
      area: ed.title,
      studyType: 'Diploma',
      startDate: ed.start,
      ...(ed.end && { endDate: ed.end }),
    })),
    certificates: cv.certifications.map((c) => ({ name: c.name, issuer: c.issuer, date: c.year, ...(c.url && { url: c.url }) })),
    skills: cv.skills.map((c) => ({ name: c.label, keywords: c.skills.map((s) => s.name) })),
    languages: profile.languages.map((l) => ({ language: l.name, fluency: l.level })),
    meta: { ...(site.url && { canonical: abs('/resume.json') }), version: 'v1.0.0', lastModified: new Date().toISOString().slice(0, 10) },
  }
}

/** Dati strutturati schema.org (ProfilePage + Person) per motori di ricerca e agenti. */
export function jsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    ...(site.url && { url: site.url }),
    inLanguage: site.lang,
    mainEntity: {
      '@type': 'Person',
      name: profile.name,
      jobTitle: profile.role,
      description: `${cv.summary}${profile.openToOffers ? ` ${OPEN_IT[0].toUpperCase()}${OPEN_IT.slice(1)}.` : ''} | EN: ${cv.summaryEn}${profile.openToOffers ? ` ${OPEN_EN[0].toUpperCase()}${OPEN_EN.slice(1)}.` : ''}`,
      email: `mailto:${profile.email}`,
      ...(site.url && { image: abs(profile.avatar), url: site.url }),
      address: { '@type': 'PostalAddress', addressLocality: profile.place.city, addressRegion: profile.place.province, addressCountry: profile.place.countryCode },
      ...(current && { worksFor: { '@type': 'Organization', name: current.company } }),
      alumniOf: cv.education.map((ed) => ({ '@type': 'EducationalOrganization', name: ed.institution })),
      knowsAbout: cv.skills.flatMap((c) => c.skills.map((s) => s.name)),
      knowsLanguage: profile.languages.map((l) => l.name),
      sameAs: web.map((l) => l.url),
    },
  }
}

export function robotsTxt(): string {
  return [
    '# Motori di ricerca e agenti AI sono benvenuti.',
    `# Indice per LLM: ${abs('/llms.txt')}`,
    'User-agent: *',
    'Allow: /',
    ...(site.url ? ['', `Sitemap: ${abs('/sitemap.xml')}`] : []),
    '',
  ].join('\n')
}

/** null se il dominio non è configurato: una sitemap richiede URL assoluti. */
export function sitemapXml(): string | null {
  if (!site.url) return null
  const today = new Date().toISOString().slice(0, 10)
  const urls = ['/', '/llms.txt', ...FILES.map((f) => f.path)]
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${abs(u)}</loc><lastmod>${today}</lastmod></url>`),
    '</urlset>',
    '',
  ].join('\n')
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Meta tag, link alternativi e JSON-LD da iniettare in <head>. */
export function headTags(): string {
  const meta = [
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="author" content="${esc(profile.name)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:title" content="${esc(site.title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:locale" content="it_IT" />`,
    `<meta property="profile:first_name" content="${esc(profile.name.split(' ')[0])}" />`,
    `<meta property="profile:last_name" content="${esc(profile.name.split(' ').slice(1).join(' '))}" />`,
    `<meta name="twitter:card" content="summary" />`,
    ...(site.url
      ? [`<link rel="canonical" href="${site.url}/" />`, `<meta property="og:url" content="${site.url}/" />`, `<meta property="og:image" content="${abs(profile.avatar)}" />`]
      : []),
    `<link rel="alternate" type="text/plain" href="${abs('/llms.txt')}" title="llms.txt" />`,
    `<link rel="alternate" type="text/markdown" href="${abs('/cv.md')}" title="CV (Markdown)" />`,
    `<link rel="alternate" type="application/json" href="${abs('/resume.json')}" title="CV (JSON Resume)" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd()).replace(/</g, '\\u003c')}</script>`,
  ]
  return meta.join('\n    ')
}

/**
 * Il CV in HTML semantico dentro #root: lo leggono crawler e agenti che non eseguono JavaScript.
 * React lo sostituisce al primo render; con JS attivo resta invisibile (classe .js su <html>).
 */
export function staticBody(): string {
  const li = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
  const exp = cv.experience
    .map(
      (e) =>
        `<article><h3>${esc(e.role)} — ${esc(e.company)}</h3><p><time datetime="${e.start}">${esc(period(e.start, e.end))}</time>${e.location ? ` · ${esc(e.location)}` : ''}</p><p>${esc(e.summary)}</p>${e.highlights.length ? li(e.highlights) : ''}</article>`,
    )
    .join('')
  return `<main class="static-cv">
      <header>
        <h1>${esc(profile.name)}</h1>
        <p>${esc(profile.role)} · ${esc(profile.location)}${profile.openToOffers ? ` · ${OPEN_IT}` : ''}</p>
        <p>${esc(cv.summary)}</p>
        <p lang="en">${esc(cv.summaryEn)}</p>
        <p>Email: <a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>${web.map((l) => ` · <a href="${esc(l.url)}">${esc(l.label)}</a>`).join('')}</p>
      </header>
      <section><h2>Esperienza</h2>${exp}</section>
      <section><h2>Competenze</h2>${li(cv.skills.map((c) => `${c.label}: ${c.skills.map((s) => s.name).join(', ')}`))}</section>
      <section><h2>Formazione</h2>${li(cv.education.map((ed) => `${ed.title} — ${ed.institution} (${period(ed.start, ed.end)})`))}</section>
      <section><h2>Lingue</h2>${li(profile.languages.map((l) => `${l.name}: ${l.level}`))}</section>
      <footer><p>Versioni testuali: ${[{ path: '/llms.txt', title: 'llms.txt' }, ...FILES].map((f) => `<a href="${abs(f.path)}">${esc(f.title)}</a>`).join(' · ')}</p></footer>
    </main>`
}
