import { memo, Suspense } from 'react'
import { Rnd } from 'react-rnd'
import { Minus, Square, Copy, X } from 'lucide-react'
import { APPS } from '../apps/registry'
import { moveFocus, useWM, type WindowState } from '../store/windows'
import { profile } from '../config/profile'
import { beep } from '../lib/sound'

const wm = () => useWM.getState()

export const Window = memo(function Window({ win, focused }: { win: WindowState; focused: boolean }) {
  const app = APPS[win.id]
  const Body = app.component
  const Icon = app.icon

  return (
    <Rnd
      size={win.maximized ? { width: '100%', height: '100%' } : { width: win.w, height: win.h }}
      position={win.maximized ? { x: 0, y: 0 } : { x: win.x, y: win.y }}
      minWidth={app.minSize.w}
      minHeight={app.minSize.h}
      bounds="parent"
      dragHandleClassName="win-drag"
      cancel=".win-ctrl"
      disableDragging={win.maximized}
      enableResizing={!win.maximized}
      onDragStop={(_, d) => wm().setRect(win.id, { x: d.x, y: d.y })}
      onResizeStop={(_, __, el, ___, pos) => wm().setRect(win.id, { w: el.offsetWidth, h: el.offsetHeight, ...pos })}
      style={{ zIndex: win.z, pointerEvents: win.minimized ? 'none' : undefined }}
    >
      {/* inert: la finestra minimizzata esce da Tab e albero di accessibilità. */}
      <section
        role="dialog"
        aria-label={app.label}
        data-window-id={win.id}
        tabIndex={-1}
        inert={win.minimized}
        onPointerDownCapture={() => wm().focus(win.id)}
        onFocusCapture={() => wm().focus(win.id)}
        className={[
          'flex h-full outline-none flex-col overflow-hidden rounded-md border bg-base shadow-2xl shadow-black/50 animate-win-in',
          'transition-[opacity,transform,border-color] duration-150 ease-out',
          focused ? 'border-accent' : 'border-surface1',
          win.minimized ? 'translate-y-6 scale-95 opacity-0' : '',
        ].join(' ')}
      >
        <header
          className={`win-drag flex h-8 shrink-0 cursor-default items-center gap-2 border-b px-2 select-none ${focused ? 'border-surface1 bg-mantle' : 'border-surface0 bg-crust'}`}
          onDoubleClick={() => wm().toggleMaximize(win.id)}
        >
          <Icon size={14} className={focused ? 'text-accent' : 'text-overlay'} />
          <span className={`truncate text-xs ${focused ? 'text-text' : 'text-overlay'}`}>
            {app.title}
            <span className="text-overlay"> — {profile.user}@{profile.host}</span>
          </span>
          <div className="win-ctrl ml-auto flex items-center gap-1">
            <CtrlButton
              label="Minimizza"
              onClick={() => {
                wm().minimize(win.id)
                moveFocus(win.id)
              }}
              hover="hover:text-yellow"
            >
              <Minus size={13} />
            </CtrlButton>
            <CtrlButton label={win.maximized ? 'Ripristina' : 'Massimizza'} onClick={() => wm().toggleMaximize(win.id)} hover="hover:text-green">
              {win.maximized ? <Copy size={11} /> : <Square size={11} />}
            </CtrlButton>
            <CtrlButton
              label="Chiudi"
              onClick={() => {
                beep('close')
                wm().close(win.id)
                moveFocus(win.id)
              }}
              hover="hover:text-red"
            >
              <X size={14} />
            </CtrlButton>
          </div>
        </header>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <Suspense fallback={<p role="status" className="p-4 text-overlay">loading {app.title}…</p>}>
            <Body />
          </Suspense>
        </div>
      </section>
    </Rnd>
  )
})

function CtrlButton({ label, hover, onClick, children }: { label: string; hover: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => {
        beep('click')
        onClick()
      }}
      className={`grid size-6 place-items-center rounded-sm text-overlay transition-colors hover:bg-surface0 ${hover}`}
    >
      {children}
    </button>
  )
}
