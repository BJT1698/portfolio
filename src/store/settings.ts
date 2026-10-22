import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeId, Wallpaper } from '../config/themes'
import type { FontId } from '../config/fonts'

interface Settings {
  theme: ThemeId
  font: FontId
  wallpaper: Wallpaper
  sound: boolean
  kbLayout: 'it' | 'us'
  /** Apre l'app Welcome all'avvio (altrimenti il CV). */
  showWelcome: boolean
  /** Su mobile entra a schermo intero al primo tocco, nascondendo la barra del browser. */
  autoFullscreen: boolean
  setTheme(theme: ThemeId): void
  setFont(font: FontId): void
  setWallpaper(wallpaper: Wallpaper): void
  toggleSound(): void
  toggleKbLayout(): void
  toggleShowWelcome(): void
  toggleAutoFullscreen(): void
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      theme: 'mocha',
      font: 'iosevka',
      wallpaper: 'grid',
      sound: false,
      kbLayout: 'it',
      showWelcome: true,
      autoFullscreen: true,
      setTheme: (theme) => set({ theme }),
      setFont: (font) => set({ font }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      toggleKbLayout: () => set((s) => ({ kbLayout: s.kbLayout === 'it' ? 'us' : 'it' })),
      toggleShowWelcome: () => set((s) => ({ showWelcome: !s.showWelcome })),
      toggleAutoFullscreen: () => set((s) => ({ autoFullscreen: !s.autoFullscreen })),
    }),
    {
      name: 'lv-desktop-settings',
      partialize: ({ theme, font, wallpaper, sound, kbLayout, showWelcome, autoFullscreen }) => ({ theme, font, wallpaper, sound, kbLayout, showWelcome, autoFullscreen }),
    },
  ),
)
