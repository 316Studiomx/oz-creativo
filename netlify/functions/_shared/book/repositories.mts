import { and, asc, desc, eq, gte, sql } from 'drizzle-orm'

import { BOOK_SKU } from './constants.mts'
import type { BookTotals, CouponForTotals } from './pricing.mts'

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

type CheckoutOrderInput = {
  orderNumber: string
  publicToken: string
  customer: {
    name: string
    email: string
    phone: string
  }
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

type MarkOrderPaidInput = {
  sessionId: string
  paymentIntentId: string | null
  stripeEventId: string
  stripeEventType: string
}

type InternationalQuoteLeadInput = {
  name: string
  email: string
  whatsapp: string
  country: string
  city: string
  postalCode: string
  quantity: number
  message?: string
}

type ActiveCouponContext = {
  quantity?: number
  subtotalCents?: number
  email?: string
  now?: Date
}

type CouponRecordForTotals = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  stackable: boolean
}

type RedeemablePaidOrder = {
  id: number
  couponCode: string | null
  couponDiscountCents: number
  customerEmail: string
}

export type BookOrderRecord = {
  id: number
}

export type MarkOrderPaidByStripeResult = {
  order: BookOrderRecord
  shouldSendPaidEmails: boolean
}

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

export type ShipmentEmailSummary = PaidOrderEmailSummary & {
  carrier: string
  service: string
  trackingNumber: string
  trackingUrl: string
}

export type EditableEmailTemplateRecord = {
  id: number
  key: string
  label: string
  description: string
  subjectTemplate: string
  headline: string
  bodyTemplate: string
  buttonLabel: string
  footerNote: string
  active: boolean
  updatedAt: Date
}

export type EditableEmailTemplateUpdateInput = {
  key: string
  subjectTemplate: string
  headline: string
  bodyTemplate: string
  buttonLabel: string
  footerNote: string
}

export type PublicOrderStatus = {
  orderNumber: string
  quantity?: number
  paymentStatus: string
  shipmentStatus: string
  shippingStatus: string
  status: string
  totalCents: number
  totalPaid: string
  addressSummary?: string
  trackingCarrier?: string
  trackingService?: string
  trackingNumber?: string
  trackingUrl?: string
}

export type AdminSession = {
  email: string
  expiresAt: Date
}

export type AdminInventoryAdjustmentInput = {
  inventoryId: number
  deltaAvailable: number
  reason: string
  createdBy: string
}

export type AdminCouponMutationInput = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  active: boolean
  minQuantity: number | null
  minSubtotalCents: number | null
  maxUsesPerEmail: number | null
  usageLimit: number | null
  stackable: boolean
}

export type AdminCouponUpdateInput = Partial<AdminCouponMutationInput> & {
  id: number
}

export type AdminBookReviewMutationInput = {
  author: string
  role: string
  quote: string
  active: boolean
  sortOrder: number
}

export type InternationalLeadStatus =
  | 'nuevo'
  | 'cotizado'
  | 'esperando_respuesta'
  | 'convertido'
  | 'cerrado'

type ShippingAddressForDisplay = {
  street: string
  exteriorNumber: string
  interiorNumber: string | null
  neighborhood: string
  city: string
  state: string
  postalCode: string
  country: string
  references?: string | null
}

type QueuedEmailEventInput = {
  to: string
  subject: string
  template: string
  relatedOrderId?: number
  relatedLeadId?: number
  idempotencyKey: string
}

export type AdminShipmentUpsertInput = {
  orderId: number
  quotationId?: string | null
  rateId?: string | null
  shipmentId?: string | null
  carrier?: string | null
  service?: string | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  labelUrl?: string | null
  realShippingCostCents?: number | null
  status: 'label_pending' | 'label_created' | 'label_error'
  error?: string | null
  rawResponseJson?: unknown
}

const TERMINAL_OR_LOCKED_PAID_STATES = new Set<BookOrderStatus>([
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

export function canMarkPaid(status: BookOrderStatus): boolean {
  return status === 'checkout_created' || status === 'payment_pending'
}

export function nextShipmentStatusAfterLabel(): 'label_created' {
  return 'label_created'
}

export function nextShipmentStatusAfterLabelState(): {
  status: 'label_created'
  shippingStatus: 'label_created'
} {
  return {
    status: 'label_created',
    shippingStatus: 'label_created',
  }
}

export function nextOrderFulfillmentStateAfterPayment(): {
  status: 'label_pending'
  shippingStatus: 'label_pending'
} {
  return {
    status: 'label_pending',
    shippingStatus: 'label_pending',
  }
}

export function createShipmentRowAfterPayment(): false {
  return false
}

export function formatShippingAddressForEmail(address: ShippingAddressForDisplay): string {
  return [
    `${address.street} #${address.exteriorNumber}${address.interiorNumber ? ` Int. ${address.interiorNumber}` : ''}`,
    address.neighborhood,
    address.city,
    address.state,
    `CP ${address.postalCode}`,
    address.country,
    address.references ? `Referencias: ${address.references}` : '',
  ]
    .filter(Boolean)
    .join(', ')
}

async function getDbModule() {
  return import('../../../../db/index.ts')
}

type BookDatabase = Awaited<ReturnType<typeof getDbModule>>['db']
type BookTransaction = Parameters<Parameters<BookDatabase['transaction']>[0]>[0]

export async function findActiveBookProduct() {
  const { db, schema } = await getDbModule()
  const [product] = await db
    .select({
      product: schema.products,
      inventory: schema.inventory,
    })
    .from(schema.products)
    .leftJoin(schema.inventory, eq(schema.inventory.productId, schema.products.id))
    .where(and(eq(schema.products.sku, BOOK_SKU), eq(schema.products.active, true)))
    .limit(1)

  return product ?? null
}

export function couponRecordToTotalsCoupon(coupon: CouponRecordForTotals): CouponForTotals {
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    stackable: coupon.stackable,
  }
}

export async function findActiveCoupon(code: string, context: ActiveCouponContext = {}) {
  const normalized = code.trim().toUpperCase()
  if (!normalized) {
    return null
  }

  const { db, schema } = await getDbModule()
  const [coupon] = await db
    .select()
    .from(schema.coupons)
    .where(and(eq(schema.coupons.code, normalized), eq(schema.coupons.active, true)))
    .limit(1)

  if (!coupon) {
    return null
  }

  const now = context.now ?? new Date()
  if (coupon.startsAt && coupon.startsAt > now) {
    return null
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return null
  }

  if (typeof coupon.usageLimit === 'number' && coupon.usedCount >= coupon.usageLimit) {
    return null
  }

  if (
    typeof coupon.minSubtotalCents === 'number' &&
    typeof context.subtotalCents === 'number' &&
    context.subtotalCents < coupon.minSubtotalCents
  ) {
    return null
  }

  if (
    typeof coupon.minQuantity === 'number' &&
    typeof context.quantity === 'number' &&
    context.quantity < coupon.minQuantity
  ) {
    return null
  }

  if (typeof coupon.maxUsesPerEmail === 'number' && coupon.maxUsesPerEmail <= 0) {
    return null
  }

  const email = context.email?.trim().toLowerCase()
  if (typeof coupon.maxUsesPerEmail === 'number' && email) {
    const [usage] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.couponRedemptions)
      .where(
        and(
          eq(schema.couponRedemptions.couponId, coupon.id),
          sql`lower(${schema.couponRedemptions.email}) = ${email}`,
        ),
      )
      .limit(1)

    if (Number(usage?.count ?? 0) >= coupon.maxUsesPerEmail) {
      return null
    }
  }

  return coupon
}

