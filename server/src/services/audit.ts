import { supabaseAdmin } from '../lib/supabase.js';

export type AuditResult = 'ok' | 'denied' | 'error';

/**
 * Запись в журнал audit_log: кто (user_id), когда (created_at), что (action),
 * над чем (object), с каким результатом (result). Не бросает ошибок:
 * сбой журнала не должен ломать основную операцию.
 */
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
