# Hazlo Magnifico Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real `Hazlo Magnifico` physical-book store on `ozcreativo.com/libro`, with Stripe checkout, Postgres inventory/orders, Resend emails, admin fulfillment, and Skydropx shipment creation.

**Architecture:** Keep the current Vite + React + Netlify Functions app. Add a book-store module with its own route detection, API functions, Postgres schema via Netlify Database + Drizzle, and backend services isolated under `netlify/functions/_shared/book`. Keep the existing proposal/payment flow separate.

**Tech Stack:** Vite, React, TypeScript, Netlify Functions, Netlify Database, Drizzle ORM, Stripe SDK, Resend, Skydropx Pro API, Zod, bcryptjs, Node `node:test`.

---

## Source References

- Design spec: `docs/superpowers/specs/2026-07-06-hazlo-magnifico-store-design.md`
- Netlify Database Drizzle docs: https://docs.netlify.com/build/data-and-storage/netlify-database/tooling/
- Netlify Functions custom paths: https://docs.netlify.com/build/functions/configuration/#routing
- Stripe Checkout Sessions: https://docs.stripe.com/api/checkout/sessions
- Stripe Webhooks: https://docs.stripe.com/webhooks
- Resend Node.js: https://resend.com/docs/send-with-nodejs
- Skydropx Pro API docs: https://pro.skydropx.com/es-MX/api-docs
- Visual references: `/Users/ozybot/Documents/Oz Creativo/outputs/hazlo-magnifico-html-independientes.zip`

## File Structure

Dependencies and config:

- Modify `package.json`: add Netlify Database, Drizzle, Stripe, Resend, Zod, bcryptjs, and scripts.
- Create `drizzle.config.ts`: Drizzle migration output to `netlify/database/migrations`.
- Modify `.gitignore`: ignore local env and database scratch files if missing.
- Create `.env.example`: document all store env vars without secrets.

Database:

- Create `db/schema.ts`: Drizzle tables and enums.
- Create `db/index.ts`: Netlify Database Drizzle client.
- Create `db/seed.mts`: seed product, inventory, discount rules, and optional dev coupon.
- Create `netlify/database/migrations/*`: generated SQL migration.

Shared backend modules:

- Create `netlify/functions/_shared/book/constants.mts`: product constants, statuses, public limits.
- Create `netlify/functions/_shared/book/http.mts`: JSON helpers, method guards, request parsing.
- Create `netlify/functions/_shared/book/validation.mts`: Zod schemas for checkout, coupons, leads, admin.
- Create `netlify/functions/_shared/book/pricing.mts`: totals, volume discounts, coupon math.
- Create `netlify/functions/_shared/book/parcel.mts`: package weight and dimensions.
- Create `netlify/functions/_shared/book/order-numbers.mts`: order numbers and public tokens.
- Create `netlify/functions/_shared/book/stripe.mts`: Stripe session and webhook helpers.
- Create `netlify/functions/_shared/book/email-templates.mts`: HTML/text email templates.
- Create `netlify/functions/_shared/book/email-service.mts`: Resend sending and outbox helpers.
- Create `netlify/functions/_shared/book/auth.mts`: admin login, password verify, signed session cookie.
- Create `netlify/functions/_shared/book/skydropx.mts`: Skydropx adapter.
- Create `netlify/functions/_shared/book/repositories.mts`: Drizzle queries and transactional operations.

API functions:

- Create `netlify/functions/book-checkout-create-session.mts`: `POST /api/book/checkout/create-session`.
- Create `netlify/functions/book-coupon-validate.mts`: `POST /api/book/coupons/validate`.
- Create `netlify/functions/book-international-quotes.mts`: `POST /api/book/international-quotes`.
- Create `netlify/functions/book-order-status.mts`: `GET /api/book/orders/:orderNumber`.
- Create `netlify/functions/book-stripe-webhook.mts`: `POST /api/book/webhooks/stripe`.
- Create `netlify/functions/book-admin-auth.mts`: login/logout/me.
- Create `netlify/functions/book-admin-orders.mts`: order list/detail/notes/resend.
- Create `netlify/functions/book-admin-inventory.mts`: inventory reads and adjustments.
- Create `netlify/functions/book-admin-coupons.mts`: coupon CRUD.
- Create `netlify/functions/book-admin-international-quotes.mts`: lead list/status.
- Create `netlify/functions/book-admin-emails.mts`: email history/retry.
- Create `netlify/functions/book-admin-shipping.mts`: quote shipping and create shipment.

Frontend:

- Modify `src/App.tsx`: detect `/libro`, `/gracias`, `/pedido/:orderNumber`, `/admin`, and legal routes.
- Modify `src/config/copy.ts`: update book CTA to local store instead of pending Amazon.
- Create `src/book/bookCopy.ts`: public book-store copy.
- Create `src/book/api.ts`: typed fetch helpers.
- Create `src/book/BookStorePage.tsx`: sales page and purchase flow.
- Create `src/book/BookCheckoutForm.tsx`: national buyer and address form.
- Create `src/book/InternationalQuoteForm.tsx`: international lead form.
- Create `src/book/OrderStatusPage.tsx`: public tokenized order status.
- Create `src/book/ThankYouPage.tsx`: post-payment page.
- Create `src/book/LegalPages.tsx`: legal/support pages.
- Create `src/admin/AdminApp.tsx`: admin router shell.
- Create `src/admin/AdminLogin.tsx`: login form.
- Create `src/admin/AdminDashboard.tsx`: overview metrics.
- Create `src/admin/AdminOrders.tsx`: order list/detail and shipment actions.
- Create `src/admin/AdminInventory.tsx`: inventory screen.
- Create `src/admin/AdminCoupons.tsx`: coupon screen.
- Create `src/admin/AdminInternationalQuotes.tsx`: lead screen.
- Create `src/admin/AdminEmails.tsx`: email logs.

Tests:

- Create `tests/book-pricing.test.mts`.
- Create `tests/book-parcel.test.mts`.
- Create `tests/book-order-state.test.mts`.
- Create `tests/book-stripe.test.mts`.
- Create `tests/book-email.test.mts`.
- Create `tests/book-skydropx.test.mts`.
- Create `tests/book-routes.test.mts`.

## Task 1: Install Store Tooling And Database Config

**Files:**
- Modify: `package.json`
- Create: `drizzle.config.ts`
- Create: `.env.example`

- [ ] **Step 1: Install dependencies**

Run:

```bash
npm install @netlify/database drizzle-orm@beta stripe resend zod bcryptjs
npm install -D drizzle-kit@beta
```

Expected: `package.json` and `package-lock.json` include the new packages.

- [ ] **Step 2: Add package scripts**

Modify `package.json` scripts so they include:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:seed": "node --experimental-strip-types db/seed.mts"
}
```

Keep existing `dev`, `build`, `preview`, `lint`, and `test` scripts unchanged.

- [ ] **Step 3: Create Drizzle config**

Create `drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: 'netlify/database/migrations',
})
```

- [ ] **Step 4: Create environment example**

Create `.env.example` with this exact content:

```bash
SITE_URL=https://ozcreativo.com

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET_BOOK=

RESEND_API_KEY=
ORDER_FROM_EMAIL=Oz Creativo <pedidos@ozcreativo.com>
SUPPORT_EMAIL=oz@expocuspide.com
ADMIN_EMAIL=oz@expocuspide.com
ADMIN_PASSWORD_HASH=
SESSION_SECRET=

SKYDROPX_CLIENT_ID=
SKYDROPX_CLIENT_SECRET=
SKYDROPX_BASE_URL=https://api.skydropx.com
SKYDROPX_ORIGIN_NAME=
SKYDROPX_ORIGIN_COMPANY=Oz Creativo
SKYDROPX_ORIGIN_PHONE=
SKYDROPX_ORIGIN_EMAIL=oz@expocuspide.com
SKYDROPX_ORIGIN_STREET=
SKYDROPX_ORIGIN_EXTERIOR_NUMBER=
SKYDROPX_ORIGIN_INTERIOR_NUMBER=
SKYDROPX_ORIGIN_NEIGHBORHOOD=
SKYDROPX_ORIGIN_CITY=
SKYDROPX_ORIGIN_STATE=
SKYDROPX_ORIGIN_POSTAL_CODE=
SKYDROPX_ORIGIN_COUNTRY=MX
```

- [ ] **Step 5: Verify config**

Run:

```bash
npm run lint
```

Expected: TypeScript exits successfully or only reports pre-existing errors. If new config imports fail, fix before committing.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json drizzle.config.ts .env.example
git commit -m "Add book store database tooling"
```

## Task 2: Add Core Store Domain Logic

**Files:**
- Create: `netlify/functions/_shared/book/constants.mts`
- Create: `netlify/functions/_shared/book/pricing.mts`
- Create: `netlify/functions/_shared/book/parcel.mts`
- Create: `netlify/functions/_shared/book/order-numbers.mts`
- Test: `tests/book-pricing.test.mts`
- Test: `tests/book-parcel.test.mts`

- [ ] **Step 1: Write pricing tests**

