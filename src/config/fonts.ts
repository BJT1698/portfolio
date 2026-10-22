// Font monospace selezionabili. I file vengono caricati solo quando servono (src/lib/fonts.ts).

export const fonts = [
  { id: 'iosevka', label: 'Iosevka', family: 'Iosevka' },
  { id: 'jetbrains', label: 'JetBrains Mono', family: 'JetBrains Mono' },
  { id: 'fira', label: 'Fira Code', family: 'Fira Code' },
  { id: 'cascadia', label: 'Cascadia Code', family: 'Cascadia Code' },
  { id: 'plex', label: 'IBM Plex Mono', family: 'IBM Plex Mono' },
  { id: 'sourcecode', label: 'Source Code Pro', family: 'Source Code Pro' },
  { id: 'geist', label: 'Geist Mono', family: 'Geist Mono' },
  { id: 'victor', label: 'Victor Mono', family: 'Victor Mono' },
  { id: 'commit', label: 'Commit Mono', family: 'Commit Mono' },
] as const

export type FontId = (typeof fonts)[number]['id']
