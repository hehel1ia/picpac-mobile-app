export type AlbumTemplate =
  | 'classic'
  | 'collage'
  | 'full'
  | 'mosaic';

export const ALBUM_TEMPLATES = [
  {
    id: 'classic',
    name: 'Классика',
    description: 'По одной или две фотографии на странице',
  },
  {
    id: 'collage',
    name: 'Коллаж',
    description: 'Несколько фотографий разного размера',
  },
  {
    id: 'full',
    name: 'Во весь разворот',
    description: 'Большая фотография на две страницы',
  },
  {
    id: 'mosaic',
    name: 'Мозаика',
    description: 'Фотографии в виде сетки',
  },
] as const;