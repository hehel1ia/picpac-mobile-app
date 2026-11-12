-- 003: функции для API проектов и заказов.
-- Запускать после schema.sql, 01-schema-upd.sql и 002_delivery_pricing.sql.

-- 1) Порядок фото в проекте одним запросом (вместо N отдельных UPDATE).
--    Функция НЕ security definer: RLS-политика photos_own продолжает работать,
--    поэтому пользователь может менять порядок только в своих проектах.
create or replace function public.reorder_project_photos(p_project uuid, p_ids uuid[])
returns void
language plpgsql
set search_path = public as $$
begin
  update project_photos pp
  set position = o.ord - 1
  from unnest(p_ids) with ordinality as o(id, ord)
  where pp.id = o.id
    and pp.project_id = p_project;
end;
$$;

revoke all on function public.reorder_project_photos(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_project_photos(uuid, uuid[]) to authenticated;


-- 2) Расчёт цены для корзины БЕЗ создания заказа.
--    ВАЖНО: логика расчёта скопирована из create_order (002_delivery_pricing.sql).
--    Если меняете формулу цены, меняйте её в обеих функциях
--    (или переделайте create_order так, чтобы она вызывала quote_order).
--    Количество фото (min/max) здесь намеренно НЕ проверяется: корзина должна
--    показывать цену, а лимиты проверяет create_order при оформлении.
create or replace function public.quote_order(
  p_project_id uuid,
  p_qty int,
  p_delivery text,
  p_promo text
)
returns jsonb
language plpgsql
security definer
set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_proj public.projects;
  v_prod public.products;
  v_dm public.delivery_methods;
  v_unit numeric;
  v_cnt int;
  v_pct numeric := 0;
  v_sub numeric;
  v_disc numeric;
  v_del numeric;
begin
  if v_uid is null then
    raise exception 'Войдите в аккаунт' using errcode = '28000';
  end if;
  if p_qty is null or p_qty < 1 then
    raise exception 'Количество должно быть не меньше 1' using errcode = '22023';
  end if;

  select * into v_proj from projects where id = p_project_id and user_id = v_uid;
  if not found then
    raise exception 'Проект не найден' using errcode = 'P0002';
  end if;

  select * into v_prod from products where id = v_proj.product_id;
  select count(*) into v_cnt from project_photos where project_id = p_project_id;

  select (v->>'price')::numeric into v_unit
  from jsonb_array_elements(v_prod.variants) v
  where v->>'name' = v_proj.variant_name
  limit 1;
  if v_unit is null then
    raise exception 'Вариант продукта не найден' using errcode = 'P0002';
  end if;

  if v_prod.pricing = 'per_photo' then
    v_unit := v_unit * greatest(v_cnt, 1);
  end if;

  select * into v_dm from delivery_methods where id = p_delivery and active;
  if not found then
    raise exception 'Неизвестный способ получения' using errcode = '22023';
  end if;

  if coalesce(trim(p_promo), '') <> '' then
    select discount_percent into v_pct from promo_codes
    where code = upper(trim(p_promo)) and active;
    if not found then
      raise exception 'Промокод не найден' using errcode = 'P0002';
    end if;
  end if;

  v_sub  := round(v_unit * p_qty, 2);
  v_disc := round(v_sub * v_pct / 100, 2);
  v_del  := case
    when v_dm.free_from is not null and (v_sub - v_disc) >= v_dm.free_from then 0
    else v_dm.cost
  end;

  return jsonb_build_object(
    'project_id',        p_project_id,
    'product_name',      v_prod.name,
    'variant_name',      v_proj.variant_name,
    'qty',               p_qty,
    'photos_count',      v_cnt,
    'delivery',          p_delivery,
    'promo_code',        nullif(upper(trim(p_promo)), ''),
    'discount_percent',  v_pct,
    'subtotal',          v_sub,
    'discount',          v_disc,
    'delivery_cost',     v_del,
    'total',             v_sub - v_disc + v_del,
    'currency',          v_prod.currency,
    'estimated_ready_at', now() + make_interval(days => v_prod.lead_days)
  );
end;
$$;

revoke all on function public.quote_order(uuid, int, text, text) from public, anon;
grant execute on function public.quote_order(uuid, int, text, text) to authenticated;
