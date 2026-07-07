import assert from 'node:assert/strict'
import test from 'node:test'

import * as adminCoupons from '../netlify/functions/book-admin-coupons.mts'
import * as adminOrders from '../netlify/functions/book-admin-orders.mts'

const existingPercentCoupon = {
  id: 7,
  code: 'SAVE20',
  type: 'percent' as const,
  value: 20,
  active: true,
  minQuantity: null,
  minSubtotalCents: null,
  maxUsesPerEmail: null,
  usageLimit: null,
  stackable: false,
}

const existingFixedCoupon = {
  ...existingPercentCoupon,
  code: 'SAVE500',
  type: 'fixed' as const,
  value: 50000,
}

test('admin fixed coupon values are entered as MXN pesos and stored as cents', () => {
  assert.equal(typeof adminCoupons.normalizeAdminCouponCreate, 'function')

  const parsed = adminCoupons.normalizeAdminCouponCreate({
    code: 'save100',
    type: 'fixed',
    value: 100,
    active: true,
    stackable: false,
  })

  assert.deepEqual(parsed, {
    ok: true,
    value: {
      code: 'SAVE100',
      type: 'fixed',
      value: 10000,
      active: true,
      minQuantity: null,
      minSubtotalCents: null,
      maxUsesPerEmail: null,
      usageLimit: null,
      stackable: false,
    },
  })
})

test('admin coupon patch validates the final merged percent state', () => {
  assert.equal(typeof adminCoupons.normalizeAdminCouponPatch, 'function')

  assert.deepEqual(adminCoupons.normalizeAdminCouponPatch({ id: 7, value: 150 }, existingPercentCoupon), {
    ok: false,
    message: 'El porcentaje no puede ser mayor a 100.',
  })

  assert.deepEqual(adminCoupons.normalizeAdminCouponPatch({ id: 7, type: 'percent' }, existingFixedCoupon), {
    ok: false,
    message: 'El porcentaje no puede ser mayor a 100.',
  })
})

test('admin coupon validation rejects zero limits and string booleans', () => {
  assert.deepEqual(
    adminCoupons.normalizeAdminCouponCreate({
      code: 'ZERO',
      type: 'percent',
      value: 10,
      usageLimit: 0,
      active: true,
      stackable: false,
    }),
    {
      ok: false,
      message: 'El limite de usos debe ser mayor a cero o quedar vacio.',
    },
  )

  assert.deepEqual(
    adminCoupons.normalizeAdminCouponPatch({ id: 7, maxUsesPerEmail: 0 }, existingPercentCoupon),
    {
      ok: false,
      message: 'El maximo por email debe ser mayor a cero o quedar vacio.',
    },
  )

  assert.deepEqual(adminCoupons.normalizeAdminCouponPatch({ id: 7, active: 'false' }, existingPercentCoupon), {
    ok: false,
    message: 'Activo debe ser verdadero o falso.',
  })

  assert.deepEqual(adminCoupons.normalizeAdminCouponPatch({ id: 7, stackable: 'false' }, existingPercentCoupon), {
    ok: false,
    message: 'Acumulable debe ser verdadero o falso.',
  })
})

test('admin order route treats non numeric order ids as invalid', () => {
  assert.equal(typeof adminOrders.readAdminOrderRoute, 'function')
  assert.deepEqual(adminOrders.readAdminOrderRoute('/api/book/admin/orders/abc'), { kind: 'invalid' })
})
