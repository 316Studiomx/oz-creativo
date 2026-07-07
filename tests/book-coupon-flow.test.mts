import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const repositoriesSource = readFileSync('netlify/functions/_shared/book/repositories.mts', 'utf8')
const checkoutSource = readFileSync('netlify/functions/book-checkout-create-session.mts', 'utf8')
const checkoutFormSource = readFileSync('src/book/BookCheckoutForm.tsx', 'utf8')

test('book coupon validation endpoint is exposed and calculates backend totals', () => {
  assert.equal(existsSync('netlify/functions/book-coupon-validate.mts'), true)

  const couponEndpointSource = readFileSync('netlify/functions/book-coupon-validate.mts', 'utf8')

  assert.equal(couponEndpointSource.includes("path: '/api/book/coupons/validate'"), true)
  assert.equal(couponEndpointSource.includes('couponValidationSchema'), true)
  assert.equal(couponEndpointSource.includes('findActiveCoupon'), true)
  assert.equal(couponEndpointSource.includes('calculateBookTotals'), true)
  assert.match(couponEndpointSource, /ok:\s*true,\s*totals/s)
  assert.match(couponEndpointSource, /Cup[oó]n no v[aá]lido/i)
})

test('checkout validates coupons on the backend before creating Stripe sessions', () => {
  const findCouponIndex = checkoutSource.indexOf('findActiveCoupon')
  const createOrderIndex = checkoutSource.indexOf('createCheckoutOrder')
  const stripeIndex = checkoutSource.indexOf('createBookCheckoutSession')

  assert.ok(findCouponIndex >= 0)
  assert.ok(createOrderIndex >= 0)
  assert.ok(stripeIndex >= 0)
  assert.ok(findCouponIndex < createOrderIndex)
  assert.ok(findCouponIndex < stripeIndex)
  assert.match(checkoutSource, /calculateBookTotals\(\{[\s\S]*coupon:/)
  assert.match(checkoutSource, /Cup[oó]n no v[aá]lido/i)
})

test('coupon repository normalizes codes and rejects unavailable coupons', () => {
  assert.equal(repositoriesSource.includes('findActiveCoupon'), true)
  assert.match(repositoriesSource, /\.trim\(\)\.toUpperCase\(\)/)
  assert.match(repositoriesSource, /eq\(schema\.coupons\.active,\s*true\)/)
  assert.equal(repositoriesSource.includes('startsAt'), true)
  assert.equal(repositoriesSource.includes('expiresAt'), true)
  assert.equal(repositoriesSource.includes('usageLimit'), true)
  assert.equal(repositoriesSource.includes('minSubtotalCents'), true)
  assert.equal(repositoriesSource.includes('minQuantity'), true)
  assert.equal(repositoriesSource.includes('maxUsesPerEmail'), true)
})

test('checkout form validates coupon estimates without trusting frontend totals', () => {
  assert.equal(checkoutFormSource.includes('/api/book/coupons/validate'), true)
  assert.equal(checkoutFormSource.includes('Aplicar cupón'), true)
  assert.equal(checkoutFormSource.includes('couponTotals'), true)
  assert.equal(checkoutFormSource.includes('couponDiscountCents > 0'), true)
  assert.equal(checkoutFormSource.includes('/api/book/checkout/create-session'), true)
  const payloadStart = checkoutFormSource.indexOf('const payload = {')
  const payloadEnd = checkoutFormSource.indexOf('    try {', payloadStart)
  assert.ok(payloadStart >= 0)
  assert.ok(payloadEnd > payloadStart)
  assert.doesNotMatch(checkoutFormSource.slice(payloadStart, payloadEnd), /totalCents\s*:/)
})

test('paid coupon redemption runs for every Stripe-paid branch', () => {
  assert.match(repositoriesSource, /async function redeemPaidOrderCoupon\(/)

  const paidReturns = [
    ...repositoriesSource.matchAll(
      /return buildMarkOrderPaidByStripeResult\(updatedOrder \?\? order, true\)/g,
    ),
  ]

  assert.equal(paidReturns.length, 4)

  for (const match of paidReturns) {
    const branchSource = repositoriesSource.slice(Math.max(0, match.index - 600), match.index)
    assert.match(branchSource, /await redeemPaidOrderCoupon\(tx, updatedOrder \?\? order, now\)/)
  }
})

test('coupon redemption is guarded by real discount and late limit checks', () => {
  const helperStart = repositoriesSource.indexOf('async function redeemPaidOrderCoupon')
  const helperEnd = repositoriesSource.indexOf('function buildMarkOrderPaidByStripeResult', helperStart)
  assert.ok(helperStart >= 0)
  assert.ok(helperEnd > helperStart)

  const helperSource = repositoriesSource.slice(helperStart, helperEnd)

  assert.match(helperSource, /couponDiscountCents\s*<=\s*0/)
  assert.match(helperSource, /couponRedemptions/)
  assert.match(helperSource, /onConflictDoNothing/)
  assert.match(helperSource, /usageLimit/)
  assert.match(helperSource, /usedCount/)
  assert.match(helperSource, /maxUsesPerEmail/)
  assert.match(helperSource, /coupon_review/)
  assert.match(helperSource, /No se consumió el cupón/)
})
