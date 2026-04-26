# JR Lifestyle Ecommerce Launch System

JR Lifestyle now runs on a live Supabase-backed catalog and order system with secure Stripe checkout, a staff admin dashboard, preorder support, product videos, featured homepage controls, and mobile-friendly cart + checkout flows.

Product and storefront changes save to the database and update the site dynamically without waiting for a Netlify rebuild.

## What is included

- Admin login with Supabase Auth
- Product create, edit, delete, search, and filtering
- Product fields for name, price, description, images, videos, sizes, colors, stock, category
- Active, sold out, preorder, and featured homepage product controls
- Multi-image and multi-video uploads with Supabase Storage
- Live storefront product pages backed by Supabase
- Shopping cart with quantity, size, color, subtotal, shipping estimate, and taxes
- Secure Stripe Checkout session creation on the server
- Promo code support through Stripe Checkout
- Success and cancel checkout pages
- Order persistence in Supabase after successful payment
- Admin orders view with paid, processing, shipped, delivered, and canceled statuses
- Customer order confirmation emails through Resend
- Dynamic homepage featured product
- Size guide, return policy, privacy policy, terms, and support/contact pages

## Stack

- React + TanStack Router + React Start
- Supabase database, auth, and storage
- Stripe Checkout
- Netlify-friendly deployment

## How the dynamic updates work

The storefront reads products, media, homepage feature selection, and store settings directly from Supabase at runtime. When staff update the catalog in `/admin`, the public site reflects the new database values immediately instead of waiting for a new Netlify build.

## 1. Install dependencies

```bash
npm install
```

## 2. Create Supabase and Stripe projects

Create:

- one Supabase project
- one Stripe account/project for checkout

From Supabase, copy:

- project URL
- anon/publishable key
- service role key

From Stripe, copy:

- secret key

## 3. Add environment variables

Create a local `.env` file:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
SITE_URL=http://localhost:3000
RESEND_API_KEY=optional_resend_api_key
ORDER_FROM_EMAIL=optional_orders@yourdomain.com
```

Add the same values in Netlify for production. In production, `SITE_URL` should be your real domain.

## 4. Run the Supabase schema

Open Supabase SQL Editor and run:

`supabase/migrations/20260424_ecommerce_checkout.sql`

Then run:

`supabase/migrations/20260426_order_lifecycle_cleanup.sql`

This creates or updates:

- `profiles`
- `products`
- `product_images`
- `product_videos`
- `orders`
- `store_settings`
- storage buckets:
  - `product-images`
  - `product-videos`
- row-level security policies

## 5. Create admin or employee users

In Supabase Auth:

1. Create an email/password user for each staff member.
2. Copy the Auth user ID.
3. Insert a matching row into `public.profiles`.

Example:

```sql
insert into public.profiles (id, email, full_name, role)
values
  ('SUPABASE_AUTH_USER_ID', 'staff@jrlifestyle.com', 'JR Admin', 'admin');
```

Use role `admin` or `employee`.

## 6. Start the app locally

```bash
npm run dev
```

Open:

- storefront: `http://localhost:3000`
- admin dashboard: `http://localhost:3000/admin`
- cart: `http://localhost:3000/cart`

## 7. Add products from the admin dashboard

In `/admin` staff can:

- add/edit/delete products
- upload multiple images
- upload multiple videos
- set stock quantity
- toggle active or sold out
- toggle preorder
- choose the featured homepage product
- search and filter products
- adjust shipping, promo code, and tax settings

Product videos are stored in Supabase Storage and autoplay on product pages with muted loop playback.

## 8. Configure Stripe checkout

Checkout session creation is handled server-side in the app using a secure server route. The Stripe secret key is never exposed to browser code.

Supported checkout behavior:

- secure Stripe Checkout redirect
- automatic tax toggle from store settings
- flat-rate shipping
- optional free shipping threshold
- preorder-aware shipping labels for preorder and mixed carts
- promo code field when enabled in admin settings
- preorder items can still be purchased
- repeated checkout attempts from the same bag reuse the existing pending order instead of creating duplicate draft records

## 9. How orders are saved

When checkout starts, the app creates a draft order row in Supabase. After Stripe reports a successful paid session on the success page, the app updates that order with:

- customer name
- customer email
- order number
- total
- items
- shipping address
- payment status
- Stripe checkout session ID
- Stripe payment intent ID
- preorder flag

Paid Stripe orders then appear automatically in the admin orders table.
Pending checkout attempts stay in draft/pending state and can be reviewed separately in the admin order filters.

## 10. Optional customer email confirmations

If `RESEND_API_KEY` and `ORDER_FROM_EMAIL` are set, the app sends a confirmation email after successful payment.

If those env vars are missing, checkout still works and orders still save, but no email is sent.

## 11. Deploy to Netlify

1. Push the repo to GitHub.
2. Connect the repo to Netlify.
3. Add all environment variables in Netlify.
4. Deploy.

Because the storefront reads live data from Supabase, product and homepage updates do not require a new deploy.

## Main files changed

- `src/lib/cart.tsx`  
  Cart context, persistence, totals, and cart actions.
- `src/lib/checkout.ts`  
  Secure server-side Stripe checkout creation and order finalization.
- `src/lib/catalog.ts`  
  Shared product, order, media, settings, and storefront helpers.
- `src/lib/admin.ts`  
  Admin auth, product CRUD, media uploads, store settings, and order status updates.
- `src/routes/admin.tsx`  
  Staff dashboard for products, paid orders, and shipping/tax/promo settings.
- `src/components/admin/product-form-dialog.tsx`  
  Product editor modal with images, videos, preorder, sold out, and featured homepage controls.
- `src/routes/index.tsx`  
  Homepage now reads featured product from Supabase dynamically.
- `src/routes/product.$slug.tsx`  
  Product detail page with media gallery, preorder badge, and add-to-cart flow.
- `src/routes/cart.tsx`  
  Mobile-friendly cart with quantity updates and checkout button.
- `src/routes/checkout.success.tsx`  
  Finalizes Stripe order and clears the cart.
- `src/routes/checkout.cancel.tsx`  
  Checkout cancel page.
- `src/components/site-nav.tsx`  
  Live cart count in navigation.
- `src/components/product-card.tsx`  
  Preorder/sold-out badges on storefront cards.
- `src/components/site-footer.tsx`  
  Footer links for store policy pages.
- `src/routes/size-guide.tsx`
- `src/routes/return-policy.tsx`
- `src/routes/privacy-policy.tsx`
- `src/routes/terms-of-service.tsx`  
  Added customer-facing support and policy pages.
- `src/integrations/supabase/types.ts`  
  Updated generated Supabase types for ecommerce features.
- `supabase/migrations/20260424_ecommerce_checkout.sql`  
  Database/storage schema for products, videos, orders, preorder, and store settings.

## Notes

- Stripe webhooks are not required for the current flow because order finalization happens from the secure success route, but adding webhooks later would make fulfillment even more robust.
- Product, homepage, preorder, and store settings updates are database-driven and do not trigger a full Netlify rebuild.
