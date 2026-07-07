import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import {
  createCoupon,
  listCoupons,
  updateCoupon,
  type AdminCouponMutationInput,
  type AdminCouponUpdateInput,
} from './_shared/book/repositories.mts'

type CouponPayload = {
  id?: unknown
  code?: unknown
  type?: unknown
  value?: unknown
  active?: unknown
  minQuantity?: unknown
  minSubtotalCents?: unknown
  maxUsesPerEmail?: unknown
  usageLimit?: unknown
  stackable?: unknown
}

export default async (req: Request) => {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  if (req.method === 'GET') {
    try {
      const coupons = await listCoupons()
      return jsonResponse({ ok: true, coupons })
    } catch {
      return jsonResponse({ ok: false, message: 'No se pudieron consultar cupones.' }, 500)
    }
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return methodNotAllowed(['GET', 'POST', 'PATCH'])
  }

  let payload: CouponPayload
  try {
    payload = await readJson<CouponPayload>(req)
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  if (req.method === 'POST') {
    const parsed = parseCouponCreate(payload)
    if (!parsed.ok) {
      return jsonResponse({ ok: false, message: parsed.message }, 400)
    }

    try {
      const coupon = await createCoupon(parsed.value)
      return jsonResponse({ ok: true, coupon }, 201)
    } catch {
      return jsonResponse({ ok: false, message: 'No se pudo crear el cupon.' }, 400)
    }
  }

  const parsed = parseCouponUpdate(payload)
  if (!parsed.ok) {
    return jsonResponse({ ok: false, message: parsed.message }, 400)
  }

  try {
    const coupon = await updateCoupon(parsed.value)
    if (!coupon) {
      return jsonResponse({ ok: false, message: 'Cupon no encontrado.' }, 404)
    }

    return jsonResponse({ ok: true, coupon })
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo actualizar el cupon.' }, 400)
  }
}

export const config: Config = {
  path: '/api/book/admin/coupons',
}

function parseCouponCreate(payload: CouponPayload):
  | { ok: true; value: AdminCouponMutationInput }
  | { ok: false; message: string } {
  const base = parseCouponFields(payload, true)
  if (!base.ok) return base

  return {
    ok: true,
    value: {
      code: base.value.code || '',
      type: base.value.type || 'percent',
      value: base.value.value ?? 0,
      active: base.value.active ?? true,
      minQuantity: base.value.minQuantity ?? null,
      minSubtotalCents: base.value.minSubtotalCents ?? null,
      maxUsesPerEmail: base.value.maxUsesPerEmail ?? null,
      usageLimit: base.value.usageLimit ?? null,
      stackable: base.value.stackable ?? false,
    },
  }
}

function parseCouponUpdate(payload: CouponPayload):
  | { ok: true; value: AdminCouponUpdateInput }
  | { ok: false; message: string } {
  const id = Number(payload.id)
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'Selecciona un cupon valido.' }
  }

  const base = parseCouponFields(payload, false)
  if (!base.ok) return base

  return {
    ok: true,
    value: {
      ...base.value,
      id,
    },
  }
}

function parseCouponFields(payload: CouponPayload, requireAll: boolean):
  | { ok: true; value: AdminCouponUpdateInput }
  | { ok: false; message: string } {
  const output: AdminCouponUpdateInput = { id: 0 }

  if (requireAll || typeof payload.code !== 'undefined') {
    const code = typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : ''
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return { ok: false, message: 'El codigo debe tener de 3 a 32 caracteres.' }
    }
    output.code = code
  }

  if (requireAll || typeof payload.type !== 'undefined') {
    if (payload.type !== 'percent' && payload.type !== 'fixed') {
      return { ok: false, message: 'El tipo de cupon no es valido.' }
    }
    output.type = payload.type
  }

  if (requireAll || typeof payload.value !== 'undefined') {
    const value = Number(payload.value)
    if (!Number.isInteger(value) || value <= 0) {
      return { ok: false, message: 'El valor del cupon debe ser mayor a cero.' }
    }
    if (payload.type === 'percent' && value > 100) {
      return { ok: false, message: 'El porcentaje no puede ser mayor a 100.' }
    }
    output.value = value
  }

  if (typeof payload.active !== 'undefined') output.active = Boolean(payload.active)
  if (typeof payload.stackable !== 'undefined') output.stackable = Boolean(payload.stackable)

  const minQuantity = parseOptionalInteger(payload.minQuantity, 'La cantidad minima no es valida.')
  if (!minQuantity.ok) return minQuantity
  if (minQuantity.touched) output.minQuantity = minQuantity.value

  const minSubtotal = parseOptionalInteger(payload.minSubtotalCents, 'El subtotal minimo no es valido.')
  if (!minSubtotal.ok) return minSubtotal
  if (minSubtotal.touched) output.minSubtotalCents = minSubtotal.value

  const maxUsesPerEmail = parseOptionalInteger(payload.maxUsesPerEmail, 'El maximo por email no es valido.')
  if (!maxUsesPerEmail.ok) return maxUsesPerEmail
  if (maxUsesPerEmail.touched) output.maxUsesPerEmail = maxUsesPerEmail.value

  const usageLimit = parseOptionalInteger(payload.usageLimit, 'El limite de usos no es valido.')
  if (!usageLimit.ok) return usageLimit
  if (usageLimit.touched) output.usageLimit = usageLimit.value

  return { ok: true, value: output }
}

function parseOptionalInteger(
  value: unknown,
  message: string,
): { ok: true; touched: boolean; value: number | null } | { ok: false; message: string } {
  if (typeof value === 'undefined') return { ok: true, touched: false, value: null }
  if (value === null || value === '') return { ok: true, touched: true, value: null }

  const numberValue = Number(value)
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    return { ok: false, message }
  }

  return { ok: true, touched: true, value: numberValue }
}
