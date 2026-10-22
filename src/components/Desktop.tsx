import { useEffect, useRef } from 'react'
import { moveFocus, useWM } from '../store/windows'
import { useSettings } from '../store/settings'
import { APPS, APP_ORDER, type AppId } from '../apps/registry'
import { Window } from './Window'
import { STAGE, useSession } from '../store/session'
import { beep } from '../lib/sound'

/** Area di lavoro: wallpaper, icone desktop e finestre flottanti. Il dock sta sotto, fuori dai bounds. */
export function Desktop() {
  const windows = useWM((s) => s.windows)
  const focused = useWM((s) => s.focused)
  const wallpaper = useSettings((s) => s.wallpaper)
  const showWallpaper = useSession((s) => s.stage >= STAGE.wallpaper)
  const areaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => useWM.getState().setArea(e.contentRect.width, e.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <main className="relative min-h-0 flex-1">
      <div className={`absolute inset-0 wallpaper-${wallpaper} transition-opacity duration-700 ease-out ${showWallpaper ? 'opacity-100' : 'opacity-0'}`} />
      <div ref={areaRef} className="absolute inset-x-0 top-0 bottom-20">
        <DesktopIcons />
        {Object.values(windows).map((w) => w && <Window key={w.id} win={w} focused={focused === w.id} />)}
      </div>
    </main>
  )
}

function DesktopIcons() {
  const visible = useSession((s) => s.stage >= STAGE.icons)
  // Doppio click con il mouse, singolo tap su touch/penna, Invio o Spazio da tastiera.
  const launch = (id: AppId) => {
    beep('open')
    useWM.getState().open(id)
    moveFocus()
  }
  // Punto di contatto: se il dito si è spostato (scroll) il tap non apre l'app.
  const down = useRef({ x: 0, y: 0 })
  return (
    <nav aria-label="Icone desktop" className="absolute top-4 bottom-4 left-4 flex flex-col flex-wrap content-start gap-2">
      {APP_ORDER.map((id, i) => {
        const { icon: Icon, label, title } = APPS[id]
        return (
          <button
            key={id}
            type="button"
            onClick={(e) => e.detail === 0 && launch(id)}
            onDoubleClick={() => launch(id)}
            onPointerDown={(e) => (down.current = { x: e.clientX, y: e.clientY })}
            onPointerUp={(e) => {
              if (e.pointerType === 'mouse') return
              if (Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) <= 10) launch(id)
            }}
            title={`${label} (doppio click)`}
            style={{ transitionDelay: visible ? `${i * 80}ms` : '0ms' }}
            className={`transition-[opacity,transform] duration-300 ease-out ${visible ? '' : 'pointer-events-none -translate-x-4 opacity-0'} group flex w-24 flex-col items-center gap-1 rounded-md p-2 text-center outline-none focus-visible:bg-surface0/60 hover:bg-surface0/40`}
          >
            <span className="grid size-11 place-items-center rounded-md border border-surface1 bg-mantle/80 text-subtext transition-colors group-hover:border-accent group-hover:text-accent group-focus-visible:border-accent">
              <Icon size={22} strokeWidth={1.6} />
            </span>
            <span className="w-full truncate text-[11px] text-subtext group-hover:text-text">{title}</span>
          </button>
        )
      })}
    </nav>
  )
}
