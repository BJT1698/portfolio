import { Globe, Mail, Rss } from 'lucide-react'
import { siBluesky, siDiscord, siGithub, siGitlab, siInstagram, siMastodon, siTelegram, siX, siYoutube } from 'simple-icons'
import type { LinkIcon } from '../config/links'

// simple-icons non include più LinkedIn (richiesta del brand): path ufficiale inline.
const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'

const BRAND_PATHS: Partial<Record<LinkIcon, string>> = {
  linkedin: LINKEDIN_PATH,
  github: siGithub.path,
  gitlab: siGitlab.path,
  youtube: siYoutube.path,
  instagram: siInstagram.path,
  mastodon: siMastodon.path,
  discord: siDiscord.path,
  telegram: siTelegram.path,
  bluesky: siBluesky.path,
  x: siX.path,
}

const GENERIC = { email: Mail, rss: Rss, globe: Globe } as const

export function LinkGlyph({ icon, size = 18, className }: { icon: LinkIcon; size?: number; className?: string }) {
  const path = BRAND_PATHS[icon]
  if (path)
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden>
        <path d={path} />
      </svg>
    )
  const Icon = GENERIC[icon as keyof typeof GENERIC] ?? Globe
  return <Icon size={size} className={className} aria-hidden />
}
