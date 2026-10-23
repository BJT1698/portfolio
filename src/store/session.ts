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
  /** Configurazione iniziale stile Android/iOS aperta (solo mobile). */
  setupOpen: boolean
  /** La guida sta uscendo con l'animazione: intanto la home comincia a comparire. */
  setupLeaving: boolean
  setStage(stage: number): void
  openSetup(): void
  leaveSetup(): void
  closeSetup(): void
}

export const useSession = create<Session>()((set) => ({
  stage: STAGE.boot,
  setupOpen: false,
  setupLeaving: false,
  setStage: (stage) => set({ stage }),
  openSetup: () => set({ setupOpen: true, setupLeaving: false }),
  leaveSetup: () => set({ setupLeaving: true }),
  closeSetup: () => set({ setupOpen: false, setupLeaving: false }),
}))
