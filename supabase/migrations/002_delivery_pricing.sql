

alter table public.products add column if not exists pricing text not null default 'per_item'
  check (pricing in ('per_item', 'per_photo'));

create table if not exists public.delivery_methods (
  id text primary key,
  name text not null,
  cost numeric(10, 2) not null check (cost >= 0),
  free_from numeric(10, 2) check (free_from is null or free_from > 0),
  min_days int,
  max_days int,
  currency text not null default 'BYN',
  active boolean not null default true,
  sort int not null default 0
);

alter table public.delivery_methods enable row level security;
drop policy if exists delivery_read on public.delivery_methods;
create policy delivery_read on public.delivery_methods
  for select to anon, authenticated using (active);

create or replace function public.create_order(
  p_project_id uuid,
  p_qty int,
  p_delivery text,
  p_promo text,
  p_key text
)
returns public.orders
language plpgsql
security definer
set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_old public.orders;
  v_proj public.projects;
  v_prod public.products;
  v_unit numeric;
  v_cnt int;
  v_pct numeric := 0;
  v_sub numeric;
  v_disc numeric;
  v_del numeric;
  v_ord public.orders;
  v_dm public.delivery_methods;
begin
  if v_uid is null then
    raise exception 'Войдите в аккаунт' using errcode = '28000';
  end if;

  if coalesce(trim(p_key), '') = '' then
    raise exception 'Не передан ключ идемпотентности' using errcode = '22023';
  end if;

  select * into v_old from orders
  where user_id = v_uid and idempotency_key = p_key;
  if found then
    return v_old;
  end if;

  if p_qty is null or p_qty < 1 then
    raise exception 'Количество должно быть не меньше 1' using errcode = '22023';
  end if;

  select * into v_proj from projects
  where id = p_project_id and user_id = v_uid;
  if not found then
    raise exception 'Проект не найден' using errcode = 'P0002';
  end if;

  select * into v_prod from products where id = v_proj.product_id;

  select count(*) into v_cnt from project_photos where project_id = p_project_id;

  if v_cnt < v_prod.min_photos then
    raise exception 'Добавьте фото: минимум %, сейчас %', v_prod.min_photos, v_cnt
      using errcode = '22023';
  end if;
  if v_cnt > v_prod.max_photos then
    raise exception 'Слишком много фото: максимум %, сейчас %', v_prod.max_photos, v_cnt
      using errcode = '22023';
  end if;

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


  v_sub := round(v_unit * p_qty, 2);
  v_disc := round(v_sub * v_pct / 100, 2);
  
  v_del := case
    when v_dm.free_from is not null and (v_sub - v_disc) >= v_dm.free_from then 0
    else v_dm.cost
  end;

  begin
    insert into orders (
      number, user_id, project_id, product_name, variant_name,
      qty, photos_count, delivery, promo_code, subtotal,
      discount, delivery_cost, total, currency, idempotency_key, due_at
    )
    values (
      'PP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_seq')::text, 4, '0'),
      v_uid, p_project_id, v_prod.name, v_proj.variant_name, p_qty, v_cnt,
      p_delivery, nullif(upper(trim(p_promo)), ''), v_sub, v_disc, v_del,
      v_sub - v_disc + v_del, v_prod.currency, p_key,
      now() + make_interval(days => v_prod.lead_days)
    )
    returning * into v_ord;
  exception when unique_violation then
  
    select * into v_old from orders
    where user_id = v_uid and idempotency_key = p_key;
    if found then
      return v_old;
    end if;
    raise;
  end;

  insert into order_status_history(order_id, status, changed_by)
  values (v_ord.id, 0, v_uid);

  update projects set status = 'ordered', updated_at = now() where id = p_project_id;

  insert into audit_log(user_id, action, object, result)
  values (v_uid, 'create_order', v_ord.number, 'ok');

  return v_ord;
end;
$$;
