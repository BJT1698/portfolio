import { useEffect, useState } from 'react'
import { Keyboard, Volume2, VolumeX } from 'lucide-react'
import { useWM } from '../store/windows'
import { useSettings } from '../store/settings'
import { APPS } from '../apps/registry'
import { profile } from '../config/profile'
import { beep } from '../lib/sound'
import { STAGE, useSession } from '../store/session'

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

const Pill = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex h-6 items-center gap-1.5 rounded-sm bg-base px-2 ${className}`}>{children}</span>
)

export function StatusBar() {
  const visible = useSession((s) => s.stage >= STAGE.bars)
  return (
    <header
      className={`transition-[transform,opacity] duration-300 ease-out ${visible ? '' : '-translate-y-full opacity-0'} relative z-[100001] flex h-8 shrink-0 items-center gap-2 border-b border-surface0 bg-mantle px-1.5 text-xs select-none`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Pill className="text-accent">
          <span className="text-green">{profile.user}</span>
          <span className="text-overlay">@</span>
          <span className="text-blue">{profile.host}</span>
          <span className="text-overlay">:~</span>
        </Pill>
      </div>
      <FocusedTitle />
      <div className="flex flex-1 items-center justify-end gap-1.5">
        <KbLayout />
        <SoundToggle />
        <Clock />
      </div>
    </header>
  )
}

function FocusedTitle() {
  const focused = useWM((s) => s.focused)
  return (
    <div className="hidden max-w-[34%] truncate text-center text-subtext md:block" aria-live="polite">
      {focused ? (
        <>
          <span className="text-accent" aria-hidden>
            ❯
          </span>{' '}
          {APPS[focused].title}
        </>
      ) : (
        <span className="text-overlay">
          <span aria-hidden>— </span>desktop<span aria-hidden> —</span>
        </span>
      )}
    </div>
  )
}

function KbLayout() {
  const kb = useSettings((s) => s.kbLayout)
  return (
    <button
      type="button"
      title="Layout tastiera"
      aria-label={`Layout tastiera: ${kb}`}
      onClick={() => useSettings.getState().toggleKbLayout()}
      className="hidden sm:flex"
    >
      <Pill className="hover:bg-surface0">
        <Keyboard size={12} className="text-mauve" />
        {kb}
      </Pill>
    </button>
  )
}

function SoundToggle() {
  const sound = useSettings((s) => s.sound)
  return (
    <button
      type="button"
      aria-label="Suoni"
      aria-pressed={sound}
      title="Retro beep"
      className="flex"
      onClick={() => {
        useSettings.getState().toggleSound()
        beep('click')
      }}
    >
      <Pill className="hover:bg-surface0">{sound ? <Volume2 size={13} className="text-green" /> : <VolumeX size={13} className="text-overlay" />}</Pill>
    </button>
  )
}

function Clock() {
  const now = useNow(1000)
  const d = new Date(now)
  return (
    <Pill className="tabular-nums">
      <span className="hidden text-subtext sm:inline">{d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
      <span className="text-accent">{d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </Pill>
  )
}
