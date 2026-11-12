import { Router } from 'express';
import { z } from 'zod';
import { AppError, fromDbError } from '../lib/errors.js';
import { supabasePublic } from '../lib/supabase.js';

export const catalogRouter = Router();

interface Variant {
  name: string;
  price: number;
  options?: Record<string, unknown>;
}

interface ProductRow {
  id: string;
  category: string;
  name: string;
  description: string | null;
  min_photos: number;
  max_photos: number;
  min_px: number;
  min_dpi: number;
  lead_days: number;
  currency: string;
  pricing: 'per_item' | 'per_photo';
  variants: Variant[];
}

const PRODUCT_FIELDS =
  'id, category, name, description, min_photos, max_photos, min_px, min_dpi, lead_days, currency, pricing, variants';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Формат карточки продукта для клиента.
 * price_unit: 'per_photo' - цена варианта за одно фото (фотопечать),
 *             'per_item'  - цена варианта за одно изделие (фотокниги).
 * estimated_ready_at: ориентировочная дата готовности, ISO 8601 в UTC (сегодня + lead_days).
 */
function toProduct(row: ProductRow) {
  const { pricing, ...rest } = row;
  const prices = row.variants.map((v) => v.price);
  return {
    ...rest,
    from_price: prices.length > 0 ? Math.min(...prices) : null,
    price_unit: pricing,
    estimated_ready_at: new Date(Date.now() + row.lead_days * DAY_MS).toISOString(),
  };
}

const listQuery = z.object({
  category: z.enum(['print', 'photobook']).optional(),
});

const idParam = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,50}$/, 'Некорректный идентификатор продукта'),
});

/** Список продуктов. Необязательный фильтр: ?category=print|photobook */
catalogRouter.get('/', async (req, res) => {
  const { category } = listQuery.parse(req.query);

  let query = supabasePublic.from('products').select(PRODUCT_FIELDS).order('category').order('name');
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw fromDbError(error);

  res.json({ products: (data as ProductRow[]).map(toProduct) });
});

/** Один продукт с вариантами и шаблонами раскладки. */
catalogRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);

  const [productRes, templatesRes] = await Promise.all([
    supabasePublic.from('products').select(PRODUCT_FIELDS).eq('id', id).maybeSingle(),
    supabasePublic
      .from('templates')
      .select('id, name, description, pages, slots')
      .eq('product_id', id)
      .order('id'),
  ]);
  if (productRes.error) throw fromDbError(productRes.error);
  if (templatesRes.error) throw fromDbError(templatesRes.error);
  if (!productRes.data) throw new AppError(404, 'NOT_FOUND', 'Продукт не найден');

  res.json({
    product: toProduct(productRes.data as ProductRow),
    templates: templatesRes.data,
  });
});
