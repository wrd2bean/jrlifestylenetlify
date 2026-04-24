create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'employee');
  end if;

  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type public.product_status as enum ('active', 'sold_out', 'draft');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('paid', 'processing', 'shipped', 'delivered', 'canceled');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'employee',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  is_preorder boolean not null default false,
  featured_homepage boolean not null default false,
  status public.product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  video_url text not null,
  storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null default '',
  customer_email text not null default '',
  status public.order_status not null default 'paid',
  payment_status text not null default 'unpaid',
  preorder boolean not null default false,
  total_amount numeric(10,2) not null check (total_amount >= 0),
  items jsonb not null default '[]'::jsonb,
  shipping_address jsonb,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id text primary key default 'default',
  shipping_flat_rate numeric(10,2) not null default 8,
  free_shipping_threshold numeric(10,2),
  estimated_tax_rate numeric(5,2) not null default 0,
  delivery_notes text not null default 'Orders typically ship within 3-5 business days unless marked as preorder.',
  enable_automatic_tax boolean not null default true,
  allow_promotion_codes boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.handle_updated_at();

create unique index if not exists products_featured_homepage_unique
on public.products (featured_homepage)
where featured_homepage = true;

create index if not exists products_status_idx on public.products (status, is_active);
create index if not exists product_images_product_id_idx on public.product_images (product_id, sort_order);
create index if not exists product_videos_product_id_idx on public.product_videos (product_id, sort_order);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_videos enable row level security;
alter table public.orders enable row level security;
alter table public.store_settings enable row level security;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'employee')
  );
$$;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Staff can view products" on public.products;
create policy "Staff can view products"
on public.products
for select
to authenticated
using (public.is_staff());

drop policy if exists "Staff can manage products" on public.products;
create policy "Staff can manage products"
on public.products
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products
for select
to anon
using (is_active = true and status in ('active', 'sold_out'));

drop policy if exists "Staff can view product images" on public.product_images;
create policy "Staff can view product images"
on public.product_images
for select
to authenticated
using (public.is_staff());

drop policy if exists "Staff can manage product images" on public.product_images;
create policy "Staff can manage product images"
on public.product_images
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Public can view active product images" on public.product_images;
create policy "Public can view active product images"
on public.product_images
for select
to anon
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.is_active = true
      and products.status in ('active', 'sold_out')
  )
);

drop policy if exists "Staff can view product videos" on public.product_videos;
create policy "Staff can view product videos"
on public.product_videos
for select
to authenticated
using (public.is_staff());

drop policy if exists "Staff can manage product videos" on public.product_videos;
create policy "Staff can manage product videos"
on public.product_videos
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Public can view active product videos" on public.product_videos;
create policy "Public can view active product videos"
on public.product_videos
for select
to anon
using (
  exists (
    select 1 from public.products
    where products.id = product_videos.product_id
      and products.is_active = true
      and products.status in ('active', 'sold_out')
  )
);

drop policy if exists "Staff can view orders" on public.orders;
create policy "Staff can view orders"
on public.orders
for select
to authenticated
using (public.is_staff());

drop policy if exists "Staff can manage orders" on public.orders;
create policy "Staff can manage orders"
on public.orders
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "Public can view store settings" on public.store_settings;
create policy "Public can view store settings"
on public.store_settings
for select
to public
using (true);

drop policy if exists "Staff can manage store settings" on public.store_settings;
create policy "Staff can manage store settings"
on public.store_settings
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-videos', 'product-videos', true)
on conflict (id) do nothing;

drop policy if exists "Public can view product images bucket" on storage.objects;
create policy "Public can view product images bucket"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

drop policy if exists "Staff can upload product images bucket" on storage.objects;
create policy "Staff can upload product images bucket"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "Staff can update product images bucket" on storage.objects;
create policy "Staff can update product images bucket"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_staff())
with check (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "Staff can delete product images bucket" on storage.objects;
create policy "Staff can delete product images bucket"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "Public can view product videos bucket" on storage.objects;
create policy "Public can view product videos bucket"
on storage.objects
for select
to public
using (bucket_id = 'product-videos');

drop policy if exists "Staff can upload product videos bucket" on storage.objects;
create policy "Staff can upload product videos bucket"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-videos' and public.is_staff());

drop policy if exists "Staff can update product videos bucket" on storage.objects;
create policy "Staff can update product videos bucket"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-videos' and public.is_staff())
with check (bucket_id = 'product-videos' and public.is_staff());

drop policy if exists "Staff can delete product videos bucket" on storage.objects;
create policy "Staff can delete product videos bucket"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-videos' and public.is_staff());

insert into public.store_settings (
  id,
  shipping_flat_rate,
  free_shipping_threshold,
  estimated_tax_rate,
  delivery_notes,
  enable_automatic_tax,
  allow_promotion_codes
)
values (
  'default',
  8,
  100,
  0,
  'Orders typically ship within 3-5 business days unless marked as preorder.',
  true,
  true
)
on conflict (id) do nothing;