export async function createCheckoutOrder(input: CheckoutOrderInput) {
  const { db, schema } = await getDbModule()
  const productRecord = await findActiveBookProduct()
  if (!productRecord?.product) {
    throw new Error('El libro no esta disponible.')
  }

  return db.transaction(async (tx) => {
    const now = new Date()
    const [order] = await tx
      .insert(schema.orders)
      .values({
        orderNumber: input.orderNumber,
        publicToken: input.publicToken,
        status: 'checkout_created',
        paymentStatus: 'unpaid',
        shippingStatus: 'not_started',
        customerName: input.customer.name,
        customerEmail: input.customer.email,
        customerPhone: input.customer.phone,
        subtotalCents: input.totals.subtotalCents,
        volumeDiscountPercent: input.totals.volumeDiscountPercent,
        volumeDiscountCents: input.totals.volumeDiscountCents,
        couponCode: input.totals.couponDiscountCents > 0 ? input.totals.couponCode : null,
        couponDiscountCents: input.totals.couponDiscountCents,
        totalDiscountCents: input.totals.totalDiscountCents,
        shippingChargedCents: input.totals.shippingChargedCents,
        totalCents: input.totals.totalCents,
        currency: input.totals.currency,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await tx.insert(schema.orderItems).values({
      orderId: order.id,
      productId: productRecord.product.id,
      sku: productRecord.product.sku,
      title: productRecord.product.title,
      quantity: input.totals.quantity,
      unitPriceCents: input.totals.unitPriceCents,
      subtotalCents: input.totals.subtotalCents,
      totalCents: input.totals.totalCents,
    })

    await tx.insert(schema.shippingAddresses).values({
      orderId: order.id,
      name: input.address.name,
      phone: input.address.phone,
      street: input.address.street,
      exteriorNumber: input.address.exteriorNumber,
      interiorNumber: input.address.interiorNumber || null,
      neighborhood: input.address.neighborhood,
      city: input.address.city,
      state: input.address.state,
      postalCode: input.address.postalCode,
      country: 'MX',
      references: input.address.references || null,
    })

    await tx.insert(schema.orderEvents).values({
      orderId: order.id,
      type: 'checkout_created',
      message: 'Pedido creado antes de redirigir a Stripe.',
    })

    return order
  })
}

export async function attachStripeSession(orderId: number, sessionId: string) {
  const { db, schema } = await getDbModule()
  const now = new Date()
  const [order] = await db
    .update(schema.orders)
    .set({
      stripeCheckoutSessionId: sessionId,
      paymentStatus: 'pending',
      status: 'payment_pending',
      updatedAt: now,
    })
    .where(eq(schema.orders.id, orderId))
    .returning()

  return order ?? null
}

export async function listRecentOrders(limit = 50) {
  const { db, schema } = await getDbModule()
  return db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(limit)
}

export async function getAdminDashboardMetrics() {
  const [orders, leads, emails] = await Promise.all([
    listAdminOrders(500),
    listInternationalQuoteLeads(),
    listEmailEvents(),
  ])

  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid')

  return {
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    unpaidOrders: orders.filter((order) => order.paymentStatus !== 'paid').length,
    pendingLabels: orders.filter((order) => order.shippingStatus === 'label_pending').length,
    shippedOrders: orders.filter((order) => order.shippingStatus === 'shipped').length,
    internationalLeads: leads.length,
    failedEmails: emails.filter((event) => event.status === 'failed').length,
    revenueCents: paidOrders.reduce((total, order) => total + order.totalCents, 0),
  }
}

export async function listAdminOrders(limit = 100) {
  const { db, schema } = await getDbModule()
  return db
    .select({
      id: schema.orders.id,
      orderNumber: schema.orders.orderNumber,
      createdAt: schema.orders.createdAt,
      customerName: schema.orders.customerName,
      customerEmail: schema.orders.customerEmail,
      customerPhone: schema.orders.customerPhone,
      quantity: schema.orderItems.quantity,
      totalCents: schema.orders.totalCents,
      currency: schema.orders.currency,
      paymentStatus: schema.orders.paymentStatus,
      shippingStatus: schema.orders.shippingStatus,
      couponCode: schema.orders.couponCode,
      couponDiscountCents: schema.orders.couponDiscountCents,
    })
    .from(schema.orders)
    .leftJoin(schema.orderItems, eq(schema.orderItems.orderId, schema.orders.id))
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit)
}

export async function getAdminOrderDetail(id: number) {
  const { db, schema } = await getDbModule()
  const [order] = await db
    .select({
      id: schema.orders.id,
      orderNumber: schema.orders.orderNumber,
      status: schema.orders.status,
      paymentStatus: schema.orders.paymentStatus,
      shippingStatus: schema.orders.shippingStatus,
      customerName: schema.orders.customerName,
      customerEmail: schema.orders.customerEmail,
      customerPhone: schema.orders.customerPhone,
      subtotalCents: schema.orders.subtotalCents,
      volumeDiscountPercent: schema.orders.volumeDiscountPercent,
      volumeDiscountCents: schema.orders.volumeDiscountCents,
      couponCode: schema.orders.couponCode,
      couponDiscountCents: schema.orders.couponDiscountCents,
      totalDiscountCents: schema.orders.totalDiscountCents,
      shippingChargedCents: schema.orders.shippingChargedCents,
      totalCents: schema.orders.totalCents,
      currency: schema.orders.currency,
      paidAt: schema.orders.paidAt,
      notes: schema.orders.notes,
      createdAt: schema.orders.createdAt,
      updatedAt: schema.orders.updatedAt,
    })
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1)

  if (!order) return null

  const [items, addresses, shipments, events] = await Promise.all([
    db
      .select({
        id: schema.orderItems.id,
        sku: schema.orderItems.sku,
        title: schema.orderItems.title,
        quantity: schema.orderItems.quantity,
        unitPriceCents: schema.orderItems.unitPriceCents,
        subtotalCents: schema.orderItems.subtotalCents,
        totalCents: schema.orderItems.totalCents,
      })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, id)),
    db
      .select({
        name: schema.shippingAddresses.name,
        phone: schema.shippingAddresses.phone,
        street: schema.shippingAddresses.street,
        exteriorNumber: schema.shippingAddresses.exteriorNumber,
        interiorNumber: schema.shippingAddresses.interiorNumber,
        neighborhood: schema.shippingAddresses.neighborhood,
        city: schema.shippingAddresses.city,
        state: schema.shippingAddresses.state,
        postalCode: schema.shippingAddresses.postalCode,
        country: schema.shippingAddresses.country,
        references: schema.shippingAddresses.references,
      })
      .from(schema.shippingAddresses)
      .where(eq(schema.shippingAddresses.orderId, id))
      .limit(1),
    db
      .select({
        provider: schema.shipments.provider,
        quotationId: schema.shipments.quotationId,
        rateId: schema.shipments.rateId,
        shipmentId: schema.shipments.shipmentId,
        carrier: schema.shipments.carrier,
        service: schema.shipments.service,
        trackingNumber: schema.shipments.trackingNumber,
        trackingUrl: schema.shipments.trackingUrl,
        labelUrl: schema.shipments.labelUrl,
        realShippingCostCents: schema.shipments.realShippingCostCents,
        status: schema.shipments.status,
        error: schema.shipments.error,
        createdAt: schema.shipments.createdAt,
        updatedAt: schema.shipments.updatedAt,
      })
      .from(schema.shipments)
      .where(eq(schema.shipments.orderId, id))
      .limit(1),
    db
      .select({
        id: schema.orderEvents.id,
        type: schema.orderEvents.type,
        message: schema.orderEvents.message,
        createdAt: schema.orderEvents.createdAt,
      })
      .from(schema.orderEvents)
      .where(eq(schema.orderEvents.orderId, id))
      .orderBy(desc(schema.orderEvents.createdAt))
      .limit(50),
  ])

  return {
    order,
    items,
    address: addresses[0] ?? null,
    shipment: shipments[0] ?? null,
    events,
  }
}

