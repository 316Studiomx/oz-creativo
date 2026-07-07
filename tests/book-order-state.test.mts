import assert from 'node:assert/strict'
import test from 'node:test'

import { jsonResponse } from '../netlify/functions/_shared/book/http.mts'
import {
  canMarkPaid,
  createShipmentRowAfterPayment,
  nextOrderFulfillmentStateAfterPayment,
  nextShipmentStatusAfterLabel,
} from '../netlify/functions/_shared/book/repositories.mts'

test('canMarkPaid allows checkout-created and payment-pending orders', () => {
  assert.equal(canMarkPaid('checkout_created'), true)
  assert.equal(canMarkPaid('payment_pending'), true)
})

test('canMarkPaid rejects paid and terminal order states', () => {
  assert.equal(canMarkPaid('paid'), false)
  assert.equal(canMarkPaid('shipped'), false)
  assert.equal(canMarkPaid('cancelled'), false)
})

test('nextShipmentStatusAfterLabel returns label-created', () => {
  assert.equal(nextShipmentStatusAfterLabel(), 'label_created')
})

test('paid orders wait for fulfillment without creating shipment rows', () => {
  assert.deepEqual(nextOrderFulfillmentStateAfterPayment(), {
    status: 'label_pending',
    shippingStatus: 'label_pending',
  })
  assert.equal(createShipmentRowAfterPayment(), false)
})

test('jsonResponse defaults to private no-store caching', async () => {
  const response = jsonResponse({ ok: true })

  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8')
  assert.deepEqual(await response.json(), { ok: true })
})

test('jsonResponse preserves caller cache-control override', () => {
  const response = jsonResponse({ ok: true }, 200, {
    'Cache-Control': 'public, max-age=60',
  })

  assert.equal(response.headers.get('cache-control'), 'public, max-age=60')
})
