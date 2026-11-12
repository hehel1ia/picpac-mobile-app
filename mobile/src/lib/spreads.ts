import { MAX_SPREADS, MIN_SPREADS, Photo } from '../types/order';

export type Slot = Photo | null;
export type Spread = Slot[];

// Раскладывает фото по разворотам. Пустые места = null (в интерфейсе это «+»).
// Фото сверх MAX_SPREADS не помещаются: покажите об этом сообщение, если нужно.
export function layout(photos: Photo[], perSpread: number, minCount = MIN_SPREADS): Spread[] {
  const count = Math.min(MAX_SPREADS, Math.max(minCount, Math.ceil(photos.length / perSpread)));
  return Array.from({ length: count }, (_, k) =>
    Array.from({ length: perSpread }, (_, i) => photos[k * perSpread + i] ?? null));
}

// Смена шаблона: берём фото в текущем порядке и раскладываем заново.
export const relayout = (spreads: Spread[], perSpread: number): Spread[] =>
  layout(spreads.flat().filter((p): p is Photo => !!p), perSpread, spreads.length);