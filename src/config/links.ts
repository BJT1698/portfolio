// Link esterni. Per aggiungere una voce basta una riga in `links`:
// il layout (finestra Social, terminale `socials`, mobile) si aggiorna da solo.
// `icon` deve essere una chiave di LinkIcon (vedi src/lib/icons.tsx).

export type LinkIcon =
  | 'linkedin'
  | 'youtube'
  | 'instagram'
  | 'github'
  | 'gitlab'
  | 'email'
  | 'mastodon'
  | 'discord'
  | 'telegram'
  | 'bluesky'
  | 'x'
  | 'rss'
  | 'globe'

export interface SocialLink {
  id: string
  label: string
  handle: string
  url: string
  icon: LinkIcon
  description?: string
  /** true = compare anche nel CV (vista CV, PDF, cv.md). */
  cv?: boolean
}

export const links: SocialLink[] = [
  { id: 'linkedin', label: 'LinkedIn', handle: 'in/lorenzo-vicentini', url: 'https://www.linkedin.com/in/lorenzo-vicentini', icon: 'linkedin', description: 'Esperienza e contatti professionali', cv: true },
  { id: 'github', label: 'GitHub', handle: '@bjt1698', url: 'https://github.com/bjt1698', icon: 'github', description: 'Dotfiles, script e progetti homelab' },
  { id: 'instagram', label: 'Instagram', handle: '@bjt_1698', url: 'https://www.instagram.com/bjt_1698/', icon: 'instagram', description: 'Fotografia' },
  { id: 'youtube', label: 'YouTube', handle: '@lorenzo.vicentini', url: 'https://www.youtube.com/@lorenzo.vicentini', icon: 'youtube', description: 'Video dei miei giri in moto' },
  { id: 'email', label: 'Email', handle: 'bjt1698@outlook.com', url: 'mailto:bjt1698@outlook.com', icon: 'email', description: 'Il modo più rapido per contattarmi', cv: true },
]

/** Link mostrati nel curriculum: solo quelli professionali. */
export const cvLinks = links.filter((l) => l.cv)
