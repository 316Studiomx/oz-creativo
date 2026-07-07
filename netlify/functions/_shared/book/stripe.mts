import Stripe from 'stripe'

import { BOOK_TITLE } from './constants.mts'

export type StripeLike = {
  checkout: {
    sessions: {
      create: (params: Record<string, unknown>) => Promise<{
        id?: string | null
        url?: string | null
      }>
    }
  }
}

export type BookStripeOrder = {
  id: number
  orderNumber: string
  publicToken: string
  customerEmail: string
  totalCents: number
}

export type BookStripeTotals = {
  quantity: number
  totalCents: number
}

export function getStripe(secretKey: string): Stripe {
  return new Stripe(secretKey)
}

export function buildStripeLineItem(input: {
  quantity: number
  totalCents: number
  orderNumber: string
}) {
  return [
    {
      quantity: 1,
      price_data: {
        currency: 'mxn',
        unit_amount: input.totalCents,
        product_data: {
          name: `${BOOK_TITLE} · ${input.orderNumber}`,
          description: `${input.quantity} libros físicos con envío gratis dentro de México.`,
        },
      },
    },
  ]
}

export function buildStripeReturnUrls(siteUrl: string, orderNumber: string, publicToken: string) {
  const origin = new URL(siteUrl).origin
  const successUrl = new URL('/gracias', origin)
  successUrl.searchParams.set('order', orderNumber)
  successUrl.searchParams.set('token', publicToken)

  const cancelUrl = new URL('/libro', origin)
  cancelUrl.searchParams.set('checkout', 'cancelled')

  return {
    successUrl: successUrl.toString(),
    cancelUrl: cancelUrl.toString(),
  }
}

export async function createBookCheckoutSession(input: {
  stripe: StripeLike
  siteUrl: string
  order: BookStripeOrder
  totals: BookStripeTotals
}) {
  const returnUrls = buildStripeReturnUrls(
    input.siteUrl,
    input.order.orderNumber,
    input.order.publicToken,
  )

  return input.stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: returnUrls.successUrl,
    cancel_url: returnUrls.cancelUrl,
    customer_email: input.order.customerEmail,
    client_reference_id: input.order.orderNumber,
    line_items: buildStripeLineItem({
      quantity: input.totals.quantity,
      totalCents: input.order.totalCents,
      orderNumber: input.order.orderNumber,
    }),
    metadata: {
      flow: 'book-store',
      orderId: String(input.order.id),
      orderNumber: input.order.orderNumber,
      publicToken: input.order.publicToken,
      quantity: String(input.totals.quantity),
    },
  })
}
