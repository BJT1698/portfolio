import { create } from 'zustand'
import { APPS, type AppId } from '../apps/registry'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface WindowState extends Rect {
  id: AppId
  z: number
  minimized: boolean
  maximized: boolean
}

interface WindowManager {
  windows: Partial<Record<AppId, WindowState>>
  focused: AppId | null
  zTop: number
  /** Dimensioni dell'area finestre, aggiornate dal Desktop (servono per posizionare le nuove finestre). */
  area: { w: number; h: number }

  setArea(w: number, h: number): void
  open(id: AppId): void
  close(id: AppId): void
  focus(id: AppId): void
  minimize(id: AppId): void
  toggleMaximize(id: AppId): void
  /** Chiude tutte le finestre (home su mobile). */
  closeAll(): void
  setRect(id: AppId, rect: Partial<Rect>): void
  /** Semantica click su dock/workspace: apre, porta in primo piano o minimizza se già in focus. */
  activate(id: AppId): void
}

/** Finestra visibile con z più alto, escludendo `skip`. */
function topVisible(windows: WindowManager['windows'], skip?: AppId): AppId | null {
  let best: WindowState | null = null
  for (const w of Object.values(windows)) {
    if (!w || w.minimized || w.id === skip) continue
    if (!best || w.z > best.z) best = w
  }
  return best?.id ?? null
}

function initialRect(id: AppId, area: { w: number; h: number }, openCount: number): Rect {
  const { size, anchor } = APPS[id]
  const w = Math.min(size.w, area.w - 16)
  const h = Math.min(size.h, area.h - 16)
  const offset = openCount * 24
  const x = Math.round(Math.max(8, Math.min(area.w - w - 8, (area.w - w) * anchor.x + offset)))
  const y = Math.round(Math.max(8, Math.min(area.h - h - 8, (area.h - h) * anchor.y + offset)))
  return { x, y, w, h }
}

export const useWM = create<WindowManager>()((set, get) => ({
  windows: {},
  focused: null,
  zTop: 10,
  area: { w: typeof window === 'undefined' ? 1280 : window.innerWidth, h: typeof window === 'undefined' ? 720 : window.innerHeight - 110 },

  setArea: (w, h) => set({ area: { w, h } }),

  open: (id) => {
    const { windows, zTop, area } = get()
    const existing = windows[id]
    const z = zTop + 1
    const next: WindowState = existing
      ? { ...existing, minimized: false, z }
      : { id, z, minimized: false, maximized: false, ...initialRect(id, area, Object.keys(windows).length) }
    set({ windows: { ...windows, [id]: next }, focused: id, zTop: z })
  },

  close: (id) => {
    const { windows, focused } = get()
    if (!windows[id]) return
    const rest = { ...windows }
    delete rest[id]
    set({ windows: rest, focused: focused === id ? topVisible(rest) : focused })
  },

  focus: (id) => {
    const { windows, zTop, focused } = get()
    const w = windows[id]
    if (!w || (focused === id && w.z === zTop)) return
    const z = zTop + 1
    set({ windows: { ...windows, [id]: { ...w, z, minimized: false } }, focused: id, zTop: z })
  },

  minimize: (id) => {
    const { windows, focused } = get()
    const w = windows[id]
    if (!w) return
    const next = { ...windows, [id]: { ...w, minimized: true } }
    set({ windows: next, focused: focused === id ? topVisible(next) : focused })
  },

  closeAll: () => set({ windows: {}, focused: null }),

  toggleMaximize: (id) => {
    const { windows } = get()
    const w = windows[id]
    if (!w) return
    set({ windows: { ...windows, [id]: { ...w, maximized: !w.maximized } } })
    get().focus(id)
  },

  setRect: (id, rect) => {
    const { windows } = get()
    const w = windows[id]
    if (!w) return
    set({ windows: { ...windows, [id]: { ...w, ...rect } } })
  },

  activate: (id) => {
    const { windows, focused } = get()
    const w = windows[id]
    if (w && focused === id && !w.minimized) get().minimize(id)
    else get().open(id)
  },
}))

/**
 * Dopo il render sposta il focus da tastiera sulla finestra in primo piano;
 * se non ce ne sono, sul pulsante dock di `fallback` (evita che il focus finisca su <body>).
 */
export function moveFocus(fallback?: AppId) {
  requestAnimationFrame(() => {
    const id = useWM.getState().focused
    const sel = id ? `[data-window-id="${id}"]` : fallback ? `[data-dock-id="${fallback}"]` : null
    if (sel) document.querySelector<HTMLElement>(sel)?.focus({ preventScroll: true })
  })
}
