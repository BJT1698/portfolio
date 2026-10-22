import { useEffect, useState } from 'react'
import { useIntro } from '../lib/useIntro'
import { profile } from '../config/profile'

// Avvio su smartphone, stile Android: splash con la foto profilo, poi animazione di boot a puntini
// nel colore d'accento del tema scelto.
// Durata ~4.5s, un tocco la salta.

const FADE_MS = 400
// Stesso colore d'accento, intensità decrescente: i puntini seguono il tema attivo.
const DOTS = ['opacity-100', 'opacity-75', 'opacity-55', 'opacity-35']

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
        <img src={profile.avatar} alt="" width={96} height={96} className="size-24 animate-fade-in rounded-md border border-white/20 object-cover" />
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 ease-out ${
          phase === 'anim' ? 'opacity-100' : 'opacity-0'
        } ${phase === 'out' ? 'scale-110' : ''}`}
      >
        <div className="flex gap-3">
          {DOTS.map((c, i) => (
            <span key={c} className={`size-3.5 rounded-full bg-accent ${c} animate-droid`} style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-5 text-center text-[10px] text-white/60">tocca per saltare</p>
    </div>
  )
}
