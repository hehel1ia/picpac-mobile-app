import { createContext, ReactNode, useContext, useState } from 'react';

export interface CartItem { id: string; kind: 'print' | 'album'; title: string; details: string; total: number; payload?: unknown }
interface Ctx { items: CartItem[]; addItem: (i: Omit<CartItem, 'id'>) => void; removeItem: (id: string) => void; clear: () => void }

const CartCtx = createContext<Ctx>({ items: [], addItem: () => {}, removeItem: () => {}, clear: () => {} });
export const useCart = () => useContext(CartCtx);

// Корзина хранится в памяти приложения. Позже сохраним черновик в Supabase (таблицы projects и project_photos).
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const addItem: Ctx['addItem'] = (i) => setItems((a) => [...a, { ...i, id: String(Date.now() + Math.random()) }]);
  const removeItem = (id: string) => setItems((a) => a.filter((x) => x.id !== id));
  return <CartCtx.Provider value={{ items, addItem, removeItem, clear: () => setItems([]) }}>{children}</CartCtx.Provider>;
}