export async function getInventorySummary() {
  const { db, schema } = await getDbModule()
  return db
    .select({
      id: schema.inventory.id,
      productId: schema.inventory.productId,
      sku: schema.products.sku,
      title: schema.products.title,
      stockInitial: schema.inventory.stockInitial,
      stockAvailable: schema.inventory.stockAvailable,
      stockSold: schema.inventory.stockSold,
      stockReserved: schema.inventory.stockReserved,
      updatedAt: schema.inventory.updatedAt,
    })
    .from(schema.inventory)
    .leftJoin(schema.products, eq(schema.products.id, schema.inventory.productId))
    .limit(20)
}

export async function adjustInventory(input: AdminInventoryAdjustmentInput) {
  const { db, schema } = await getDbModule()

  return db.transaction(async (tx) => {
    const [stock] = await tx
      .select()
      .from(schema.inventory)
      .where(eq(schema.inventory.id, input.inventoryId))
      .limit(1)

    if (!stock) return null

    const nextAvailable = stock.stockAvailable + input.deltaAvailable
    if (nextAvailable < 0) {
      throw new Error('El ajuste deja inventario negativo.')
    }

    const now = new Date()
    const [updated] = await tx
      .update(schema.inventory)
      .set({
        stockAvailable: nextAvailable,
        updatedAt: now,
      })
      .where(eq(schema.inventory.id, stock.id))
      .returning()

    if (!updated) return null

    await tx.insert(schema.inventoryMovements).values({
      productId: updated.productId,
      type: 'admin_adjustment',
      quantity: input.deltaAvailable,
      reason: input.reason,
      createdBy: input.createdBy,
      createdAt: now,
    })

    const [product] = await tx
      .select({
        sku: schema.products.sku,
        title: schema.products.title,
      })
      .from(schema.products)
      .where(eq(schema.products.id, updated.productId))
      .limit(1)

    return {
      id: updated.id,
      productId: updated.productId,
      sku: product?.sku ?? null,
      title: product?.title ?? null,
      stockInitial: updated.stockInitial,
      stockAvailable: updated.stockAvailable,
      stockSold: updated.stockSold,
      stockReserved: updated.stockReserved,
      updatedAt: updated.updatedAt,
    }
  })
}

export async function listCoupons() {
  const { db, schema } = await getDbModule()
  return db
    .select({
      id: schema.coupons.id,
      code: schema.coupons.code,
      type: schema.coupons.type,
      value: schema.coupons.value,
      active: schema.coupons.active,
      usageLimit: schema.coupons.usageLimit,
      usedCount: schema.coupons.usedCount,
      minSubtotalCents: schema.coupons.minSubtotalCents,
      minQuantity: schema.coupons.minQuantity,
      maxUsesPerEmail: schema.coupons.maxUsesPerEmail,
      stackable: schema.coupons.stackable,
      createdAt: schema.coupons.createdAt,
      updatedAt: schema.coupons.updatedAt,
    })
    .from(schema.coupons)
    .orderBy(desc(schema.coupons.createdAt))
}

export async function getCouponById(id: number) {
  const { db, schema } = await getDbModule()
  const [coupon] = await db
    .select({
      id: schema.coupons.id,
      code: schema.coupons.code,
      type: schema.coupons.type,
      value: schema.coupons.value,
      active: schema.coupons.active,
      usageLimit: schema.coupons.usageLimit,
      usedCount: schema.coupons.usedCount,
      minSubtotalCents: schema.coupons.minSubtotalCents,
      minQuantity: schema.coupons.minQuantity,
      maxUsesPerEmail: schema.coupons.maxUsesPerEmail,
      stackable: schema.coupons.stackable,
      createdAt: schema.coupons.createdAt,
      updatedAt: schema.coupons.updatedAt,
    })
    .from(schema.coupons)
    .where(eq(schema.coupons.id, id))
    .limit(1)

  return coupon ?? null
}

