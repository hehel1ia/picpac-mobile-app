export type Role = 'customer' | 'support' | 'admin';

export const ROLES: readonly Role[] = ['customer', 'support', 'admin'];

export interface AuthUser {
  id: string;
  email: string | null;
  isAnonymous: boolean;
  role: Role;
}


export const ORDER_STATUS_LABELS = [
  'Оформлен',
  'В работе',
  'Отправлен',
  'Готов'
] as const;

export function orderStatusLabel(status: number): string {
  return ORDER_STATUS_LABELS[status] ?? 'Неизвестно';
}
