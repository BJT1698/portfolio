import { useSyncExternalStore } from 'react'

// Schermo intero su mobile: nasconde la barra del browser (Chrome Android, Firefox Android).
// Safari su iPhone non lo supporta per le pagine: lì serve "Aggiungi a schermata Home" (manifest PWA).

export const canFullscreen = () => typeof document !== 'undefined' && document.fullscreenEnabled === true

/** Avviato come app installata: il browser è già nascosto. */
export const isStandalone = () => window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches

export function enterFullscreen() {
  if (!canFullscreen() || document.fullscreenElement) return
  // Va chiamato dentro un gesto dell'utente (tocco/click), altrimenti il browser rifiuta.
  void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
}

export function exitFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
}

export function useIsFullscreen() {
  return useSyncExternalStore(
    (cb) => {
      document.addEventListener('fullscreenchange', cb)
      return () => document.removeEventListener('fullscreenchange', cb)
    },
    () => !!document.fullscreenElement,
    () => false,
  )
}
