import { moveFocus, useWM } from '../store/windows'
import { APPS, APP_ORDER } from '../apps/registry'
import { beep } from '../lib/sound'
import { STAGE, useSession } from '../store/session'

export function Dock() {
  const windows = useWM((s) => s.windows)
  const focused = useWM((s) => s.focused)
  const visible = useSession((s) => s.stage >= STAGE.bars)

  return (
    <nav aria-label="Dock" className="pointer-events-none fixed inset-x-0 bottom-3 z-[100000] flex justify-center">
      <ul
        className={`transition-[transform,opacity] delay-100 duration-300 ease-out ${visible ? '' : 'translate-y-24 opacity-0'} pointer-events-auto flex items-end gap-1.5 rounded-lg border border-surface1 bg-mantle/85 px-2 py-1.5 shadow-xl shadow-black/40 backdrop-blur-md`}
      >
        {APP_ORDER.map((id, i) => {
          const { icon: Icon, label } = APPS[id]
          const win = windows[id]
          const active = focused === id && win && !win.minimized
          return (
            <li key={id} className="group relative">
              <button
                type="button"
                aria-label={label}
                aria-current={active ? 'true' : undefined}
                aria-keyshortcuts={`Alt+${i + 1}`}
                data-dock-id={id}
                onClick={() => {
                  beep(win ? 'click' : 'open')
                  useWM.getState().activate(id)
                  // Aperta o portata in primo piano: il focus entra nella finestra; minimizzata: resta sul dock.
                  if (useWM.getState().focused === id) moveFocus()
                }}
                className={`grid size-11 origin-bottom place-items-center rounded-md border transition-[transform,background-color,border-color] duration-150 ease-out hover:-translate-y-1 hover:scale-110 ${
                  active ? 'border-accent bg-surface0 text-accent' : 'border-transparent text-subtext hover:border-surface1 hover:bg-surface0 hover:text-text'
                }`}
              >
                <Icon size={22} strokeWidth={1.6} />
              </button>
              {/* indicatore finestra aperta */}
              <span
                className={`absolute -bottom-1 left-1/2 h-0.5 -translate-x-1/2 rounded-full transition-[width,background-color] ${win ? (active ? 'w-4 bg-accent' : 'w-1.5 bg-overlay') : 'w-0'}`}
              />
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-sm border border-surface1 bg-crust px-2 py-0.5 text-[11px] whitespace-nowrap text-text opacity-0 transition-opacity group-has-focus-visible:opacity-100 group-hover:opacity-100">
                {label} <span className="text-overlay">alt+{i + 1}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
