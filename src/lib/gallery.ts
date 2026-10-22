import { fallbackAlbums, gallery, type AlbumCover } from '../config/gallery'

// Lettura degli album dal sito Hugo: home → card degli album, pagina album → foto.
// Risultati in cache per tutta la sessione.

export interface Photo {
  thumb: string
  full: string
  w: number
  h: number
  color?: string
}

export interface Album {
  photos: Photo[]
  /** Foto totali nell'album (anche oltre il limite dell'anteprima). */
  total: number
}

export const abs = (path: string) => new URL(path, gallery.url).href

async function fetchDoc(path: string) {
  const res = await fetch(abs(path))
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  return new DOMParser().parseFromString(await res.text(), 'text/html')
}

let albumsPromise: Promise<AlbumCover[]> | null = null

export function loadAlbums(): Promise<AlbumCover[]> {
  albumsPromise ??= fetchDoc('/')
    .then((doc) => {
      const albums = [...doc.querySelectorAll<HTMLAnchorElement>('a.card')].flatMap((a) => {
        const img = a.querySelector('img')
        const slug = a.getAttribute('href')?.replace(/^\/|\/$/g, '')
        const cover = img?.getAttribute('data-src') ?? img?.getAttribute('src')
        if (!slug || !cover) return []
        return [{ slug, title: a.title || a.querySelector('h2')?.textContent?.trim() || slug, cover, w: Number(img?.getAttribute('width')) || 600, h: Number(img?.getAttribute('height')) || 450 }]
      })
      if (!albums.length) throw new Error('nessun album trovato')
      return albums
    })
    .catch(() => fallbackAlbums)
  return albumsPromise
}

const albumCache = new Map<string, Promise<Album>>()

export function loadAlbum(slug: string): Promise<Album> {
  let p = albumCache.get(slug)
  if (!p) {
    p = fetchDoc(`/${slug}/`).then((doc) => {
      const items = [...doc.querySelectorAll<HTMLAnchorElement>('a.gallery-item')]
      const photos = items.slice(0, gallery.previewLimit).flatMap((a) => {
        const img = a.querySelector('img')
        const thumb = img?.getAttribute('data-src')
        if (!thumb) return []
        return [
          {
            thumb,
            full: a.getAttribute('data-pswp-src') ?? thumb,
            w: Number(img?.getAttribute('width')) || 600,
            h: Number(img?.getAttribute('height')) || 450,
            color: a.querySelector('figure')?.style.backgroundColor || undefined,
          },
        ]
      })
      return { photos, total: items.length }
    })
    // Su errore non tenere la promessa in cache, così si può riprovare.
    p.catch(() => albumCache.delete(slug))
    albumCache.set(slug, p)
  }
  return p
}
