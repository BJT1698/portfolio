import { create } from 'zustand'

/** Fasi di avvio della sessione grafica dopo il boot: ogni componente compare quando la sua fase è raggiunta. */
export const STAGE = {
  boot: 0,
  wallpaper: 1,
  bars: 2,
  icons: 3,
  windows: 4,
  ready: 5,
} as const

interface Session {
  stage: number
  setStage(stage: number): void
}

export const useSession = create<Session>()((set) => ({
  stage: STAGE.boot,
  setStage: (stage) => set({ stage }),
}))
