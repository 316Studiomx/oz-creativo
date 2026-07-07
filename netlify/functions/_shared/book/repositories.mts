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
      return order
    }

    if (TERMINAL_OR_LOCKED_PAID_STATES.has(order.status as BookOrderStatus)) {
      return order
    }

    if (!canMarkPaid(order.status as BookOrderStatus)) {
      return order
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

      return updatedOrder ?? order
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

      return updatedOrder ?? order
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

      return updatedOrder ?? order
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

    return updatedOrder ?? order
  })
}
