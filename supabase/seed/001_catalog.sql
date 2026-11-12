
update public.templates set active = false
  where product_id in ('polaroid', 'canvas', 'photobook-soft', 'photobook-hard', 'calendar');
update public.products set active = false
  where id in ('polaroid', 'canvas', 'photobook-soft', 'photobook-hard', 'calendar');

insert into public.products
  (id, category, name, description, min_photos, max_photos, min_px, min_dpi, lead_days, currency, pricing, variants, active)
values
('print', 'print', 'Фотопечать',
 'Фотохимическая печать на фотобумаге Lucky, матовой или глянцевой. Цена за один отпечаток.',
 1, 300, 600, 150, 3, 'BYN', 'per_photo',
 '[{"name":"10x15 матовая","price":1.30,"options":{"format":"10x15","paper":"matte","file_px":"1205x1795"}},
   {"name":"10x15 глянцевая","price":1.30,"options":{"format":"10x15","paper":"gloss","file_px":"1205x1795"}},
   {"name":"15x20 матовая","price":1.60,"options":{"format":"15x20","paper":"matte","file_px":"1795x2398"}},
   {"name":"15x20 глянцевая","price":1.60,"options":{"format":"15x20","paper":"gloss","file_px":"1795x2398"}},
   {"name":"20x30 матовая","price":3.20,"options":{"format":"20x30","paper":"matte","file_px":"2398x3602"}},
   {"name":"20x30 глянцевая","price":3.20,"options":{"format":"20x30","paper":"gloss","file_px":"2398x3602"}}]'::jsonb, true),

('print-digital', 'print', 'Цифровая фотопечать',
 'Мини-снимки на профессиональном цифровом оборудовании, матовые или глянцевые. Цена за один отпечаток.',
 1, 304, 600, 150, 3, 'BYN', 'per_photo',
 '[{"name":"10x15 матовая","price":0.61,"options":{"format":"10x15","paper":"matte","file_px":"1205x1795"}},
   {"name":"10x15 глянцевая","price":0.61,"options":{"format":"10x15","paper":"gloss","file_px":"1205x1795"}},
   {"name":"15x20 матовая","price":1.50,"options":{"format":"15x20","paper":"matte","file_px":"1795x2398"}},
   {"name":"15x20 глянцевая","price":1.50,"options":{"format":"15x20","paper":"gloss","file_px":"1795x2398"}},
   {"name":"20x30 матовая","price":2.90,"options":{"format":"20x30","paper":"matte","file_px":"2398x3602"}},
   {"name":"20x30 глянцевая","price":2.90,"options":{"format":"20x30","paper":"gloss","file_px":"2398x3602"}}]'::jsonb, true),

('photobook-lite', 'photobook', 'Фотокнига Lite',
 'Твёрдая книжная обложка, гибкие журнальные страницы (0,12 мм), есть форзац. До 160 страниц, от 24.',
 25, 400, 800, 150, 3, 'BYN', 'per_item',
 '[{"name":"25x25","price":90.00,"options":{"format":"25x25","cover":"hard","lamination":"none","min_pages":24,"max_pages":160}}]'::jsonb, true),

('photobook-classic', 'photobook', 'Фотокнига Classic',
 'Твёрдая глянцевая обложка, плотные листы (0,28 мм) с ламинацией, раскрытие на 180 градусов. От 10 до 30 разворотов.',
 20, 200, 800, 150, 3, 'BYN', 'per_item',
 '[{"name":"20x20","price":81.00,"options":{"format":"20x20","cover":"hard","lamination":"gloss","min_spreads":10,"max_spreads":30}}]'::jsonb, true),

('photobook-premium', 'photobook', 'Фотокнига Premium',
 'Твёрдая обложка, матовая фотобумага, очень плотные развороты (1 мм), точная цветопередача. От 5 разворотов.',
 15, 200, 800, 150, 3, 'BYN', 'per_item',
 '[{"name":"21x30","price":130.00,"options":{"format":"21x30","cover":"hard","lamination":"matte","min_spreads":5,"max_spreads":30}}]'::jsonb, true)
