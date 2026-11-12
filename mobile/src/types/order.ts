// Типы и справочники заказа. Цены тестовые: когда в Supabase появятся таблицы, берём их оттуда.
export interface Photo { uri: string; width: number; height: number }

export interface Adjust { exposure: number; contrast: number; shadows: number; light: number; temperature: number; tint: number }
export const NO_ADJUST: Adjust = { exposure: 0, contrast: 0, shadows: 0, light: 0, temperature: 0, tint: 0 };
export const ADJUST_LABELS: { key: keyof Adjust; label: string }[] = [
  { key: 'exposure', label: 'Экспозиция' }, { key: 'contrast', label: 'Контраст' },
  { key: 'shadows', label: 'Тени' }, { key: 'light', label: 'Свет' },
  { key: 'temperature', label: 'Температура' }, { key: 'tint', label: 'Тинт' },
];
export const FILTERS = ['Оригинал', 'Ч/Б', 'Сепия', 'Тёплый', 'Холодный'] as const;
export type Filter = (typeof FILTERS)[number];

// ---- Фотопечать ----
export const PRINT_FORMATS = [
  { id: '10x15', name: '10 × 15 см', note: 'Стандартный', price: 0.45, minPx: 1000 },
  { id: '15x21', name: '15 × 21 см', note: 'Альбом A5', price: 0.9, minPx: 1400 },
  { id: '20x30', name: '20 × 30 см', note: 'Большой A4', price: 1.8, minPx: 2000 },
  { id: '10x10', name: '10 × 10 см', note: 'Polaroid с рамкой', price: 0.55, minPx: 800 },
];
export const PRINT_PAPERS = [
  { id: 'matte', name: 'Матовая', note: 'Без отпечатков' },
  { id: 'gloss', name: 'Глянцевая', note: 'Сочные цвета' },
];

// ---- Фотоальбом ----
export const ALBUM_COVERS = [
  { id: 'hard', name: 'Твёрдая', note: 'Фотообложка', price: 30 },
  { id: 'soft', name: 'Мягкая', note: 'Журнальная', price: 20 },
  { id: 'eco', name: 'Экокожа', note: 'Премиум', price: 40 },
];
export const ALBUM_FORMATS = [
  { id: '20x20', name: '20 × 20 см', note: 'Квадратный', price: 0 },
  { id: '20x30', name: '20 × 30 см', note: 'Вертикальный A4', price: 10 },
  { id: '30x30', name: '30 × 30 см', note: 'Макси альбом', price: 20 },
];
export const ALBUM_LAMINATION = [
  { id: 'gloss', name: 'Глянцевая', note: 'Яркий блеск', price: 0 },
  { id: 'grain', name: 'Зернистая (матовая)', note: 'Тактильный эффект', price: 5 },
];
export const ALBUM_PAPERS = [
  { id: 'silk', name: 'Шёлк (Silk)', note: '+ Премиум', price: 9 },
  { id: 'matte', name: 'Матовая', note: 'Классика', price: 0 },
  { id: 'hd', name: 'Глянцевая HD', note: 'Сочная', price: 6 },
];
export const SPREAD_PRICE = 4;
export const MIN_SPREADS = 10;
export const MAX_SPREADS = 40;
export const ALBUM_MIN_PX = 1200;

// Цена одного альбома = обложка + формат + ламинация + бумага + разворотов × 4
export const albumPrice = (cover: number, format: number, lam: number, paper: number, spreads: number) =>
  cover + format + lam + paper + spreads * SPREAD_PRICE;

export const money = (n: number) => `${n.toFixed(2).replace('.', ',')} BYN`;
