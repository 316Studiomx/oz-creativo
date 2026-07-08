import {
  boolean,
  index,
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
export const internationalLeadStatusEnum = pgEnum('international_lead_status', [
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
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  stockInitial: integer('stock_initial').notNull(),
  stockAvailable: integer('stock_available').notNull(),
  stockSold: integer('stock_sold').notNull().default(0),
  stockReserved: integer('stock_reserved').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdIdx: uniqueIndex('inventory_product_id_idx').on(table.productId),
}))

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
}, (table) => ({
  publicTokenIdx: uniqueIndex('orders_public_token_idx').on(table.publicToken),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  customerEmailIdx: index('orders_customer_email_idx').on(table.customerEmail),
}))

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  sku: text('sku').notNull(),
  title: text('title').notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  totalCents: integer('total_cents').notNull(),
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
}))

export const shippingAddresses = pgTable('shipping_addresses', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .unique()
    .references(() => orders.id),
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

export const shipments = pgTable('shipments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .unique()
    .references(() => orders.id),
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
}, (table) => ({
  trackingNumberIdx: index('shipments_tracking_number_idx').on(table.trackingNumber),
}))

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

export const couponRedemptions = pgTable('coupon_redemptions', {
  id: serial('id').primaryKey(),
  couponId: integer('coupon_id')
    .notNull()
    .references(() => coupons.id),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  email: text('email').notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  couponIdIdx: index('coupon_redemptions_coupon_id_idx').on(table.couponId),
  orderIdIdx: uniqueIndex('coupon_redemptions_order_id_idx').on(table.orderId),
  emailIdx: index('coupon_redemptions_email_idx').on(table.email),
}))

export const discountRules = pgTable('discount_rules', {
  id: serial('id').primaryKey(),
  minQuantity: integer('min_quantity').notNull(),
  maxQuantity: integer('max_quantity').notNull(),
  percent: integer('percent').notNull(),
  active: boolean('active').notNull().default(true),
}, (table) => ({
  quantityRangeIdx: uniqueIndex('discount_rules_quantity_range_idx').on(table.minQuantity, table.maxQuantity),
}))

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
  status: internationalLeadStatusEnum('status').notNull().default('nuevo'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  createdAtIdx: index('international_quote_leads_created_at_idx').on(table.createdAt),
}))

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
  relatedOrderIdx: index('email_events_related_order_id_idx').on(table.relatedOrderId),
}))

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  description: text('description').notNull(),
  subjectTemplate: text('subject_template').notNull(),
  headline: text('headline').notNull(),
  bodyTemplate: text('body_template').notNull(),
  buttonLabel: text('button_label').notNull().default(''),
  footerNote: text('footer_note').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  keyIdx: uniqueIndex('email_templates_key_idx').on(table.key),
}))

export const bookReviews = pgTable('book_reviews', {
  id: serial('id').primaryKey(),
  author: text('author').notNull(),
  role: text('role').notNull(),
  quote: text('quote').notNull(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  activeSortIdx: index('book_reviews_active_sort_idx').on(table.active, table.sortOrder),
  createdAtIdx: index('book_reviews_created_at_idx').on(table.createdAt),
}))

export const processedStripeEvents = pgTable('processed_stripe_events', {
  id: serial('id').primaryKey(),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
})

export const orderEvents = pgTable('order_events', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  type: text('type').notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orderIdIdx: index('order_events_order_id_idx').on(table.orderId),
  createdAtIdx: index('order_events_created_at_idx').on(table.createdAt),
}))

export const inventoryMovements = pgTable('inventory_movements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  orderId: integer('order_id').references(() => orders.id),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by').notNull().default('system'),
}, (table) => ({
  productIdIdx: index('inventory_movements_product_id_idx').on(table.productId),
  orderIdIdx: index('inventory_movements_order_id_idx').on(table.orderId),
}))

export const adminSessions = pgTable('admin_sessions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  expiresAtIdx: index('admin_sessions_expires_at_idx').on(table.expiresAt),
}))
