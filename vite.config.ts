import { createHash } from 'node:crypto'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { esc, headTags, staticBody } from './src/lib/machine.ts'
import { site } from './src/config/site.ts'
import { gallery } from './src/config/gallery.ts'

/** Inietta in index.html titolo, meta tag, JSON-LD e il CV in HTML statico per crawler e agenti AI. */
function machineReadable(): Plugin {
  return {
    name: 'machine-readable',
    // Sostituzioni con funzione: un `$` nella config non viene interpretato come pattern di replace.
    transformIndexHtml: (html) =>
      html
        .replace(/<title>.*<\/title>/, () => `<title>${esc(site.title)}</title>\n    ${headTags()}`)
        .replace('<div id="root"></div>', () => `<div id="root">${staticBody()}</div>`),
  }
}

/**
 * Content-Security-Policy come <meta>, solo in build: GitHub Pages non permette header personalizzati
 * (quindi niente frame-ancestors) e in sviluppo bloccherebbe l'HMR di Vite.
 * Lo script inline di index.html è ammesso tramite il suo hash.
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`)
        const galleryOrigin = new URL(gallery.url).origin
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')}`,
          // React applica stili inline (finestre, temi, animazioni): servono gli attributi style.
          "style-src 'self' 'unsafe-inline'",
          `img-src 'self' ${galleryOrigin} https://i.ytimg.com`,
          "font-src 'self'",
          `connect-src 'self' ${galleryOrigin}`,
          'frame-src https://www.youtube-nocookie.com',
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'none'",
        ].join('; ')
        return html.replace('<meta charset="UTF-8" />', (m) => `${m}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), machineReadable(), contentSecurityPolicy()],
})
