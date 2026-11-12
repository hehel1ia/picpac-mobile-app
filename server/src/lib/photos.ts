export const PHOTOS_BUCKET = 'photos';


export const ALLOWED_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const PREVIEW_MAX_SIDE = 800;
export const SIGNED_URL_TTL_SEC = 60 * 60;

const CM_PER_INCH = 2.54;


export function previewPath(storagePath: string): string {
  return `${storagePath.replace(/\.[^./]+$/, '')}_preview.jpg`;
}

export interface SizeCm {
  w: number;
  h: number;
}

export function parseFormatCm(format: unknown): SizeCm | null {
  if (typeof format !== 'string') return null;
  const m = /^(\d+(?:[.,]\d+)?)\s*[xх×]\s*(\d+(?:[.,]\d+)?)$/i.exec(format.trim());
  const a = m?.[1];
  const b = m?.[2];
  if (!a || !b) return null;
  const w = Number(a.replace(',', '.'));
  const h = Number(b.replace(',', '.'));
  return w > 0 && h > 0 ? { w, h } : null;
}


export function effectiveDpi(
  photo: { width: number; height: number },
  target: SizeCm,
  fit: 'cover' | 'contain',
  matchOrientation: boolean,
): number {
  let tw = target.w;
  let th = target.h;
  if (matchOrientation && (photo.width >= photo.height) !== (tw >= th)) {
    [tw, th] = [th, tw];
  }
  const rw = photo.width / (tw / CM_PER_INCH);
  const rh = photo.height / (th / CM_PER_INCH);
  return Math.round(fit === 'contain' ? Math.max(rw, rh) : Math.min(rw, rh));
}
