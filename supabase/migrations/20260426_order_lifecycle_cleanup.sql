do $$
begin
  alter type public.order_status add value if not exists 'draft';
exception
  when duplicate_object then null;
end
$$;

alter table public.orders
add column if not exists checkout_fingerprint text;

update public.orders
set payment_status = 'pending'
where payment_status in ('unpaid', 'open')
   or payment_status is null;

update public.orders
set status = 'draft'
where payment_status = 'pending'
  and status = 'paid';

create index if not exists orders_checkout_fingerprint_idx
on public.orders (checkout_fingerprint, created_at desc);