export async function createCoupon(input: AdminCouponMutationInput) {
  const { db, schema } = await getDbModule()
  const now = new Date()
  const [coupon] = await db
    .insert(schema.coupons)
    .values({
      code: normalizeCouponCode(input.code),
      type: input.type,
      value: input.value,
      active: input.active,
      minQuantity: input.minQuantity,
      minSubtotalCents: input.minSubtotalCents,
      maxUsesPerEmail: input.maxUsesPerEmail,
      usageLimit: input.usageLimit,
      stackable: input.stackable,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return coupon ?? null
}

export async function updateCoupon(input: AdminCouponUpdateInput) {
  const { db, schema } = await getDbModule()
  const updates: Partial<typeof schema.coupons.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (typeof input.code === 'string') updates.code = normalizeCouponCode(input.code)
  if (input.type) updates.type = input.type
  if (typeof input.value === 'number') updates.value = input.value
  if (typeof input.active === 'boolean') updates.active = input.active
  if ('minQuantity' in input) updates.minQuantity = input.minQuantity ?? null
  if ('minSubtotalCents' in input) updates.minSubtotalCents = input.minSubtotalCents ?? null
  if ('maxUsesPerEmail' in input) updates.maxUsesPerEmail = input.maxUsesPerEmail ?? null
  if ('usageLimit' in input) updates.usageLimit = input.usageLimit ?? null
  if (typeof input.stackable === 'boolean') updates.stackable = input.stackable

  const [coupon] = await db
    .update(schema.coupons)
    .set(updates)
    .where(eq(schema.coupons.id, input.id))
    .returning()

  return coupon ?? null
}

export async function listBookReviews() {
  const { db, schema } = await getDbModule()
  return db
    .select({
      id: schema.bookReviews.id,
      author: schema.bookReviews.author,
      role: schema.bookReviews.role,
      quote: schema.bookReviews.quote,
      active: schema.bookReviews.active,
      sortOrder: schema.bookReviews.sortOrder,
      createdAt: schema.bookReviews.createdAt,
      updatedAt: schema.bookReviews.updatedAt,
    })
    .from(schema.bookReviews)
    .orderBy(asc(schema.bookReviews.sortOrder), desc(schema.bookReviews.createdAt))
}

export async function listPublicBookReviews() {
  const { db, schema } = await getDbModule()
  return db
    .select({
      author: schema.bookReviews.author,
      role: schema.bookReviews.role,
      quote: schema.bookReviews.quote,
    })
    .from(schema.bookReviews)
    .where(eq(schema.bookReviews.active, true))
    .orderBy(asc(schema.bookReviews.sortOrder), desc(schema.bookReviews.createdAt))
}

export async function createBookReview(input: AdminBookReviewMutationInput) {
  const { db, schema } = await getDbModule()
  const now = new Date()
  const [review] = await db
    .insert(schema.bookReviews)
    .values({
      author: input.author,
      role: input.role,
      quote: input.quote,
      active: input.active,
      sortOrder: input.sortOrder,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return review ?? null
}

export async function listInternationalQuoteLeads() {
  const { db, schema } = await getDbModule()
  return db
    .select({
      id: schema.internationalQuoteLeads.id,
      name: schema.internationalQuoteLeads.name,
      email: schema.internationalQuoteLeads.email,
      whatsapp: schema.internationalQuoteLeads.whatsapp,
      country: schema.internationalQuoteLeads.country,
      city: schema.internationalQuoteLeads.city,
      postalCode: schema.internationalQuoteLeads.postalCode,
      quantity: schema.internationalQuoteLeads.quantity,
      message: schema.internationalQuoteLeads.message,
      status: schema.internationalQuoteLeads.status,
      notes: schema.internationalQuoteLeads.notes,
      createdAt: schema.internationalQuoteLeads.createdAt,
    })
    .from(schema.internationalQuoteLeads)
    .orderBy(desc(schema.internationalQuoteLeads.createdAt))
}

export async function updateInternationalQuoteLead(input: {
  id: number
  status: InternationalLeadStatus
  notes: string | null
}) {
  const { db, schema } = await getDbModule()
  const [lead] = await db
    .update(schema.internationalQuoteLeads)
    .set({
      status: input.status,
      notes: input.notes,
    })
    .where(eq(schema.internationalQuoteLeads.id, input.id))
    .returning()

  return lead ?? null
}

export async function listEmailEvents() {
  const { db, schema } = await getDbModule()
  return db
    .select({
      id: schema.emailEvents.id,
      to: schema.emailEvents.to,
      subject: schema.emailEvents.subject,
      template: schema.emailEvents.template,
      status: schema.emailEvents.status,
      error: schema.emailEvents.error,
      relatedOrderId: schema.emailEvents.relatedOrderId,
      relatedLeadId: schema.emailEvents.relatedLeadId,
      sentAt: schema.emailEvents.sentAt,
      createdAt: schema.emailEvents.createdAt,
    })
    .from(schema.emailEvents)
    .orderBy(desc(schema.emailEvents.createdAt))
    .limit(200)
}

export async function retryEmailEvent(id: number) {
  const { db, schema } = await getDbModule()
  const [event] = await db
    .update(schema.emailEvents)
    .set({
      status: 'queued',
      error: null,
      providerMessageId: null,
      sentAt: null,
    })
    .where(and(eq(schema.emailEvents.id, id), eq(schema.emailEvents.status, 'failed')))
    .returning({
      id: schema.emailEvents.id,
      to: schema.emailEvents.to,
      subject: schema.emailEvents.subject,
      template: schema.emailEvents.template,
      status: schema.emailEvents.status,
      error: schema.emailEvents.error,
      relatedOrderId: schema.emailEvents.relatedOrderId,
      relatedLeadId: schema.emailEvents.relatedLeadId,
      sentAt: schema.emailEvents.sentAt,
      createdAt: schema.emailEvents.createdAt,
    })

  return event ?? null
}

export async function listEditableEmailTemplates(): Promise<EditableEmailTemplateRecord[]> {
  const { db, schema } = await getDbModule()
  return db
    .select({
      id: schema.emailTemplates.id,
      key: schema.emailTemplates.key,
      label: schema.emailTemplates.label,
      description: schema.emailTemplates.description,
      subjectTemplate: schema.emailTemplates.subjectTemplate,
      headline: schema.emailTemplates.headline,
      bodyTemplate: schema.emailTemplates.bodyTemplate,
      buttonLabel: schema.emailTemplates.buttonLabel,
      footerNote: schema.emailTemplates.footerNote,
      active: schema.emailTemplates.active,
      updatedAt: schema.emailTemplates.updatedAt,
    })
    .from(schema.emailTemplates)
    .where(eq(schema.emailTemplates.active, true))
    .orderBy(asc(schema.emailTemplates.id))
}

export async function findEditableEmailTemplate(
  key: string,
): Promise<EditableEmailTemplateRecord | null> {
  if (!isEditableEmailTemplateKey(key)) {
    return null
  }

  const { db, schema } = await getDbModule()
  const [template] = await db
    .select({
      id: schema.emailTemplates.id,
      key: schema.emailTemplates.key,
      label: schema.emailTemplates.label,
      description: schema.emailTemplates.description,
      subjectTemplate: schema.emailTemplates.subjectTemplate,
      headline: schema.emailTemplates.headline,
      bodyTemplate: schema.emailTemplates.bodyTemplate,
      buttonLabel: schema.emailTemplates.buttonLabel,
      footerNote: schema.emailTemplates.footerNote,
      active: schema.emailTemplates.active,
      updatedAt: schema.emailTemplates.updatedAt,
    })
    .from(schema.emailTemplates)
    .where(and(eq(schema.emailTemplates.key, key), eq(schema.emailTemplates.active, true)))
    .limit(1)

  return template ?? null
}

export async function updateEditableEmailTemplate(
  input: EditableEmailTemplateUpdateInput,
): Promise<EditableEmailTemplateRecord | null> {
  if (!isEditableEmailTemplateKey(input.key)) {
    return null
  }

  const { db, schema } = await getDbModule()
  const [template] = await db
    .update(schema.emailTemplates)
    .set({
      subjectTemplate: input.subjectTemplate,
      headline: input.headline,
      bodyTemplate: input.bodyTemplate,
      buttonLabel: input.buttonLabel,
      footerNote: input.footerNote,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.emailTemplates.key, input.key), eq(schema.emailTemplates.active, true)))
    .returning({
      id: schema.emailTemplates.id,
      key: schema.emailTemplates.key,
      label: schema.emailTemplates.label,
      description: schema.emailTemplates.description,
      subjectTemplate: schema.emailTemplates.subjectTemplate,
      headline: schema.emailTemplates.headline,
      bodyTemplate: schema.emailTemplates.bodyTemplate,
      buttonLabel: schema.emailTemplates.buttonLabel,
      footerNote: schema.emailTemplates.footerNote,
      active: schema.emailTemplates.active,
      updatedAt: schema.emailTemplates.updatedAt,
    })

  return template ?? null
}

export async function createAdminSession(email: string, tokenHash: string, expiresAt: Date) {
  const { db, schema } = await getDbModule()
  const [session] = await db
    .insert(schema.adminSessions)
    .values({
      email: email.trim().toLowerCase(),
      tokenHash,
      expiresAt,
    })
    .returning({
      email: schema.adminSessions.email,
      expiresAt: schema.adminSessions.expiresAt,
    })

  return session ?? null
}

export async function findValidAdminSession(
  tokenHash: string,
  now = new Date(),
): Promise<AdminSession | null> {
  if (!tokenHash) {
    return null
  }

  const { db, schema } = await getDbModule()
  const [session] = await db
    .select({
      email: schema.adminSessions.email,
      expiresAt: schema.adminSessions.expiresAt,
    })
    .from(schema.adminSessions)
    .where(and(eq(schema.adminSessions.tokenHash, tokenHash), gte(schema.adminSessions.expiresAt, now)))
    .limit(1)

  return session ?? null
}

export async function deleteAdminSession(tokenHash: string) {
  if (!tokenHash) {
    return
  }

  const { db, schema } = await getDbModule()
  await db.delete(schema.adminSessions).where(eq(schema.adminSessions.tokenHash, tokenHash))
}

export async function createInternationalQuoteLead(input: InternationalQuoteLeadInput) {
  const { db, schema } = await getDbModule()
  const [lead] = await db
    .insert(schema.internationalQuoteLeads)
    .values({
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp,
      country: input.country,
      city: input.city,
      postalCode: input.postalCode,
      quantity: input.quantity,
      message: input.message || null,
    })
    .returning({
      id: schema.internationalQuoteLeads.id,
      status: schema.internationalQuoteLeads.status,
    })

  return lead ?? null
}

export async function findPublicOrderStatus(
  orderNumber: string,
  token: string,
): Promise<PublicOrderStatus | null> {
  const normalizedOrderNumber = orderNumber.trim()
  const normalizedToken = token.trim()

  if (!normalizedOrderNumber || !normalizedToken) {
    return null
  }

  const { db, schema } = await getDbModule()
  const [record] = await db
    .select({
      orderNumber: schema.orders.orderNumber,
      paymentStatus: schema.orders.paymentStatus,
      orderShippingStatus: schema.orders.shippingStatus,
      status: schema.orders.status,
      totalCents: schema.orders.totalCents,
      currency: schema.orders.currency,
      quantity: schema.orderItems.quantity,
      city: schema.shippingAddresses.city,
      state: schema.shippingAddresses.state,
      shipmentStatus: schema.shipments.status,
      trackingCarrier: schema.shipments.carrier,
      trackingService: schema.shipments.service,
      trackingNumber: schema.shipments.trackingNumber,
      trackingUrl: schema.shipments.trackingUrl,
    })
    .from(schema.orders)
    .leftJoin(schema.orderItems, eq(schema.orderItems.orderId, schema.orders.id))
    .leftJoin(schema.shippingAddresses, eq(schema.shippingAddresses.orderId, schema.orders.id))
    .leftJoin(schema.shipments, eq(schema.shipments.orderId, schema.orders.id))
    .where(
      and(
        eq(schema.orders.orderNumber, normalizedOrderNumber),
        eq(schema.orders.publicToken, normalizedToken),
      ),
    )
    .limit(1)

  if (!record) {
    return null
  }

  const shippingStatus = record.shipmentStatus || record.orderShippingStatus

  return {
    orderNumber: record.orderNumber,
    quantity: record.quantity ?? undefined,
    paymentStatus: record.paymentStatus,
    shipmentStatus: shippingStatus,
    shippingStatus,
    status: record.status,
    totalCents: record.totalCents,
    totalPaid: formatPublicMoney(record.totalCents, record.currency),
    addressSummary: formatAddressSummary(record.city, record.state),
    trackingCarrier: record.trackingCarrier ?? undefined,
    trackingService: record.trackingService ?? undefined,
    trackingNumber: record.trackingNumber ?? undefined,
    trackingUrl: record.trackingUrl ?? undefined,
  }
}

export async function loadPaidOrderEmailSummary(
  orderId: number,
): Promise<PaidOrderEmailSummary | null> {
  const { db, schema } = await getDbModule()
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId))
    .limit(1)

  if (!order) {
    return null
  }

  const [item] = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id))
    .limit(1)
  const [shippingAddress] = await db
    .select()
    .from(schema.shippingAddresses)
    .where(eq(schema.shippingAddresses.orderId, order.id))
    .limit(1)

  if (!item || !shippingAddress) {
    return null
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    quantity: item.quantity,
    totalCents: order.totalCents,
    address: formatShippingAddressForEmail(shippingAddress),
  }
}

