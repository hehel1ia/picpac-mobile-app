// Пока каталог — mock. На этапе 4 заменим тело getProducts() на запрос в Supabase:
//   const { data, error } = await supabase.from('products').select('*'); if (error) throw error; return data;
export interface Product {
  id: string; category: string; name: string; description: string;
  minPhotos: number; minPx: number; leadDays: number; currency: 'BYN';
  variants: { name: string; price: number }[];
}

const MOCK: Product[] = [
  { id: 'book', category: 'Книги', name: 'Фотокнига 20×20', description: 'Твёрдая обложка, 20 разворотов', minPhotos: 10, minPx: 1200, leadDays: 5, currency: 'BYN', variants: [{ name: 'Матовая', price: 38 }, { name: 'Глянцевая', price: 41 }] },
  { id: 'print', category: 'Печать', name: 'Фотопечать 10×15', description: 'Бумага 200 г/м², цена за снимок', minPhotos: 1, minPx: 1000, leadDays: 1, currency: 'BYN', variants: [{ name: 'Матовая', price: 0.45 }, { name: 'Глянцевая', price: 0.45 }] },
  { id: 'canvas', category: 'Печать', name: 'Холст 30×40', description: 'Печать на холсте, подрамник', minPhotos: 1, minPx: 2400, leadDays: 4, currency: 'BYN', variants: [{ name: '30×40', price: 42 }, { name: '40×60', price: 68 }] },
];

export async function getProducts(): Promise<Product[]> {
  await new Promise((r) => setTimeout(r, 400)); // имитация сети
  return MOCK;
}

export const priceText = (n: number, cur = 'BYN') => `${n.toFixed(2).replace('.', ',')} ${cur}`;
