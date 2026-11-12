import { Router } from 'express';
import { fromDbError } from '../lib/errors.js';
import { supabasePublic } from '../lib/supabase.js';

export const deliveryRouter = Router();

/**
 * Способы получения. Передавайте id в create_order как delivery.
 * free_from: если сумма товаров после скидки не меньше этого порога, доставка бесплатна.
 * Самовывоза нет: производство закрытое.
 */
deliveryRouter.get('/', async (_req, res) => {
  const { data, error } = await supabasePublic
    .from('delivery_methods')
    .select('id, name, cost, free_from, min_days, max_days, currency')
    .order('sort');
  if (error) throw fromDbError(error);
  res.json({ delivery_methods: data });
});
