# JR Lifestyle Product Management System

This project now includes a database-backed admin dashboard for managing products and viewing orders without touching code or triggering a Netlify rebuild for every edit.

## What it includes

- Secure staff login with Supabase Auth
- Admin dashboard at `/admin`
- Product create, edit, and delete
- Multi-image uploads to Supabase Storage
- Product fields for name, price, description, images, sizes, colors, stock quantity, and category
- Active / sold out controls
- Product search and filtering
- Orders page for viewing customer orders
- Public storefront pages that read live products from the database

## Stack

- React + TanStack Router
- Supabase database, auth, and storage
- Netlify-friendly frontend deployment

## How dynamic updates work

The storefront reads products directly from Supabase at runtime. When a staff member updates a product in `/admin`, the site reflects the change from the database instead of waiting for a new Netlify build.

## 1. Install dependencies

Use your preferred Node package manager:

```bash
npm install
```

If you use Bun instead:

```bash
bun install
```

## 2. Create a Supabase project

In Supabase, create a new project and copy:

- Project URL
- Anon / publishable key
- Service role key

## 3. Add environment variables

Create a local `.env` file:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Add the same values in Netlify for production.

## 4. Run the database schema

Open the SQL editor in Supabase and run:

`supabase/migrations/20260423_product_management_system.sql`

That creates:

- `profiles`
- `products`
- `product_images`
- `orders`
- storage bucket: `product-images`
- row-level security policies

## 5. Create staff users

In Supabase Auth:

1. Create an email/password user for each employee.
2. Copy each user ID.
3. Insert a matching row into `profiles`.

Example:

```sql
insert into public.profiles (id, email, full_name, role)
values
  ('SUPABASE_AUTH_USER_ID', 'staff@jrlifestyle.com', 'JR Admin', 'admin');
```

Use `admin` or `employee` as the role.

## 6. Start the app locally

```bash
npm run dev
```

Then open:

- Storefront: `http://localhost:3000` or the Vite URL shown in terminal
- Admin dashboard: `http://localhost:3000/admin`

## 7. Add your first product

1. Sign in at `/admin`
2. Click `Add Product`
3. Fill in product details
4. Upload multiple images
5. Save

The product will appear on:

- `/shop`
- `/drop`
- `/product/[slug]`

without a rebuild.

## 8. Connect customer orders

The admin orders page reads from the `orders` table. If your checkout flow writes completed orders into that table, they will appear automatically in `/admin`.

Suggested order payload:

```sql
insert into public.orders (
  order_number,
  customer_name,
  customer_email,
  status,
  total_amount,
  items,
  shipping_address
) values (
  'JR-1001',
  'Jane Doe',
  'jane@example.com',
  'paid',
  120,
  '[{"productId":"...","name":"Born To Win Tee","quantity":2,"price":60}]'::jsonb,
  '{"city":"Los Angeles","state":"CA"}'::jsonb
);
```

## 9. Deploy to Netlify

1. Push this repo to GitHub
2. Connect it to Netlify
3. Add the same Supabase environment variables in Netlify
4. Deploy

After deployment, product edits continue to update from Supabase directly, so staff can keep managing products without redeploying the site.

## File structure

- `src/routes/admin.tsx` - staff login and dashboard
- `src/components/admin/product-form-dialog.tsx` - product editor modal
- `src/lib/catalog.ts` - shared storefront product helpers and live data fetching
- `src/lib/admin.ts` - admin auth, CRUD, uploads, and orders
- `supabase/migrations/20260423_product_management_system.sql` - database schema and policies
