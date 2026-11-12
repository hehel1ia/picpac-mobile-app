import type { Adjust, Filter } from '../types/order';

// Матрица 4×5 построчно (R, G, B, A). 5-й столбец это смещение в долях 0..1.
type M = number[];
const I: M = [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0];

// Применить b, затем a
function mul(a: M, b: M): M {
  const r: M = new Array(20).fill(0);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[i * 5 + k] * b[k * 5 + j];
    r[i * 5 + j] = s + (j === 4 ? a[i * 5 + 4] : 0);
  }
  return r;
}
const diag = (sr: number, sg: number, sb: number, or = 0, og = 0, ob = 0): M =>
  [sr,0,0,0,or, 0,sg,0,0,og, 0,0,sb,0,ob, 0,0,0,1,0];

const GRAY: M = [0.2126,0.7152,0.0722,0,0, 0.2126,0.7152,0.0722,0,0, 0.2126,0.7152,0.0722,0,0, 0,0,0,1,0];
const SEPIA: M = [0.393,0.769,0.189,0,0, 0.349,0.686,0.168,0,0, 0.272,0.534,0.131,0,0, 0,0,0,1,0];

const FILTER: Record<Filter, M> = {
  'Оригинал': I, 'Ч/Б': GRAY, 'Сепия': SEPIA,
  'Тёплый': diag(1.08, 1, 0.9), 'Холодный': diag(0.9, 1, 1.08),
};

// Приближённо: экспозиция/свет/тени это общий сдвиг яркости, контраст это масштаб вокруг 0.5.
export function buildMatrix(filter: Filter, a: Adjust): M {
  const bright = ((a.exposure + a.light * 0.6 + a.shadows * 0.3) / 100) * 0.3;
  const k = 1 + a.contrast / 100;
  const base = 0.5 * (1 - k) + bright;
  const t = (a.temperature / 100) * 0.12;
  const ti = (a.tint / 100) * 0.1;
  const adjust = diag(k, k, k, base + t, base - ti, base - t);
  return mul(adjust, FILTER[filter]);
}

export const isIdentity = (m: M) => m.every((v, i) => Math.abs(v - I[i]) < 1e-6);