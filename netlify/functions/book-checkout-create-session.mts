import type { Config } from '@netlify/functions'

import { getSiteUrl, jsonResponse, methodNotAllowed } from './_shared/book/http.mts'
import { buildOrderNumber, buildPublicOrderToken } from './_shared/book/order-numbers.mts'
import { calculateBookTotals } from './_shared/book/pricing.mts'
import {
  attachStripeSession,
  couponRecordToTotalsCoupon,
  findActiveCoupon,
  createCheckoutOrder,
} from './_shared/book/repositories.mts'
import { createBookCheckoutSession, getStripe } from './_shared/book/stripe.mts'
import { checkoutSchema } from './_shared/book/validation.mts'

declare const Netlify: {
  env: {
    get: (key: string) => string | undefined
  }
}

type CheckoutRequest = {
  quantity?: unknown
  couponCode?: unknown
  customer?: unknown
  address?: unknown
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return methodNotAllowed('POST')
  }

  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) {
    return jsonResponse({ ok: false, message: 'Falta configurar Stripe.' }, 503)
  }

  let payload: CheckoutRequest
  try {
    payload = (await req.json()) as CheckoutRequest
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const parsed = checkoutSchema.safeParse(payload)
  if (!parsed.success) {
    return jsonResponse({ ok: false, message: 'Datos de checkout invalidos.' }, 400)
  }

  try {
    const couponCode = parsed.data.couponCode?.trim() || ''
    const baseTotals = calculateBookTotals({
      quantity: parsed.data.quantity,
    })
    const coupon = couponCode
      ? await findActiveCoupon(couponCode, {
          quantity: parsed.data.quantity,
          subtotalCents: baseTotals.subtotalCents,
          email: parsed.data.customer.email,
        })
      : null

    if (couponCode && !coupon) {
      return jsonResponse({ ok: false, message: 'Cupón no válido para esta compra.' }, 400)
    }

    const totals = calculateBookTotals({
      quantity: parsed.data.quantity,
      coupon: coupon ? couponRecordToTotalsCoupon(coupon) : null,
    })

    const order = await createCheckoutOrder({
      orderNumber: buildOrderNumber(),
      publicToken: buildPublicOrderToken(),
      customer: parsed.data.customer,
      address: parsed.data.address,
      totals,
    })

    const stripe = getStripe(secretKey)
    const siteUrl = Netlify.env.get('SITE_URL') || getSiteUrl(req)
    const session = await createBookCheckoutSession({
      stripe,
      siteUrl,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        publicToken: order.publicToken,
        customerEmail: order.customerEmail,
        totalCents: order.totalCents,
      },
      totals: {
        quantity: totals.quantity,
        totalCents: totals.totalCents,
      },
    })

    if (!session.id || !session.url) {
      return jsonResponse({ ok: false, message: 'No se pudo crear el checkout de Stripe.' }, 502)
    }

    await attachStripeSession(order.id, session.id)

    return jsonResponse({
      ok: true,
      checkoutUrl: session.url,
      orderNumber: order.orderNumber,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear el checkout.'
    return jsonResponse({ ok: false, message }, 500)
  }
}

export const config: Config = {
  path: '/api/book/checkout/create-session',
}
