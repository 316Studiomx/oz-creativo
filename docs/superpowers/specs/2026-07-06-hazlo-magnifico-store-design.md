# Hazlo Magnifico Store Design

## Context

Oz Creativo already runs as a Vite + React site deployed on Netlify, with Netlify Functions handling the existing proposal and payment flow. The book store will be added inside the same production site at `ozcreativo.com`, without migrating the full app to Next.js and without touching the existing private proposal payment flow beyond shared environment hygiene.

The store sells one physical product: `Hazlo Magnifico`, by Oz Creativo. The public price is `499 MXN`, shipping inside Mexico is free for the customer, and inventory starts at `100` units. The site must not expose exact stock, internal print cost, package weight, ISBN, publication date, or fulfillment internals.

## Goals

- Create a real purchase flow for one physical book on `ozcreativo.com/libro`.
- Collect Mexican shipping information before payment.
- Create a real Stripe Checkout session from server-calculated totals.
- Confirm payment through a verified Stripe webhook.
- Store paid orders, inventory movements, discounts, coupons, emails, and shipments in Postgres.
- Send real transactional emails through Resend.
- Provide a protected admin panel for orders, inventory, coupons, international quote leads, email logs, and Skydropx shipment work.
- Integrate Skydropx Pro behind a shipping adapter so labels can be created from admin after payment.
- Keep the existing consulting/proposal payment system separate from book commerce.

## Non-Goals

- No print-on-demand through KDP for this checkout.
- No public real-time stock counter.
- No automatic guide creation inside the Stripe webhook.
- No admin-visible secrets.
- No anonymous order editing after checkout.
- No migration to a new frontend framework during this phase.

## Architecture

Use the current Vite app for public routes and admin UI, Netlify Functions for backend APIs, and Netlify Database/Postgres with Drizzle for durable state.

Main additions:

- `src/pages/book` style components mounted from the SPA router logic.
- `src/pages/admin` style components for protected admin screens.
- `netlify/functions/book-*.mts` endpoints for public checkout, international leads, order lookup, admin, webhooks, email, and shipping.
- `netlify/functions/_shared/book/*` modules for totals, coupons, inventory, order state, Stripe, Resend, and Skydropx.
- `db/schema.ts`, `db/migrations`, and seed scripts for product, inventory, discount rules, and optional development data.

The existing proposal files under `netlify/functions/_shared/proposals.mts`, `create-payment.mts`, `stripe-webhook.mts`, and `mercado-pago-webhook.mts` remain the proposal system. The book store receives its own Stripe webhook route so order fulfillment does not share proposal state.

## Public Routes

`/libro`

- Sales page based on the attached HTML visual reference.
- Includes hero, synopsis, purchase card, quantity selector, coupon field, price summary, benefits, A-D105 section, testimonials, author block, international request form, FAQ, and legal/support links.
- Quantity is limited to `1` through `10`.
- National purchase starts from a form that collects name, email, phone, and Mexican shipping address before redirecting to Stripe.

`/gracias`

- Generic post-payment confirmation page.
- Reads a public order reference from the Stripe success URL.
- Shows that the order is being prepared and links to `/pedido/[orderNumber]`.
- Does not claim shipment until a tracking number exists.

`/pedido/[orderNumber]`

- Public order status page.
- Requires an order access token in the URL or a tokenized link sent by email.
- Shows order number, quantity, paid status, shipping status, address summary, and tracking when available.

Legal/support routes:

- `/politica-de-envios`
- `/cambios-devoluciones-cancelaciones`
- `/aviso-de-privacidad`
- `/terminos-y-condiciones`
- `/contacto`

## Pricing And Discounts

The backend is the only source of truth for totals.

Product:

- Unit price: `49900` cents MXN.
- Currency: `MXN`.
- Shipping charged to customer in Mexico: `0`.

Volume rules:

- `1-4` books: no volume discount.
- `5-9` books: `10%`.
- `10` books: `20%`.

Coupon rules:

- Coupons live in Postgres.
- Supported coupon types are `percent` and `fixed`.
- Coupon fields include active state, dates, usage limit, minimum subtotal, minimum quantity, max uses per email, and `stackable`.
- Default behavior: volume discount and coupon are not stackable. The backend applies the better discount unless a coupon is explicitly stackable.
- Coupon redemptions are created only after payment is confirmed.

## Inventory

Inventory is durable and auditable.

