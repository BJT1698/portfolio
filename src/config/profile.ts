// Dati anagrafici del profilo.
// File puro (niente import UI): viene letto anche da scripts/gen-cv.ts via Node.

export interface Profile {
  name: string
  role: string
  user: string
  host: string
  location: string
  /** Località strutturata per i dati leggibili dalle macchine (JSON-LD, JSON Resume). */
  place: { city: string; province: string; region: string; countryCode: string }
  email: string
  /** Percorso in public/. */
  avatar: string
  /** Occupato ma aperto a valutare proposte: mostrato nell'interfaccia e nei dati per agenti/HR. */
  openToOffers: boolean
  tagline: string
  bio: string[]
  languages: { name: string; level: string }[]
  interests: string[]
}

export const profile: Profile = {
  name: 'Lorenzo Vicentini',
  role: 'IT Support Specialist & SysAdmin',
  user: 'lorenzo',
  host: 'portfolio',
  location: 'Alba (CN)',
  place: { city: 'Alba', province: 'CN', region: 'Piemonte', countryCode: 'IT' },
  email: 'bjt1698@outlook.com',
  avatar: '/avatar.jpg',
  openToOffers: true,
  tagline: 'Tengo in piedi server, reti e utenti. Possibilmente in quest’ordine.',
  bio: [
    'IT Support Specialist e SysAdmin con base Linux-first e piena operatività su ambienti Windows Server / Active Directory.',
    'Mi occupo di provisioning, virtualizzazione (Proxmox, LXC, Docker), networking e automazione con Bash e PowerShell.',
    'Homelab sempre acceso, dotfiles versionati, preferisco uno script ben scritto a dieci click ripetuti.',
  ],
  languages: [
    { name: 'Italiano', level: 'Madrelingua' },
    { name: 'Inglese', level: 'B2' },
  ],
  interests: ['Homelab', 'Tiling WM', 'Network booting / PXE', 'NixOS', 'Self-hosting'],
}
