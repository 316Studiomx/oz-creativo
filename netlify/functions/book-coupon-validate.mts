import type { Config } from '@netlify/functions'

import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import { calculateBookTotals } from './_shared/book/pricing.mts'
import {
  couponRecordToTotalsCoupon,
  findActiveCoupon,
} from './_shared/book/repositories.mts'
import { couponValidationSchema } from './_shared/book/validation.mts'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return methodNotAllowed('POST')
  }

  let payload: unknown
  try {
    payload = await readJson<unknown>(req)
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const parsed = couponValidationSchema.safeParse(payload)
  if (!parsed.success) {
    return jsonResponse({ ok: false, message: 'Datos de cupón inválidos.' }, 400)
  }

  try {
    const baseTotals = calculateBookTotals({ quantity: parsed.data.quantity })
    const coupon = await findActiveCoupon(parsed.data.couponCode, {
      quantity: parsed.data.quantity,
      subtotalCents: baseTotals.subtotalCents,
      email: parsed.data.email || undefined,
    })

    if (!coupon) {
      return jsonResponse({ ok: false, message: 'Cupón no válido para esta compra.' }, 404)
    }

    const totals = calculateBookTotals({
      quantity: parsed.data.quantity,
      coupon: couponRecordToTotalsCoupon(coupon),
    })

    return jsonResponse({ ok: true, totals })
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo validar el cupón.' }, 500)
  }
}

export const config: Config = {
  path: '/api/book/coupons/validate',
}