- Initial stock: `100`.
- A checkout-created order does not reduce available stock.
- Stock is decremented only after Stripe confirms payment.
- Payment webhook processing must be transactional and idempotent.
- If stock is no longer available when payment is confirmed, the order is flagged for manual resolution instead of silently overselling.
- Every stock change creates an `InventoryMovement`.

## Checkout Flow

1. Buyer opens `/libro`.
2. Buyer selects quantity and optionally enters a coupon.
3. Buyer fills national checkout form.
4. Frontend calls `POST /api/book/checkout/create-session`.
5. Backend validates product, quantity, coupon, address, and inventory availability.
6. Backend creates an order in `checkout_created`.
7. Backend creates a Stripe Checkout Session with metadata containing the order id and order number.
8. Buyer pays through Stripe Checkout.
9. Stripe redirects to `/gracias?order=...`.
10. Stripe sends webhook to `POST /api/book/webhooks/stripe`.
11. Webhook verifies signature, checks idempotency, marks order paid, decrements stock, records coupon redemption, creates order events, queues/sends emails, and sets shipment state to `label_pending`.

The webhook never creates a Skydropx shipment. Guide creation is an admin action after payment.

## Stripe

Use the existing Stripe account configuration where possible, with separate metadata and endpoint routing for book orders.

Required behavior:

- Verify webhook signature using `STRIPE_WEBHOOK_SECRET_BOOK` or a clearly named equivalent.
- Use raw request body for signature verification.
- Process only successful checkout completion events for book orders.
- Store `stripeCheckoutSessionId`, `stripePaymentIntentId`, and processed event ids.
- Ignore duplicate Stripe events safely.
- Reject mismatched totals or missing metadata.

## Skydropx

Use Skydropx Pro through an internal adapter.

Adapter modules:

- `lib/shipping/types.ts`
- `lib/shipping/skydropx.ts`

Core methods:

- `getToken`
- `createQuotation`
- `getQuotationRates`
- `createShipment`
- `getTracking`
- `normalizeRate`
- `normalizeShipment`
- `normalizeError`

Admin flow:

1. Admin opens a paid order with `label_pending`.
2. Admin confirms origin, destination, package dimensions, and quantity.
3. Admin requests Skydropx quotation.
4. Admin reviews available rates, carrier, service, estimated time, and real internal shipping cost.
5. Admin creates the shipment.
6. System stores shipment id, carrier, service, tracking number, tracking URL, label URL, real shipping cost, sanitized raw response, and shipment status.
7. System sends tracking email to the customer.

Shipping package rule:

- `1` book: `300g`, `24 x 17 x 3 cm`.
- Additional books add `180g` each.
- Height scales conservatively by quantity and remains configurable.

## Email

Use Resend with an email outbox/event table to avoid duplicate sends.

Templates:

- Purchase confirmation to buyer after paid webhook.
- Internal paid order notification to `oz@expocuspide.com`.
- Shipment/tracking email after Skydropx guide creation.
- International quote internal notification.
- International quote confirmation to the requester.

Email records include recipient, subject, template, status, provider id, error, related order or lead, and `sentAt`.

Customer confirmation email must include order number, quantity, total paid, free shipping message for Mexico, shipping address, support email, and invoicing instruction.

Shipment email must include carrier, service, tracking number, tracking URL, address, support email, and a clear recommendation to watch for courier calls/messages.

## Admin

Admin runs under `/admin` with server-backed authentication.

Authentication:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `httpOnly`, `secure`, `sameSite` cookie session.
- Session expiration.
- Protected `/admin` and `/api/book/admin/*`.

Screens:

- `/admin/login`
- `/admin`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/inventory`
- `/admin/coupons`
- `/admin/discount-rules`
- `/admin/international-quotes`
- `/admin/emails`
- `/admin/settings`

Admin actions:

- View dashboard metrics.
- View paid orders and fulfillment status.
- Copy customer address.
- Quote shipping with Skydropx.
- Create guide with Skydropx.
- View label PDF.
- Copy tracking number.
- Open tracking URL.
- Re-send allowed emails.
- Add internal order notes.
- Adjust inventory with audit log.
- Create, edit, activate, deactivate, and inspect coupon usage.
- Manage international quote lead statuses.

## Data Model

Minimum tables:

- `products`
- `inventory`
- `inventory_movements`
- `orders`
- `order_items`
- `shipping_addresses`
- `shipments`
- `coupons`
- `coupon_redemptions`
- `discount_rules`
- `international_quote_leads`
- `email_events`
- `processed_stripe_events`
- `order_events`
- `admin_sessions`

Order states:

- `checkout_created`
- `payment_pending`
- `paid`
- `label_pending`
- `label_created`
- `fulfillment_in_progress`
- `shipped`
- `delivered`
- `cancelled`
- `refunded`
- `payment_failed`
- `label_error`

## API Routes

Public:

- `POST /api/book/checkout/create-session`
- `POST /api/book/coupons/validate`
- `POST /api/book/international-quotes`
- `GET /api/book/orders/:orderNumber`

Stripe:

- `POST /api/book/webhooks/stripe`

Admin:

- `POST /api/book/admin/login`
- `POST /api/book/admin/logout`
- `GET /api/book/admin/me`
- `GET /api/book/admin/orders`
- `GET /api/book/admin/orders/:id`
- `POST /api/book/admin/orders/:id/notes`
- `POST /api/book/admin/orders/:id/resend-confirmation`
- `POST /api/book/admin/orders/:id/quote-shipping`
- `POST /api/book/admin/orders/:id/create-shipment`
- `POST /api/book/admin/orders/:id/resend-tracking`
- `GET /api/book/admin/inventory`
- `POST /api/book/admin/inventory/adjust`
- `GET /api/book/admin/coupons`
- `POST /api/book/admin/coupons`
- `PATCH /api/book/admin/coupons/:id`
- `GET /api/book/admin/international-quotes`
- `PATCH /api/book/admin/international-quotes/:id`
- `GET /api/book/admin/emails`
- `POST /api/book/admin/emails/:id/retry`

## Environment Variables

The `.env.example` will include:

- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET_BOOK`
- `RESEND_API_KEY`
- `ORDER_FROM_EMAIL`
- `SUPPORT_EMAIL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `SITE_URL`
- `SKYDROPX_CLIENT_ID`
- `SKYDROPX_CLIENT_SECRET`
- `SKYDROPX_BASE_URL`
- `SKYDROPX_ORIGIN_NAME`
- `SKYDROPX_ORIGIN_COMPANY`
- `SKYDROPX_ORIGIN_PHONE`
- `SKYDROPX_ORIGIN_EMAIL`
- `SKYDROPX_ORIGIN_STREET`
- `SKYDROPX_ORIGIN_EXTERIOR_NUMBER`
- `SKYDROPX_ORIGIN_INTERIOR_NUMBER`
- `SKYDROPX_ORIGIN_NEIGHBORHOOD`
- `SKYDROPX_ORIGIN_CITY`
- `SKYDROPX_ORIGIN_STATE`
- `SKYDROPX_ORIGIN_POSTAL_CODE`
- `SKYDROPX_ORIGIN_COUNTRY`

Missing external configuration must produce admin-facing setup errors, not broken blank screens.

## Testing

Automated tests:

- Price and total calculations.
- Volume discounts.
- Coupon validation and stacking behavior.
- Inventory transitions.
- Order state transitions.
- Stripe webhook idempotency.
- Email idempotency.
- Skydropx adapter with mocked responses.
- Admin auth session basics.

Manual QA:

- `/libro` desktop and mobile.
- Quantity `1`, `5`, and `10` price summaries.
- Valid and invalid coupon.
- Stripe test checkout.
- Stripe webhook replay.
- Paid order appears in admin.
- Stock decreases only after webhook.
- Confirmation email sends once.
- Admin shipping quote.
- Admin shipment creation with Skydropx sandbox or configured test environment.
- Tracking email sends once.
- Legal pages render.
- Production build passes.

## Rollout Plan

Phase 1: database, schema, seed, totals, coupons, inventory, and tests.

Phase 2: `/libro`, checkout form, legal pages, and order status UI.

Phase 3: Stripe Checkout and book-specific Stripe webhook.

Phase 4: Resend email templates and idempotent email events.

Phase 5: admin authentication, dashboard, orders, inventory, coupons, and international leads.

Phase 6: Skydropx adapter, shipping quote, guide creation, tracking, and shipment email.

Phase 7: README, `.env.example`, production deploy, webhook setup notes, and final QA.

## Completion Criteria

The work is complete when:

- `/libro` is live and usable on desktop and mobile.
- A buyer can pay for `Hazlo Magnifico` with Stripe.
- Paid orders are stored in Postgres.
- Inventory is adjusted only after verified payment.
- Confirmation email reaches the buyer.
- Internal purchase email reaches `oz@expocuspide.com`.
- Admin can see the order.
- Admin can quote and create a Skydropx shipment.
- Tracking email reaches the buyer.
- International quote form stores and emails a lead.
- Legal pages are accessible.
- Build, typecheck, and tests pass.
- No secrets are committed.
