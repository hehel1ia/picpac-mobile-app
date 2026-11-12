import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, ensure, fromDbError, unwrap } from '../lib/errors.js';
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  PHOTOS_BUCKET,
  PREVIEW_MAX_SIDE,
  SIGNED_URL_TTL_SEC,
  effectiveDpi,
  parseFormatCm,
  previewPath,
} from '../lib/photos.js';
import { authed } from '../middleware/auth.js';
import { logAction } from '../services/audit.js';

export const projectsRouter = Router();



interface ProjectRow {
  id: string;
  product_id: string;
  variant_name: string;
  template_id: string | null;
  status: 'draft' | 'ordered';
  layout: Record<string, string | null>;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface PhotoRow {
  id: string;
  project_id: string;
  storage_path: string;
  file_name: string | null;
  width: number | null;
  height: number | null;
  position: number;
  fit: string;
  enhanced_path: string | null;
}

interface Variant {
  name: string;
  price: number;
  options?: Record<string, unknown>;
}

interface ProductRow {
  id: string;
  category: string;
  min_photos: number;
  max_photos: number;
  min_px: number;
  min_dpi: number;
  variants: Variant[];
}

const slotsSchema = z.array(
  z.object({ id: z.string(), x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
);
type Slots = z.infer<typeof slotsSchema>;

const PROJECT_FIELDS = 'id, product_id, variant_name, template_id, status, layout, settings, created_at, updated_at';
const PHOTO_FIELDS = 'id, project_id, storage_path, file_name, width, height, position, fit, enhanced_path';
const PRODUCT_FIELDS = 'id, category, min_photos, max_photos, min_px, min_dpi, variants';



const ID_RE = /^[a-z0-9-]{1,50}$/;
const idParam = z.object({ id: z.uuid() });
const photoParams = z.object({ id: z.uuid(), photoId: z.uuid() });

const layoutSchema = z.record(z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, 'Некорректный id слота'), z.uuid().nullable());
const settingsSchema = z.record(z.string(), z.unknown());

const createBody = z.strictObject({

  id: z.uuid().optional(),
  product_id: z.string().regex(ID_RE, 'Некорректный идентификатор продукта'),
  variant_name: z.string().trim().min(1, 'Выберите вариант').max(100),
  template_id: z.string().regex(ID_RE, 'Некорректный идентификатор шаблона').optional(),
  settings: settingsSchema.optional(),
});

const patchBody = z
  .strictObject({
    variant_name: z.string().trim().min(1).max(100).optional(),
    template_id: z.string().regex(ID_RE, 'Некорректный идентификатор шаблона').nullable().optional(),
    layout: layoutSchema.optional(),
    settings: settingsSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Нет данных для изменения');

const listQuery = z.object({ status: z.enum(['draft', 'ordered']).optional() });

const uploadBody = z.object({

  client_id: z.uuid().optional(),
  position: z.coerce.number().int().min(0).max(100000).optional(),
  fit: z.enum(['cover', 'contain']).optional(),
});

const orderBody = z.strictObject({ ids: z.array(z.uuid()).min(1).max(1000) });



async function loadProject(db: SupabaseClient, id: string, opts?: { draftOnly?: boolean }): Promise<ProjectRow> {
  const { data, error } = await db.from('projects').select(PROJECT_FIELDS).eq('id', id).maybeSingle();
  if (error) throw fromDbError(error);
  if (!data) throw new AppError(404, 'NOT_FOUND', 'Проект не найден');
  const project = data as unknown as ProjectRow;
  if (opts?.draftOnly && project.status !== 'draft') {
    throw new AppError(409, 'CONFLICT', 'Проект уже заказан, изменить его нельзя');
  }
  return project;
}

async function loadProduct(db: SupabaseClient, id: string): Promise<ProductRow> {
  const { data, error } = await db.from('products').select(PRODUCT_FIELDS).eq('id', id).maybeSingle();
  if (error) throw fromDbError(error);
  if (!data) throw new AppError(404, 'NOT_FOUND', 'Продукт не найден');
  return data as unknown as ProductRow;
}

async function loadSlots(db: SupabaseClient, templateId: string, productId: string): Promise<Slots> {
  const { data, error } = await db
    .from('templates')
    .select('id, product_id, slots')
    .eq('id', templateId)
    .maybeSingle();
  if (error) throw fromDbError(error);
  if (!data) throw new AppError(422, 'VALIDATION', 'Шаблон не найден');
  if (data.product_id !== productId) {
    throw new AppError(422, 'VALIDATION', 'Этот шаблон не подходит для выбранного продукта');
  }
  const parsed = slotsSchema.safeParse(data.slots);
  return parsed.success ? parsed.data : [];
}

function assertVariant(product: ProductRow, variantName: string): void {
  if (!product.variants.some((v) => v.name === variantName)) {
    throw new AppError(422, 'VALIDATION', 'У этого продукта нет такого варианта');
  }
}

async function loadPhotos(db: SupabaseClient, projectId: string): Promise<PhotoRow[]> {
  const { data, error } = await db
    .from('project_photos')
    .select(PHOTO_FIELDS)
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw fromDbError(error);
  return (data ?? []) as unknown as PhotoRow[];
}


async function signPreviews(db: SupabaseClient, rows: PhotoRow[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (rows.length === 0) return urls;
  const { data, error } = await db.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(
      rows.map((r) => previewPath(r.storage_path)),
      SIGNED_URL_TTL_SEC,
    );
  if (error) {
    console.error('[photos] не удалось подписать ссылки:', error.message);
    return urls;
  }
  for (const item of data) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

function toPhotoDto(row: PhotoRow, urls: Map<string, string>) {
  return {
    id: row.id,
    file_name: row.file_name,
    width: row.width,
    height: row.height,
    position: row.position,
    fit: row.fit,
    has_enhanced: row.enhanced_path !== null,
    preview_url: urls.get(previewPath(row.storage_path)) ?? null,
  };
}

function storagePathsOf(rows: PhotoRow[]): string[] {
  const paths: string[] = [];
  for (const r of rows) {
    paths.push(r.storage_path, previewPath(r.storage_path));
    if (r.enhanced_path) paths.push(r.enhanced_path);
  }
  return paths;
}


async function removeFiles(db: SupabaseClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await db.storage.from(PHOTOS_BUCKET).remove(paths);
  if (error) console.error('[photos] не удалось удалить файлы:', error.message);
}



const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in ALLOWED_MIME) {
      cb(null, true);
    } else {
      cb(new AppError(422, 'VALIDATION', 'Поддерживаются только JPEG, PNG и WebP'));
    }
  },
});


function receivePhoto(req: Request, res: Response, next: NextFunction): void {
  upload.single('photo')(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const mb = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);
        return next(new AppError(413, 'PAYLOAD_TOO_LARGE', `Файл слишком большой (максимум ${mb} МБ)`));
      }
      return next(new AppError(400, 'BAD_REQUEST', 'Не удалось принять файл'));
    }
    next(err);
  });
}



