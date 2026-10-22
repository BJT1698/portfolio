// Genera in public/ le versioni testuali e strutturate del profilo, per agenti AI, crawler e ATS:
// cv.md, cv.txt, llms.txt, llms-full.txt, resume.json, robots.txt e sitemap.xml (solo con dominio configurato).
// Eseguito da `npm run dev` / `npm run build` (Node >= 22.18 con type stripping).
import { rmSync, writeFileSync } from 'node:fs'
import { cvToMarkdown, cvToText } from '../src/lib/cvMarkdown.ts'
import { jsonResume, llmsFullTxt, llmsTxt, robotsTxt, sitemapXml } from '../src/lib/machine.ts'

const out = (name: string) => new URL(`../public/${name}`, import.meta.url)
const files: Record<string, string> = {
  'cv.md': cvToMarkdown(),
  'cv.txt': cvToText(),
  'llms.txt': llmsTxt(),
  'llms-full.txt': llmsFullTxt(),
  'resume.json': JSON.stringify(jsonResume(), null, 2) + '\n',
  'robots.txt': robotsTxt(),
}
const sitemap = sitemapXml()
if (sitemap) files['sitemap.xml'] = sitemap
else rmSync(out('sitemap.xml'), { force: true })

for (const [name, content] of Object.entries(files)) writeFileSync(out(name), content)
console.log(`gen-cv: ${Object.keys(files).join(', ')}`)