export async function loadShipmentEmailSummary(
  orderId: number,
): Promise<ShipmentEmailSummary | null> {
  const paidSummary = await loadPaidOrderEmailSummary(orderId)
  if (!paidSummary) {
    return null
  }

  const { db, schema } = await getDbModule()
  const [shipment] = await db
    .select({
      carrier: schema.shipments.carrier,
      service: schema.shipments.service,
      trackingNumber: schema.shipments.trackingNumber,
      trackingUrl: schema.shipments.trackingUrl,
    })
    .from(schema.shipments)
    .where(eq(schema.shipments.orderId, orderId))
    .limit(1)

  if (!shipment?.trackingNumber) {
    return null
  }

  return {
    ...paidSummary,
    carrier: shipment.carrier || 'Paqueteria',
    service: shipment.service || 'Servicio estandar',
    trackingNumber: shipment.trackingNumber,
    trackingUrl: shipment.trackingUrl || '',
  }
}

export async function upsertAdminShipment(input: AdminShipmentUpsertInput) {
  const { db, schema } = await getDbModule()
  const now = new Date()
  const [shipment] = await db
    .insert(schema.shipments)
    .values({
      orderId: input.orderId,
      provider: 'skydropx',
      quotationId: input.quotationId ?? null,
      rateId: input.rateId ?? null,
      shipmentId: input.shipmentId ?? null,
      carrier: input.carrier ?? null,
      service: input.service ?? null,
      trackingNumber: input.trackingNumber ?? null,
      trackingUrl: input.trackingUrl ?? null,
      labelUrl: input.labelUrl ?? null,
      realShippingCostCents: input.realShippingCostCents ?? null,
      status: input.status,
      error: input.error ?? null,
      rawResponseJson: input.rawResponseJson ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.shipments.orderId,
      set: {
        quotationId: input.quotationId ?? null,
        rateId: input.rateId ?? null,
        shipmentId: input.shipmentId ?? null,
        carrier: input.carrier ?? null,
        service: input.service ?? null,
        trackingNumber: input.trackingNumber ?? null,
        trackingUrl: input.trackingUrl ?? null,
        labelUrl: input.labelUrl ?? null,
        realShippingCostCents: input.realShippingCostCents ?? null,
        status: input.status,
        error: input.error ?? null,
        rawResponseJson: input.rawResponseJson ?? null,
        updatedAt: now,
      },
    })
    .returning()

  return shipment ?? null
}