projectsRouter.post('/', async (req, res) => {
  const { user, db } = authed(req);
  const body = createBody.parse(req.body);

  if (body.id) {
    const { data: existing, error } = await db.from('projects').select(PROJECT_FIELDS).eq('id', body.id).maybeSingle();
    if (error) throw fromDbError(error);
    if (existing) {
      res.status(200).json({ project: existing, replayed: true });
      return;
    }
  }

  const product = await loadProduct(db, body.product_id);
  assertVariant(product, body.variant_name);
  if (body.template_id) await loadSlots(db, body.template_id, product.id);

  const row: Record<string, unknown> = {
    user_id: user.id,
    product_id: product.id,
    variant_name: body.variant_name,
  };
  if (body.id !== undefined) row.id = body.id;
  if (body.template_id !== undefined) row.template_id = body.template_id;
  if (body.settings !== undefined) row.settings = body.settings;

  const project = unwrap(await db.from('projects').insert(row).select(PROJECT_FIELDS).single());
  await logAction(user.id, 'create_project', (project as unknown as ProjectRow).id, 'ok');
  res.status(201).json({ project, replayed: false });
});

projectsRouter.get('/', async (req, res) => {
  const { user, db } = authed(req);
  const { status } = listQuery.parse(req.query);

  let query = db
    .from('projects')
    .select(`${PROJECT_FIELDS}, project_photos(count)`)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw fromDbError(error);

  const projects = (data ?? []).map((row) => {
    const { project_photos: counts, ...rest } = row as unknown as ProjectRow & { project_photos?: { count: number }[] };
    return { ...rest, photos_count: counts?.[0]?.count ?? 0 };
  });
  res.json({ projects });
});