Create `tests/book-pricing.test.mts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BOOK_PRICE_CENTS,
  calculateBookTotals,
  normalizeCouponCode,
} from '../netlify/functions/_shared/book/pricing.mts'

test('single book has no discount and free Mexico shipping', () => {
  assert.deepEqual(calculateBookTotals({ quantity: 1 }), {
    currency: 'MXN',
    quantity: 1,
    unitPriceCents: BOOK_PRICE_CENTS,
    subtotalCents: 49900,
    volumeDiscountPercent: 0,
    volumeDiscountCents: 0,
    couponCode: null,
    couponDiscountCents: 0,
    totalDiscountCents: 0,
    shippingChargedCents: 0,
    totalCents: 49900,
    discountLabel: null,
  })
})

test('five books receive 10 percent volume discount', () => {
  const totals = calculateBookTotals({ quantity: 5 })
  assert.equal(totals.subtotalCents, 249500)
  assert.equal(totals.volumeDiscountPercent, 10)
  assert.equal(totals.volumeDiscountCents, 24950)
  assert.equal(totals.totalCents, 224550)
})

test('ten books receive 20 percent volume discount', () => {
  const totals = calculateBookTotals({ quantity: 10 })
  assert.equal(totals.subtotalCents, 499000)
  assert.equal(totals.volumeDiscountPercent, 20)
  assert.equal(totals.volumeDiscountCents, 99800)
  assert.equal(totals.totalCents, 399200)
})

test('non-stackable coupon uses the better discount', () => {
  const totals = calculateBookTotals({
    quantity: 10,
    coupon: {
      code: 'MAGNIFICO100',
      type: 'fixed',
      value: 10000,
      stackable: false,
    },
  })

  assert.equal(totals.volumeDiscountCents, 99800)
  assert.equal(totals.couponDiscountCents, 0)
  assert.equal(totals.totalDiscountCents, 99800)
  assert.equal(totals.discountLabel, 'Descuento por volumen')
})

test('stackable coupon adds to volume discount', () => {
  const totals = calculateBookTotals({
    quantity: 5,
    coupon: {
      code: 'LECTOR10',
      type: 'percent',
      value: 10,
      stackable: true,
    },
  })

  assert.equal(totals.volumeDiscountCents, 24950)
  assert.equal(totals.couponDiscountCents, 24950)
  assert.equal(totals.totalDiscountCents, 49900)
  assert.equal(totals.totalCents, 199600)
})

test('quantity outside 1 through 10 is rejected', () => {
  assert.throws(() => calculateBookTotals({ quantity: 0 }), /cantidad debe estar entre 1 y 10/i)
  assert.throws(() => calculateBookTotals({ quantity: 11 }), /cantidad debe estar entre 1 y 10/i)
})

test('coupon codes are normalized for storage and comparison', () => {
  assert.equal(normalizeCouponCode(' magnifico-10 '), 'MAGNIFICO-10')
})
```

- [ ] **Step 2: Run pricing test and verify failure**

Run:

```bash
npm test -- tests/book-pricing.test.mts
```

Expected: FAIL because the book pricing module does not exist.

- [ ] **Step 3: Implement constants and pricing**

Create `netlify/functions/_shared/book/constants.mts`:

```ts
export const BOOK_SKU = 'HAZLO-MAGNIFICO-PAPERBACK'
export const BOOK_TITLE = 'Hazlo Magnífico'
export const BOOK_SUBTITLE = 'La fórmula para emprender tus sueños sin perder el alma'
export const BOOK_AUTHOR = 'Oz Creativo'
export const BOOK_PRICE_CENTS = 49_900
export const BOOK_CURRENCY = 'MXN'
export const BOOK_INITIAL_STOCK = 100
export const MIN_BOOK_QUANTITY = 1
export const MAX_BOOK_QUANTITY = 10
export const FREE_MEXICO_SHIPPING_CENTS = 0
```

Create `netlify/functions/_shared/book/pricing.mts`:

```ts
import {
  BOOK_CURRENCY,
  BOOK_PRICE_CENTS,
  FREE_MEXICO_SHIPPING_CENTS,
  MAX_BOOK_QUANTITY,
  MIN_BOOK_QUANTITY,
} from './constants.mts'

export { BOOK_PRICE_CENTS }

export type CouponForTotals = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  stackable: boolean
}

export type BookTotals = {
  currency: 'MXN'
  quantity: number
  unitPriceCents: number
  subtotalCents: number
  volumeDiscountPercent: number
  volumeDiscountCents: number
  couponCode: string | null
  couponDiscountCents: number
  totalDiscountCents: number
  shippingChargedCents: number
  totalCents: number
  discountLabel: string | null
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}

export function calculateBookTotals(input: {
  quantity: number
  coupon?: CouponForTotals | null
}): BookTotals {
  const quantity = Math.trunc(input.quantity)
  if (quantity < MIN_BOOK_QUANTITY || quantity > MAX_BOOK_QUANTITY) {
    throw new Error('La cantidad debe estar entre 1 y 10 libros.')
  }

  const subtotalCents = quantity * BOOK_PRICE_CENTS
  const volumeDiscountPercent = getVolumeDiscountPercent(quantity)
  const volumeDiscountCents = Math.round((subtotalCents * volumeDiscountPercent) / 100)
  const rawCouponDiscountCents = input.coupon
    ? calculateCouponDiscountCents(subtotalCents, input.coupon)
    : 0

  let couponDiscountCents = 0
  let totalDiscountCents = volumeDiscountCents
  let discountLabel: string | null = volumeDiscountCents > 0 ? 'Descuento por volumen' : null

  if (input.coupon) {
    if (input.coupon.stackable) {
      couponDiscountCents = rawCouponDiscountCents
      totalDiscountCents = Math.min(subtotalCents, volumeDiscountCents + couponDiscountCents)
      discountLabel = volumeDiscountCents > 0 ? 'Descuento por volumen + cupón' : 'Cupón'
    } else if (rawCouponDiscountCents > volumeDiscountCents) {
      couponDiscountCents = rawCouponDiscountCents
      totalDiscountCents = couponDiscountCents
      discountLabel = 'Cupón'
    }
  }

  const totalCents = Math.max(
    0,
    subtotalCents - totalDiscountCents + FREE_MEXICO_SHIPPING_CENTS,
  )

  return {
    currency: BOOK_CURRENCY,
    quantity,
    unitPriceCents: BOOK_PRICE_CENTS,
    subtotalCents,
    volumeDiscountPercent,
    volumeDiscountCents,
    couponCode: input.coupon ? normalizeCouponCode(input.coupon.code) : null,
    couponDiscountCents,
    totalDiscountCents,
    shippingChargedCents: FREE_MEXICO_SHIPPING_CENTS,
    totalCents,
    discountLabel,
  }
}

export function getVolumeDiscountPercent(quantity: number): number {
  if (quantity === 10) return 20
  if (quantity >= 5) return 10
  return 0
}

function calculateCouponDiscountCents(subtotalCents: number, coupon: CouponForTotals): number {
  if (coupon.type === 'percent') {
    return Math.min(subtotalCents, Math.round((subtotalCents * coupon.value) / 100))
  }

  return Math.min(subtotalCents, Math.round(coupon.value))
}
```

- [ ] **Step 4: Write parcel tests**

Create `tests/book-parcel.test.mts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { calculateBookParcel } from '../netlify/functions/_shared/book/parcel.mts'

test('one book uses the base package', () => {
  assert.deepEqual(calculateBookParcel(1), {
    weightGrams: 300,
    lengthCm: 24,
    widthCm: 17,
    heightCm: 3,
  })
})

test('extra books add 180 grams each and increase height', () => {
  assert.deepEqual(calculateBookParcel(4), {
    weightGrams: 840,
    lengthCm: 24,
    widthCm: 17,
    heightCm: 6,
  })
})

test('ten books remain inside the public quantity limit', () => {
  assert.deepEqual(calculateBookParcel(10), {
    weightGrams: 1920,
    lengthCm: 24,
    widthCm: 17,
    heightCm: 12,
  })
})
```

- [ ] **Step 5: Implement parcel helper**

Create `netlify/functions/_shared/book/parcel.mts`:

```ts
import { MAX_BOOK_QUANTITY, MIN_BOOK_QUANTITY } from './constants.mts'

export type BookParcel = {
  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
}

export function calculateBookParcel(quantity: number): BookParcel {
  const safeQuantity = Math.trunc(quantity)
  if (safeQuantity < MIN_BOOK_QUANTITY || safeQuantity > MAX_BOOK_QUANTITY) {
    throw new Error('La cantidad debe estar entre 1 y 10 libros.')
  }

  return {
    weightGrams: 300 + Math.max(0, safeQuantity - 1) * 180,
    lengthCm: 24,
    widthCm: 17,
    heightCm: 3 + Math.ceil(Math.max(0, safeQuantity - 1) / 3) * 3,
  }
}
```

- [ ] **Step 6: Add order number helper**

Create `netlify/functions/_shared/book/order-numbers.mts`:

```ts
export function buildOrderNumber(now = new Date(), random = crypto.getRandomValues(new Uint32Array(1))[0]): string {
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const suffix = random.toString(36).toUpperCase().padStart(6, '0').slice(-6)
  return `HM-${yyyy}${mm}${dd}-${suffix}`
}

export function buildPublicOrderToken(bytes = crypto.getRandomValues(new Uint8Array(24))): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
```

- [ ] **Step 7: Run tests**

Run:

```bash
npm test -- tests/book-pricing.test.mts tests/book-parcel.test.mts
```

Expected: both new tests pass.

- [ ] **Step 8: Commit**

```bash
git add netlify/functions/_shared/book tests/book-pricing.test.mts tests/book-parcel.test.mts
git commit -m "Add book store pricing and parcel logic"
```

## Task 3: Add Database Schema, Client, And Seed

**Files:**
- Create: `db/schema.ts`
- Create: `db/index.ts`
- Create: `db/seed.mts`
- Create: `netlify/database/migrations/*`

- [ ] **Step 1: Create schema**

Create `db/schema.ts` with Drizzle tables for the spec. Use `integer` cents, `timestamp` dates, and `jsonb` for sanitized provider responses:

