import { Router } from 'express';
import { z } from 'zod';
import { AppError, fromDbError, unwrap } from '../lib/errors.js';
import { authed } from '../middleware/auth.js';
import { orderStatusLabel } from '../types/index.js';

export const ordersRouter = Router();

interface OrderRow {
  id: string;
  number: string;
  project_id: string | null;
  product_name: string;
  variant_name: string;
  qty: number;
  photos_count: number;
  delivery: string;
  promo_code: string | null;
  subtotal: number;
  discount: number;
  delivery_cost: number;
  total: number;
  currency: string;
  status: number;
  created_at: string;
  due_at: string | null;
  completed_at: string | null;
}

const ORDER_FIELDS =
  'id, number, project_id, product_name, variant_name, qty, photos_count, delivery, promo_code, ' +
  'subtotal, discount, delivery_cost, total, currency, status, created_at, due_at, completed_at';


function toOrderDto(row: OrderRow) {
  return {
    id: row.id,
    number: row.number,
    project_id: row.project_id,
    product_name: row.product_name,
    variant_name: row.variant_name,
    qty: row.qty,
    photos_count: row.photos_count,
    delivery: row.delivery,
    promo_code: row.promo_code,
    subtotal: row.subtotal,
    discount: row.discount,
    delivery_cost: row.delivery_cost,
    total: row.total,
    currency: row.currency,
    status: row.status,
    status_label: orderStatusLabel(row.status),
    created_at: row.created_at,
    due_at: row.due_at,
    completed_at: row.completed_at,
  };
}



const idParam = z.object({ id: z.uuid() });


const idempotencyKey = z
  .string()
  .regex(/^[A-Za-z0-9_-]{16,100}$/, 'Заголовок Idempotency-Key должен быть уникальным ключом (например, UUID)');

const quoteBody = z.strictObject({
  project_id: z.uuid(),
  qty: z.number().int().min(1, 'Минимум 1').max(1000).default(1),
  delivery: z.string().regex(/^[a-z0-9_-]{1,40}$/, 'Некорректный способ получения'),
  promo_code: z.string().trim().max(40).nullable().optional(),
});

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const normalizePromo = (code: string | null | undefined): string | null => {
  const v = (code ?? '').trim().toUpperCase();
  return v === '' ? null : v;
};


ordersRouter.post('/quote', async (req, res) => {
  const { db } = authed(req);
  const body = quoteBody.parse(req.body);

  const quote = unwrap(
    await db.rpc('quote_order', {
      p_project_id: body.project_id,
      p_qty: body.qty,
      p_delivery: body.delivery,
      p_promo: body.promo_code ?? null,
    }),
  );
  res.json({ quote });
});


ordersRouter.post('/', async (req, res) => {
  const { user, db } = authed(req);
  const key = idempotencyKey.parse(req.header('Idempotency-Key') ?? '');
  const body = quoteBody.parse(req.body);

  const { data: previous, error: previousError } = await db
    .from('orders')
    .select('project_id, qty, delivery, promo_code')
    .eq('user_id', user.id)
    .eq('idempotency_key', key)
    .maybeSingle();
  if (previousError) throw fromDbError(previousError);

  if (
    previous &&
    (previous.project_id !== body.project_id ||
      previous.qty !== body.qty ||
      previous.delivery !== body.delivery ||
      normalizePromo(previous.promo_code) !== normalizePromo(body.promo_code))
  ) {
    throw new AppError(409, 'CONFLICT', 'Этот ключ уже использован для заказа с другими параметрами');
  }

  const order = unwrap(
    await db.rpc('create_order', {
      p_project_id: body.project_id,
      p_qty: body.qty,
      p_delivery: body.delivery,
      p_promo: body.promo_code ?? null,
      p_key: key,
    }),
  ) as unknown as OrderRow;

  const replayed = previous !== null;
  if (replayed) res.setHeader('Idempotent-Replayed', 'true');
  res.status(replayed ? 200 : 201).json({ order: toOrderDto(order), replayed });
});


ordersRouter.get('/', async (req, res) => {
  const { user, db } = authed(req);
  const { limit, offset } = listQuery.parse(req.query);

  const { data, error } = await db
    .from('orders')
    .select(ORDER_FIELDS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw fromDbError(error);

  res.json({ orders: ((data ?? []) as unknown as OrderRow[]).map(toOrderDto), limit, offset });
});


ordersRouter.get('/:id', async (req, res) => {
  const { db } = authed(req);
  const { id } = idParam.parse(req.params);

  const { data, error } = await db.from('orders').select(ORDER_FIELDS).eq('id', id).maybeSingle();
  if (error) throw fromDbError(error);
  if (!data) throw new AppError(404, 'NOT_FOUND', 'Заказ не найден');

  const history = await db
    .from('order_status_history')
    .select('status, changed_at')
    .eq('order_id', id)
    .order('changed_at', { ascending: true })
    .order('id', { ascending: true });
  if (history.error) throw fromDbError(history.error);

  res.json({
    order: toOrderDto(data as unknown as OrderRow),
    status_history: (history.data ?? []).map((h: { status: number; changed_at: string }) => ({
      status: h.status,
      status_label: orderStatusLabel(h.status),
      changed_at: h.changed_at,
    })),
  });
});
