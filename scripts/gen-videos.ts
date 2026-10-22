// Genera public/videos.json con gli ultimi video del canale. Eseguito da `npm run dev` / `npm run build`.
// Fonte principale: la pagina /videos del canale (ID in ordine di pubblicazione) + la pagina di ogni
// video (titolo, data, durata). Riserva: il feed RSS, che a volte YouTube smette di servire (404).
// Se nessuna fonte risponde, il file esistente resta com'è: la build non fallisce.
import { existsSync, writeFileSync } from 'node:fs'
import { youtube, type Video, type VideoFeed } from '../src/config/youtube.ts'

const OUT = new URL('../public/videos.json', import.meta.url)
const LIMIT = 15
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  'Accept-Language': 'it-IT,it;q=0.9',
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

async function text(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

/** Titolo, data e durata dalla pagina del video. */
async function details(id: string): Promise<Partial<Video>> {
  try {
    const html = await text(`https://www.youtube.com/watch?v=${id}`)
    const title = html.match(/<meta name="title" content="([^"]*)"/)?.[1]
    const published = html.match(/"publishDate":"([^"]+)"/)?.[1] ?? html.match(/"uploadDate":"([^"]+)"/)?.[1]
    const seconds = html.match(/"lengthSeconds":"(\d+)"/)?.[1]
    return {
      ...(title && { title: decode(title) }),
      ...(published && { published: new Date(published).toISOString() }),
      duration: seconds ? Number(seconds) : null,
    }
  } catch {
    return { duration: null }
  }
}

/** ID dei video dalla scheda /videos del canale, nell'ordine mostrato (dal più recente). */
async function fromChannelPage(): Promise<Video[]> {
  const html = await text(`${youtube.url}/videos`)
  // Il layout attuale usa "contentId" per le schede video; "videoId" come ripiego per layout più vecchi.
  const pick = (key: string) => [...new Set([...html.matchAll(new RegExp(`"${key}":"([\\w-]{11})"`, 'g'))].map((m) => m[1]))]
  const ids = (pick('contentId').length ? pick('contentId') : pick('videoId')).slice(0, LIMIT)
  if (!ids.length) throw new Error('nessun video nella pagina del canale')
  const videos = await Promise.all(ids.map(async (id) => ({ id, title: '', published: '', duration: null, ...(await details(id)) })))
  const complete = videos.filter((v) => v.title && v.published)
  if (!complete.length) throw new Error('dettagli dei video non leggibili')
  return complete
}

async function fromFeed(): Promise<Video[]> {
  const feed = await text(`https://www.youtube.com/feeds/videos.xml?channel_id=${youtube.channelId}`)
  const entries = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: e.match(/<yt:videoId>([^<]+)/)?.[1] ?? '',
    title: decode(e.match(/<title>([^<]*)/)?.[1] ?? ''),
    published: e.match(/<published>([^<]+)/)?.[1] ?? '',
  }))
  return Promise.all(entries.filter((e) => e.id).slice(0, LIMIT).map(async (e) => ({ ...e, duration: (await details(e.id)).duration ?? null })))
}

const errors: string[] = []
let videos: Video[] | null = null
for (const [name, source] of [['pagina canale', fromChannelPage], ['feed RSS', fromFeed]] as const) {
  try {
    videos = await source()
    console.log(`gen-videos: ${videos.length} video in public/videos.json (fonte: ${name})`)
    break
  } catch (err) {
    errors.push(`${name}: ${(err as Error).message}`)
  }
}

if (videos) {
  const out: VideoFeed = { generatedAt: new Date().toISOString(), videos }
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
} else {
  if (!existsSync(OUT)) writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), videos: [] }, null, 2) + '\n')
  console.warn(`gen-videos: impossibile aggiornare i video (${errors.join('; ')}), uso il file esistente`)
}