```ts
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const orderStatusEnum = pgEnum('order_status', [
  'checkout_created',
  'payment_pending',
  'paid',
  'label_pending',
  'label_created',
  'fulfillment_in_progress',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'payment_failed',
  'label_error',
])

export const couponTypeEnum = pgEnum('coupon_type', ['percent', 'fixed'])
export const emailStatusEnum = pgEnum('email_status', ['queued', 'sent', 'failed'])
export const leadStatusEnum = pgEnum('international_lead_status', [
  'nuevo',
  'cotizado',
  'esperando_respuesta',
  'convertido',
  'cerrado',
])

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  author: text('author').notNull(),
  description: text('description').notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull(),
  pages: integer('pages').notNull(),
  widthCm: integer('width_cm').notNull(),
  heightCm: integer('height_cm').notNull(),
  publicWeightGrams: integer('public_weight_grams').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id),
  stockInitial: integer('stock_initial').notNull(),
  stockAvailable: integer('stock_available').notNull(),
  stockSold: integer('stock_sold').notNull().default(0),
  stockReserved: integer('stock_reserved').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  publicToken: text('public_token').notNull(),
  status: orderStatusEnum('status').notNull().default('checkout_created'),
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  shippingStatus: text('shipping_status').notNull().default('not_started'),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  volumeDiscountPercent: integer('volume_discount_percent').notNull().default(0),
  volumeDiscountCents: integer('volume_discount_cents').notNull().default(0),
  couponCode: text('coupon_code'),
  couponDiscountCents: integer('coupon_discount_cents').notNull().default(0),
  totalDiscountCents: integer('total_discount_cents').notNull().default(0),
  shippingChargedCents: integer('shipping_charged_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull(),
  currency: text('currency').notNull().default('MXN'),
  stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  sku: text('sku').notNull(),
  title: text('title').notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  totalCents: integer('total_cents').notNull(),
})

export const shippingAddresses = pgTable('shipping_addresses', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().unique().references(() => orders.id),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  street: text('street').notNull(),
  exteriorNumber: text('exterior_number').notNull(),
  interiorNumber: text('interior_number'),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull().default('MX'),
  references: text('references'),
})

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  type: couponTypeEnum('type').notNull(),
  value: integer('value').notNull(),
  active: boolean('active').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').notNull().default(0),
  minSubtotalCents: integer('min_subtotal_cents'),
  minQuantity: integer('min_quantity'),
  maxUsesPerEmail: integer('max_uses_per_email'),
  stackable: boolean('stackable').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().unique().references(() => orders.id),
  provider: text('provider').notNull().default('skydropx'),
  quotationId: text('quotation_id'),
  rateId: text('rate_id'),
  shipmentId: text('shipment_id'),
  carrier: text('carrier'),
  service: text('service'),
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  labelUrl: text('label_url'),
  realShippingCostCents: integer('real_shipping_cost_cents'),
  status: text('status').notNull().default('label_pending'),
  error: text('error'),
  rawResponseJson: jsonb('raw_response_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const inventoryMovements = pgTable('inventory_movements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id),
  orderId: integer('order_id').references(() => orders.id),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by').notNull().default('system'),
})

export const couponRedemptions = pgTable('coupon_redemptions', {
  id: serial('id').primaryKey(),
  couponId: integer('coupon_id').notNull().references(() => coupons.id),
  orderId: integer('order_id').notNull().references(() => orders.id),
  email: text('email').notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
})

export const discountRules = pgTable('discount_rules', {
  id: serial('id').primaryKey(),
  minQuantity: integer('min_quantity').notNull(),
  maxQuantity: integer('max_quantity').notNull(),
  percent: integer('percent').notNull(),
  active: boolean('active').notNull().default(true),
})

export const internationalQuoteLeads = pgTable('international_quote_leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  whatsapp: text('whatsapp').notNull(),
  country: text('country').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code').notNull(),
  quantity: integer('quantity').notNull(),
  message: text('message'),
  status: leadStatusEnum('status').notNull().default('nuevo'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const emailEvents = pgTable('email_events', {
  id: serial('id').primaryKey(),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  template: text('template').notNull(),
  status: emailStatusEnum('status').notNull().default('queued'),
  providerMessageId: text('provider_message_id'),
  error: text('error'),
  relatedOrderId: integer('related_order_id').references(() => orders.id),
  relatedLeadId: integer('related_lead_id').references(() => internationalQuoteLeads.id),
  idempotencyKey: text('idempotency_key').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idempotencyKeyIdx: uniqueIndex('email_events_idempotency_key_idx').on(table.idempotencyKey),
}))

export const processedStripeEvents = pgTable('processed_stripe_events', {
  id: serial('id').primaryKey(),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orderEvents = pgTable('order_events', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  type: text('type').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const adminSessions = pgTable('admin_sessions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 2: Create DB client**

Create `db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/netlify-db'

import * as schema from './schema'

export const db = drizzle({ schema })
export { schema }
```

- [ ] **Step 3: Create seed script**

Create `db/seed.mts`:

```ts
import { eq } from 'drizzle-orm'

import { db } from './index.ts'
import {
  discountRules,
  inventory,
  products,
} from './schema.ts'
import {
  BOOK_AUTHOR,
  BOOK_INITIAL_STOCK,
  BOOK_PRICE_CENTS,
  BOOK_SKU,
  BOOK_SUBTITLE,
  BOOK_TITLE,
} from '../netlify/functions/_shared/book/constants.mts'

const [product] = await db
  .insert(products)
  .values({
    sku: BOOK_SKU,
    title: BOOK_TITLE,
    subtitle: BOOK_SUBTITLE,
    author: BOOK_AUTHOR,
    description: 'Libro físico de Oz Creativo para emprender tus sueños sin perder el alma.',
    priceCents: BOOK_PRICE_CENTS,
    currency: 'MXN',
    pages: 108,
    widthCm: 14,
    heightCm: 22,
    publicWeightGrams: 180,
    active: true,
  })
  .onConflictDoUpdate({
    target: products.sku,
    set: {
      title: BOOK_TITLE,
      subtitle: BOOK_SUBTITLE,
      priceCents: BOOK_PRICE_CENTS,
      active: true,
    },
  })
  .returning()

const existingInventory = await db
  .select()
  .from(inventory)
  .where(eq(inventory.productId, product.id))
  .limit(1)

if (existingInventory.length === 0) {
  await db.insert(inventory).values({
    productId: product.id,
    stockInitial: BOOK_INITIAL_STOCK,
    stockAvailable: BOOK_INITIAL_STOCK,
    stockSold: 0,
    stockReserved: 0,
  })
}

await db.delete(discountRules)
await db.insert(discountRules).values([
  { minQuantity: 5, maxQuantity: 9, percent: 10, active: true },
  { minQuantity: 10, maxQuantity: 10, percent: 20, active: true },
])

console.log('Hazlo Magnifico store seed complete.')
```

- [ ] **Step 4: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: a new SQL migration appears under `netlify/database/migrations`.

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run lint
```

Expected: TypeScript passes. If Drizzle beta type signatures differ, adjust schema syntax to match installed package and re-run.

- [ ] **Step 6: Commit**

```bash
git add db drizzle.config.ts netlify/database package.json package-lock.json
git commit -m "Add book store database schema"
```

## Task 4: Add Validation, HTTP Helpers, And Repositories

**Files:**
- Create: `netlify/functions/_shared/book/http.mts`
- Create: `netlify/functions/_shared/book/validation.mts`
- Create: `netlify/functions/_shared/book/repositories.mts`
- Test: `tests/book-order-state.test.mts`

- [ ] **Step 1: Write order-state test**

Create `tests/book-order-state.test.mts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canMarkPaid,
  nextShipmentStatusAfterLabel,
} from '../netlify/functions/_shared/book/repositories.mts'

test('checkout_created and payment_pending can be marked paid', () => {
  assert.equal(canMarkPaid('checkout_created'), true)
  assert.equal(canMarkPaid('payment_pending'), true)
})

test('terminal or paid states are not paid twice', () => {
  assert.equal(canMarkPaid('paid'), false)
  assert.equal(canMarkPaid('shipped'), false)
  assert.equal(canMarkPaid('cancelled'), false)
})

test('shipment state after label creation is label_created', () => {
  assert.equal(nextShipmentStatusAfterLabel(), 'label_created')
})
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
npm test -- tests/book-order-state.test.mts
```

Expected: FAIL because repository helpers do not exist.

- [ ] **Step 3: Create HTTP helpers**

Create `netlify/functions/_shared/book/http.mts`:

```ts
export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      ...headers,
    },
  })
}

export function methodNotAllowed(allow: string) {
  return jsonResponse({ ok: false, message: 'Metodo no permitido.' }, 405, { Allow: allow })
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new Error('Formato invalido.')
  }
}

export function getSiteUrl(req: Request): string {
  return process.env.SITE_URL || req.headers.get('origin') || new URL(req.url).origin
}
```

- [ ] **Step 4: Create Zod validation**

Create `netlify/functions/_shared/book/validation.mts`:

```ts
import { z } from 'zod'

export const checkoutSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(10),
  couponCode: z.string().trim().max(64).optional().or(z.literal('')),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(180),
    phone: z.string().trim().min(8).max(32),
  }),
  address: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(32),
    street: z.string().trim().min(2).max(160),
    exteriorNumber: z.string().trim().min(1).max(32),
    interiorNumber: z.string().trim().max(32).optional().or(z.literal('')),
    neighborhood: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(120),
    state: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().regex(/^[0-9]{5}$/),
    references: z.string().trim().max(400).optional().or(z.literal('')),
  }),
})

export const couponValidationSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(10),
  couponCode: z.string().trim().min(1).max(64),
})

export const internationalQuoteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  whatsapp: z.string().trim().min(8).max(32),
  country: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().min(2).max(32),
  quantity: z.coerce.number().int().min(1).max(50),
  message: z.string().trim().max(800).optional().or(z.literal('')),
})

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
})
```

- [ ] **Step 5: Create repository helper skeleton and state helpers**

Create `netlify/functions/_shared/book/repositories.mts`:

```ts
export type BookOrderStatus =
  | 'checkout_created'
  | 'payment_pending'
  | 'paid'
  | 'label_pending'
  | 'label_created'
  | 'fulfillment_in_progress'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'payment_failed'
  | 'label_error'

export function canMarkPaid(status: BookOrderStatus): boolean {
  return status === 'checkout_created' || status === 'payment_pending'
}

export function nextShipmentStatusAfterLabel(): BookOrderStatus {
  return 'label_created'
}
```

- [ ] **Step 6: Run order-state test**

Run:

```bash
npm test -- tests/book-order-state.test.mts
```

Expected: PASS.

- [ ] **Step 7: Extend repositories with DB operations**

Add DB operations to `netlify/functions/_shared/book/repositories.mts` below the state helpers:

