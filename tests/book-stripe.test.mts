import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildStripeLineItem,
  buildStripeReturnUrls,
  createBookCheckoutSession,
} from '../netlify/functions/_shared/book/stripe.mts'

test('buildStripeLineItem returns the Hazlo Magnifico line item expected by Stripe', () => {
  assert.deepEqual(
    buildStripeLineItem({
      quantity: 2,
      totalCents: 99800,
      orderNumber: 'HM-20260706-ABC123',
    }),
    [
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
    ],
  )
})

test('buildStripeReturnUrls returns the expected success and cancel routes', () => {
  assert.deepEqual(
    buildStripeReturnUrls('https://ozcreativo.com', 'HM-1', 'tok_123'),
    {
      successUrl: 'https://ozcreativo.com/gracias?order=HM-1&token=tok_123',
      cancelUrl: 'https://ozcreativo.com/libro?checkout=cancelled',
    },
  )
})

test('createBookCheckoutSession forwards book metadata into Stripe Checkout', async () => {
  const calls: Array<Record<string, unknown>> = []
  const stripe = {
    checkout: {
      sessions: {
        create: async (params: Record<string, unknown>) => {
          calls.push(params)
          return {
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/c/pay/cs_test_123',
          }
        },
      },
    },
  }

  const session = await createBookCheckoutSession({
    stripe,
    siteUrl: 'https://ozcreativo.com',
    order: {
      id: 42,
      orderNumber: 'HM-20260706-ABC123',
      publicToken: 'tok_123',
      customerEmail: 'lector@example.com',
      totalCents: 99800,
    },
    totals: {
      quantity: 2,
      totalCents: 99800,
    },
  })

  assert.equal(session.id, 'cs_test_123')
  assert.equal(session.url, 'https://checkout.stripe.com/c/pay/cs_test_123')
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], {
    mode: 'payment',
    success_url: 'https://ozcreativo.com/gracias?order=HM-20260706-ABC123&token=tok_123',
    cancel_url: 'https://ozcreativo.com/libro?checkout=cancelled',
    customer_email: 'lector@example.com',
    client_reference_id: 'HM-20260706-ABC123',
    line_items: [
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
    ],
    metadata: {
      flow: 'book-store',
      orderId: '42',
      orderNumber: 'HM-20260706-ABC123',
      publicToken: 'tok_123',
      quantity: '2',
    },
  })
})
