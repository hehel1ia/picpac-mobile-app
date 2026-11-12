
alter table public.profiles add column if not exists phone text;
 
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
 
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Гость'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;
 
 

alter table public.products add column if not exists min_dpi int not null default 150;
 

create table if not exists public.templates (
  id text primary key,
  product_id text not null references public.products(id),
  name text not null,
  description text,
  pages int not null default 1 check (pages > 0),
  slots jsonb not null check (jsonb_typeof(slots) = 'array'),
  active boolean not null default true
);
 
alter table public.templates enable row level security;
drop policy if exists templates_read on public.templates;
create policy templates_read on public.templates
  for select to anon, authenticated using (active);
 

alter table public.projects add column if not exists template_id text
  references public.templates(id) on delete set null;
alter table public.projects add column if not exists layout jsonb not null default '{}'::jsonb;
 

alter table public.project_photos add column if not exists enhanced_path text;
 

create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
 
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();
 
 

alter table public.orders add column if not exists channel text not null default 'app'
  check (channel in ('app', 'web', 'store'));
alter table public.orders add column if not exists due_at timestamptz;
alter table public.orders add column if not exists completed_at timestamptz;
alter table public.orders add column if not exists is_defective boolean not null default false;
alter table public.orders add column if not exists defect_reason text;
 
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists photos_project_pos_idx on public.project_photos (project_id, position);
 
 

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
 

  if v_prod.id = 'print' then
    v_unit := v_unit * greatest(v_cnt, 1);
  end if;
 
  v_del := case p_delivery
    when 'pickup' then 0
    when 'courier' then 7
    when 'post' then 4.5
    else null
  end;
  if v_del is null then
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
 
create or replace function public.set_order_status(p_order uuid, p_status int)
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Войдите в аккаунт' using errcode = '28000';
  end if;
  if not is_staff() then
    raise exception 'Недостаточно прав' using errcode = '42501';
  end if;
  if p_status is null or p_status not between 0 and 4 then
    raise exception 'Статус должен быть от 0 до 4' using errcode = '22023';
  end if;
 
  update orders
  set status = p_status,
      completed_at = case when p_status = 4 then now() else null end
  where id = p_order;
  if not found then
    raise exception 'Заказ не найден' using errcode = 'P0002';
  end if;
 
  insert into order_status_history(order_id, status, changed_by)
  values (p_order, p_status, auth.uid());
 
  insert into audit_log(user_id, action, object, result)
  values (auth.uid(), 'set_status', p_order::text || ':' || p_status, 'ok');
end;
$$;
 

drop function if exists public.log_action(text, text, text);
 
create or replace function public.log_action(
  p_user uuid, p_action text, p_object text, p_result text
)
returns void
language sql
security definer
set search_path = public as $$
  insert into audit_log(user_id, action, object, result)
  values (p_user, p_action, p_object, p_result);
$$;
 
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.log_action(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.log_action(uuid, text, text, text) to service_role;
 
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated, service_role;
 
revoke all on function public.create_order(uuid, int, text, text, text) from public, anon;
grant execute on function public.create_order(uuid, int, text, text, text) to authenticated;
 
revoke all on function public.set_order_status(uuid, int) from public, anon;
grant execute on function public.set_order_status(uuid, int) to authenticated;
 
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;