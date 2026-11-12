import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from './index.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      db?: SupabaseClient;
    }
  }
}
