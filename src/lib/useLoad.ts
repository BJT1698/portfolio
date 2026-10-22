import { useEffect, useState } from 'react'

export type Load<T> = { status: 'loading' } | { status: 'ok'; data: T } | { status: 'error' }

/** Carica `load(key)` e ricarica quando cambia `key`. `load` deve essere una funzione stabile (di modulo). */
export function useLoad<T>(key: string, load: (key: string) => Promise<T>): Load<T> {
  // Il risultato è legato alla chiave: se la chiave cambia, finché non arriva il nuovo dato vale "loading".
  const [state, setState] = useState<{ key: string; result: Load<T> } | null>(null)
  useEffect(() => {
    let alive = true
    load(key).then(
      (data) => alive && setState({ key, result: { status: 'ok', data } }),
      () => alive && setState({ key, result: { status: 'error' } }),
    )
    return () => {
      alive = false
    }
  }, [key, load])
  return state?.key === key ? state.result : { status: 'loading' }
}
