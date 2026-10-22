import { fonts, type FontId } from '../config/fonts'

// Import dinamici: ogni font diventa un chunk CSS separato, scaricato solo se scelto
// (o quando le Impostazioni mostrano le anteprime). Iosevka è già nel CSS principale.
const LOADERS: Record<FontId, () => Promise<unknown>> = {
  iosevka: () => Promise.resolve(),
  jetbrains: () => Promise.all([import('@fontsource/jetbrains-mono/latin-400.css'), import('@fontsource/jetbrains-mono/latin-700.css')]),
  fira: () => Promise.all([import('@fontsource/fira-code/latin-400.css'), import('@fontsource/fira-code/latin-700.css')]),
  cascadia: () => Promise.all([import('@fontsource/cascadia-code/latin-400.css'), import('@fontsource/cascadia-code/latin-700.css')]),
  plex: () => Promise.all([import('@fontsource/ibm-plex-mono/latin-400.css'), import('@fontsource/ibm-plex-mono/latin-700.css')]),
  sourcecode: () => Promise.all([import('@fontsource/source-code-pro/latin-400.css'), import('@fontsource/source-code-pro/latin-700.css')]),
  geist: () => Promise.all([import('@fontsource/geist-mono/latin-400.css'), import('@fontsource/geist-mono/latin-700.css')]),
  victor: () => Promise.all([import('@fontsource/victor-mono/latin-400.css'), import('@fontsource/victor-mono/latin-700.css')]),
  commit: () => Promise.all([import('@fontsource/commit-mono/latin-400.css'), import('@fontsource/commit-mono/latin-700.css')]),
}

const familyOf = (id: FontId) => fonts.find((f) => f.id === id)?.family ?? 'Iosevka'

/** Carica i file del font e aspetta che il browser li abbia pronti (niente salto di layout a metà). */
export async function loadFont(id: FontId): Promise<void> {
  await LOADERS[id]?.()
  await document.fonts.load(`16px "${familyOf(id)}"`).catch(() => {})
}

/** Applica il font a tutto il sito tramite la variabile CSS usata da font-mono. */
export async function applyFont(id: FontId): Promise<void> {
  await loadFont(id)
  document.documentElement.style.setProperty('--app-font', `"${familyOf(id)}"`)
}
