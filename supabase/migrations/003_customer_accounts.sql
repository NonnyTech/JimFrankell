begin;
alter table public.store_orders add column customer_id uuid references auth.users(id) on delete set null;
create index store_orders_customer_created on public.store_orders(customer_id, created_at desc);
create table public.store_carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50),
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.store_carts enable row level security;
revoke all on public.store_carts from anon, authenticated;
grant all on public.store_carts to service_role;
commit;