projectsRouter.get('/:id', async (req, res) => {
  const { db } = authed(req);
  const { id } = idParam.parse(req.params);

  const project = await loadProject(db, id);
  const photos = await loadPhotos(db, id);
  const urls = await signPreviews(db, photos);

  res.json({ project, photos: photos.map((p) => toPhotoDto(p, urls)) });
});

projectsRouter.patch('/:id', async (req, res) => {
  const { db } = authed(req);
  const { id } = idParam.parse(req.params);
  const body = patchBody.parse(req.body);

  const project = await loadProject(db, id, { draftOnly: true });
  const patch: Record<string, unknown> = {};

  if (body.variant_name !== undefined) {
    assertVariant(await loadProduct(db, project.product_id), body.variant_name);
    patch.variant_name = body.variant_name;
  }

  const templateChanged = body.template_id !== undefined && body.template_id !== project.template_id;
  const nextTemplateId = body.template_id !== undefined ? body.template_id : project.template_id;
  if (body.template_id !== undefined) patch.template_id = body.template_id;

  if (templateChanged && body.layout === undefined) patch.layout = {};

  if (body.layout !== undefined && nextTemplateId === null) {
    throw new AppError(422, 'VALIDATION', 'Сначала выберите шаблон');
  }
  if (nextTemplateId !== null && (templateChanged || body.layout !== undefined)) {
    const slots = await loadSlots(db, nextTemplateId, project.product_id);

    if (body.layout !== undefined) {
      const slotIds = new Set(slots.map((s) => s.id));
      const unknownSlot = Object.keys(body.layout).find((k) => !slotIds.has(k));
      if (unknownSlot) throw new AppError(422, 'VALIDATION', `В шаблоне нет слота «${unknownSlot}»`);

      const photoIds = new Set((await loadPhotos(db, id)).map((p) => p.id));
      const unknownPhoto = Object.values(body.layout).find((v) => v !== null && !photoIds.has(v));
      if (unknownPhoto) throw new AppError(422, 'VALIDATION', 'В раскладке есть фото, которого нет в проекте');

      patch.layout = body.layout;
    }
  }
  if (body.settings !== undefined) patch.settings = body.settings;

  const updated = unwrap(
    await db.from('projects').update(patch).eq('id', id).eq('status', 'draft').select(PROJECT_FIELDS).single(),
  );
  res.json({ project: updated });
});

projectsRouter.delete('/:id', async (req, res) => {
  const { user, db } = authed(req);
  const { id } = idParam.parse(req.params);

  await loadProject(db, id, { draftOnly: true });
  await removeFiles(db, storagePathsOf(await loadPhotos(db, id)));
  ensure(await db.from('projects').delete().eq('id', id).eq('status', 'draft'));

  await logAction(user.id, 'delete_project', id, 'ok');
  res.status(204).end();
});


