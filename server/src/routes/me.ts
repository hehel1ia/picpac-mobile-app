import { Router } from 'express';
import { z } from 'zod';
import { authed } from '../middleware/auth.js';
import { unwrap } from '../lib/errors.js';
import { logAction } from '../services/audit.js';

export const meRouter = Router();

const PROFILE_FIELDS = 'id, full_name, phone, role, created_at';

/** Текущий пользователь и его профиль. Нужен клиенту после входа. */
meRouter.get('/', async (req, res) => {
  const { user, db } = authed(req);
  const profile = unwrap(await db.from('profiles').select(PROFILE_FIELDS).eq('id', user.id).single());
  res.json({ user: { id: user.id, email: user.email, isAnonymous: user.isAnonymous }, profile });
});

// strictObject: любые лишние поля (например role) дают ошибку 422
const patchBody = z
  .strictObject({
    full_name: z.string().trim().min(1, 'Введите имя').max(80, 'Не больше 80 символов').optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,20}$/, 'Некорректный номер телефона')
      .nullable()
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Нет данных для изменения');

/** Изменить имя и телефон. Телефон можно очистить, передав null. */
meRouter.patch('/', async (req, res) => {
  const { user, db } = authed(req);
  const body = patchBody.parse(req.body);

  const patch: Record<string, string | null> = {};
  if (body.full_name !== undefined) patch.full_name = body.full_name;
  if (body.phone !== undefined) patch.phone = body.phone;

  const profile = unwrap(
    await db.from('profiles').update(patch).eq('id', user.id).select(PROFILE_FIELDS).single(),
  );
  await logAction(user.id, 'update_profile', user.id, 'ok');
  res.json({ profile });
});
