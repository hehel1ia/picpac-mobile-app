import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from './index.js';

declare global {
  namespace Express {
    interface Request {
      /** Заполняется middleware requireAuth */
      user?: AuthUser;
      /** Клиент Supabase от имени пользователя: RLS продолжает работать */
      db?: SupabaseClient;
    }
  }
}
