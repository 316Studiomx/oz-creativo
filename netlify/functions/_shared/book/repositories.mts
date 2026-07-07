import { and, desc, eq, gte, sql } from 'drizzle-orm'

import { BOOK_SKU } from './constants.mts'
import type { BookTotals } from './pricing.mts'

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
        couponCode: input.totals.couponCode,
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
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, order.id))
        .returning()

      await tx.insert(schema.orderEvents).values({
        orderId: order.id,
        type: 'label_error',
        message: 'Pago confirmado pero el pedido no tiene articulos para surtir.',
        metadata: { stripeEventId: input.stripeEventId },
      })

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
          paidAt: new Date(),
          updatedAt: new Date(),
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

      return buildMarkOrderPaidByStripeResult(updatedOrder ?? order, true)
    }

    const now = new Date()

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

    return buildMarkOrderPaidByStripeResult(updatedOrder ?? order, true)
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