export async function markOrderShippingQuoted(input: {
  orderId: number
  quotationId: string
  rawResponseJson?: unknown
}) {
  const { db, schema } = await getDbModule()
  return db.transaction(async (tx) => {
    const now = new Date()
    const [shipment] = await tx
      .insert(schema.shipments)
      .values({
        orderId: input.orderId,
        provider: 'skydropx',
        quotationId: input.quotationId,
        status: 'label_pending',
        rawResponseJson: input.rawResponseJson ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.shipments.orderId,
        set: {
          quotationId: input.quotationId,
          status: 'label_pending',
          error: null,
          rawResponseJson: input.rawResponseJson ?? null,
          updatedAt: now,
        },
      })
      .returning()

    await tx
      .update(schema.orders)
      .set({
        status: 'label_pending',
        shippingStatus: 'label_pending',
        updatedAt: now,
      })
      .where(eq(schema.orders.id, input.orderId))

    await tx.insert(schema.orderEvents).values({
      orderId: input.orderId,
      type: 'shipping_quoted',
      message: 'Cotizacion de envio generada en Skydropx.',
      metadata: { quotationId: input.quotationId },
      createdAt: now,
    })

    return shipment ?? null
  })
}

export async function markOrderShipmentCreated(input: AdminShipmentUpsertInput) {
  const { db, schema } = await getDbModule()
  return db.transaction(async (tx) => {
    const now = new Date()
    const [shipment] = await tx
      .insert(schema.shipments)
      .values({
        orderId: input.orderId,
        provider: 'skydropx',
        quotationId: input.quotationId ?? null,
        rateId: input.rateId ?? null,
        shipmentId: input.shipmentId ?? null,
        carrier: input.carrier ?? null,
        service: input.service ?? null,
        trackingNumber: input.trackingNumber ?? null,
        trackingUrl: input.trackingUrl ?? null,
        labelUrl: input.labelUrl ?? null,
        realShippingCostCents: input.realShippingCostCents ?? null,
        status: 'label_created',
        error: null,
        rawResponseJson: input.rawResponseJson ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.shipments.orderId,
        set: {
          quotationId: input.quotationId ?? null,
          rateId: input.rateId ?? null,
          shipmentId: input.shipmentId ?? null,
          carrier: input.carrier ?? null,
          service: input.service ?? null,
          trackingNumber: input.trackingNumber ?? null,
          trackingUrl: input.trackingUrl ?? null,
          labelUrl: input.labelUrl ?? null,
          realShippingCostCents: input.realShippingCostCents ?? null,
          status: 'label_created',
          error: null,
          rawResponseJson: input.rawResponseJson ?? null,
          updatedAt: now,
        },
      })
      .returning()

    await tx
      .update(schema.orders)
      .set({
        ...nextShipmentStatusAfterLabelState(),
        updatedAt: now,
      })
      .where(eq(schema.orders.id, input.orderId))

    await tx.insert(schema.orderEvents).values({
      orderId: input.orderId,
      type: 'shipment_created',
      message: 'Guia de envio creada en Skydropx.',
      metadata: {
        quotationId: input.quotationId,
        rateId: input.rateId,
        shipmentId: input.shipmentId,
        trackingNumber: input.trackingNumber,
        carrier: input.carrier,
        service: input.service,
      },
      createdAt: now,
    })

    return shipment ?? null
  })
}