```ts
import { and, desc, eq, sql } from 'drizzle-orm'

import { db, schema } from '../../../../db/index'
import { BOOK_SKU } from './constants.mts'
import type { BookTotals } from './pricing.mts'

export type CheckoutOrderInput = {
  orderNumber: string
  publicToken: string
  customer: { name: string; email: string; phone: string }
  address: {
    name: string
    phone: string
    street: string
    exteriorNumber: string
    interiorNumber?: string
    neighborhood: string
    city: string
    state: string
    postalCode: string
    references?: string
  }
  totals: BookTotals
}

export async function findActiveBookProduct() {
  const [product] = await db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.sku, BOOK_SKU), eq(schema.products.active, true)))
    .limit(1)
  return product ?? null
}

export async function createCheckoutOrder(input: CheckoutOrderInput) {
  const product = await findActiveBookProduct()
  if (!product) throw new Error('El libro no esta disponible.')

  const [order] = await db
    .insert(schema.orders)
    .values({
      orderNumber: input.orderNumber,
      publicToken: input.publicToken,
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone,
      subtotalCents: input.totals.subtotalCents,
      volumeDiscountPercent: input.totals.volumeDiscountPercent,
      volumeDiscountCents: input.totals.volumeDiscountCents,
      couponCode: input.totals.couponCode,
      couponDiscountCents: input.totals.couponDiscountCents,
      totalDiscountCents: input.totals.totalDiscountCents,
      shippingChargedCents: input.totals.shippingChargedCents,
      totalCents: input.totals.totalCents,
      currency: input.totals.currency,
    })
    .returning()

  await db.insert(schema.orderItems).values({
    orderId: order.id,
    productId: product.id,
    sku: product.sku,
    title: product.title,
    quantity: input.totals.quantity,
    unitPriceCents: input.totals.unitPriceCents,
    subtotalCents: input.totals.subtotalCents,
    totalCents: input.totals.totalCents,
  })

  await db.insert(schema.shippingAddresses).values({
    orderId: order.id,
    ...input.address,
    interiorNumber: input.address.interiorNumber || null,
    references: input.address.references || null,
  })

  await db.insert(schema.orderEvents).values({
    orderId: order.id,
    type: 'checkout_created',
    message: 'Pedido creado antes de redirigir a Stripe.',
  })

  return order
}

export async function attachStripeSession(orderId: number, sessionId: string) {
  await db
    .update(schema.orders)
    .set({
      stripeCheckoutSessionId: sessionId,
      paymentStatus: 'pending',
      status: 'payment_pending',
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, orderId))
}

export async function listRecentOrders(limit = 50) {
  return db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(limit)
}

export async function hasProcessedStripeEvent(stripeEventId: string): Promise<boolean> {
  const [event] = await db
    .select()
    .from(schema.processedStripeEvents)
    .where(eq(schema.processedStripeEvents.stripeEventId, stripeEventId))
    .limit(1)
  return Boolean(event)
}

export async function recordStripeEvent(stripeEventId: string, type: string) {
  await db.insert(schema.processedStripeEvents).values({ stripeEventId, type }).onConflictDoNothing()
}

export async function markOrderPaidByStripe(input: {
  sessionId: string
  paymentIntentId: string | null
  stripeEventId: string
  stripeEventType: string
}) {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.stripeCheckoutSessionId, input.sessionId))
    .limit(1)

  if (!order || !canMarkPaid(order.status as BookOrderStatus)) {
    return order ?? null
  }

  const [item] = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id))
    .limit(1)

  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, item.productId))
    .limit(1)

  const [stock] = await db
    .select()
    .from(schema.inventory)
    .where(eq(schema.inventory.productId, product.id))
    .limit(1)

  if (!stock || stock.stockAvailable < item.quantity) {
    await db
      .update(schema.orders)
      .set({ status: 'label_error', shippingStatus: 'inventory_review', updatedAt: new Date() })
      .where(eq(schema.orders.id, order.id))
    return order
  }

  await db
    .update(schema.inventory)
    .set({
      stockAvailable: sql`${schema.inventory.stockAvailable} - ${item.quantity}`,
      stockSold: sql`${schema.inventory.stockSold} + ${item.quantity}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.inventory.id, stock.id))

  await db.insert(schema.inventoryMovements).values({
    productId: product.id,
    orderId: order.id,
    type: 'sale',
    quantity: item.quantity * -1,
    reason: `Pago confirmado por Stripe ${input.sessionId}`,
  })

  await db
    .update(schema.orders)
    .set({
      status: 'label_pending',
      paymentStatus: 'paid',
      shippingStatus: 'label_pending',
      stripePaymentIntentId: input.paymentIntentId,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, order.id))

  await db.insert(schema.shipments).values({
    orderId: order.id,
    provider: 'skydropx',
    status: 'label_pending',
  }).onConflictDoNothing()

  await db.insert(schema.orderEvents).values({
    orderId: order.id,
    type: 'paid',
    message: 'Pago confirmado por Stripe.',
    metadata: { stripeEventId: input.stripeEventId, stripeEventType: input.stripeEventType },
  })

  await recordStripeEvent(input.stripeEventId, input.stripeEventType)
  return order
}
```

- [ ] **Step 8: Run typecheck and tests**

Run:

```bash
npm run lint
npm test -- tests/book-order-state.test.mts
```

Expected: TypeScript and order-state test pass.

- [ ] **Step 9: Commit**

```bash
git add netlify/functions/_shared/book tests/book-order-state.test.mts
git commit -m "Add book store validation and repository helpers"
```

## Task 5: Add Stripe Checkout And Webhook

**Files:**
- Create: `netlify/functions/_shared/book/stripe.mts`
- Create: `netlify/functions/book-checkout-create-session.mts`
- Create: `netlify/functions/book-stripe-webhook.mts`
- Test: `tests/book-stripe.test.mts`

- [ ] **Step 1: Write Stripe helper tests**

Create `tests/book-stripe.test.mts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { buildStripeLineItem, buildStripeReturnUrls } from '../netlify/functions/_shared/book/stripe.mts'

test('Stripe line item uses MXN cents and book title', () => {
  assert.deepEqual(
    buildStripeLineItem({
      quantity: 2,
      totalCents: 99800,
      orderNumber: 'HM-20260706-ABC123',
    }),
    {
      quantity: 1,
      price_data: {
        currency: 'mxn',
        unit_amount: 99800,
        product_data: {
          name: 'Hazlo Magnífico · HM-20260706-ABC123',
          description: '2 libros físicos con envío gratis dentro de México.',
        },
      },
    },
  )
})

test('Stripe return URLs go to gracias and libro', () => {
  assert.deepEqual(buildStripeReturnUrls('https://ozcreativo.com', 'HM-1', 'tok_123'), {
    success_url: 'https://ozcreativo.com/gracias?order=HM-1&token=tok_123',
    cancel_url: 'https://ozcreativo.com/libro?checkout=cancelled',
  })
})
```

- [ ] **Step 2: Run Stripe helper test and verify failure**

Run:

```bash
npm test -- tests/book-stripe.test.mts
```

Expected: FAIL because Stripe helper does not exist.

- [ ] **Step 3: Implement Stripe helper**

Create `netlify/functions/_shared/book/stripe.mts`:

```ts
import Stripe from 'stripe'

import { BOOK_TITLE } from './constants.mts'

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('Falta configurar Stripe.')
  return new Stripe(secretKey, { apiVersion: '2025-06-30.basil' })
}

export function buildStripeLineItem(input: {
  quantity: number
  totalCents: number
  orderNumber: string
}) {
  return {
    quantity: 1,
    price_data: {
      currency: 'mxn',
      unit_amount: input.totalCents,
      product_data: {
        name: `${BOOK_TITLE} · ${input.orderNumber}`,
        description: `${input.quantity} ${input.quantity === 1 ? 'libro físico' : 'libros físicos'} con envío gratis dentro de México.`,
      },
    },
  }
}

export function buildStripeReturnUrls(siteUrl: string, orderNumber: string, publicToken: string) {
  const origin = siteUrl.replace(/\/$/, '')
  return {
    success_url: `${origin}/gracias?order=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(publicToken)}`,
    cancel_url: `${origin}/libro?checkout=cancelled`,
  }
}

export async function createBookCheckoutSession(input: {
  stripe: Stripe
  siteUrl: string
  order: { id: number; orderNumber: string; publicToken: string; customerEmail: string; totalCents: number }
  quantity: number
}) {
  const urls = buildStripeReturnUrls(input.siteUrl, input.order.orderNumber, input.order.publicToken)

  return input.stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: input.order.customerEmail,
    client_reference_id: input.order.orderNumber,
    success_url: urls.success_url,
    cancel_url: urls.cancel_url,
    line_items: [buildStripeLineItem({
      quantity: input.quantity,
      totalCents: input.order.totalCents,
      orderNumber: input.order.orderNumber,
    })],
    metadata: {
      flow: 'book-store',
      orderId: String(input.order.id),
      orderNumber: input.order.orderNumber,
    },
  })
}
```

- [ ] **Step 4: Implement checkout function**

Create `netlify/functions/book-checkout-create-session.mts`:

```ts
import type { Config } from '@netlify/functions'

import { buildOrderNumber, buildPublicOrderToken } from './_shared/book/order-numbers.mts'
import { calculateBookTotals, normalizeCouponCode } from './_shared/book/pricing.mts'
import {
  attachStripeSession,
  createCheckoutOrder,
} from './_shared/book/repositories.mts'
import { createBookCheckoutSession, getStripe } from './_shared/book/stripe.mts'
import { checkoutSchema } from './_shared/book/validation.mts'
import { getSiteUrl, jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'

export default async (req: Request) => {
  if (req.method !== 'POST') return methodNotAllowed('POST')

  try {
    const payload = checkoutSchema.parse(await readJson(req))
    const couponCode = payload.couponCode ? normalizeCouponCode(payload.couponCode) : ''
    const totals = calculateBookTotals({ quantity: payload.quantity })
    const order = await createCheckoutOrder({
      orderNumber: buildOrderNumber(),
      publicToken: buildPublicOrderToken(),
      customer: payload.customer,
      address: payload.address,
      totals: couponCode ? { ...totals, couponCode } : totals,
    })
    const session = await createBookCheckoutSession({
      stripe: getStripe(),
      siteUrl: getSiteUrl(req),
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        publicToken: order.publicToken,
        customerEmail: order.customerEmail,
        totalCents: order.totalCents,
      },
      quantity: totals.quantity,
    })

    await attachStripeSession(order.id, session.id)
    return jsonResponse({ ok: true, checkoutUrl: session.url, orderNumber: order.orderNumber })
  } catch (error) {
    return jsonResponse(
      { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear el checkout.' },
      400,
    )
  }
}

export const config: Config = {
  path: '/api/book/checkout/create-session',
}
```

- [ ] **Step 5: Implement Stripe webhook function**

Create `netlify/functions/book-stripe-webhook.mts`:

```ts
import type { Config } from '@netlify/functions'

import {
  hasProcessedStripeEvent,
  markOrderPaidByStripe,
} from './_shared/book/repositories.mts'
import { getStripe } from './_shared/book/stripe.mts'
import { jsonResponse, methodNotAllowed } from './_shared/book/http.mts'

export default async (req: Request) => {
  if (req.method !== 'POST') return methodNotAllowed('POST')

  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_BOOK
  if (!signature || !webhookSecret) {
    return jsonResponse({ received: false, message: 'Webhook no configurado.' }, 503)
  }

  let event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return jsonResponse({ received: false, message: 'Firma invalida.' }, 400)
  }

  if (await hasProcessedStripeEvent(event.id)) {
    return jsonResponse({ received: true, ok: true, duplicate: true })
  }

  if (event.type !== 'checkout.session.completed') {
    return jsonResponse({ received: true, ok: true })
  }

  const session = event.data.object
  if (session.metadata?.flow !== 'book-store' || session.payment_status !== 'paid') {
    return jsonResponse({ received: true, ok: true })
  }

  await markOrderPaidByStripe({
    sessionId: session.id,
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    stripeEventId: event.id,
    stripeEventType: event.type,
  })

  return jsonResponse({ received: true, ok: true })
}