projectsRouter.post('/:id/photos', receivePhoto, async (req, res) => {
  const { user, db } = authed(req);
  const { id: projectId } = idParam.parse(req.params);
  const body = uploadBody.parse(req.body ?? {});

  const file = req.file;
  if (!file) throw new AppError(400, 'BAD_REQUEST', 'Прикрепите файл в поле «photo»');

  const project = await loadProject(db, projectId, { draftOnly: true });
  const product = await loadProduct(db, project.product_id);


  if (body.client_id) {
    const { data: existing, error } = await db
      .from('project_photos')
      .select(PHOTO_FIELDS)
      .eq('id', body.client_id)
      .eq('project_id', projectId)
      .maybeSingle();
    if (error) throw fromDbError(error);
    if (existing) {
      const row = existing as unknown as PhotoRow;
      res.status(200).json({ photo: toPhotoDto(row, await signPreviews(db, [row])), replayed: true });
      return;
    }
  }

  const existingPhotos = await loadPhotos(db, projectId);
  if (existingPhotos.length >= product.max_photos) {
    throw new AppError(422, 'VALIDATION', `Достигнут лимит: не больше ${product.max_photos} фото в проекте`);
  }

 
  let width: number;
  let height: number;
  let preview: Buffer;
  try {
    const meta = await sharp(file.buffer).metadata();
    const rotated = (meta.orientation ?? 1) >= 5;
    const w = rotated ? meta.height : meta.width;
    const h = rotated ? meta.width : meta.height;
    if (!w || !h) throw new Error('нет размеров');
    width = w;
    height = h;
    preview = await sharp(file.buffer)
      .rotate()
      .resize({ width: PREVIEW_MAX_SIDE, height: PREVIEW_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    throw new AppError(422, 'VALIDATION', 'Не удалось прочитать изображение, файл повреждён');
  }

  const photoId = body.client_id ?? randomUUID();
  const ext = ALLOWED_MIME[file.mimetype as keyof typeof ALLOWED_MIME];

  const storagePath = `${user.id}/${projectId}/${photoId}.${ext}`;
  const thumbPath = previewPath(storagePath);
  const bucket = db.storage.from(PHOTOS_BUCKET);

  const [orig, thumb] = await Promise.all([
    bucket.upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: true }),
    bucket.upload(thumbPath, preview, { contentType: 'image/jpeg', upsert: true }),
  ]);
  if (orig.error || thumb.error) {
    console.error('[photos] ошибка загрузки в хранилище:', orig.error?.message ?? thumb.error?.message);
    await removeFiles(db, [storagePath, thumbPath]);
    throw new AppError(500, 'INTERNAL', 'Не удалось сохранить фото, попробуйте ещё раз');
  }

  const nextPosition = existingPhotos.reduce((max, p) => Math.max(max, p.position), -1) + 1;
  const row: Record<string, unknown> = {
    id: photoId,
    project_id: projectId,
    storage_path: storagePath,
    file_name: file.originalname.slice(0, 200),
    width,
    height,
    position: body.position ?? nextPosition,
    fit: body.fit ?? 'cover',
  };

  const inserted = await db.from('project_photos').insert(row).select(PHOTO_FIELDS).single();
  if (inserted.error) {
    await removeFiles(db, [storagePath, thumbPath]);
    throw fromDbError(inserted.error);
  }
  const photo = inserted.data as unknown as PhotoRow;

  const warnings: string[] = [];
  if (Math.min(width, height) < product.min_px) {
    warnings.push(`Низкое разрешение: меньшая сторона ${Math.min(width, height)} px, рекомендуется от ${product.min_px} px`);
  }

  res.status(201).json({
    photo: toPhotoDto(photo, await signPreviews(db, [photo])),
    warnings,
    replayed: false,
  });
});


projectsRouter.put('/:id/photos/order', async (req, res) => {
  const { db } = authed(req);
  const { id: projectId } = idParam.parse(req.params);
  const { ids } = orderBody.parse(req.body);

  await loadProject(db, projectId, { draftOnly: true });
  const current = new Set((await loadPhotos(db, projectId)).map((p) => p.id));
  if (ids.length !== current.size || new Set(ids).size !== ids.length || !ids.every((x) => current.has(x))) {
    throw new AppError(422, 'VALIDATION', 'Список должен содержать все фото проекта по одному разу');
  }

  ensure(await db.rpc('reorder_project_photos', { p_project: projectId, p_ids: ids }));

  const photos = await loadPhotos(db, projectId);
  const urls = await signPreviews(db, photos);
  res.json({ photos: photos.map((p) => toPhotoDto(p, urls)) });
});

