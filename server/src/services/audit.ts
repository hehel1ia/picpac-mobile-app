import { supabaseAdmin } from '../lib/supabase.js';

export type AuditResult = 'ok' | 'denied' | 'error';


export async function logAction(
  userId: string | null,
  action: string,
  object: string | null,
  result: AuditResult,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('log_action', {
      p_user: userId,
      p_action: action,
      p_object: object,
      p_result: result,
    });
    if (error) console.error('[audit] не удалось записать журнал:', error.message);
  } catch (e) {
    console.error('[audit] не удалось записать журнал:', e);
  }
}
