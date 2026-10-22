import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Play, VideoOff } from 'lucide-react'
import { youtube, type Video, type VideoFeed } from '../config/youtube'
import { useLoad } from '../lib/useLoad'
import { useIsMobile } from '../lib/useMediaQuery'
import { beep } from '../lib/sound'
import { SiteButton } from '../components/SiteButton'

// Anteprime dei video del canale YouTube (generate in build in /videos.json),
// riproduzione dentro la finestra e rimando al canale.

const loadFeed = (): Promise<VideoFeed> =>
  fetch('/videos.json').then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json()
  })

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`

export default function VideosApp() {
  const mobile = useIsMobile()
  const state = useLoad('feed', loadFeed)
  const [playing, setPlaying] = useState<Video | null>(null)
  // Video da cui si torna: la sua card riprende il focus.
  const [back, setBack] = useState<string | null>(null)
  const list = useRef<HTMLUListElement>(null)
  const loading = state.status === 'loading'

  useEffect(() => {
    if (!playing && back && state.status === 'ok') list.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(back)}"]`)?.focus()
  }, [playing, back, state.status])

  return (
    <div className="@container flex h-full min-h-0 flex-col bg-base">
      <h1 className="sr-only">Video</h1>
      <header className="flex shrink-0 items-center gap-2 border-b border-surface0 bg-mantle px-3 py-2 text-xs">
        {playing && (
          <button
            type="button"
            onClick={() => {
              setBack(playing.id)
              setPlaying(null)
            }}
            className="flex h-8 items-center rounded-sm px-1.5 text-accent hover:bg-surface0"
            aria-label="Torna ai video"
          >
            <ArrowLeft size={14} />
          </button>
        )}
        <span className="min-w-0 truncate">
          <span className="text-accent" aria-hidden="true">
            $
          </span>{' '}
          <span className="text-subtext">ls</span> <span className="text-text">~/videos</span>
          {playing && <span className="text-text">/{playing.id}.mp4</span>}
        </span>
        {!mobile && (
          <span className="ml-auto">
            <SiteButton href={youtube.url} primary>
              youtube {youtube.handle}
            </SiteButton>
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {playing ? (
          <Player video={playing} />
        ) : (
          <div className="p-3 @lg:p-4">
            <p className="mb-3 text-xs text-overlay">
              <span className="text-accent" aria-hidden="true">
                ##
              </span>{' '}
              giri in moto · ultimi video del canale
            </p>
            {state.status === 'error' || (state.status === 'ok' && state.data.videos.length === 0) ? (
              <div className="flex flex-col items-start gap-3 rounded-md border border-surface0 bg-mantle p-4 text-sm text-subtext">
                <span className="flex items-center gap-2">
                  <VideoOff size={16} className="text-overlay" /> anteprime non disponibili
                </span>
                <SiteButton href={youtube.url}>vai al canale</SiteButton>
              </div>
            ) : (
              <ul ref={list} aria-busy={loading} className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
                {loading && Array.from({ length: 2 }, (_, i) => <li key={i} aria-hidden="true" className="aspect-video animate-pulse rounded-md bg-surface0" />)}
                {state.status === 'ok' &&
                  state.data.videos.map((v) => (
                    <li key={v.id}>
                      <VideoCard
                        video={v}
                        onPlay={() => {
                          beep('open')
                          setPlaying(v)
                        }}
                      />
                    </li>
                  ))}
              </ul>
            )}
            <span role="status" className="sr-only">
              {loading ? 'caricamento…' : ''}
            </span>
          </div>
        )}
      </div>

      {mobile && (
        <div className="grid shrink-0 border-t border-surface0 bg-mantle p-2">
          <SiteButton href={playing ? watchUrl(playing.id) : youtube.url} primary>
            {playing ? 'apri su YouTube' : `canale ${youtube.handle}`}
          </SiteButton>
        </div>
      )}
    </div>
  )
}

function VideoCard({ video, onPlay }: { video: Video; onPlay: () => void }) {
  return (
    <button
      type="button"
      data-id={video.id}
      onClick={onPlay}
      className="group block w-full overflow-hidden rounded-md border border-surface0 bg-mantle text-left transition-colors hover:border-accent focus-visible:border-accent"
    >
      <span className="relative block aspect-video overflow-hidden bg-surface0">
        {/* hqdefault è 4:3 con bande nere: object-cover le taglia. */}
        <img src={thumb(video.id)} alt="" loading="lazy" decoding="async" width={480} height={360} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="grid size-12 place-items-center rounded-md border border-accent bg-crust/80 text-accent">
            <Play size={20} fill="currentColor" />
          </span>
        </span>
        {video.duration !== null && (
          <span aria-hidden="true" className="absolute right-1.5 bottom-1.5 rounded-sm bg-crust/90 px-1.5 py-0.5 text-[11px] text-text tabular-nums">{formatDuration(video.duration)}</span>
        )}
      </span>
      <span className="block px-2.5 py-2">
        <span className="line-clamp-2 text-sm text-text">{video.title}</span>
        {video.duration !== null && <span className="sr-only">, durata {formatDuration(video.duration)}</span>}
        <span className="mt-0.5 block text-xs text-overlay">{formatDate(video.published)}</span>
      </span>
    </button>
  )
}

function Player({ video }: { video: Video }) {
  const heading = useRef<HTMLHeadingElement>(null)
  // Il pulsante cliccato è stato smontato: il focus passa al titolo del video.
  useEffect(() => heading.current?.focus(), [])
  return (
    <div className="p-3 @lg:p-4">
      <div className="aspect-video overflow-hidden rounded-md border border-surface1 bg-crust">
        {/* youtube-nocookie: niente cookie di tracciamento finché non parte la riproduzione. */}
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="size-full"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 ref={heading} tabIndex={-1} className="font-bold text-text focus:outline-none">
            {video.title}
          </h2>
          <p className="mt-0.5 text-xs text-overlay">
            {formatDate(video.published)}
            {video.duration !== null && ` · ${formatDuration(video.duration)}`}
          </p>
        </div>
        <span className="hidden @lg:block">
          <SiteButton href={watchUrl(video.id)}>apri su YouTube</SiteButton>
        </span>
      </div>
    </div>
  )
}
