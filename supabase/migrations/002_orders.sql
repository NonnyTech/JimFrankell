-- Run once in the Supabase SQL editor before deploying order tracking.
begin;
create table public.store_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  request_key uuid not null unique,
  request_hash text not null,
  customer jsonb not null check (jsonb_typeof(customer) = 'object'),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50),
  total numeric(16,2) check (total >= 0),
  status text not null default 'new' check (status in ('new','confirmed','dispatched','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
create index store_orders_status_created on public.store_orders(status, created_at desc);
alter table public.store_orders enable row level security;
revoke all on public.store_orders from anon, authenticated;
grant all on public.store_orders to service_role;
commit;