export async function markOrderShipmentError(orderId: number, error: string) {
  const { db, schema } = await getDbModule()
  return db.transaction(async (tx) => {
    const now = new Date()
    const [shipment] = await tx
      .insert(schema.shipments)
      .values({
        orderId,
        provider: 'skydropx',
        status: 'label_error',
        error,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.shipments.orderId,
        set: {
          status: 'label_error',
          error,
          updatedAt: now,
        },
      })
      .returning()

    await tx
      .update(schema.orders)
      .set({
        status: 'label_error',
        shippingStatus: 'label_error',
        updatedAt: now,
      })
      .where(eq(schema.orders.id, orderId))

    await tx.insert(schema.orderEvents).values({
      orderId,
      type: 'label_error',
      message: 'No se pudo crear la guia en Skydropx.',
      metadata: { error },
      createdAt: now,
    })

    return shipment ?? null
  })
}

export async function createQueuedEmailEvent(input: QueuedEmailEventInput) {
  const { db, schema } = await getDbModule()
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

  if (event) {
    return event
  }

  const [existingEvent] = await db
    .select()
    .from(schema.emailEvents)
    .where(eq(schema.emailEvents.idempotencyKey, input.idempotencyKey))
    .limit(1)

  if (!existingEvent || existingEvent.status === 'sent' || existingEvent.status === 'queued') {
    return null
  }

  const [claimedEvent] = await db
    .update(schema.emailEvents)
    .set({
      to: input.to,
      subject: input.subject,
      template: input.template,
      status: 'queued',
      error: null,
      providerMessageId: null,
      sentAt: null,
      relatedOrderId: input.relatedOrderId ?? null,
      relatedLeadId: input.relatedLeadId ?? null,
    })
    .where(and(eq(schema.emailEvents.id, existingEvent.id), eq(schema.emailEvents.status, 'failed')))
    .returning()

  return claimedEvent ?? null
}

export async function markEmailEventSent(id: number, providerMessageId: string) {
  const { db, schema } = await getDbModule()
  await db
    .update(schema.emailEvents)
    .set({
      status: 'sent',
      providerMessageId,
      error: null,
      sentAt: new Date(),
    })
    .where(eq(schema.emailEvents.id, id))
}

export async function markEmailEventFailed(id: number, error: string) {
  const { db, schema } = await getDbModule()
  await db
    .update(schema.emailEvents)
    .set({
      status: 'failed',
      error,
    })
    .where(eq(schema.emailEvents.id, id))
}

export async function hasProcessedStripeEvent(stripeEventId: string): Promise<boolean> {
  const { db, schema } = await getDbModule()
  const [event] = await db
    .select({ id: schema.processedStripeEvents.id })
    .from(schema.processedStripeEvents)
    .where(eq(schema.processedStripeEvents.stripeEventId, stripeEventId))
    .limit(1)

  return Boolean(event)
}

export async function recordStripeEvent(stripeEventId: string, type: string) {
  const { db, schema } = await getDbModule()
  await db
    .insert(schema.processedStripeEvents)
    .values({ stripeEventId, type })
    .onConflictDoNothing()
}

export async function markOrderPaidByStripe(input: MarkOrderPaidInput) {
  const { db, schema } = await getDbModule()
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.stripeCheckoutSessionId, input.sessionId))
      .limit(1)

    if (!order) {
      return null
    }

    const [recordedEvent] = await tx
      .insert(schema.processedStripeEvents)
      .values({
        stripeEventId: input.stripeEventId,
        type: input.stripeEventType,
      })
      .onConflictDoNothing()
      .returning()

    if (!recordedEvent) {
      return buildMarkOrderPaidByStripeResult(order, false)
    }

    if (TERMINAL_OR_LOCKED_PAID_STATES.has(order.status as BookOrderStatus)) {
      return buildMarkOrderPaidByStripeResult(order, false)
    }

    if (!canMarkPaid(order.status as BookOrderStatus)) {
      return buildMarkOrderPaidByStripeResult(order, false)
    }

    const now = new Date()

    const [item] = await tx
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id))
      .limit(1)

    if (!item) {
      const [updatedOrder] = await tx
        .update(schema.orders)
        .set({
          status: 'label_error',
          paymentStatus: 'paid',
          shippingStatus: 'inventory_review',
          stripePaymentIntentId: input.paymentIntentId,
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(schema.orders.id, order.id))
        .returning()

      await tx.insert(schema.orderEvents).values({
        orderId: order.id,
        type: 'label_error',
        message: 'Pago confirmado pero el pedido no tiene articulos para surtir.',
        metadata: { stripeEventId: input.stripeEventId },
      })

      await redeemPaidOrderCoupon(tx, updatedOrder ?? order, now)

      return buildMarkOrderPaidByStripeResult(updatedOrder ?? order, true)
    }

    const [stock] = await tx
      .select()
      .from(schema.inventory)
      .where(eq(schema.inventory.productId, item.productId))
      .limit(1)

    if (!stock || stock.stockAvailable < item.quantity) {
      const [updatedOrder] = await tx
        .update(schema.orders)
        .set({
          status: 'label_error',
          paymentStatus: 'paid',
          shippingStatus: 'inventory_review',
          stripePaymentIntentId: input.paymentIntentId,
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(schema.orders.id, order.id))
        .returning()

      await tx.insert(schema.orderEvents).values({
        orderId: order.id,
        type: 'inventory_review',
        message: 'Pago confirmado sin inventario suficiente para surtir.',
        metadata: {
          stripeEventId: input.stripeEventId,
          requestedQuantity: item.quantity,
          stockAvailable: stock?.stockAvailable ?? 0,
        },
      })

      await redeemPaidOrderCoupon(tx, updatedOrder ?? order, now)

      return buildMarkOrderPaidByStripeResult(updatedOrder ?? order, true)
    }

    const [updatedInventory] = await tx
      .update(schema.inventory)
      .set({
        stockAvailable: sql`${schema.inventory.stockAvailable} - ${item.quantity}`,
        stockSold: sql`${schema.inventory.stockSold} + ${item.quantity}`,
        updatedAt: now,
      })
      .where(and(eq(schema.inventory.id, stock.id), gte(schema.inventory.stockAvailable, item.quantity)))
      .returning()

    if (!updatedInventory) {
      const [updatedOrder] = await tx
        .update(schema.orders)
        .set({
          status: 'label_error',
          paymentStatus: 'paid',
          shippingStatus: 'inventory_review',
          stripePaymentIntentId: input.paymentIntentId,
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(schema.orders.id, order.id))
        .returning()

      await tx.insert(schema.orderEvents).values({
        orderId: order.id,
        type: 'inventory_review',
        message: 'Pago confirmado sin inventario suficiente para surtir.',
        metadata: {
          stripeEventId: input.stripeEventId,
          requestedQuantity: item.quantity,
          stockAvailable: stock.stockAvailable,
        },
      })

      await redeemPaidOrderCoupon(tx, updatedOrder ?? order, now)

      return buildMarkOrderPaidByStripeResult(updatedOrder ?? order, true)
    }

    await tx.insert(schema.inventoryMovements).values({
      productId: item.productId,
      orderId: order.id,
      type: 'sale',
      quantity: item.quantity * -1,
      reason: `Pago confirmado por Stripe ${input.sessionId}`,
      createdBy: 'system',
    })

    const [updatedOrder] = await tx
      .update(schema.orders)
      .set({
        ...nextOrderFulfillmentStateAfterPayment(),
        paymentStatus: 'paid',
        stripePaymentIntentId: input.paymentIntentId,
        paidAt: now,
        updatedAt: now,
      })
      .where(eq(schema.orders.id, order.id))
      .returning()

    await tx.insert(schema.orderEvents).values({
      orderId: order.id,
      type: 'paid',
      message: 'Pago confirmado por Stripe.',
      metadata: {
        stripeEventId: input.stripeEventId,
        stripeEventType: input.stripeEventType,
      },
    })

    await redeemPaidOrderCoupon(tx, updatedOrder ?? order, now)

    return buildMarkOrderPaidByStripeResult(updatedOrder ?? order, true)
  })
}

