import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { profile } from '../config/profile'
import { useIntro } from '../lib/useIntro'

// Animazione d'avvio: kernel → systemd → login su tty1 → sessione Wayland → desktop.
// Durata totale ~6.5s, qualsiasi tasto o click la salta (useIntro).

const KERNEL = '6.17.2-arch1-1'
const FADE_MS = 450

const OK = 'ok'
const DO = 'do'
type Status = typeof OK | typeof DO

const KERNEL_LOG = [
  `Linux version ${KERNEL} (linux@archlinux) (gcc (GCC) 15.2.1) #1 SMP PREEMPT_DYNAMIC`,
  `Command line: BOOT_IMAGE=/vmlinuz-linux root=UUID=7c1e…a4f2 rw quiet splash`,
  'x86/fpu: Supporting XSAVE feature 0x001: x87 floating point registers',
  'BIOS-provided physical RAM map:',
  'ACPI: RSDP 0x00000000000F05B0 000024 (v02 ALASKA)',
  'smpboot: CPU0: AMD Ryzen 7 (family: 0x19, model: 0x61)',
  'nvme nvme0: 16/0/0 default/read/poll queues',
  'Run /init as init process',
]

const SYSTEMD_LOG: [Status, string][] = [
  [OK, 'Created slice Slice /system/getty.'],
  [OK, 'Created slice User and Session Slice.'],
  [OK, 'Started Dispatch Password Requests to Console Directory Watch.'],
  [OK, 'Reached target Local Encrypted Volumes.'],
  [OK, 'Reached target Path Units.'],
  [OK, 'Listening on Journal Socket.'],
  [OK, 'Listening on udev Control Socket.'],
  [DO, 'Mounting Huge Pages File System...'],
  [DO, 'Starting Journal Service...'],
  [OK, 'Mounted Huge Pages File System.'],
  [OK, 'Started Journal Service.'],
  [OK, 'Started Rule-based Manager for Device Events and Files.'],
  [OK, 'Found device /dev/nvme0n1p2.'],
  [OK, 'Reached target Local File Systems.'],
  [DO, 'Starting Network Configuration...'],
  [OK, 'Started Network Configuration.'],
  [OK, 'Reached target Network.'],
  [OK, 'Started WireGuard via wg-quick(8) for wg0.'],
  [OK, 'Started OpenSSH Daemon.'],
  [OK, 'Started Docker Application Container Engine.'],
  [OK, 'Started User Login Management.'],
  [OK, 'Reached target Multi-User System.'],
  [OK, 'Started Getty on tty1.'],
  [OK, 'Reached target Login Prompts.'],
  [OK, 'Reached target Graphical Interface.'],
]

const SESSION_LOG = [
  'uwsm: starting wayland session "portfolio"',
  'compositor: listening on WAYLAND_DISPLAY=wayland-1',
  'xdg-desktop-portal: ready',
]

function lastLogin() {
  const d = new Date(Date.now() - 86_400_000 + 3_600_000 * 3)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' })
  const mon = d.toLocaleDateString('en-US', { month: 'short' })
  return `Last login: ${day} ${mon} ${String(d.getDate()).padStart(2, ' ')} ${d.toTimeString().slice(0, 8)} ${d.getFullYear()} on tty1`
}

const ts = (t: number) => `[${t.toFixed(6).padStart(12, ' ')}]`

const StatusTag = ({ s }: { s: Status }) =>
  s === OK ? (
    <span>
      [<span className="text-[#5fd75f]">{'  OK  '}</span>]{' '}
    </span>
  ) : (
    <span>{'         '}</span>
  )

const PROMPT = (
  <>
    <span className="text-[#5fd75f]">{profile.user}</span>@{profile.host} <span className="text-[#5f87ff]">~</span>
    {'> '}
  </>
)

interface Line {
  id: number
  node: ReactNode
  /** Testo digitato in coda alla riga (login, comando). */
  typed?: string
}

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<Line[]>([])
  const [cursor, setCursor] = useState(true)
  const nextId = useRef(0)
  const screenRef = useRef<HTMLDivElement>(null)

  const { fading, finish } = useIntro(onDone, FADE_MS)

  useEffect(() => {
    const ac = new AbortController()
    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, ms)
        ac.signal.addEventListener(
          'abort',
          () => {
            clearTimeout(t)
            reject(ac.signal.reason)
          },
          { once: true },
        )
      })
    const print = (node: ReactNode) => setLines((l) => [...l, { id: nextId.current++, node }])
    const type = async (text: string, cps: number) => {
      for (let i = 1; i <= text.length; i++) {
        setLines((l) => [...l.slice(0, -1), { ...l[l.length - 1], typed: text.slice(0, i) }])
        await sleep(cps)
      }
    }

    ;(async () => {
      await sleep(150)
      let t = 0
      for (const msg of KERNEL_LOG) {
        t += 0.04 + Math.random() * 0.25
        print(
          <>
            <span className="text-[#808080]">{ts(t)}</span> {msg}
          </>,
        )
        await sleep(40)
      }
      await sleep(120)
      print(<></>)
      print(
        <>
          Welcome to <span className="text-[#5fd7ff]">Arch Linux</span>!
        </>,
      )
      print(<></>)
      for (const [s, msg] of SYSTEMD_LOG) {
        print(
          <>
            <StatusTag s={s} />
            {msg}
          </>,
        )
        await sleep(s === DO ? 90 : 38 + Math.random() * 24)
      }

      // tty1: login
      await sleep(250)
      setLines([])
      await sleep(200)
      print(<></>)
      print(`Arch Linux ${KERNEL} (tty1)`)
      print(<></>)
      print(`${profile.host} login: `)
      await sleep(350)
      await type(profile.user, 75)
      await sleep(180)
      print('Password: ')
      await sleep(400)
      print(lastLogin())
      print(<></>)
      print(PROMPT)
      await sleep(300)
      await type('exec uwsm start portfolio.desktop', 24)
      await sleep(220)

      // sessione Wayland
      setCursor(false)
      for (const msg of SESSION_LOG) {
        print(<span className="text-[#808080]">{msg}</span>)
        await sleep(160)
      }
      await sleep(150)
      finish()
    })().catch(() => {})

    return () => ac.abort()
  }, [finish])

  // Console che scorre: le righe partono dall'alto e l'ultima resta sempre visibile.
  useLayoutEffect(() => {
    const el = screenRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[1000000] bg-black font-mono text-[11px] leading-snug text-[#c6c6c6] transition-opacity ease-out select-none sm:text-[13px] ${fading ? 'pointer-events-none opacity-0' : ''}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div ref={screenRef} className="h-full overflow-hidden p-3 sm:p-5">
        {lines.map((l, i) => (
          <div key={l.id} className="min-h-[1lh] break-all whitespace-pre-wrap">
            {l.node}
            {l.typed}
            {cursor && i === lines.length - 1 && <span className="animate-blink">█</span>}
          </div>
        ))}
      </div>
      <p className="absolute right-3 bottom-2 text-[10px] text-[#8a8a8a]">premi un tasto per saltare</p>
    </div>
  )
}