export const config: Config = {
  path: '/api/book/webhooks/stripe',
}
```

- [ ] **Step 6: Run Stripe tests and typecheck**

Run:

```bash
npm test -- tests/book-stripe.test.mts
npm run lint
```

Expected: tests and typecheck pass.

- [ ] **Step 7: Commit**

```bash
git add netlify/functions/_shared/book/stripe.mts netlify/functions/book-checkout-create-session.mts netlify/functions/book-stripe-webhook.mts tests/book-stripe.test.mts
git commit -m "Add book Stripe checkout flow"
```

## Task 6: Add Resend Email Templates And Email Events

**Files:**
- Create: `netlify/functions/_shared/book/email-templates.mts`
- Create: `netlify/functions/_shared/book/email-service.mts`
- Modify: `netlify/functions/book-stripe-webhook.mts`
- Test: `tests/book-email.test.mts`

- [ ] **Step 1: Write email template tests**

Create `tests/book-email.test.mts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  renderPurchaseConfirmationEmail,
  renderShipmentEmail,
} from '../netlify/functions/_shared/book/email-templates.mts'

const order = {
  orderNumber: 'HM-20260706-ABC123',
  customerName: 'Oz',
  customerEmail: 'oz@expocuspide.com',
  customerPhone: '8999110922',
  quantity: 2,
  totalCents: 99800,
  address: 'Calle 1 #2, Colonia, Monterrey, Nuevo Leon, 64000',
}

test('purchase email includes order number and free shipping message', () => {
  const email = renderPurchaseConfirmationEmail(order)
  assert.equal(email.subject, 'Confirmamos tu pedido de Hazlo Magnífico — HM-20260706-ABC123')
  assert.match(email.html, /envío gratis dentro de México/i)
  assert.match(email.html, /HM-20260706-ABC123/)
  assert.match(email.text, /oz@expocuspide.com/)
})

test('shipment email includes tracking button and carrier', () => {
  const email = renderShipmentEmail({
    ...order,
    carrier: 'DHL',
    service: 'Express',
    trackingNumber: 'TRACK123',
    trackingUrl: 'https://tracking.example/TRACK123',
  })

  assert.match(email.html, /Rastrear mi pedido/)
  assert.match(email.html, /TRACK123/)
  assert.match(email.text, /DHL/)
})
```

- [ ] **Step 2: Implement email templates**

Create `netlify/functions/_shared/book/email-templates.mts` with deterministic HTML/text renderers:

```ts
type PurchaseEmailInput = {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  quantity: number
  totalCents: number
  address: string
}

type ShipmentEmailInput = PurchaseEmailInput & {
  carrier: string
  service: string
  trackingNumber: string
  trackingUrl: string
}

export function formatMxn(cents: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function renderPurchaseConfirmationEmail(input: PurchaseEmailInput) {
  const subject = `Confirmamos tu pedido de Hazlo Magnífico — ${input.orderNumber}`
  const html = emailShell(`
    <h1>Gracias por comprar Hazlo Magnífico.</h1>
    <p>Hola ${escapeHtml(input.customerName)}, recibimos tu compra.</p>
    <p><strong>Pedido:</strong> ${input.orderNumber}</p>
    <p><strong>Cantidad:</strong> ${input.quantity}</p>
    <p><strong>Total pagado:</strong> ${formatMxn(input.totalCents)}</p>
    <p>Tu compra incluye envío gratis dentro de México.</p>
    <p><strong>Dirección:</strong> ${escapeHtml(input.address)}</p>
    <p>Estamos preparando tu pedido. Recibirás otro correo con tu número de guía cuando sea entregado a la paquetería.</p>
    <p>En caso de requerir factura, solicítala escribiendo a oz@expocuspide.com con tu número de pedido y tus datos fiscales.</p>
  `)
  return { subject, html, text: htmlToText(subject, html) }
}

export function renderShipmentEmail(input: ShipmentEmailInput) {
  const subject = `Tu pedido de Hazlo Magnífico ya va en camino — ${input.orderNumber}`
  const html = emailShell(`
    <h1>Tu pedido ya va en camino.</h1>
    <p>Hola ${escapeHtml(input.customerName)}, tu libro fue entregado a paquetería.</p>
    <p><strong>Pedido:</strong> ${input.orderNumber}</p>
    <p><strong>Paquetería:</strong> ${escapeHtml(input.carrier)}</p>
    <p><strong>Servicio:</strong> ${escapeHtml(input.service)}</p>
    <p><strong>Guía:</strong> ${escapeHtml(input.trackingNumber)}</p>
    <p><a href="${escapeHtml(input.trackingUrl)}">Rastrear mi pedido</a></p>
    <p>Te recomendamos estar pendiente de llamadas o mensajes de la paquetería.</p>
    <p><strong>Dirección:</strong> ${escapeHtml(input.address)}</p>
  `)
  return { subject, html, text: htmlToText(subject, html) }
}

function emailShell(body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#090909;color:#f8f5e7;font-family:Arial,sans-serif"><main style="max-width:640px;margin:0 auto;padding:32px"><div style="color:#ffd400;font-weight:700">OZ CREATIVO</div>${body}<p style="color:#9c9c9c">Soporte: oz@expocuspide.com</p></main></body></html>`
}

function htmlToText(subject: string, html: string): string {
  return `${subject}\n\n${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
```

- [ ] **Step 3: Implement email service**

Create `netlify/functions/_shared/book/email-service.mts`:

```ts
import { Resend } from 'resend'

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ORDER_FROM_EMAIL
  if (!apiKey || !from) {
    throw new Error('Falta configurar Resend.')
  }

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return result.data?.id || ''
}
```

- [ ] **Step 4: Run email tests**

Run:

```bash
npm test -- tests/book-email.test.mts
```

Expected: PASS.

- [ ] **Step 5: Add email summary and idempotency helpers**

Add these exports to `netlify/functions/_shared/book/repositories.mts`:

```ts
export type PaidOrderEmailSummary = {
  orderId: number
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  quantity: number
  totalCents: number
  address: string
}

export async function loadPaidOrderEmailSummary(orderId: number): Promise<PaidOrderEmailSummary | null> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1)
  if (!order) return null
  const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)).limit(1)
  const [address] = await db
    .select()
    .from(schema.shippingAddresses)
    .where(eq(schema.shippingAddresses.orderId, order.id))
    .limit(1)
  if (!item || !address) return null

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    quantity: item.quantity,
    totalCents: order.totalCents,
    address: `${address.street} ${address.exteriorNumber}${address.interiorNumber ? ` Int. ${address.interiorNumber}` : ''}, ${address.neighborhood}, ${address.city}, ${address.state}, ${address.postalCode}`,
  }
}

export async function createQueuedEmailEvent(input: {
  to: string
  subject: string
  template: string
  relatedOrderId?: number
  relatedLeadId?: number
  idempotencyKey: string
}) {
  const [event] = await db
    .insert(schema.emailEvents)
    .values({
      to: input.to,
      subject: input.subject,
      template: input.template,
      relatedOrderId: input.relatedOrderId ?? null,
      relatedLeadId: input.relatedLeadId ?? null,
      idempotencyKey: input.idempotencyKey,
    })
    .onConflictDoNothing()
    .returning()
  return event ?? null
}

export async function markEmailEventSent(id: number, providerMessageId: string) {
  await db
    .update(schema.emailEvents)
    .set({ status: 'sent', providerMessageId, sentAt: new Date() })
    .where(eq(schema.emailEvents.id, id))
}

export async function markEmailEventFailed(id: number, error: string) {
  await db.update(schema.emailEvents).set({ status: 'failed', error }).where(eq(schema.emailEvents.id, id))
}
```

- [ ] **Step 6: Add paid-order email sender**

Add to `netlify/functions/_shared/book/email-service.mts`:

```ts
import {
  createQueuedEmailEvent,
  loadPaidOrderEmailSummary,
  markEmailEventFailed,
  markEmailEventSent,
} from './repositories.mts'
import { renderPurchaseConfirmationEmail } from './email-templates.mts'

export async function sendPaidOrderEmails(orderId: number) {
  const summary = await loadPaidOrderEmailSummary(orderId)
  if (!summary) throw new Error('No se pudo cargar el resumen del pedido pagado.')

  const customerEmail = renderPurchaseConfirmationEmail(summary)
  const customerEvent = await createQueuedEmailEvent({
    to: summary.customerEmail,
    subject: customerEmail.subject,
    template: 'purchase-confirmation',
    relatedOrderId: summary.orderId,
    idempotencyKey: `purchase-confirmation:${summary.orderId}`,
  })

  if (customerEvent) {
    try {
      const providerId = await sendTransactionalEmail({
        to: summary.customerEmail,
        subject: customerEmail.subject,
        html: customerEmail.html,
        text: customerEmail.text,
      })
      await markEmailEventSent(customerEvent.id, providerId)
    } catch (error) {
      await markEmailEventFailed(customerEvent.id, error instanceof Error ? error.message : 'Error enviando correo.')
    }
  }
}
```

- [ ] **Step 7: Wire purchase email after webhook**

Modify `netlify/functions/book-stripe-webhook.mts` after `markOrderPaidByStripe(...)`:

```ts
const paidOrder = await markOrderPaidByStripe({
  sessionId: session.id,
  paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
  stripeEventId: event.id,
  stripeEventType: event.type,
})

if (paidOrder) {
  await sendPaidOrderEmails(paidOrder.id)
}
```

Import `sendPaidOrderEmails` from `./_shared/book/email-service.mts`.

- [ ] **Step 8: Commit**

```bash
git add netlify/functions/_shared/book/email-templates.mts netlify/functions/_shared/book/email-service.mts netlify/functions/book-stripe-webhook.mts tests/book-email.test.mts
git commit -m "Add book store transactional emails"
```

## Task 7: Add Public Book Store Pages

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/config/copy.ts`
- Create: `src/book/bookCopy.ts`
- Create: `src/book/api.ts`
- Create: `src/book/BookStorePage.tsx`
- Create: `src/book/BookCheckoutForm.tsx`
- Create: `src/book/InternationalQuoteForm.tsx`
- Create: `src/book/ThankYouPage.tsx`
- Create: `src/book/OrderStatusPage.tsx`
- Create: `src/book/LegalPages.tsx`
- Test: `tests/book-routes.test.mts`

- [ ] **Step 1: Write route/source test**

Create `tests/book-routes.test.mts`:

```ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const appSource = readFileSync('src/App.tsx', 'utf8')
const bookSource = readFileSync('src/book/BookStorePage.tsx', 'utf8')

test('App routes dedicated book store paths before the landing page', () => {
  assert.equal(appSource.includes('getBookRoute'), true)
  assert.equal(appSource.includes('BookStorePage'), true)
  assert.equal(appSource.includes('ThankYouPage'), true)
  assert.equal(appSource.includes('OrderStatusPage'), true)
})

test('book store page posts to the book checkout endpoint', () => {
  assert.equal(bookSource.includes('/api/book/checkout/create-session'), true)
  assert.equal(bookSource.includes('Hazlo Magnífico'), true)
  assert.equal(bookSource.includes('$499 MXN'), true)
})
```

- [ ] **Step 2: Create book copy**

Create `src/book/bookCopy.ts`:

```ts
export const BOOK_STORE_COPY = {
  title: 'Hazlo Magnífico',
  subtitle: 'La fórmula para emprender tus sueños sin perder el alma.',
  price: '$499 MXN',
  hero:
    'Un libro físico para emprender con estrategia, fe, claridad y alma. Envío gratis dentro de México.',
  synopsis:
    'Hazlo Magnífico reúne principios, historias y decisiones para construir algo rentable sin sacrificar lo que más importa.',
  supportEmail: 'oz@expocuspide.com',
  learn: [
    'Ordenar ideas, ambición, fe y ejecución.',
    'Construir una propuesta con claridad comercial.',
    'Avanzar sin perder el alma en el proceso.',
  ],
}
```

- [ ] **Step 3: Create API helper**

Create `src/book/api.ts`:

```ts
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = (await response.json()) as T
  if (!response.ok) {
    throw new Error(readMessage(result))
  }
  return result
}

function readMessage(value: unknown): string {
  if (typeof value === 'object' && value && 'message' in value) {
    const message = (value as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'No se pudo completar la solicitud.'
}
```

- [ ] **Step 4: Create checkout form**

Create `src/book/BookCheckoutForm.tsx` with controlled inputs for quantity, coupon, name, email, phone, street, exterior, interior, neighborhood, city, state, postal code, references. On submit call:

```ts
const result = await postJson<{ ok: boolean; checkoutUrl?: string; message?: string }>(
  '/api/book/checkout/create-session',
  payload,
)
if (result.checkoutUrl) window.location.href = result.checkoutUrl
```

Use button text `Comprar con Stripe` and include the visible copy `Envío gratis dentro de México`.

- [ ] **Step 5: Create book store page**

Create `src/book/BookStorePage.tsx`:

```tsx
import { BookCheckoutForm } from './BookCheckoutForm'
import { InternationalQuoteForm } from './InternationalQuoteForm'
import { BOOK_STORE_COPY } from './bookCopy'

export function BookStorePage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="container-x grid gap-10 py-24 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-yellow">/ Libro físico</p>
          <h1 className="display mt-6 text-[clamp(3rem,9vw,8rem)] [letter-spacing:0]">
            {BOOK_STORE_COPY.title}
          </h1>
          <p className="mt-5 max-w-2xl text-2xl text-paper/90">{BOOK_STORE_COPY.subtitle}</p>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{BOOK_STORE_COPY.hero}</p>
          <div className="mt-10 overflow-hidden rounded-lg border border-yellow/25 bg-yellow/10">
            <img
              src="/assets/track/hazlo-magnifico-libro.jpg"
              alt="Libro Hazlo Magnífico de Oz Creativo."
              className="h-full max-h-[560px] w-full object-cover"
            />
          </div>
        </div>
        <BookCheckoutForm />
      </section>
      <section className="container-x py-16">
        <h2 className="display text-5xl [letter-spacing:0]">Lo que vas a encontrar</h2>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">{BOOK_STORE_COPY.synopsis}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {BOOK_STORE_COPY.learn.map((item) => (
            <div key={item} className="border-l border-yellow bg-white/[0.03] p-5 text-paper/90">
              {item}
            </div>
          ))}
        </div>
      </section>
      <InternationalQuoteForm />
    </main>
  )
}
```

- [ ] **Step 6: Create remaining public pages**

Create `ThankYouPage`, `OrderStatusPage`, and `LegalPages` with the exact routes and clear Spanish copy from the spec. `OrderStatusPage` reads `orderNumber` and `token` from route/query and fetches `GET /api/book/orders/:orderNumber?token=...`.

- [ ] **Step 7: Modify App route detection**

Modify `src/App.tsx` so book/admin/legal routes return before the existing proposal route and landing route:

```tsx
const bookRoute = getBookRoute(window.location.pathname)
if (bookRoute?.type === 'book') return <BookStorePage />
if (bookRoute?.type === 'thanks') return <ThankYouPage />
if (bookRoute?.type === 'order') return <OrderStatusPage orderNumber={bookRoute.orderNumber} />
if (bookRoute?.type === 'legal') return <LegalPage slug={bookRoute.slug} />
```

Add:

```ts
function getBookRoute(pathname: string):
  | { type: 'book' }
  | { type: 'thanks' }
  | { type: 'order'; orderNumber: string }
  | { type: 'legal'; slug: string }
  | null {
  if (pathname === '/libro') return { type: 'book' }
  if (pathname === '/gracias') return { type: 'thanks' }
  const [, route, orderNumber] = pathname.split('/')
  if (route === 'pedido' && orderNumber) return { type: 'order', orderNumber }
  if ([
    'politica-de-envios',
    'cambios-devoluciones-cancelaciones',
    'aviso-de-privacidad',
    'terminos-y-condiciones',
    'contacto',
  ].includes(pathname.slice(1))) {
    return { type: 'legal', slug: pathname.slice(1) }
  }
  return null
}
```

- [ ] **Step 8: Update landing book CTA**

Modify `src/config/copy.ts` book values:

```ts
amazonHref: '/libro',
cta: 'Comprar libro',
ctaPending: 'Comprar libro',
```

- [ ] **Step 9: Run tests and build**

Run:

```bash
npm test -- tests/book-routes.test.mts
npm run build
```

Expected: route test and production build pass.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx src/config/copy.ts src/book tests/book-routes.test.mts
git commit -m "Add Hazlo Magnifico public store pages"
```

