import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Logica comune alle animazioni d'avvio: `finish()` avvia la dissolvenza e poi chiama onDone,
 * qualsiasi tasto o tocco la salta. onDone sta in un ref così un re-render del genitore non riavvia l'animazione.
 */
export function useIntro(onDone: () => void, fadeMs: number) {
  const [fading, setFading] = useState(false)
  const finished = useRef(false)
  const onDoneRef = useRef(onDone)
  useLayoutEffect(() => {
    onDoneRef.current = onDone
  })

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setFading(true)
    setTimeout(() => onDoneRef.current(), fadeMs)
  }, [fadeMs])

  useEffect(() => {
    window.addEventListener('keydown', finish)
    window.addEventListener('pointerdown', finish)
    return () => {
      window.removeEventListener('keydown', finish)
      window.removeEventListener('pointerdown', finish)
    }
  }, [finish])

  return { fading, finish }
}
