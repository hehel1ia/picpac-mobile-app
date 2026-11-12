create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'support', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  category text not null,
  name text not null,
  description text,
  min_photos int not null,
  max_photos int not null,
  min_px int not null,
  lead_days int not null,
  currency text not null default 'BYN',
  variants jsonb not null,
  active boolean not null default true
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id),
  variant_name text not null,
  status text not null default 'draft' check (status in ('draft', 'ordered')),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  storage_path text not null,
  file_name text,
  width int,
  height int,
  position int not null,
  fit text not null default 'cover',
  created_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  code text primary key,
  discount_percent numeric not null check (discount_percent between 0 and 100),
  active boolean not null default true
);

create sequence if not exists public.order_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  product_name text not null,
  variant_name text not null,
  qty int not null check (qty > 0),
  photos_count int not null default 0,
  delivery text not null,
  promo_code text,
  subtotal numeric (10,2) not null,
  discount numeric (10,2) not null,
  delivery_cost numeric (10,2) not null,
  total numeric (10,2) not null,
  currency text not null default 'BYN',
  status int not null default 0 check (status between 0 and 4),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status int not null,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  assignee uuid references auth.users(id),
  sla_due_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  object text,
  result text not null,
  created_at timestamptz not null default now()
);


create or replace function public.handle_new_user() 
returns trigger
language plpgsql 
security definer 
set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Гость'));
  return new;
end;
$$;


drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created 
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_staff() 
returns boolean
language sql 
security definer 
stable 
set search_path = public as $$
  select exists (
    select 1 from profiles 
    where id = auth.uid() and role in ('support', 'admin')
  );
$$;

create or replace function public.log_action(p_action text, p_object text, p_result text)
returns void 
language sql 
security definer 
set search_path = public as $$
  insert into audit_log(user_id, action, object, result) 
  values (auth.uid(), p_action, p_object, p_result);
$$;


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
    raise exception 'Войдите в аккаунт'; 
  end if;

  select * into v_old from orders 
  where user_id = v_uid and idempotency_key = p_key;
  
  if found then 
    return v_old; 
  end if;

  select * into v_proj from projects 
  where id = p_project_id and user_id = v_uid;
  
  if not found then 
    raise exception 'Проект не найден'; 
  end if;

  select * into v_prod from products 
  where id = v_proj.product_id;

  select count(*) into v_cnt from project_photos 
  where project_id = p_project_id;

  select (v->>'price')::numeric into v_unit
  from jsonb_array_elements(v_prod.variants) v 
  where v->>'name' = v_proj.variant_name 
  limit 1;

  if v_unit is null then 
    raise exception 'Вариант продукта не найден'; 
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
    raise exception 'Неизвестный способ получения'; 
  end if;

  if coalesce(trim(p_promo), '') <> '' then
    select discount_percent into v_pct from promo_codes
    where code = upper(trim(p_promo)) and active;
    
    if not found then 
      raise exception 'Промокод не найден'; 
    end if;
  end if;

  v_sub := round(v_unit * p_qty, 2);
  v_disc := round(v_sub * v_pct / 100, 2);

  insert into orders (
    number, user_id, project_id, product_name, variant_name, 
    qty, photos_count, delivery, promo_code, subtotal, 
    discount, delivery_cost, total, currency, idempotency_key
  )
  values (
    'PP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_seq')::text, 4, '0'),
    v_uid, p_project_id, v_prod.name, v_proj.variant_name, p_qty, v_cnt,
    p_delivery, nullif(upper(trim(p_promo)), ''), v_sub, v_disc, v_del,
    v_sub - v_disc + v_del, v_prod.currency, p_key
  )
  returning * into v_ord;

  insert into order_status_history(order_id, status, changed_by) 
  values (v_ord.id, 0, v_uid);

  update projects 
  set status = 'ordered', updated_at = now() 
  where id = p_project_id;

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
  if not is_staff() then 
    raise exception 'Недостаточно прав'; 
  end if;

  update orders 
  set status = p_status 
  where id = p_order;

  insert into order_status_history(order_id, status, changed_by) 
  values (p_order, p_status, auth.uid());

  insert into audit_log(user_id, action, object, result) 
  values (auth.uid(), 'set_status', p_order::text, 'ok');
end;
$$;


create or replace function public.delete_my_account() 
returns void
language plpgsql 
security definer 
set search_path = public as $$
begin
  if auth.uid() is null then 
    raise exception 'Войдите в аккаунт'; 
  end if;

  insert into audit_log(user_id, action, object, result) 
  values (auth.uid(), 'delete_account', auth.uid()::text, 'ok');

  delete from auth.users 
  where id = auth.uid();
end;
$$;

alter table profiles enable row level security;
alter table products enable row level security;
alter table projects enable row level security;
alter table project_photos enable row level security;
alter table promo_codes enable row level security;
alter table orders enable row level security;
alter table order_status_history enable row level security;
alter table support_tickets enable row level security;
alter table audit_log enable row level security;



drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated using (id = auth.uid() or is_staff());

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated using (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

drop policy if exists products_read on products;
create policy products_read on products for select to anon, authenticated using (active);

drop policy if exists projects_own on projects;
create policy projects_own on projects for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists photos_own on project_photos;
create policy photos_own on project_photos for all to authenticated
using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()))
with check (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));

drop policy if exists orders_read on orders;
create policy orders_read on orders for select to authenticated using (user_id = auth.uid() or is_staff());

drop policy if exists history_read on order_status_history;
create policy history_read on order_status_history for select to authenticated
using (is_staff() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists tickets_read on support_tickets;
create policy tickets_read on support_tickets for select to authenticated
using (user_id = auth.uid() or is_staff());

drop policy if exists tickets_insert on support_tickets;
create policy tickets_insert on support_tickets for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists tickets_update on support_tickets;
create policy tickets_update on support_tickets for update to authenticated using (is_staff());

drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log for select to authenticated using (is_staff());


insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists photos_storage_own on storage.objects;
create policy photos_storage_own on storage.objects for all to authenticated
using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
