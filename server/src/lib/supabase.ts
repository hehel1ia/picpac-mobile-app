import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

const noSession = { persistSession: false, autoRefreshToken: false } as const;

/**
 * Клиент с ключом service_role: обходит RLS.
 * Только для сервера: проверка токена, журнал, админские операции, seed.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  { auth: noSession },
);

/** Клиент с публичным ключом без входа: для общедоступных данных (каталог), RLS действует. */
export const supabasePublic: SupabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
  auth: noSession,
});

/** Клиент от имени пользователя: действуют RLS и права на функции. */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: noSession,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
