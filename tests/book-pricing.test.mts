import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BOOK_PRICE_CENTS,
  calculateBookTotals,
  normalizeCouponCode,
} from '../netlify/functions/_shared/book/pricing.mts'
import { buildOrderNumber, buildPublicOrderToken } from '../netlify/functions/_shared/book/order-numbers.mts'

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

test('negative fixed coupon is rejected', () => {
  assert.throws(
    () =>
      calculateBookTotals({
        quantity: 2,
        coupon: {
          code: 'NEGATIVO',
          type: 'fixed',
          value: -100,
          stackable: false,
        },
      }),
    /Cupón inválido\./i,
  )
})

test('NaN fixed coupon is rejected', () => {
  assert.throws(
    () =>
      calculateBookTotals({
        quantity: 2,
        coupon: {
          code: 'NAN',
          type: 'fixed',
          value: Number.NaN,
          stackable: false,
        },
      }),
    /Cupón inválido\./i,
  )
})

test('Infinity percent coupon is rejected', () => {
  assert.throws(
    () =>
      calculateBookTotals({
        quantity: 2,
        coupon: {
          code: 'INFINITE',
          type: 'percent',
          value: Number.POSITIVE_INFINITY,
          stackable: false,
        },
      }),
    /Cupón inválido\./i,
  )
})

test('percent coupon above 100 is rejected', () => {
  assert.throws(
    () =>
      calculateBookTotals({
        quantity: 2,
        coupon: {
          code: 'ALTO',
          type: 'percent',
          value: 110,
          stackable: false,
        },
      }),
    /Cupón inválido\./i,
  )
})

test('quantity outside 1 through 10 is rejected', () => {
  assert.throws(() => calculateBookTotals({ quantity: 0 }), /cantidad debe estar entre 1 y 10/i)
  assert.throws(() => calculateBookTotals({ quantity: 11 }), /cantidad debe estar entre 1 y 10/i)
  assert.throws(() => calculateBookTotals({ quantity: 1.5 }), /cantidad debe estar entre 1 y 10/i)
})

test('coupon codes are normalized for storage and comparison', () => {
  assert.equal(normalizeCouponCode(' magnifico-10 '), 'MAGNIFICO-10')
})

test('order number helper supports deterministic inputs', () => {
  assert.equal(
    buildOrderNumber(new Date('2026-07-06T00:00:00.000Z'), 12345),
    'HM-20260706-0009IX',
  )
})

test('public order token is deterministic with fixed bytes', () => {
  const token = buildPublicOrderToken(new Uint8Array([0, 15, 255, 16, 32, 48]))
  assert.equal(token, '000fff102030')
})
