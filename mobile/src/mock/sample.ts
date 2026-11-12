// Тестовые данные только для оформления экранов. На этапах 4–5 заменяются данными из Supabase.
export const STATUSES = ['Принят', 'Модерация', 'Производство', 'Готов к выдаче', 'Завершён'];

export const SAMPLE_PRODUCT = {
  id: 'book', name: 'Фотокнига 20×20', description: 'Твёрдая обложка, 20 разворотов',
  minPhotos: 10, minPx: 1200, leadDays: 5,
  variants: [{ name: 'Матовая', price: 38 }, { name: 'Глянцевая', price: 41 }],
};

export const SAMPLE_ORDERS = [
  { id: 'PP-2026-0003', product: 'Фотокнига 20×20', variant: 'Матовая', qty: 1, total: 38, status: 2, date: '12.11.2026' },
  { id: 'PP-2026-0002', product: 'Кружка с фото', variant: 'Белая', qty: 2, total: 39, status: 4, date: '03.11.2026' },
  { id: 'PP-2026-0001', product: 'Фотопечать 10×15', variant: 'Глянцевая', qty: 1, total: 13.5, status: 4, date: '28.10.2026' },
];

export const DELIVERY = [
  { id: 'pickup', name: 'Самовывоз', price: 0 },
  { id: 'courier', name: 'Курьер', price: 7 },
  { id: 'post', name: 'Европочта', price: 4.5 },
];
