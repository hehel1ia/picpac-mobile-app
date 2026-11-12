import type { Request, RequestHandler } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../lib/errors.js';
import { createUserClient, supabaseAdmin } from '../lib/supabase.js';
import { logAction } from '../services/audit.js';
import { ROLES, type AuthUser, type Role } from '../types/index.js';

/**
 * Проверяет токен Supabase из заголовка Authorization: Bearer <token>,
 * определяет роль по таблице profiles и кладёт в req.user и req.db.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Войдите в аккаунт');

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Сессия истекла, войдите снова');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) {
    console.error('[auth] не удалось прочитать профиль:', profileError.message);
    throw new AppError(500, 'INTERNAL', 'Ошибка сервера, попробуйте ещё раз');
  }

  // Нет профиля или неизвестная роль: даём минимальные права
  const role: Role = ROLES.find((r) => r === profile?.role) ?? 'customer';

  req.user = {
    id: data.user.id,
    email: data.user.email ?? null,
    isAnonymous: data.user.is_anonymous ?? false,
    role,
  };
  req.db = createUserClient(token);
  next();
};

/**
 * Пускает только указанные роли, иначе 403 и запись в журнал.
 * Использовать после requireAuth: router.use(requireAuth, requireRole('admin'))
 */
export function requireRole(...allowed: Role[]): RequestHandler {
  return async (req, _res, next) => {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Войдите в аккаунт');
    if (!allowed.includes(req.user.role)) {
      await logAction(req.user.id, 'access_denied', `${req.method} ${req.baseUrl}${req.path}`, 'denied');
      throw new AppError(403, 'FORBIDDEN', 'Недостаточно прав');
    }
    next();
  };
}

/** Достаёт пользователя и его клиент БД из запроса (после requireAuth). */
export function authed(req: Request): { user: AuthUser; db: SupabaseClient } {
  if (!req.user || !req.db) throw new AppError(401, 'UNAUTHORIZED', 'Войдите в аккаунт');
  return { user: req.user, db: req.db };
}
