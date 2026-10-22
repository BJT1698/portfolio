import { useSettings } from '../store/settings'

let ctx: AudioContext | null = null

const TONES = {
  click: { freq: 1800, dur: 0.018, type: 'square' },
  open: { freq: 660, dur: 0.05, type: 'square' },
  close: { freq: 330, dur: 0.05, type: 'square' },
  error: { freq: 140, dur: 0.12, type: 'sawtooth' },
} as const satisfies Record<string, { freq: number; dur: number; type: OscillatorType }>

/** Beep retrò via WebAudio. No-op se il suono è disattivato nelle impostazioni. */
export function beep(kind: keyof typeof TONES = 'click') {
  if (!useSettings.getState().sound) return
  try {
    ctx ??= new AudioContext()
    const { freq, dur, type } = TONES[kind]
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur)
  } catch {
    // AudioContext non disponibile: silenzio.
  }
}
