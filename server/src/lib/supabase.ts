import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

const noSession = { persistSession: false, autoRefreshToken: false } as const;


export const supabaseAdmin: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  { auth: noSession },
);


export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: noSession,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
