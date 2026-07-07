import {
  BOOK_CURRENCY,
  BOOK_PRICE_CENTS,
  FREE_MEXICO_SHIPPING_CENTS,
  MAX_BOOK_QUANTITY,
  MIN_BOOK_QUANTITY,
} from './constants.mts'

export { BOOK_PRICE_CENTS }

export type CouponForTotals = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  stackable: boolean
}

export type BookTotals = {
  currency: 'MXN'
  quantity: number
  unitPriceCents: number
  subtotalCents: number
  volumeDiscountPercent: number
  volumeDiscountCents: number
  couponCode: string | null
  couponDiscountCents: number
  totalDiscountCents: number
  shippingChargedCents: number
  totalCents: number
  discountLabel: string | null
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}

export function calculateBookTotals(input: {
  quantity: number
  coupon?: CouponForTotals | null
}): BookTotals {
  if (!Number.isInteger(input.quantity)) {
    throw new Error('La cantidad debe estar entre 1 y 10 libros.')
  }

  const quantity = input.quantity
  if (quantity < MIN_BOOK_QUANTITY || quantity > MAX_BOOK_QUANTITY) {
    throw new Error('La cantidad debe estar entre 1 y 10 libros.')
  }

  const subtotalCents = quantity * BOOK_PRICE_CENTS
  const volumeDiscountPercent = getVolumeDiscountPercent(quantity)
  const volumeDiscountCents = Math.round((subtotalCents * volumeDiscountPercent) / 100)
  const validatedCoupon = input.coupon ? assertValidCoupon(input.coupon) : null
  const rawCouponDiscountCents = validatedCoupon
    ? calculateCouponDiscountCents(subtotalCents, validatedCoupon)
    : 0

  let couponDiscountCents = 0
  let totalDiscountCents = volumeDiscountCents
  let discountLabel: string | null = volumeDiscountCents > 0 ? 'Descuento por volumen' : null

  if (validatedCoupon) {
    if (validatedCoupon.stackable) {
      couponDiscountCents = rawCouponDiscountCents
      totalDiscountCents = Math.min(subtotalCents, volumeDiscountCents + couponDiscountCents)
      discountLabel = volumeDiscountCents > 0 ? 'Descuento por volumen + cupón' : 'Cupón'
    } else if (rawCouponDiscountCents > volumeDiscountCents) {
      couponDiscountCents = rawCouponDiscountCents
      totalDiscountCents = couponDiscountCents
      discountLabel = 'Cupón'
    }
  }

  const totalCents = Math.max(
    0,
    subtotalCents - totalDiscountCents + FREE_MEXICO_SHIPPING_CENTS,
  )

  return {
    currency: BOOK_CURRENCY,
    quantity,
    unitPriceCents: BOOK_PRICE_CENTS,
    subtotalCents,
    volumeDiscountPercent,
    volumeDiscountCents,
    couponCode: validatedCoupon ? normalizeCouponCode(validatedCoupon.code) : null,
    couponDiscountCents,
    totalDiscountCents,
    shippingChargedCents: FREE_MEXICO_SHIPPING_CENTS,
    totalCents,
    discountLabel,
  }
}

export function getVolumeDiscountPercent(quantity: number): number {
  if (quantity === 10) return 20
  if (quantity >= 5) return 10
  return 0
}

function assertValidCoupon(coupon: CouponForTotals): CouponForTotals {
  if (coupon.type !== 'percent' && coupon.type !== 'fixed') {
    throw new Error('Cupón inválido.')
  }

  if (typeof coupon.value !== 'number' || !Number.isFinite(coupon.value)) {
    throw new Error('Cupón inválido.')
  }

  if (coupon.type === 'percent' && (coupon.value < 0 || coupon.value > 100)) {
    throw new Error('Cupón inválido.')
  }

  if (coupon.type === 'fixed' && coupon.value < 0) {
    throw new Error('Cupón inválido.')
  }

  return coupon
}

function calculateCouponDiscountCents(subtotalCents: number, coupon: CouponForTotals): number {
  if (coupon.type === 'percent') {
    return Math.min(subtotalCents, Math.round((subtotalCents * coupon.value) / 100))
  }

  return Math.min(subtotalCents, Math.round(coupon.value))
}