projectsRouter.delete('/:id/photos/:photoId', async (req, res) => {
  const { db } = authed(req);
  const { id: projectId, photoId } = photoParams.parse(req.params);

  const project = await loadProject(db, projectId, { draftOnly: true });
  const { data, error } = await db
    .from('project_photos')
    .select(PHOTO_FIELDS)
    .eq('id', photoId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw fromDbError(error);
  if (!data) throw new AppError(404, 'NOT_FOUND', 'Фото не найдено');

  ensure(await db.from('project_photos').delete().eq('id', photoId).eq('project_id', projectId));
  await removeFiles(db, storagePathsOf([data as unknown as PhotoRow]));


  const cleared = Object.fromEntries(
    Object.entries(project.layout ?? {}).map(([slot, pid]) => [slot, pid === photoId ? null : pid]),
  );
  if (Object.values(project.layout ?? {}).includes(photoId)) {
    ensure(await db.from('projects').update({ layout: cleared }).eq('id', projectId));
  }

  res.status(204).end();
});


interface Issue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  photo_id?: string;
  slot_id?: string;
}


projectsRouter.get('/:id/check', async (req, res) => {
  const { db } = authed(req);
  const { id } = idParam.parse(req.params);

  const project = await loadProject(db, id);
  const product = await loadProduct(db, project.product_id);
  const photos = await loadPhotos(db, id);
  const byId = new Map(photos.map((p) => [p.id, p]));
  const variant = product.variants.find((v) => v.name === project.variant_name);
  const format = parseFormatCm(variant?.options?.['format']);
  const issues: Issue[] = [];

  if (photos.length < product.min_photos) {
    issues.push({
      code: 'NOT_ENOUGH_PHOTOS',
      severity: 'error',
      message: `Добавьте фото: минимум ${product.min_photos}, сейчас ${photos.length}`,
    });
  }
  if (photos.length > product.max_photos) {
    issues.push({
      code: 'TOO_MANY_PHOTOS',
      severity: 'error',
      message: `Слишком много фото: максимум ${product.max_photos}, сейчас ${photos.length}`,
    });
  }

  for (const p of photos) {
    if (p.width && p.height && Math.min(p.width, p.height) < product.min_px) {
      issues.push({
        code: 'LOW_RESOLUTION',
        severity: 'warning',
        photo_id: p.id,
        message: `Низкое разрешение: ${p.width}×${p.height} px, рекомендуется от ${product.min_px} px по меньшей стороне`,
      });
    }
  }

  const dpiWarning = (p: PhotoRow, dpi: number, slotId?: string): Issue => {
    const issue: Issue = {
      code: 'LOW_DPI',
      severity: 'warning',
      photo_id: p.id,
      message: `Низкое качество печати: около ${dpi} dpi, рекомендуется от ${product.min_dpi}`,
    };
    if (slotId !== undefined) issue.slot_id = slotId;
    return issue;
  };

  let totalSlots = 0;
  let filledSlots = 0;

  if (project.template_id) {
    
    const slots = await loadSlots(db, project.template_id, project.product_id);
    totalSlots = slots.length;
    for (const slot of slots) {
      const photoId = project.layout?.[slot.id] ?? null;
      const photo = photoId ? byId.get(photoId) : undefined;
      if (!photo) {
        issues.push({ code: 'EMPTY_SLOT', severity: 'warning', slot_id: slot.id, message: 'Пустая зона: поставьте сюда фото' });
        continue;
      }
      filledSlots += 1;
      if (format && photo.width && photo.height) {
        const target = { w: slot.w * format.w, h: slot.h * format.h };
        const dpi = effectiveDpi({ width: photo.width, height: photo.height }, target, photo.fit === 'contain' ? 'contain' : 'cover', false);
        if (dpi < product.min_dpi) issues.push(dpiWarning(photo, dpi, slot.id));
      }
    }
  } else if (format) {
   
    for (const p of photos) {
      if (!p.width || !p.height) continue;
      const dpi = effectiveDpi({ width: p.width, height: p.height }, format, p.fit === 'contain' ? 'contain' : 'cover', true);
      if (dpi < product.min_dpi) issues.push(dpiWarning(p, dpi));
    }
  }

  res.json({
    can_order: project.status === 'draft' && !issues.some((i) => i.severity === 'error'),
    summary: {
      photos: photos.length,
      min_photos: product.min_photos,
      max_photos: product.max_photos,
      total_slots: totalSlots,
      filled_slots: filledSlots,
    },
    issues,
  });
});
