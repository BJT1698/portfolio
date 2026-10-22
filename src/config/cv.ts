// Contenuto del curriculum. Unica fonte per: finestra CV, terminale (`cat cv.txt`),
// export markdown e public/cv.md generato da scripts/gen-cv.ts.

export interface Experience {
  role: string
  company: string
  location?: string
  /** Formato 'YYYY-MM'. */
  start: string
  /** null = posizione attuale. */
  end: string | null
  summary: string
  highlights: string[]
  tags: string[]
}

export interface Skill {
  name: string
}

export interface SkillCategory {
  id: string
  label: string
  skills: Skill[]
}

export interface Education {
  title: string
  institution: string
  start: string
  end: string | null
  notes?: string
}

export interface Certification {
  name: string
  issuer: string
  year: string
  status: 'done' | 'in-progress'
  url?: string
}

export interface CV {
  summary: string
  /** Stesso riassunto in inglese, per agenti AI e recruiter internazionali (llms.txt, JSON-LD). */
  summaryEn: string
  experience: Experience[]
  skills: SkillCategory[]
  education: Education[]
  certifications: Certification[]
}

export const cv: CV = {
  summary:
    'Tecnico informatico e sistemista, sul campo dal 2019. Oggi gestisco helpdesk di secondo e terzo livello e infrastruttura on-premise: cluster Proxmox, deployment dei PC via PXE, Active Directory e dispositivi mobili con Intune. Alle spalle assistenza on-site e da remoto, sistemi POS e registratori telematici, VPN/RDP e migrazioni Microsoft 365.',

  summaryEn:
    'IT technician and system administrator, hands-on since 2019. Currently handling 2nd/3rd-level helpdesk and on-premise infrastructure: a Proxmox cluster, PXE-based PC deployment, Active Directory and mobile device management with Intune. Background in on-site and remote support, POS systems and fiscal registers, VPN/RDP setups and Microsoft 365 migrations.',

  experience: [
    {
      role: 'IT Support Specialist & SysAdmin',
      company: 'MVS Multivendor Service',
      location: 'Alba (CN)',
      start: '2023-04',
      end: null,
      summary: 'Supporto IT di secondo e terzo livello e gestione dell’infrastruttura per un ambiente di uffici e produzione.',
      // Ordine per impatto: su mobile si vedono le prime tre.
      highlights: [
        'Amministrazione di un cluster Proxmox VE: macchine virtuali, container LXC e Docker.',
        'Gestione end-to-end del deployment dei PC aziendali: preparazione e manutenzione delle immagini del sistema operativo e distribuzione tramite server PXE amministrato in autonomia.',
        'Helpdesk di secondo e terzo livello: presa in carico e risoluzione delle problematiche più complesse.',
        'Gestione di permessi e gruppi in Active Directory.',
        'Configurazione e gestione dei telefoni aziendali con Microsoft Intune.',
        'Onboarding e induction dei nuovi utenti.',
        'Configurazione dei PC client per uffici e reparti di produzione.',
        'Installazione e manutenzione di primo livello di stampanti A4 e stampanti di etichette Zebra.',
        'Gestione del magazzino hardware dei PC.',
        'Redazione e aggiornamento della documentazione tecnica.',
      ],
      tags: ['Proxmox', 'LXC', 'Docker', 'PXE', 'Active Directory', 'Intune', 'Help Desk', 'Zebra'],
    },
    {
      role: 'Tecnico informatico e manutentore registratori telematici',
      company: 'Inside S.r.l.',
      location: 'Sanremo (IM)',
      start: '2019-06',
      end: '2023-03',
      summary: 'Assistenza IT per aziende, privati e ristorazione: installazioni on-site, laboratorio e supporto da remoto.',
      highlights: [
        'Installazione e configurazione di PC client e stampanti presso aziende e privati.',
        'Deployment di ambienti Linux per sistemi di prenotazione gestiti da remoto.',
        'Riparazioni hardware e software di PC desktop e portatili in laboratorio.',
        'Installazione di gestionali POS e totem multimediali per la ristorazione.',
        'Installazione e manutenzione di registratori telematici.',
        'Assistenza informatica on-site e da remoto.',
        'Configurazione di postazioni per lo smart working (RDP e connessioni VPN).',
        'Installazione e configurazione di Microsoft 365, migrazione di caselle di posta elettronica.',
      ],
      tags: ['Linux', 'Help Desk', 'Hardware', 'POS', 'VPN', 'RDP', 'Microsoft 365'],
    },
    {
      role: 'Tecnico video',
      company: 'Pico Service',
      location: 'Sanremo (IM)',
      start: '2018-09',
      end: '2019-06',
      summary: 'Allestimenti tecnici per eventi live e conferenze.',
      highlights: [
        'Installazione di attrezzatura video per eventi live e conferenze.',
        'Regia video e gestione di pannelli ledwall.',
        'Montaggio di palchi e strutture americane (truss).',
        'Gestione magazzino e inventario.',
        'Riparazioni in laboratorio.',
      ],
      tags: ['Hardware', 'Video'],
    },
  ],

  skills: [
    { id: 'os', label: 'Sistemi operativi', skills: [{ name: 'Linux' }, { name: 'Debian' }, { name: 'Ubuntu' }, { name: 'NixOS' }, { name: 'Arch Linux' }, { name: 'Windows' }, { name: 'Windows Server' }] },
    { id: 'virt', label: 'Virtualizzazione & container', skills: [{ name: 'Proxmox' }, { name: 'LXC' }, { name: 'Docker' }, { name: 'KVM/QEMU' }] },
    { id: 'identity', label: 'Identity & dispositivi', skills: [{ name: 'Active Directory' }, { name: 'GPO' }, { name: 'Intune' }, { name: 'Microsoft 365' }, { name: 'Azure' }] },
    { id: 'deploy', label: 'Deployment', skills: [{ name: 'PXE' }, { name: 'Imaging OS' }] },
    { id: 'net', label: 'Reti & accesso remoto', skills: [{ name: 'VPN' }, { name: 'RDP' }] },
    { id: 'auto', label: 'Scripting & automazione', skills: [{ name: 'Bash' }, { name: 'PowerShell' }, { name: 'Git' }] },
    { id: 'support', label: 'Supporto & hardware', skills: [{ name: 'Help Desk' }, { name: 'Hardware' }, { name: 'Stampanti' }, { name: 'Zebra' }, { name: 'POS' }, { name: 'Registratori telematici' }] },
  ],

  education: [
    {
      title: 'Diploma — Manutenzione e assistenza tecnica (elettrico ed elettronico)',
      institution: 'I.I.S. G. Marconi, Sanremo (IM)',
      start: '2014',
      end: '2018',
    },
  ],

  certifications: [],
}

/** Tutti i tag filtrabili (skill + tag delle esperienze), ordinati e senza duplicati. */
export const allTags: string[] = [
  ...new Set([...cv.skills.flatMap((c) => c.skills.map((s) => s.name)), ...cv.experience.flatMap((e) => e.tags)]),
].sort((a, b) => a.localeCompare(b))