## Task 8: Add Coupon Validation And International Quote API

**Files:**
- Create: `netlify/functions/book-coupon-validate.mts`
- Create: `netlify/functions/book-international-quotes.mts`
- Modify: `netlify/functions/_shared/book/repositories.mts`
- Modify: `src/book/InternationalQuoteForm.tsx`

- [ ] **Step 1: Add coupon repository functions**

Add to `repositories.mts`:

```ts
export async function findActiveCoupon(code: string) {
  const normalized = code.trim().toUpperCase()
  const [coupon] = await db
    .select()
    .from(schema.coupons)
    .where(and(eq(schema.coupons.code, normalized), eq(schema.coupons.active, true)))
    .limit(1)
  return coupon ?? null
}
```

- [ ] **Step 2: Create coupon validation API**

Create `netlify/functions/book-coupon-validate.mts`:

```ts
import type { Config } from '@netlify/functions'

import { calculateBookTotals } from './_shared/book/pricing.mts'
import { findActiveCoupon } from './_shared/book/repositories.mts'
import { couponValidationSchema } from './_shared/book/validation.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'

export default async (req: Request) => {
  if (req.method !== 'POST') return methodNotAllowed('POST')
  try {
    const payload = couponValidationSchema.parse(await readJson(req))
    const coupon = await findActiveCoupon(payload.couponCode)
    if (!coupon) return jsonResponse({ ok: false, message: 'Cupón no válido.' }, 404)
    const totals = calculateBookTotals({
      quantity: payload.quantity,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        stackable: coupon.stackable,
      },
    })
    return jsonResponse({ ok: true, totals })
  } catch (error) {
    return jsonResponse({ ok: false, message: error instanceof Error ? error.message : 'No se pudo validar el cupón.' }, 400)
  }
}

export const config: Config = {
  path: '/api/book/coupons/validate',
}
```

- [ ] **Step 3: Add international lead repository**

Add to `repositories.mts`:

```ts
export async function createInternationalQuoteLead(input: {
  name: string
  email: string
  whatsapp: string
  country: string
  city: string
  postalCode: string
  quantity: number
  message?: string
}) {
  const [lead] = await db
    .insert(schema.internationalQuoteLeads)
    .values({ ...input, message: input.message || null })
    .returning()
  return lead
}
```

- [ ] **Step 4: Create international quotes API**

Create `netlify/functions/book-international-quotes.mts`:

```ts
import type { Config } from '@netlify/functions'

import { createInternationalQuoteLead } from './_shared/book/repositories.mts'
import { internationalQuoteSchema } from './_shared/book/validation.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'

export default async (req: Request) => {
  if (req.method !== 'POST') return methodNotAllowed('POST')
  try {
    const payload = internationalQuoteSchema.parse(await readJson(req))
    const lead = await createInternationalQuoteLead(payload)
    return jsonResponse({ ok: true, leadId: lead.id })
  } catch (error) {
    return jsonResponse({ ok: false, message: error instanceof Error ? error.message : 'No se pudo guardar la solicitud.' }, 400)
  }
}

export const config: Config = {
  path: '/api/book/international-quotes',
}
```

- [ ] **Step 5: Connect international form**

Create `src/book/InternationalQuoteForm.tsx`:

