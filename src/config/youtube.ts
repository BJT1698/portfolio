// Canale YouTube mostrato nell'app Video. I dati dei video (titolo, data, durata) vengono
// generati in build da scripts/gen-videos.ts in public/videos.json: YouTube non consente
// di leggerli dal browser (niente CORS). Sezione personale: non va nel CV.

export const youtube = {
  channelId: 'UCMQcJz9hnAJeelRs_mch_vg',
  handle: '@lorenzo.vicentini',
  url: 'https://www.youtube.com/@lorenzo.vicentini',
}

export interface Video {
  id: string
  title: string
  /** ISO 8601 */
  published: string
  /** Secondi; null se non è stato possibile leggerla. */
  duration: number | null
}

export interface VideoFeed {
  generatedAt: string
  videos: Video[]
}
