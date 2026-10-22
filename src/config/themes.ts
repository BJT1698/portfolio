// Le palette vere e proprie sono variabili CSS in src/index.css ([data-theme="..."]).

export const themes = [
  { id: 'mocha', label: 'Catppuccin Mocha', swatch: ['#1e1e2e', '#cba6f7', '#a6e3a1', '#f38ba8'] },
  { id: 'tokyonight', label: 'Tokyo Night', swatch: ['#1a1b26', '#7aa2f7', '#9ece6a', '#f7768e'] },
  { id: 'gruvbox', label: 'Gruvbox Dark', swatch: ['#282828', '#fabd2f', '#b8bb26', '#fb4934'] },
  { id: 'dracula', label: 'Dracula', swatch: ['#282a36', '#bd93f9', '#50fa7b', '#ff5555'] },
  { id: 'nord', label: 'Nord', swatch: ['#2e3440', '#88c0d0', '#a3be8c', '#bf616a'] },
  { id: 'rosepine', label: 'Rosé Pine', swatch: ['#1f1d2e', '#ebbcba', '#9ccfd8', '#eb6f92'] },
  { id: 'kanagawa', label: 'Kanagawa', swatch: ['#1f1f28', '#7fb4ca', '#98bb6c', '#e46876'] },
  { id: 'everforest', label: 'Everforest Dark', swatch: ['#2d353b', '#a7c080', '#dbbc7f', '#e67e80'] },
  { id: 'onedark', label: 'One Dark', swatch: ['#282c34', '#61afef', '#98c379', '#e06c75'] },
] as const

export type ThemeId = (typeof themes)[number]['id']

export const wallpapers = ['grid', 'dots', 'none'] as const
export type Wallpaper = (typeof wallpapers)[number]
