import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'
import { gallery, type AlbumCover } from '../config/gallery'
import { abs, loadAlbum, loadAlbums, type Album } from '../lib/gallery'
import { useIsMobile } from '../lib/useMediaQuery'
import { beep } from '../lib/sound'
import { useLoad } from '../lib/useLoad'
import { SiteButton } from '../components/SiteButton'

// Anteprima del sito fotografico: album → foto → visore, più il rimando al sito.

export default function GalleryApp() {
  const mobile = useIsMobile()
  const [album, setAlbum] = useState<AlbumCover | null>(null)
  // Album da cui si torna: la sua card riprende il focus.
  const [back, setBack] = useState<string | null>(null)
  const [viewing, setViewing] = useState(false)

  return (
    <div className="@container flex h-full min-h-0 flex-col bg-base">
      <h1 className="sr-only">Gallery</h1>
      <header inert={viewing} className="flex shrink-0 items-center gap-2 border-b border-surface0 bg-mantle px-3 py-2 text-xs">
        {album ? (
          <button
            type="button"
            onClick={() => {
              setBack(album.slug)
              setAlbum(null)
            }}
            className="flex h-8 items-center gap-1 rounded-sm px-1.5 text-accent hover:bg-surface0"
            aria-label="Torna agli album"
          >
            <ArrowLeft size={14} />
          </button>
        ) : null}
        <span className="min-w-0 truncate">
          <span className="text-accent" aria-hidden="true">
            $
          </span>{' '}
          <span className="text-subtext">ls</span> <span className="text-text">~/gallery</span>
          {album && <span className="text-text">/{album.slug}</span>}
        </span>
        {!mobile && (
          <span className="ml-auto">
            <SiteButton href={gallery.url} primary>
              {gallery.label}
            </SiteButton>
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {album ? <AlbumView album={album} onViewer={setViewing} /> : <AlbumGrid onOpen={setAlbum} focusSlug={back} />}
      </div>

      {mobile && (
        <div inert={viewing} className="grid shrink-0 border-t border-surface0 bg-mantle p-2">
          <SiteButton href={album ? abs(`/${album.slug}/`) : gallery.url} primary>
            {album ? 'apri l’album sul sito' : `visita ${gallery.label}`}
          </SiteButton>
        </div>
      )}
    </div>
  )
}

function AlbumGrid({ onOpen, focusSlug }: { onOpen: (a: AlbumCover) => void; focusSlug: string | null }) {
  const state = useLoad('home', loadAlbums)
  const list = useRef<HTMLUListElement>(null)
  const loading = state.status === 'loading'

  // Tornando da un album, il focus va sulla sua card.
  useEffect(() => {
    if (state.status === 'ok' && focusSlug) list.current?.querySelector<HTMLElement>(`[data-slug="${CSS.escape(focusSlug)}"]`)?.focus()
  }, [state.status, focusSlug])

  return (
    <div className="p-3 @lg:p-4">
      <p className="mb-3 text-xs text-overlay">
        <span className="text-accent" aria-hidden="true">
          ##
        </span>{' '}
        anteprima degli album · tutte le foto su <span className="text-subtext">{gallery.label}</span>
      </p>
      <span role="status" className="sr-only">
        {loading ? 'caricamento…' : ''}
      </span>
      {(state.status === 'error' || (state.status === 'ok' && state.data.length === 0)) && (
        <div className="flex flex-col items-start gap-3 rounded-md border border-surface0 bg-mantle p-4 text-sm text-subtext">
          <span className="flex items-center gap-2 text-red">
            <ImageOff size={16} /> impossibile caricare gli album
          </span>
          <SiteButton href={gallery.url}>apri sul sito</SiteButton>
        </div>
      )}
      <ul ref={list} aria-busy={loading} className="grid grid-cols-2 gap-2.5 @2xl:grid-cols-3">
        {loading && Array.from({ length: 6 }, (_, i) => <li key={i} aria-hidden="true" className="aspect-[4/3] animate-pulse rounded-md bg-surface0" />)}
        {state.status === 'ok' &&
          state.data.map((a) => (
            <li key={a.slug}>
              <button
                type="button"
                data-slug={a.slug}
                onClick={() => {
                  beep('click')
                  onOpen(a)
                }}
                className="group block w-full overflow-hidden rounded-md border border-surface0 bg-mantle text-left transition-colors hover:border-accent focus-visible:border-accent"
              >
                <span className="block aspect-[4/3] overflow-hidden bg-surface0">
                  <img
                    src={abs(a.cover)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={a.w}
                    height={a.h}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-2 text-xs">
                  <span className="text-accent" aria-hidden="true">
                    ▸
                  </span>
                  <span className="truncate text-text">{a.title}</span>
                </span>
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}

function AlbumView({ album, onViewer }: { album: AlbumCover; onViewer: (open: boolean) => void }) {
  const state = useLoad(album.slug, loadAlbum)
  const [index, setIndex] = useState<number | null>(null)
  const mobile = useIsMobile()
  const photos = state.status === 'ok' ? state.data.photos : []
  const loading = state.status === 'loading'
  const heading = useRef<HTMLHeadingElement>(null)
  const thumbs = useRef<(HTMLButtonElement | null)[]>([])
  // Ultima foto vista: alla chiusura del visore il focus torna sulla sua miniatura.
  const last = useRef<number | null>(null)
  const open = index !== null && state.status === 'ok'

  // Entrando nell'album il focus va sul titolo (il pulsante cliccato è stato smontato).
  useEffect(() => heading.current?.focus(), [])

  useEffect(() => {
    onViewer(open)
    if (open) last.current = index
    else if (last.current !== null) {
      thumbs.current[last.current]?.focus()
      last.current = null
    }
  }, [open, index, onViewer])

  useEffect(() => () => onViewer(false), [onViewer])

  return (
    <div className="p-3 @lg:p-4">
      <div inert={open}>
        <div className="mb-3 flex items-center gap-3">
          <h2 ref={heading} tabIndex={-1} className="min-w-0 flex-1 truncate font-bold text-text focus:outline-none">
            <span className="text-accent" aria-hidden="true">
              ##{' '}
            </span>
            {album.title}
          </h2>
          {state.status === 'ok' && <span className="shrink-0 text-xs text-overlay">{state.data.total} foto</span>}
        </div>

        {state.status === 'error' && (
          <div className="flex flex-col items-start gap-3 rounded-md border border-surface0 bg-mantle p-4 text-sm text-subtext">
            <span className="flex items-center gap-2 text-red">
              <ImageOff size={16} /> impossibile caricare l’album
            </span>
            <SiteButton href={abs(`/${album.slug}/`)}>apri sul sito</SiteButton>
          </div>
        )}

        <span role="status" className="sr-only">
          {loading ? 'caricamento…' : ''}
        </span>
        <ul aria-busy={loading} className="columns-2 gap-2.5 @2xl:columns-3 [&>li]:mb-2.5">
          {loading &&
            Array.from({ length: 6 }, (_, i) => <li key={i} aria-hidden="true" className={`break-inside-avoid animate-pulse rounded-md bg-surface0 ${i % 3 ? 'aspect-[4/3]' : 'aspect-[3/4]'}`} />)}
          {photos.map((p, i) => (
            <li key={p.thumb} className="break-inside-avoid">
              <button
                ref={(el) => {
                  thumbs.current[i] = el
                }}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${album.title} — foto ${i + 1}`}
                className="block w-full overflow-hidden rounded-md border border-surface0 transition-colors hover:border-accent"
                style={{ background: p.color, aspectRatio: `${p.w} / ${p.h}` }}
              >
                <img src={abs(p.thumb)} alt="" loading="lazy" decoding="async" width={p.w} height={p.h} className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>

        {state.status === 'ok' && (
          <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-surface0 pt-3 text-xs text-overlay">
            {state.data.total > photos.length && <span>+{state.data.total - photos.length} foto sul sito</span>}
            {/* Su mobile il rimando sta già nella barra in basso. */}
            {!mobile && (
              <span className="ml-auto">
                <SiteButton href={abs(`/${album.slug}/`)}>apri l’album</SiteButton>
              </span>
            )}
          </div>
        )}
      </div>

      {open && <Viewer title={album.title} album={state.data} index={index} onIndex={setIndex} onClose={() => setIndex(null)} />}
    </div>
  )
}

/** Visore a tutta finestra: frecce/swipe per scorrere, Esc o × per chiudere. Tasti gestiti solo col focus nel visore. */
function Viewer({ title, album, index, onIndex, onClose }: { title: string; album: Album; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const n = album.photos.length
  const photo = album.photos[index]
  const go = useCallback((d: number) => onIndex((index + d + n) % n), [index, n, onIndex])
  const [touchX, setTouchX] = useState<number | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => close.current?.focus(), [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      // Focus intrappolato: Tab cicla tra i pulsanti del visore.
      const els = [...(dialog.current?.querySelectorAll<HTMLElement>('button') ?? [])]
      if (!els.length) return
      const first = els[0]
      const lastEl = els[els.length - 1]
      const cur = document.activeElement
      if (e.shiftKey && (cur === first || !els.includes(cur as HTMLElement))) lastEl.focus()
      else if (!e.shiftKey && (cur === lastEl || !els.includes(cur as HTMLElement))) first.focus()
      else return
    } else if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowRight') go(1)
    else if (e.key === 'ArrowLeft') go(-1)
    else return
    e.preventDefault()
    e.stopPropagation()
  }

  const nav = 'absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-sm border border-surface1 bg-mantle/80 text-text hover:border-accent hover:text-accent'

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — foto ${index + 1} di ${n}`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="absolute inset-0 z-10 flex flex-col bg-crust/95 outline-none backdrop-blur-sm"
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return
        const dx = e.changedTouches[0].clientX - touchX
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        setTouchX(null)
      }}
    >
      <div className="flex shrink-0 items-center justify-between px-3 py-2 text-xs text-subtext">
        <span className="tabular-nums" aria-hidden="true">
          <span className="text-accent">{index + 1}</span>/{n}
        </span>
        <button ref={close} type="button" onClick={onClose} aria-label="Chiudi" className="grid size-10 place-items-center rounded-sm hover:bg-surface0 hover:text-red">
          <X size={16} />
        </button>
      </div>
      <div className="relative min-h-0 flex-1 px-3 pb-3">
        {/* La miniatura fa da segnaposto mentre carica la versione grande. */}
        <img
          key={photo.full}
          src={abs(photo.full)}
          alt={`${title} — foto ${index + 1} di ${n}`}
          className="size-full object-contain"
          style={{ backgroundImage: `url(${abs(photo.thumb)})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
        />
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Precedente" className={`${nav} left-4`}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Successiva" className={`${nav} right-4`}>
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