async function redeemPaidOrderCoupon(
  tx: BookTransaction,
  order: RedeemablePaidOrder,
  now: Date,
): Promise<boolean> {
  if (!order.couponCode || order.couponDiscountCents <= 0) {
    return false
  }

  const { schema } = await getDbModule()

  const [existingRedemption] = await tx
    .select({ id: schema.couponRedemptions.id })
    .from(schema.couponRedemptions)
    .where(eq(schema.couponRedemptions.orderId, order.id))
    .limit(1)

  if (existingRedemption) {
    return true
  }

  const [coupon] = await tx
    .select({
      id: schema.coupons.id,
      code: schema.coupons.code,
      usageLimit: schema.coupons.usageLimit,
      usedCount: schema.coupons.usedCount,
      maxUsesPerEmail: schema.coupons.maxUsesPerEmail,
    })
    .from(schema.coupons)
    .where(eq(schema.coupons.code, order.couponCode))
    .limit(1)

  if (!coupon) {
    await createCouponReviewEvent(tx, order, now, 'No se consumió el cupón: el código ya no existe.')
    return false
  }

  const email = order.customerEmail.trim().toLowerCase()
  if (typeof coupon.maxUsesPerEmail === 'number') {
    const [emailUsage] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.couponRedemptions)
      .where(
        and(
          eq(schema.couponRedemptions.couponId, coupon.id),
          sql`lower(${schema.couponRedemptions.email}) = ${email}`,
        ),
      )
      .limit(1)

    if (Number(emailUsage?.count ?? 0) >= coupon.maxUsesPerEmail) {
      await createCouponReviewEvent(
        tx,
        order,
        now,
        'No se consumió el cupón: el email excedió el máximo de usos.',
      )
      return false
    }
  }

  const [updatedCoupon] = await tx
    .update(schema.coupons)
    .set({
      usedCount: sql`${schema.coupons.usedCount} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.coupons.id, coupon.id),
        sql`(${schema.coupons.usageLimit} is null or ${schema.coupons.usedCount} < ${schema.coupons.usageLimit})`,
      ),
    )
    .returning({ id: schema.coupons.id })

  if (!updatedCoupon) {
    await createCouponReviewEvent(tx, order, now, 'No se consumió el cupón: ya no hay cupo.')
    return false
  }

  const [redemption] = await tx
    .insert(schema.couponRedemptions)
    .values({
      couponId: coupon.id,
      orderId: order.id,
      email: order.customerEmail,
      redeemedAt: now,
    })
    .onConflictDoNothing()
    .returning({ id: schema.couponRedemptions.id })

  if (!redemption) {
    await tx
      .update(schema.coupons)
      .set({
        usedCount: sql`${schema.coupons.usedCount} - 1`,
        updatedAt: now,
      })
      .where(eq(schema.coupons.id, coupon.id))
    return true
  }

  return true
}

async function createCouponReviewEvent(
  tx: BookTransaction,
  order: RedeemablePaidOrder,
  now: Date,
  message: string,
) {
  const { schema } = await getDbModule()
  await tx.insert(schema.orderEvents).values({
    orderId: order.id,
    type: 'coupon_review',
    message,
    metadata: {
      couponCode: order.couponCode,
      couponDiscountCents: order.couponDiscountCents,
      customerEmail: order.customerEmail,
    },
    createdAt: now,
  })
}

function buildMarkOrderPaidByStripeResult(
  order: BookOrderRecord,
  shouldSendPaidEmails: boolean,
): MarkOrderPaidByStripeResult {
  return {
    order,
    shouldSendPaidEmails,
  }
}

function formatAddressSummary(city: string | null, state: string | null): string | undefined {
  const summary = [city, state].filter(Boolean).join(', ')
  return summary || undefined
}

function formatPublicMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
    }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toLocaleString('es-MX')} ${currency || 'MXN'}`
  }
}

function isEditableEmailTemplateKey(key: string): boolean {
  return key === 'purchase-confirmation' || key === 'shipment-tracking'
}

function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}
