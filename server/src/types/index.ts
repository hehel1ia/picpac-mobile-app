export type Role = 'customer' | 'support' | 'admin';

export const ROLES: readonly Role[] = ['customer', 'support', 'admin'];

export interface AuthUser {
  id: string;
  email: string | null;
  isAnonymous: boolean;
  role: Role;
}
