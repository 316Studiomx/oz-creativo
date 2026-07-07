import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canMarkPaid,
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