on conflict (id) do update set
  category = excluded.category, name = excluded.name, description = excluded.description,
  min_photos = excluded.min_photos, max_photos = excluded.max_photos, min_px = excluded.min_px,
  min_dpi = excluded.min_dpi, lead_days = excluded.lead_days, currency = excluded.currency,
  pricing = excluded.pricing, variants = excluded.variants, active = excluded.active;


do $$
declare p text;
begin
  foreach p in array array['photobook-lite', 'photobook-classic', 'photobook-premium'] loop
    insert into public.templates (id, product_id, name, description, pages, slots) values
    (p || '-full', p, 'Одно фото', 'Фото на весь разворот', 1,
     '[{"id":"s1","x":0.04,"y":0.04,"w":0.92,"h":0.92}]'::jsonb),
    (p || '-duo', p, 'Два фото', 'Два фото рядом', 1,
     '[{"id":"s1","x":0.04,"y":0.04,"w":0.45,"h":0.92},{"id":"s2","x":0.51,"y":0.04,"w":0.45,"h":0.92}]'::jsonb),
    (p || '-trio', p, 'Три фото', 'Одно большое и два маленьких', 1,
     '[{"id":"s1","x":0.04,"y":0.04,"w":0.52,"h":0.92},{"id":"s2","x":0.58,"y":0.04,"w":0.38,"h":0.45},{"id":"s3","x":0.58,"y":0.51,"w":0.38,"h":0.45}]'::jsonb),
    (p || '-grid4', p, 'Сетка 2x2', 'Четыре фото в сетке', 1,
     '[{"id":"s1","x":0.04,"y":0.04,"w":0.45,"h":0.45},{"id":"s2","x":0.51,"y":0.04,"w":0.45,"h":0.45},{"id":"s3","x":0.04,"y":0.51,"w":0.45,"h":0.45},{"id":"s4","x":0.51,"y":0.51,"w":0.45,"h":0.45}]'::jsonb),
    (p || '-collage6', p, 'Коллаж 3x2', 'Шесть фото в сетке', 1,
     '[{"id":"s1","x":0.04,"y":0.04,"w":0.2933,"h":0.45},{"id":"s2","x":0.3533,"y":0.04,"w":0.2933,"h":0.45},{"id":"s3","x":0.6666,"y":0.04,"w":0.2933,"h":0.45},{"id":"s4","x":0.04,"y":0.51,"w":0.2933,"h":0.45},{"id":"s5","x":0.3533,"y":0.51,"w":0.2933,"h":0.45},{"id":"s6","x":0.6666,"y":0.51,"w":0.2933,"h":0.45}]'::jsonb)
    on conflict (id) do update set
      product_id = excluded.product_id, name = excluded.name, description = excluded.description,
      pages = excluded.pages, slots = excluded.slots, active = true;
  end loop;
end $$;


insert into public.delivery_methods (id, name, cost, free_from, min_days, max_days, currency, active, sort) values
('europochta', 'Европочта (пункт выдачи)', 5.90, null, 2, null, 'BYN', true, 10),
('belpost', 'Белпочта', 6.90, 150, 2, 3, 'BYN', true, 20),
('ems', 'EMS (курьер по Беларуси)', 20.90, 300, 1, 2, 'BYN', true, 30),
('courier_minsk', 'Курьер Европочты по Минску', 14.90, null, null, null, 'BYN', true, 40),
('courier_by', 'Курьер Европочты по Беларуси', 19.90, null, null, null, 'BYN', true, 50)
on conflict (id) do update set
  name = excluded.name, cost = excluded.cost, free_from = excluded.free_from,
  min_days = excluded.min_days, max_days = excluded.max_days, currency = excluded.currency,
  active = excluded.active, sort = excluded.sort;


insert into public.promo_codes (code, discount_percent, active) values
('TEST10', 10, true),
('WELCOME5', 5, true)
on conflict (code) do update set discount_percent = excluded.discount_percent, active = excluded.active;
