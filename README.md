# Lorenzo Vicentini — portfolio

Portfolio personale in forma di desktop Linux: finestre, dock, terminale con filesystem virtuale, CV interattivo, gallery e video. Su smartphone diventa una home a griglia con app a schermo intero.

Pubblicato su **https://bjt1698.it**.

## Sviluppo

```sh
npm ci
npm run dev      # server di sviluppo (rigenera CV e video)
npm run build    # build di produzione in dist/
npm run lint
```

Richiede Node ≥ 22.18 (gli script in `scripts/` sono TypeScript eseguito direttamente da Node).

## Dove stanno i contenuti

- `src/config/` — profilo, CV, link, temi, font, gallery, canale YouTube, dominio del sito
- `scripts/gen-cv.ts` — genera `cv.md`, `llms.txt`, `resume.json`, `robots.txt`, `sitemap.xml` per crawler e agenti AI
- `scripts/gen-videos.ts` — legge i video dal canale YouTube in `public/videos.json`

## Pubblicazione

Ogni push su `main` (e ogni lunedì, per aggiornare i video) GitHub Actions esegue la build e la pubblica su GitHub Pages (`.github/workflows/deploy.yml`). Il dominio è in `public/CNAME`.
