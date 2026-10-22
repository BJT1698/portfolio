import { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { profile } from '../config/profile'
import { cv } from '../config/cv'
import { links } from '../config/links'
import { themes, type ThemeId } from '../config/themes'
import { fonts } from '../config/fonts'
import { cvToMarkdown, period } from '../lib/cvMarkdown'
import { APPS, APP_ORDER, type AppId } from './registry'
import { moveFocus, useWM } from '../store/windows'
import { useSettings } from '../store/settings'
import { beep } from '../lib/sound'
import { useIsMobile } from '../lib/useMediaQuery'

interface Entry {
  id: number
  /** Directory corrente al momento del comando (per il prompt nello storico). */
  cwd: string[]
  command: string
  output: ReactNode
}

/** Stato della shell passato all'interprete. */
interface Shell {
  cwd: string[]
  prev: string[]
  cd(path: string[]): void
}

interface Result {
  out: ReactNode
  err?: boolean
}

const HOME = ['home', profile.user]
const MAX_ENTRIES = 200

const HELP: { name: string; desc: string }[] = [
  { name: 'help', desc: 'mostra questo elenco (alias: man)' },
  { name: 'whoami', desc: 'chi sono, in breve' },
  { name: 'ls [dir]', desc: 'elenca i file (prova ls experience)' },
  { name: 'cd <dir>', desc: 'entra in una directory (cd .. per tornare su)' },
  { name: 'cat <file>', desc: 'mostra un file, es. cat cv.txt o cat skills/virt.txt' },
  { name: 'tree [dir]', desc: 'albero di file e directory' },
  { name: 'curl -O /cv.md', desc: 'scarica il CV in markdown' },
  { name: 'skills', desc: 'competenze in formato tree' },
  { name: 'socials', desc: 'link e contatti' },
  { name: 'open <app>', desc: `apre una finestra (${APP_ORDER.join(', ')})` },
  { name: 'theme [name]', desc: 'elenca o cambia tema' },
  { name: 'font [name]', desc: 'elenca o cambia font' },
  { name: 'sound [on|off]', desc: 'attiva/disattiva i beep' },
  { name: 'history', desc: 'comandi eseguiti' },
  { name: 'date', desc: 'data e ora' },
  { name: 'uname -a', desc: 'info kernel' },
  { name: 'pwd / echo', desc: 'i soliti' },
  { name: 'clear', desc: 'pulisce lo schermo (Ctrl+L)' },
  { name: 'exit', desc: 'chiude il terminale' },
]

const COMMANDS = [
  'help', 'man', 'whoami', 'cat', 'curl', 'skills', 'socials', 'ls', 'cd', 'tree', 'open',
  'theme', 'font', 'sound', 'history', 'date', 'uname', 'echo', 'pwd', 'clear', 'exit', 'sudo', 'rm',
]

const ARGS: Record<string, readonly string[]> = {
  open: APP_ORDER,
  theme: themes.map((t) => t.id),
  font: fonts.map((f) => f.id),
  sound: ['on', 'off'],
  curl: ['cv', '-O'],
}

function download(href: string, name: string) {
  Object.assign(document.createElement('a'), { href, download: name }).click()
}

const fail = (msg: string): Result => ({ out: <span className="text-red">{msg}</span>, err: true })

/* ---------- output dei comandi ---------- */

/** '/home/lorenzo/skills' → '~/skills' */
function displayPath(path: string[]): string {
  const inHome = HOME.every((p, i) => path[i] === p)
  return inHome ? ['~', ...path.slice(HOME.length)].join('/') : `/${path.join('/')}`
}

const PS1 = memo(function PS1({ cwd }: { cwd: string[] }) {
  return (
    <span className="shrink-0 whitespace-pre">
      <span className="text-green">{profile.user}</span>
      <span className="text-subtext">@</span>
      <span className="text-blue">{profile.host}</span>
      <span className="text-subtext">:</span>
      <span className="text-accent">{displayPath(cwd)}</span>
      <span className="text-subtext">$ </span>
    </span>
  )
})

function Help() {
  const pad = Math.max(...HELP.map((h) => h.name.length)) + 3
  return (
    <div>
      <div className="mb-1 text-subtext">Comandi disponibili:</div>
      {HELP.map((h) => (
        <div key={h.name} className="flex">
          <span className="shrink-0 whitespace-pre text-accent">{h.name.padEnd(pad)}</span>
          <span className="min-w-0 text-subtext">{h.desc}</span>
        </div>
      ))}
      <div className="mt-1 text-overlay">Tab completa · ↑/↓ cronologia · Ctrl+C interrompe · Ctrl+L pulisce</div>
    </div>
  )
}

function Whoami() {
  return (
    <div className="space-y-1">
      <div>
        <span className="font-bold text-text">{profile.name}</span>
        <span className="text-overlay"> — </span>
        <span className="text-accent">{profile.role}</span>
      </div>
      <div className="italic text-subtext">{profile.tagline}</div>
      {profile.bio.map((p) => (
        <p key={p} className="text-text">
          {p}
        </p>
      ))}
    </div>
  )
}

function H({ children }: { children: ReactNode }) {
  return <div className="mt-2 font-bold text-mauve">{children}</div>
}

function CvText() {
  return (
    <div>
      <div>
        <span className="font-bold text-text">{profile.name}</span>
        <span className="text-overlay"> · </span>
        <span className="text-accent">{profile.role}</span>
      </div>
      <div className="text-subtext">
        {profile.location} · {profile.email}
      </div>
      <p className="mt-1 text-text">{cv.summary}</p>

      <H>## Esperienza</H>
      {cv.experience.map((e) => (
        <div key={e.role + e.start} className="mt-1">
          <div>
            <span className="text-yellow">{e.role}</span>
            <span className="text-overlay"> @ </span>
            <span className="text-blue">{e.company}</span>
            <span className="text-overlay"> · {period(e.start, e.end)}</span>
          </div>
          {e.highlights.map((h) => (
            <div key={h} className="flex text-text">
              <span className="shrink-0 whitespace-pre text-green">{'  • '}</span>
              <span className="min-w-0">{h}</span>
            </div>
          ))}
        </div>
      ))}

      <H>## Competenze</H>
      {cv.skills.map((c) => (
        <div key={c.id}>
          <span className="text-teal">{c.label}:</span> <span className="text-text">{c.skills.map((s) => s.name).join(', ')}</span>
        </div>
      ))}

      <H>## Formazione</H>
      {cv.education.map((ed) => (
        <div key={ed.title}>
          <span className="text-yellow">{ed.title}</span>
          <span className="text-overlay"> — {ed.institution} · {period(ed.start, ed.end)}</span>
        </div>
      ))}

      {cv.certifications.length > 0 && <H>## Certificazioni</H>}
      {cv.certifications.map((c) => (
        <div key={c.name}>
          <span className="text-text">{c.name}</span>
          <span className="text-overlay"> — {c.issuer}, {c.year}</span>
          {c.status === 'in-progress' && <span className="text-peach"> (in corso)</span>}
        </div>
      ))}

      <div className="mt-2 text-overlay">
        → <span className="text-accent">curl -O /cv.md</span> per scaricarlo, <span className="text-accent">open cv</span> per la vista completa
      </div>
    </div>
  )
}

function Skills() {
  const total = cv.skills.reduce((n, c) => n + c.skills.length, 0)
  return (
    <div tabIndex={0} aria-label="Albero delle competenze" className="overflow-x-auto whitespace-pre">
      <div className="font-bold text-blue">~/skills</div>
      {cv.skills.map((c, i) => {
        const lastCat = i === cv.skills.length - 1
        return (
          <div key={c.id}>
            <div>
              <span className="text-overlay">{lastCat ? '└── ' : '├── '}</span>
              <span className="font-bold text-blue">{c.label}/</span>
            </div>
            {c.skills.map((s, j) => (
              <div key={s.name}>
                <span className="text-overlay">
                  {lastCat ? '    ' : '│   '}
                  {j === c.skills.length - 1 ? '└── ' : '├── '}
                </span>
                <span className="text-text">{s.name}</span>
              </div>
            ))}
          </div>
        )
      })}
      <div className="mt-1 text-subtext">
        {cv.skills.length} directories, {total} skills
      </div>
    </div>
  )
}

function Socials() {
  const pad = Math.max(...links.map((l) => l.label.length)) + 2
  return (
    <div>
      {links.map((l) => {
        const mail = l.url.startsWith('mailto:')
        return (
          <div key={l.id} className="flex">
            <span className="shrink-0 whitespace-pre text-teal">{l.label.padEnd(pad)}</span>
            <a
              href={l.url}
              {...(mail ? {} : { target: '_blank', rel: 'noreferrer' })}
              className="min-w-0 break-all text-accent underline underline-offset-2 hover:text-text"
            >
              {mail ? l.url.slice(7) : l.url.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )
      })}
    </div>
  )
}

function Columns({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-4">
      {items.map((it) => (
        <span key={it} className={it.endsWith('/') ? 'font-bold text-blue' : it.endsWith('.md') ? 'text-yellow' : it.endsWith('.url') ? 'text-teal' : 'text-text'}>
          {it}
        </span>
      ))}
    </div>
  )
}

function curlDownload(): Result {
  download('/cv.md', 'cv.md')
  const size = `${(new Blob([cvToMarkdown()]).size / 1024).toFixed(1)}k`.padStart(5)
  return {
    out: (
      <pre className="text-subtext">
        {'  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n'}
        {'                                 Dload  Upload   Total   Spent    Left  Speed\n'}
        <span className="text-green">{`100 ${size}  100 ${size}    0     0  48.2k      0 --:--:-- --:--:-- --:--:-- 48.9k`}</span>
      </pre>
    ),
  }
}

/* ---------- filesystem virtuale ---------- */

type FsNode = { kind: 'file'; read: () => ReactNode } | { kind: 'dir'; children: Record<string, FsNode> }

const file = (read: () => ReactNode): FsNode => ({ kind: 'file', read })
const dir = (children: Record<string, FsNode>): FsNode => ({ kind: 'dir', children })

/** 'MVS Multivendor Service' → 'mvs', 'Inside S.r.l.' → 'inside' */
const slug = (s: string) => s.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')

function ExperienceFile({ e }: { e: (typeof cv.experience)[number] }) {
  return (
    <div>
      <div>
        <span className="text-yellow">{e.role}</span>
        <span className="text-overlay"> @ </span>
        <span className="text-blue">{e.company}</span>
      </div>
      <div className="text-overlay">
        {period(e.start, e.end)}
        {e.location && ` · ${e.location}`}
      </div>
      <p className="mt-1 text-text">{e.summary}</p>
      {e.highlights.map((h) => (
        <div key={h} className="flex text-text">
          <span className="shrink-0 whitespace-pre text-green">{'  • '}</span>
          <span className="min-w-0">{h}</span>
        </div>
      ))}
    </div>
  )
}

function LinkFile({ l }: { l: (typeof links)[number] }) {
  const mail = l.url.startsWith('mailto:')
  return (
    <div>
      <span className="text-teal">{l.label}</span>
      <span className="text-overlay"> · </span>
      <a href={l.url} {...(mail ? {} : { target: '_blank', rel: 'noreferrer' })} className="break-all text-accent underline underline-offset-2 hover:text-text">
        {mail ? l.url.slice(7) : l.url.replace(/^https?:\/\//, '')}
      </a>
    </div>
  )
}

const homeDir = dir({
  'about.txt': file(() => <Whoami />),
  'cv.txt': file(() => <CvText />),
  'cv.md': file(() => <pre className="whitespace-pre-wrap text-text">{cvToMarkdown()}</pre>),
  'education.txt': file(() => (
    <div>
      {cv.education.map((ed) => (
        <div key={ed.title}>
          <span className="text-yellow">{ed.title}</span>
          <span className="text-overlay"> — {ed.institution} · {period(ed.start, ed.end)}</span>
        </div>
      ))}
      <H>## Lingue</H>
      {profile.languages.map((l) => (
        <div key={l.name}>
          <span className="text-text">{l.name}</span>
          <span className="text-overlay"> — {l.level}</span>
        </div>
      ))}
    </div>
  )),
  experience: dir(Object.fromEntries(cv.experience.map((e) => [`${slug(e.company)}.txt`, file(() => <ExperienceFile e={e} />)]))),
  skills: dir(
    Object.fromEntries(
      cv.skills.map((c) => [
        `${c.id}.txt`,
        file(() => (
          <div>
            <div className="text-teal">{c.label}</div>
            {c.skills.map((sk) => (
              <div key={sk.name} className="text-text">
                <span className="text-green">{'  • '}</span>
                {sk.name}
              </div>
            ))}
          </div>
        )),
      ]),
    ),
  ),
  socials: dir(Object.fromEntries(links.map((l) => [`${l.id}.url`, file(() => <LinkFile l={l} />)]))),
})

const ROOT = dir({ home: dir({ [profile.user]: homeDir }) })

/** Risolve un percorso (assoluto, relativo, con ~, . e ..) rispetto a cwd. */
function resolve(cwd: string[], input: string): string[] {
  const base = input.startsWith('/') ? [] : input === '~' || input.startsWith('~/') ? [...HOME] : [...cwd]
  const rest = input.replace(/^~(?=\/|$)/, '').split('/')
  for (const part of rest) {
    if (!part || part === '.') continue
    if (part === '..') base.pop()
    else base.push(part)
  }
  return base
}

function nodeAt(path: string[]): FsNode | null {
  let node: FsNode = ROOT
  for (const part of path) {
    if (node.kind !== 'dir' || !(part in node.children)) return null
    node = node.children[part]
  }
  return node
}

/** Nomi in una directory, con '/' finale per le sottodirectory. */
const entries = (d: Extract<FsNode, { kind: 'dir' }>) =>
  Object.entries(d.children).map(([name, n]) => (n.kind === 'dir' ? `${name}/` : name))

function Tree({ node, label }: { node: Extract<FsNode, { kind: 'dir' }>; label: string }) {
  let dirs = 0
  let files = 0
  const lines: ReactNode[] = []
  const walk = (d: Extract<FsNode, { kind: 'dir' }>, prefix: string) => {
    const names = Object.keys(d.children)
    names.forEach((name, i) => {
      const n = d.children[name]
      const last = i === names.length - 1
      const isDir = n.kind === 'dir'
      if (isDir) dirs++
      else files++
      lines.push(
        <div key={lines.length}>
          <span className="text-overlay">
            {prefix}
            {last ? '└── ' : '├── '}
          </span>
          <span className={isDir ? 'font-bold text-blue' : name.endsWith('.md') ? 'text-yellow' : name.endsWith('.url') ? 'text-teal' : 'text-text'}>{name}</span>
        </div>,
      )
      if (n.kind === 'dir') walk(n, prefix + (last ? '    ' : '│   '))
    })
  }
  walk(node, '')
  return (
    <div tabIndex={0} aria-label={`Albero di ${label}`} className="overflow-x-auto whitespace-pre">
      <div className="font-bold text-blue">{label}</div>
      {lines}
      <div className="mt-1 text-subtext">
        {dirs} directories, {files} files
      </div>
    </div>
  )
}

/* ---------- interprete ---------- */

function run(line: string, history: string[], sh: Shell): Result | null {
  const [cmd, ...args] = line.split(/\s+/)
  const flags = args.filter((a) => a.startsWith('-'))
  const pos = args.filter((a) => !a.startsWith('-'))

  switch (cmd) {
    case 'help':
    case 'man':
      return { out: <Help /> }
    case 'whoami':
      return { out: <Whoami /> }
    case 'skills':
      return { out: <Skills /> }
    case 'socials':
      return { out: <Socials /> }

    case 'cat': {
      if (!pos.length) return fail('usage: cat <file>')
      const out: ReactNode[] = []
      for (const p of pos) {
        const n = nodeAt(resolve(sh.cwd, p))
        if (!n) return fail(`cat: ${p}: No such file or directory`)
        if (n.kind === 'dir') return fail(`cat: ${p}: Is a directory`)
        out.push(<div key={p}>{n.read()}</div>)
      }
      return { out: <div className="space-y-2">{out}</div> }
    }

    case 'curl':
      if (flags.includes('-O') && /^\/?cv\.md$/.test(pos[0] ?? '')) return curlDownload()
      if (pos[0] === 'cv') return { out: <CvText /> }
      if (!pos[0]) return fail("curl: try 'curl cv' or 'curl -O /cv.md'")
      return fail(`curl: (6) Could not resolve host: ${pos[0]}`)

    case 'ls': {
      const target = pos[0] ?? '.'
      const n = nodeAt(resolve(sh.cwd, target))
      if (!n) return fail(`ls: cannot access '${target}': No such file or directory`)
      if (n.kind === 'file') return { out: <Columns items={[target]} /> }
      return { out: <Columns items={entries(n)} /> }
    }

    case 'cd': {
      const target = pos[0] ?? '~'
      const path = target === '-' ? sh.prev : resolve(sh.cwd, target)
      const n = nodeAt(path)
      if (!n) return fail(`cd: The directory '${target}' does not exist`)
      if (n.kind !== 'dir') return fail(`cd: '${target}' is not a directory`)
      sh.cd(path)
      return { out: null }
    }

    case 'tree': {
      const target = pos[0] ?? '.'
      const path = resolve(sh.cwd, target)
      const n = nodeAt(path)
      if (!n) return fail(`tree: '${target}': No such file or directory`)
      if (n.kind !== 'dir') return { out: target }
      return { out: <Tree node={n} label={displayPath(path)} /> }
    }

    case 'open': {
      const id = pos[0] as AppId | undefined
      if (!id || !APP_ORDER.includes(id)) return fail(`usage: open <${APP_ORDER.join('|')}>`)
      useWM.getState().open(id)
      moveFocus()
      return { out: <span className="text-subtext">opening {APPS[id].title}…</span> }
    }

    case 'theme': {
      const s = useSettings.getState()
      if (!pos[0])
        return {
          out: (
            <div>
              {themes.map((t) => (
                <div key={t.id} className={t.id === s.theme ? 'text-green' : 'text-text'}>
                  {t.id === s.theme ? '* ' : '  '}
                  {t.id.padEnd(12)}
                  <span className="text-overlay">{t.label}</span>
                </div>
              ))}
            </div>
          ),
        }
      const t = themes.find((x) => x.id === pos[0])
      if (!t) return fail(`theme: unknown theme '${pos[0]}'`)
      s.setTheme(t.id as ThemeId)
      return { out: <span className="text-subtext">theme → {t.label}</span> }
    }
    case 'font': {
      const s = useSettings.getState()
      if (!pos[0])
        return {
          out: (
            <div>
              {fonts.map((f) => (
                <div key={f.id} className={f.id === s.font ? 'text-green' : 'text-text'}>
                  {f.id === s.font ? '* ' : '  '}
                  {f.id.padEnd(12)}
                  <span className="text-overlay">{f.label}</span>
                </div>
              ))}
            </div>
          ),
        }
      const f = fonts.find((x) => x.id === pos[0])
      if (!f) return fail(`font: unknown font '${pos[0]}'`)
      s.setFont(f.id)
      return { out: <span className="text-subtext">font → {f.label}</span> }
    }

    case 'sound': {
      const s = useSettings.getState()
      const want = pos[0] === 'on' ? true : pos[0] === 'off' ? false : pos[0] ? null : !s.sound
      if (want === null) return fail('usage: sound [on|off]')
      if (want !== s.sound) s.toggleSound()
      return { out: <span className="text-subtext">sound: {want ? 'on' : 'off'}</span> }
    }

    case 'history':
      return {
        out: (
          <div className="whitespace-pre">
            {history.map((h, i) => (
              <div key={i}>
                <span className="text-overlay">{String(i + 1).padStart(4)}  </span>
                <span className="text-text">{h}</span>
              </div>
            ))}
          </div>
        ),
      }

    case 'date':
      return { out: new Date().toString() }
    case 'uname':
      if (flags.includes('-a')) return { out: `Linux ${profile.host} 6.17.2-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux` }
      if (flags.includes('-r')) return { out: '6.17.2-arch1-1' }
      return { out: 'Linux' }
    case 'echo':
      return { out: args.join(' ') }
    case 'pwd':
      return { out: `/${sh.cwd.join('/')}` }

    case 'exit':
      beep('close')
      useWM.getState().close('terminal')
      moveFocus('terminal')
      return null

    case 'sudo':
      return fail(`${profile.user} is not in the sudoers file. This incident will be reported.`)

    case 'rm':
      if (flags.some((f) => /r/.test(f)) && pos.some((p) => p === '/' || p === '/*'))
        return {
          out: (
            <div>
              <div className="text-red">rm: it is dangerous to operate recursively on '/'</div>
              <div className="text-subtext">Bel tentativo. Questo homelab ha i backup, e anche i backup dei backup.</div>
            </div>
          ),
          err: true,
        }
      return fail(`rm: cannot remove '${pos[0] ?? ''}': Read-only file system`)

    default:
      return fail(`fish: Unknown command: ${cmd}`)
  }
}

const PATH_COMMANDS = ['cd', 'ls', 'cat', 'tree']

/** Completamento di un percorso: restituisce i candidati come percorso completo da inserire. */
function completePath(cwd: string[], word: string, dirsOnly: boolean): string[] {
  const cut = word.lastIndexOf('/') + 1
  const dirPart = word.slice(0, cut)
  const base = word.slice(cut)
  const n = nodeAt(resolve(cwd, dirPart || '.'))
  if (!n || n.kind !== 'dir') return []
  return entries(n)
    .filter((e) => e.startsWith(base) && (!dirsOnly || e.endsWith('/')))
    .map((e) => dirPart + e)
}

/** Completamento Tab: comandi, argomenti di open/theme/font/... e percorsi per cd/ls/cat/tree. */
function complete(value: string, cwd: string[]): { value: string; candidates: string[] } {
  const parts = value.trimStart().split(/\s+/)
  const word = parts[parts.length - 1]
  const cmd = parts[0]
  const isPath = parts.length > 1 && PATH_COMMANDS.includes(cmd)
  const matches = isPath
    ? completePath(cwd, word, cmd === 'cd')
    : (parts.length === 1 ? COMMANDS : parts.length === 2 ? (ARGS[cmd] ?? []) : []).filter((p) => p.startsWith(word))
  if (matches.length === 0) return { value, candidates: [] }
  const head = value.slice(0, value.length - word.length)
  // Una directory completata non prende lo spazio: si può continuare a scendere.
  if (matches.length === 1) return { value: `${head}${matches[0]}${matches[0].endsWith('/') ? '' : ' '}`, candidates: [] }
  let common = matches[0]
  for (const m of matches) while (!m.startsWith(common)) common = common.slice(0, -1)
  if (common.length > word.length) return { value: head + common, candidates: [] }
  return { value, candidates: isPath ? matches.map((m) => m.slice(m.lastIndexOf('/', m.length - 2) + 1)) : matches }
}

/* ---------- UI ---------- */

const EntryView = memo(function EntryView({ entry }: { entry: Entry }) {
  return (
    <div>
      <div className="flex">
        <PS1 cwd={entry.cwd} />
        <span className="min-w-0 whitespace-pre-wrap break-all text-text">{entry.command}</span>
      </div>
      {entry.output != null && <div className="mb-1 whitespace-pre-wrap break-words text-text">{entry.output}</div>}
    </div>
  )
})

interface PromptProps {
  cwd: string[]
  inputRef: RefObject<HTMLInputElement | null>
  history: RefObject<string[]>
  onSubmit(line: string): void
  onInterrupt(line: string): void
  onClear(): void
  onCandidates(line: string, candidates: string[]): void
}

/** Tasto touch (mobile): non ruba il focus all'input, così la tastiera resta aperta. */
function TouchKey({ label, name, onPress, input }: { label: string; name: string; onPress(): void; input: RefObject<HTMLInputElement | null> }) {
  return (
    <button
      type="button"
      aria-label={name}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        onPress()
        input.current?.focus({ preventScroll: true })
      }}
      className="min-h-8 min-w-11 rounded border border-surface1 bg-mantle px-2.5 text-sm text-subtext active:bg-surface0"
    >
      {label}
    </button>
  )
}

// Stato dell'input isolato qui: digitare non ri-renderizza l'output.
const Prompt = memo(function Prompt({ cwd, inputRef, history, onSubmit, onInterrupt, onClear, onCandidates }: PromptProps) {
  const [value, setValue] = useState('')
  const idx = useRef(-1)
  const draft = useRef('')
  const isMobile = useIsMobile()

  // Su mobile niente autofocus: aprirebbe la tastiera virtuale all'avvio.
  useEffect(() => {
    if (!isMobile) inputRef.current?.focus()
  }, [inputRef, isMobile])

  const historyUp = () => {
    const h = history.current
    if (!h.length) return
    if (idx.current === -1) {
      draft.current = value
      idx.current = h.length
    }
    idx.current = Math.max(0, idx.current - 1)
    setValue(h[idx.current])
  }

  const tabComplete = () => {
    const r = complete(value, cwd)
    if (r.candidates.length) onCandidates(value, r.candidates)
    else setValue(r.value)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const h = history.current
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit(value)
      setValue('')
      idx.current = -1
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      historyUp()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (idx.current === -1) return
      idx.current += 1
      if (idx.current >= h.length) {
        idx.current = -1
        setValue(draft.current)
      } else setValue(h[idx.current])
    } else if (e.key === 'Tab') {
      // Tab completa solo con testo e senza Shift: altrimenti il focus esce (niente trappola).
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || !value.trim()) return
      e.preventDefault()
      tabComplete()
    } else if (e.key === 'Escape') {
      e.currentTarget.blur()
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      onClear()
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      const el = e.currentTarget
      // lascia funzionare la copia se c'è testo selezionato
      if (el.selectionStart !== el.selectionEnd || window.getSelection()?.toString()) return
      e.preventDefault()
      onInterrupt(value)
      setValue('')
      idx.current = -1
    }
  }

  return (
    <>
      <div className="flex">
        <PS1 cwd={cwd} />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          name="command"
          aria-label="Terminale: digita un comando"
          enterKeyHint="go"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          // 16px su mobile: sotto iOS fa zoom al focus
          className={`min-w-0 flex-1 bg-transparent text-text caret-accent outline-none ${isMobile ? 'text-[16px]' : ''}`}
        />
      </div>
      {isMobile && (
        <div className="mt-2 flex gap-2" onMouseUp={(e) => e.stopPropagation()}>
          <TouchKey label="Tab" name="Completa il comando (Tab)" onPress={() => value.trim() && tabComplete()} input={inputRef} />
          <TouchKey label="↑" name="Comando precedente" onPress={() => historyUp()} input={inputRef} />
        </div>
      )}
    </>
  )
})

export default function TerminalApp() {
  const [log, setLog] = useState<Entry[]>([])
  const [cwd, setCwd] = useState<string[]>(HOME)
  // Ref per l'interprete: i callback restano stabili e l'input non si ri-renderizza a ogni comando.
  const cwdRef = useRef<string[]>(HOME)
  const prevRef = useRef<string[]>(HOME)
  const history = useRef<string[]>([])
  const nextId = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const push = useCallback((command: string, output: ReactNode, at: string[] = cwdRef.current) => {
    const entry = { id: nextId.current++, cwd: at, command, output }
    setLog((prev) => [...prev.slice(-(MAX_ENTRIES - 1)), entry])
  }, [])

  const execute = useCallback(
    (raw: string) => {
      const line = raw.trim()
      if (!line) return push('', null)
      const h = history.current
      if (h[h.length - 1] !== line) h.push(line)
      if (line.split(/\s+/)[0] === 'clear') {
        beep('click')
        return setLog([])
      }
      const at = cwdRef.current
      const res = run(line, h, {
        cwd: at,
        prev: prevRef.current,
        cd: (path) => {
          prevRef.current = cwdRef.current
          cwdRef.current = path
          setCwd(path)
        },
      })
      if (!res) return
      beep(res.err ? 'error' : 'click')
      push(raw, res.out, at)
    },
    [push],
  )

  const onInterrupt = useCallback((line: string) => push(`${line}^C`, null), [push])
  const onClear = useCallback(() => setLog([]), [])
  const onCandidates = useCallback(
    (line: string, c: string[]) => push(line, <Columns items={c} />),
    [push],
  )

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])

  const refocus = () => {
    if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true })
  }

  return (
    <div ref={scrollRef} onMouseUp={refocus} className="@container h-full cursor-text overflow-y-auto bg-base p-3 text-sm leading-relaxed">
      {log.length === 0 && (
        <p className="text-overlay">
          Digita <span className="text-accent">help</span> per l’elenco dei comandi.
        </p>
      )}
      <div aria-live="polite" role="log">
        {log.map((e) => (
          <EntryView key={e.id} entry={e} />
        ))}
      </div>
      <Prompt cwd={cwd} inputRef={inputRef} history={history} onSubmit={execute} onInterrupt={onInterrupt} onClear={onClear} onCandidates={onCandidates} />
    </div>
  )
}
