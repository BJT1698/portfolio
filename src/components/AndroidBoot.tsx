import { useEffect, useState } from 'react'
import { useIntro } from '../lib/useIntro'

// Avvio su smartphone, stile Android: splash del "produttore", poi animazione di boot a puntini.
// Durata ~4.5s, un tocco la salta.

const FADE_MS = 400
const DOTS = ['bg-blue', 'bg-red', 'bg-yellow', 'bg-green']

export function AndroidBoot({ onDone }: { onDone: () => void }) {
  const { fading, finish } = useIntro(onDone, FADE_MS)
  const [phase, setPhase] = useState<'oem' | 'anim' | 'out'>('oem')

  useEffect(() => {
    const timers = [setTimeout(() => setPhase('anim'), 1500), setTimeout(() => setPhase('out'), 3700), setTimeout(finish, 4100)]
    return () => timers.forEach(clearTimeout)
  }, [finish])

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[1000000] bg-black text-white transition-opacity ease-out select-none ${fading ? 'pointer-events-none opacity-0' : ''}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${phase === 'oem' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid size-20 animate-fade-in place-items-center rounded-[22px] border-2 border-white/90 text-2xl font-bold tracking-tight">LV</div>
        <p className="absolute bottom-14 text-[10px] tracking-[0.3em] text-white/45 uppercase">powered by linux</p>
      </div>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-7 transition-[opacity,transform] duration-300 ease-out ${
          phase === 'anim' ? 'opacity-100' : 'opacity-0'
        } ${phase === 'out' ? 'scale-110' : ''}`}
      >
        <div className="flex gap-3">
          {DOTS.map((c, i) => (
            <span key={c} className={`size-3.5 rounded-full ${c} animate-droid`} style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
        <p className="text-sm tracking-[0.35em] text-white/85">
          lorenzo<span className="text-white/40">os</span>
        </p>
      </div>

      <p className="absolute inset-x-0 bottom-5 text-center text-[10px] text-white/60">tocca per saltare</p>
    </div>
  )
}
