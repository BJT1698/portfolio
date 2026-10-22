// Sito fotografico collegato all'app Gallery. Gli album vengono letti dal sito in tempo reale
// (il server espone CORS aperto); `fallbackAlbums` serve solo se il sito non risponde.
// Questa sezione è personale: non va in CV né competenze.

export interface AlbumCover {
  slug: string
  title: string
  cover: string
  w: number
  h: number
}

export const gallery = {
  url: 'https://gallery.bjt1698.it',
  label: 'gallery.bjt1698.it',
  /** Foto mostrate in anteprima per ogni album; le altre si vedono sul sito. */
  previewLimit: 12,
}

export const fallbackAlbums: AlbumCover[] = [
  { slug: 'bonette', title: 'Col de la bonette', cover: '/bonette/bonette_1_hu_7584f5f19d6ed053.jpg', w: 600, h: 452 },
  { slug: 'food', title: 'Food', cover: '/food/meat_capo1_hu_f007df6aa94abdad.png', w: 600, h: 600 },
  { slug: 'austria', title: 'Österreich', cover: '/austria/feature_hu_caa0318c5189e728.jpg', w: 600, h: 389 },
  { slug: 'gs', title: 'BMW R1200GS', cover: '/gs/feature_hu_d54c679ee455cca0.jpg', w: 600, h: 452 },
  { slug: 'agnello', title: "Colle dell'Agnello - Col d'Izoard", cover: '/agnello/feature_hu_c9b05fe12d01f651.jpg', w: 600, h: 400 },
  { slug: 'leave', title: 'Leave', cover: '/leave/feature_hu_4450870c412ad8b1.jpeg', w: 600, h: 600 },
]