```tsx
import { FormEvent, useState } from 'react'

import { postJson } from './api'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function InternationalQuoteForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setMessage('')

    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      whatsapp: String(form.get('whatsapp') || ''),
      country: String(form.get('country') || ''),
      city: String(form.get('city') || ''),
      postalCode: String(form.get('postalCode') || ''),
      quantity: Number(form.get('quantity') || 1),
      message: String(form.get('message') || ''),
    }

    try {
      await postJson('/api/book/international-quotes', payload)
      setStatus('sent')
      setMessage('Recibimos tu solicitud. Te responderemos por correo con el costo total del libro y envío a tu país.')
      event.currentTarget.reset()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.')
    }
  }

  return (
    <section className="container-x py-16">
      <h2 className="display text-5xl [letter-spacing:0]">Compras internacionales</h2>
      <p className="mt-4 max-w-2xl text-muted">
        Si estás fuera de México, solicita una cotización personalizada de libro y envío.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
        <input required name="name" placeholder="Nombre" className="bg-white/10 p-4 text-paper" />
        <input required name="email" type="email" placeholder="Email" className="bg-white/10 p-4 text-paper" />
        <input required name="whatsapp" placeholder="WhatsApp" className="bg-white/10 p-4 text-paper" />
        <input required name="country" placeholder="País" className="bg-white/10 p-4 text-paper" />
        <input required name="city" placeholder="Ciudad" className="bg-white/10 p-4 text-paper" />
        <input required name="postalCode" placeholder="Código postal" className="bg-white/10 p-4 text-paper" />
        <input required name="quantity" type="number" min="1" max="50" defaultValue="1" className="bg-white/10 p-4 text-paper" />
        <textarea name="message" placeholder="Mensaje" className="min-h-32 bg-white/10 p-4 text-paper md:col-span-2" />
        <button disabled={status === 'sending'} className="rounded-full bg-yellow px-6 py-4 font-semibold text-ink md:col-span-2">
          {status === 'sending' ? 'Enviando...' : 'Solicitar cotización internacional'}
        </button>
        {message && <p className="text-sm text-yellow md:col-span-2">{message}</p>}
      </form>
    </section>
  )
}
```

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 7: Commit**

```bash
git add netlify/functions/book-coupon-validate.mts netlify/functions/book-international-quotes.mts netlify/functions/_shared/book/repositories.mts src/book/InternationalQuoteForm.tsx
git commit -m "Add book coupon and international quote APIs"
```

## Task 9: Add Admin Authentication And Shell

**Files:**
- Create: `netlify/functions/_shared/book/auth.mts`
- Create: `netlify/functions/book-admin-auth.mts`
- Create: `src/admin/AdminApp.tsx`
- Create: `src/admin/AdminLogin.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement admin auth helper**

Create `netlify/functions/_shared/book/auth.mts`:

```ts
import bcrypt from 'bcryptjs'

const COOKIE_NAME = 'oz_book_admin'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

export async function verifyAdminPassword(email: string, password: string): Promise<boolean> {
  if (email.toLowerCase() !== (process.env.ADMIN_EMAIL || '').toLowerCase()) return false
  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) throw new Error('Falta configurar ADMIN_PASSWORD_HASH.')
  return bcrypt.compare(password, hash)
}

export function buildSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export function readSessionToken(req: Request): string {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  return match?.[1] || ''
}
```

- [ ] **Step 2: Implement auth API**

Create `netlify/functions/book-admin-auth.mts` with `path: ['/api/book/admin/login', '/api/book/admin/logout', '/api/book/admin/me']`, using `context.params` or URL pathname to route login/logout/me. Login validates `loginSchema`, verifies bcrypt hash, writes `admin_sessions`, and returns a secure cookie.

- [ ] **Step 3: Create admin shell**

Create `src/admin/AdminApp.tsx`:

```tsx
import { useEffect, useState } from 'react'

import { AdminLogin } from './AdminLogin'

export function AdminApp() {
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    fetch('/api/book/admin/me')
      .then((res) => setLoggedIn(res.ok))
      .finally(() => setReady(true))
  }, [])

  if (!ready) return <main className="min-h-screen bg-ink p-8 text-paper">Cargando...</main>
  if (!loggedIn) return <AdminLogin onLoggedIn={() => setLoggedIn(true)} />

  return (
    <main className="min-h-screen bg-ink p-6 text-paper">
      <h1 className="display text-5xl [letter-spacing:0]">Admin Hazlo Magnífico</h1>
      <p className="mt-3 text-muted">Pedidos, inventario, cupones y envíos.</p>
    </main>
  )
}
```

- [ ] **Step 4: Create login form**

Create `src/admin/AdminLogin.tsx` with email/password form posting to `/api/book/admin/login`, credentials included, and error state in Spanish.

- [ ] **Step 5: Route `/admin`**

Modify `src/App.tsx` so `pathname === '/admin' || pathname.startsWith('/admin/')` returns `<AdminApp />`.

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 7: Commit**

```bash
git add netlify/functions/_shared/book/auth.mts netlify/functions/book-admin-auth.mts src/admin src/App.tsx
git commit -m "Add book admin authentication shell"
```

## Task 10: Add Admin Orders, Inventory, Coupons, Leads, And Emails

**Files:**
- Create: `netlify/functions/book-admin-orders.mts`
- Create: `netlify/functions/book-admin-inventory.mts`
- Create: `netlify/functions/book-admin-coupons.mts`
- Create: `netlify/functions/book-admin-international-quotes.mts`
- Create: `netlify/functions/book-admin-emails.mts`
- Create: `src/admin/AdminDashboard.tsx`
- Create: `src/admin/AdminOrders.tsx`
- Create: `src/admin/AdminInventory.tsx`
- Create: `src/admin/AdminCoupons.tsx`
- Create: `src/admin/AdminInternationalQuotes.tsx`
- Create: `src/admin/AdminEmails.tsx`
- Modify: `src/admin/AdminApp.tsx`

- [ ] **Step 1: Add admin repository list functions**

Add these exports to `netlify/functions/_shared/book/repositories.mts`:

```ts
export async function getAdminDashboardMetrics() {
  const orders = await listRecentOrders(500)
  return {
    paidOrders: orders.filter((order) => order.paymentStatus === 'paid').length,
    pendingLabels: orders.filter((order) => order.shippingStatus === 'label_pending').length,
    shippedOrders: orders.filter((order) => order.shippingStatus === 'shipped').length,
    revenueCents: orders
      .filter((order) => order.paymentStatus === 'paid')
      .reduce((total, order) => total + order.totalCents, 0),
  }
}

export async function getAdminOrderDetail(id: number) {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1)
  if (!order) return null
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id))
  const [address] = await db.select().from(schema.shippingAddresses).where(eq(schema.shippingAddresses.orderId, id)).limit(1)
  const [shipment] = await db.select().from(schema.shipments).where(eq(schema.shipments.orderId, id)).limit(1)
  const events = await db.select().from(schema.orderEvents).where(eq(schema.orderEvents.orderId, id))
  return { order, items, address, shipment: shipment ?? null, events }
}

export async function getInventorySummary() {
  return db.select().from(schema.inventory).limit(20)
}

export async function listCoupons() {
  return db.select().from(schema.coupons).orderBy(desc(schema.coupons.createdAt))
}

export async function listInternationalQuoteLeads() {
  return db.select().from(schema.internationalQuoteLeads).orderBy(desc(schema.internationalQuoteLeads.createdAt))
}

export async function listEmailEvents() {
  return db.select().from(schema.emailEvents).orderBy(desc(schema.emailEvents.createdAt)).limit(200)
}
```

- [ ] **Step 2: Create admin API functions**

Each admin function must call `readSessionToken(req)`, validate the session in `admin_sessions`, and return `401` when missing/expired. Use Netlify custom paths for exact endpoints.

- [ ] **Step 3: Build admin tabs**

Update `AdminApp` to render tab buttons:

```tsx
const tabs = ['dashboard', 'orders', 'inventory', 'coupons', 'international', 'emails'] as const
```

The active tab renders the corresponding admin component.

- [ ] **Step 4: Implement order list/detail**

`AdminOrders.tsx` fetches `/api/book/admin/orders`, displays order number, date, customer, email, phone, quantity, total, payment status, shipping status, coupon, and buttons for detail/shipping.

- [ ] **Step 5: Implement inventory screen**

`AdminInventory.tsx` fetches `/api/book/admin/inventory`, displays initial stock, available, sold, reserved, and adjustment form with required reason.

- [ ] **Step 6: Implement coupon screen**

`AdminCoupons.tsx` lists coupons and creates/updates code, type, value, active, min quantity, min subtotal, max uses per email, usage limit, and stackable.

- [ ] **Step 7: Implement international quote screen**

`AdminInternationalQuotes.tsx` lists leads and allows status update to `nuevo`, `cotizado`, `esperando_respuesta`, `convertido`, or `cerrado`.

- [ ] **Step 8: Implement email screen**

`AdminEmails.tsx` lists email events and allows retry only for failed events.

- [ ] **Step 9: Run build**

Run:

```bash
npm run build
```

Expected: build passes and admin UI compiles.

- [ ] **Step 10: Commit**

```bash
git add netlify/functions/book-admin-*.mts netlify/functions/_shared/book/repositories.mts src/admin
git commit -m "Add book admin management screens"
```

## Task 11: Add Skydropx Adapter And Admin Shipment Actions

**Files:**
- Create: `netlify/functions/_shared/book/skydropx.mts`
- Create: `netlify/functions/book-admin-shipping.mts`
- Modify: `src/admin/AdminOrders.tsx`
- Test: `tests/book-skydropx.test.mts`

- [ ] **Step 1: Write Skydropx normalization tests**

Create `tests/book-skydropx.test.mts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeSkydropxRate,
  normalizeSkydropxShipment,
} from '../netlify/functions/_shared/book/skydropx.mts'

test('normalizes Skydropx rate', () => {
  assert.deepEqual(
    normalizeSkydropxRate({
      id: 'rate_1',
      carrier: 'DHL',
      service: 'Express',
      total: '145.50',
      currency: 'MXN',
      days: 2,
    }),
    {
      rateId: 'rate_1',
      carrier: 'DHL',
      service: 'Express',
      totalCents: 14550,
      currency: 'MXN',
      estimatedDays: 2,
    },
  )
})

test('normalizes Skydropx shipment', () => {
  assert.deepEqual(
    normalizeSkydropxShipment({
      id: 'ship_1',
      tracking_number: 'TRACK123',
      tracking_url: 'https://tracking.example/TRACK123',
      label_url: 'https://label.example/label.pdf',
    }),
    {
      shipmentId: 'ship_1',
      trackingNumber: 'TRACK123',
      trackingUrl: 'https://tracking.example/TRACK123',
      labelUrl: 'https://label.example/label.pdf',
    },
  )
})
```

- [ ] **Step 2: Implement Skydropx adapter**

Create `netlify/functions/_shared/book/skydropx.mts` with:

```ts
export type NormalizedSkydropxRate = {
  rateId: string
  carrier: string
  service: string
  totalCents: number
  currency: string
  estimatedDays: number | null
}

