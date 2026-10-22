import { useEffect, useState } from 'react'
import { StatusBar } from './components/StatusBar'
import { Desktop } from './components/Desktop'
import { Dock } from './components/Dock'
import { MobileShell } from './components/MobileShell'
import { BootSequence } from './components/BootSequence'
import { AndroidBoot } from './components/AndroidBoot'
import { useSettings } from './store/settings'
import { moveFocus, useWM } from './store/windows'
import { STAGE, useSession } from './store/session'
import { APP_ORDER } from './apps/registry'
import { useIsMobile } from './lib/useMediaQuery'
import { applyFont } from './lib/fonts'

export default function App() {
  const theme = useSettings((s) => s.theme)
  const font = useSettings((s) => s.font)
  const mobile = useIsMobile()
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [booting, setBooting] = useState(!reducedMotion)
  const stage = useSession((s) => s.stage)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    // La barra del browser mobile prende il colore della barra di stato del sito (mantle): un'unica fascia.
    const mantle = getComputedStyle(root).getPropertyValue('--mantle').trim()
    if (mantle) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mantle)
  }, [theme])

  useEffect(() => {
    void applyFont(font)
  }, [font])

  // Avvio a pezzi come un vero WM: sfondo → barra e dock → icone → finestre.
  useEffect(() => {
    if (booting) return
    const { setStage } = useSession.getState()
    if (reducedMotion) return setStage(STAGE.ready)
    const steps: [number, number][] = [
      [0, STAGE.wallpaper],
      [300, STAGE.bars],
      [650, STAGE.icons],
      [1100, STAGE.windows],
      [1700, STAGE.ready],
    ]
    const timers = steps.map(([ms, st]) => setTimeout(() => setStage(st), ms))
    return () => timers.forEach(clearTimeout)
  }, [booting, reducedMotion])

  // Sessione iniziale: Welcome (o il CV, se l'utente l'ha disattivata).
  useEffect(() => {
    if (stage < STAGE.windows || mobile || Object.keys(useWM.getState().windows).length) return
    useWM.getState().open(useSettings.getState().showWelcome ? 'welcome' : 'cv')
  }, [stage, mobile])

  // Scorciatoie stile tiling WM: Alt+1..N attiva app, Alt+Q chiude, Alt+F massimizza.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      const wm = useWM.getState()
      // e.code e non e.key: su macOS Option+1 produce '¡'.
      const n = Number(/^(?:Digit|Numpad)([1-9])$/.exec(e.code)?.[1])
      if (n && n <= APP_ORDER.length) {
        const id = APP_ORDER[n - 1]
        wm.activate(id)
        moveFocus(id)
      } else if (e.code === 'KeyQ' && wm.focused) {
        const id = wm.focused
        wm.close(id)
        moveFocus(id)
      } else if (e.code === 'KeyF' && wm.focused) wm.toggleMaximize(wm.focused)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Il desktop viene montato subito sotto l'animazione di boot, così è già pronto alla dissolvenza.
  return (
    <>
      {mobile ? (
        <MobileShell />
      ) : (
        <div className="flex h-full flex-col">
          <StatusBar />
          <Desktop />
          <Dock />
        </div>
      )}
      {booting && (mobile ? <AndroidBoot onDone={() => setBooting(false)} /> : <BootSequence onDone={() => setBooting(false)} />)}
    </>
  )
}