export type NormalizedSkydropxShipment = {
  shipmentId: string
  trackingNumber: string
  trackingUrl: string
  labelUrl: string
}

export function normalizeSkydropxRate(raw: Record<string, unknown>): NormalizedSkydropxRate {
  return {
    rateId: String(raw.id || ''),
    carrier: String(raw.carrier || raw.provider || ''),
    service: String(raw.service || raw.service_level || ''),
    totalCents: Math.round(Number(raw.total || raw.amount || 0) * 100),
    currency: String(raw.currency || 'MXN'),
    estimatedDays: raw.days == null ? null : Number(raw.days),
  }
}

export function normalizeSkydropxShipment(raw: Record<string, unknown>): NormalizedSkydropxShipment {
  return {
    shipmentId: String(raw.id || ''),
    trackingNumber: String(raw.tracking_number || raw.trackingNumber || ''),
    trackingUrl: String(raw.tracking_url || raw.trackingUrl || ''),
    labelUrl: String(raw.label_url || raw.labelUrl || ''),
  }
}
```

- [ ] **Step 3: Add Skydropx HTTP contract**

Extend `netlify/functions/_shared/book/skydropx.mts` with these exported contracts. Before writing the request bodies, open the Skydropx Pro API docs linked in this plan and copy the current endpoint names into the `SKYDROPX_ENDPOINTS` object, then keep the function signatures below unchanged so the admin API remains stable.

```ts
const SKYDROPX_ENDPOINTS = {
  token: '/oauth/token',
  quotations: '/v1/quotations',
  rates: (quotationId: string) => `/v1/quotations/${quotationId}/rates`,
  shipments: '/v1/shipments',
  tracking: (shipmentId: string) => `/v1/shipments/${shipmentId}/tracking`,
}

export type SkydropxAddress = {
  name: string
  company?: string
  phone: string
  email?: string
  street: string
  exteriorNumber: string
  interiorNumber?: string
  neighborhood: string
  city: string
  state: string
  postalCode: string
  country: string
}

export type SkydropxParcel = {
  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
}

export async function getToken(): Promise<string> {
  const baseUrl = getSkydropxBaseUrl()
  const response = await fetch(`${baseUrl}${SKYDROPX_ENDPOINTS.token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: requireEnv('SKYDROPX_CLIENT_ID'),
      client_secret: requireEnv('SKYDROPX_CLIENT_SECRET'),
      grant_type: 'client_credentials',
    }),
  })
  const payload = (await response.json()) as { access_token?: string; error?: string }
  if (!response.ok || !payload.access_token) throw new Error(payload.error || 'Skydropx no entregó token.')
  return payload.access_token
}

function getSkydropxBaseUrl(): string {
  return (process.env.SKYDROPX_BASE_URL || 'https://api.skydropx.com').replace(/\/$/, '')
}

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Falta configurar ${key}.`)
  return value
}
```

Implement `createQuotation`, `getQuotationRates`, `createShipment`, and `getTracking` in the same file with these stable signatures:

```ts
export async function createQuotation(input: {
  origin: SkydropxAddress
  destination: SkydropxAddress
  parcel: SkydropxParcel
}): Promise<{ quotationId: string; raw: unknown }>

export async function getQuotationRates(quotationId: string): Promise<NormalizedSkydropxRate[]>

export async function createShipment(input: {
  quotationId: string
  rateId: string
}): Promise<NormalizedSkydropxShipment & { raw: unknown }>

export async function getTracking(shipmentId: string): Promise<{ trackingNumber: string; trackingUrl: string; raw: unknown }>
```

- [ ] **Step 4: Run Skydropx tests**

Run:

```bash
npm test -- tests/book-skydropx.test.mts
```

Expected: PASS.

- [ ] **Step 5: Create admin shipping API**

Create `netlify/functions/book-admin-shipping.mts` with paths:

```ts
export const config = {
  path: [
    '/api/book/admin/orders/:id/quote-shipping',
    '/api/book/admin/orders/:id/create-shipment',
  ],
}
```

Use `context.params.id`, verify admin session, load the order, calculate parcel, quote rates, create shipment, update `shipments`, update order shipping state, and send tracking email with idempotency key `shipment-tracking:${order.id}:${trackingNumber}`.

- [ ] **Step 6: Add admin shipment UI**

Modify `AdminOrders.tsx` so paid orders with `label_pending` can:

- request rates,
- show carrier/service/cost,
- create shipment after confirmation,
- show tracking number,
- open label URL.

- [ ] **Step 7: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 8: Commit**

```bash
git add netlify/functions/_shared/book/skydropx.mts netlify/functions/book-admin-shipping.mts src/admin/AdminOrders.tsx tests/book-skydropx.test.mts
git commit -m "Add Skydropx fulfillment workflow"
```

## Task 12: Add Order Status API, Legal Pages, README, And Deploy Checklist

**Files:**
- Create: `netlify/functions/book-order-status.mts`
- Modify: `src/book/OrderStatusPage.tsx`
- Modify: `src/book/LegalPages.tsx`
- Modify: `README.md`

- [ ] **Step 1: Create order status API**

Create `netlify/functions/book-order-status.mts`:

```ts
import type { Config, Context } from '@netlify/functions'

import { findPublicOrderStatus } from './_shared/book/repositories.mts'
import { jsonResponse, methodNotAllowed } from './_shared/book/http.mts'

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') return methodNotAllowed('GET')
  const orderNumber = context.params.orderNumber || ''
  const token = new URL(req.url).searchParams.get('token') || ''
  const order = await findPublicOrderStatus(orderNumber, token)
  if (!order) return jsonResponse({ ok: false, message: 'Pedido no encontrado.' }, 404)
  return jsonResponse({ ok: true, order })
}

export const config: Config = {
  path: '/api/book/orders/:orderNumber',
}
```

- [ ] **Step 2: Add public status repository**

Add `findPublicOrderStatus(orderNumber, token)` to `repositories.mts`, returning only safe fields: order number, quantity, paid/shipping status, customer first name, address city/state, tracking carrier/service/tracking URL when available.

- [ ] **Step 3: Finalize legal pages**

Update `LegalPages.tsx` with Spanish copy for:

- shipping policy,
- changes, returns and cancellations,
- privacy notice,
- terms and conditions,
- contact/support.

Include support email `oz@expocuspide.com` and invoicing instruction.

- [ ] **Step 4: Update README**

Add a `Hazlo Magnífico Store` section to `README.md` covering:

- Netlify Database setup with `netlify database init`,
- `npm run db:generate`,
- `npm run db:seed`,
- Stripe webhook `/api/book/webhooks/stripe`,
- Resend env vars,
- Skydropx env vars,
- admin password hash generation with bcryptjs,
- test commands,
- production QA checklist.

- [ ] **Step 5: Run complete verification**

Run:

```bash
npm test
npm run build
git status --short
```

Expected: tests pass, build passes, and only intentional files are changed.

- [ ] **Step 6: Commit**

```bash
git add netlify/functions/book-order-status.mts netlify/functions/_shared/book/repositories.mts src/book/OrderStatusPage.tsx src/book/LegalPages.tsx README.md
git commit -m "Finalize book store status and documentation"
```

## Task 13: Production Setup And Live QA

**Files:**
- No secrets committed.
- Netlify environment variables configured in UI or CLI.
- Stripe dashboard webhook configured.
- Skydropx credentials configured.
- Resend verified sender configured.

- [ ] **Step 1: Provision Netlify Database**

Run through Netlify:

```bash
netlify database init
```

Expected: Netlify Database is linked to the site and migrations directory is recognized.

- [ ] **Step 2: Configure production environment**

Set production env vars in Netlify UI or CLI:

```bash
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET_BOOK
RESEND_API_KEY
ORDER_FROM_EMAIL
SUPPORT_EMAIL
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
SESSION_SECRET
SITE_URL
SKYDROPX_CLIENT_ID
SKYDROPX_CLIENT_SECRET
SKYDROPX_BASE_URL
SKYDROPX_ORIGIN_*
```

Expected: no secret values appear in git.

- [ ] **Step 3: Configure Stripe webhook**

In Stripe, create endpoint:

```text
https://ozcreativo.com/api/book/webhooks/stripe
```

Subscribe to:

```text
checkout.session.completed
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET_BOOK`.

- [ ] **Step 4: Deploy preview**

Run:

```bash
npm run build
netlify deploy
```

Expected: preview deploy URL is created.

- [ ] **Step 5: Test preview checkout with Stripe test card**

Use Stripe test card in preview:

```text
4242 4242 4242 4242
```

Expected:

- buyer redirects to `/gracias`,
- order appears in DB/admin,
- stock decreases after webhook,
- confirmation email is sent once.

- [ ] **Step 6: Test admin fulfillment**

In preview admin:

- log in,
- open paid order,
- quote shipment,
- create shipment with Skydropx sandbox/test credentials,
- verify tracking email sends once,
- verify order status page shows tracking.

- [ ] **Step 7: Production deploy**

Run:

```bash
netlify deploy --prod
```

Expected: production deploy completes.

- [ ] **Step 8: Production smoke test**

Verify:

- `https://ozcreativo.com/libro` renders,
- checkout button opens Stripe,
- legal pages render,
- `/admin` requires login,
- existing proposal payment pages still work,
- no browser console errors on `/libro`.

- [ ] **Step 9: Final commit if deployment notes changed**

```bash
git status --short
git add README.md
git commit -m "Document book store production setup"
```

Only run this if README changed during live setup.

## Self-Review Notes

- Spec coverage: public store, checkout, Stripe webhook, Postgres state, inventory, coupons, email, admin, Skydropx, legal, README, and deploy QA are covered.
- Existing proposal flow stays isolated: all new functions use `/api/book/*`; existing `/api/payments/*` remains untouched.
- Data safety: stock changes only occur in webhook payment confirmation.
- Payment safety: Stripe webhook is book-specific and verifies `flow: book-store`.
- Email safety: plan requires idempotent `email_events` keys for confirmation and tracking.
- Shipping safety: Skydropx shipment is admin-triggered, never automatic inside payment webhook.
