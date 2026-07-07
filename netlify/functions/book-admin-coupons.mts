import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import {
  createCoupon,
  getCouponById,
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

type CouponType = 'percent' | 'fixed'

type AdminCouponForValidation = AdminCouponMutationInput & {
  id: number
}

type CouponParseResult<T> = { ok: true; value: T } | { ok: false; message: string }

type ParsedCouponFields = {
  values: Partial<AdminCouponMutationInput>
  valueInput: number | null
  touched: {
    code: boolean
    type: boolean
    value: boolean
    active: boolean
    minQuantity: boolean
    minSubtotalCents: boolean
    maxUsesPerEmail: boolean
    usageLimit: boolean
    stackable: boolean
  }
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
    const parsed = normalizeAdminCouponCreate(payload)
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

  const id = readCouponId(payload)
  if (!id.ok) {
    return jsonResponse({ ok: false, message: id.message }, 400)
  }

  let existingCoupon: AdminCouponForValidation | null = null
  try {
    existingCoupon = await getCouponById(id.value)
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo consultar el cupon.' }, 500)
  }

  if (!existingCoupon) {
    return jsonResponse({ ok: false, message: 'Cupon no encontrado.' }, 404)
  }

  const parsed = normalizeAdminCouponPatch(payload, existingCoupon)
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

export function normalizeAdminCouponCreate(payload: CouponPayload): CouponParseResult<AdminCouponMutationInput> {
  const base = parseCouponFields(payload, true)
  if (!base.ok) return base

  const type = base.value.values.type || 'percent'
  const normalizedValue = normalizeCouponValue(type, base.value.valueInput)
  if (!normalizedValue.ok) return normalizedValue

  const finalState = {
    code: base.value.values.code || '',
    type,
    value: normalizedValue.value,
    active: base.value.values.active ?? true,
    minQuantity: base.value.values.minQuantity ?? null,
    minSubtotalCents: base.value.values.minSubtotalCents ?? null,
    maxUsesPerEmail: base.value.values.maxUsesPerEmail ?? null,
    usageLimit: base.value.values.usageLimit ?? null,
    stackable: base.value.values.stackable ?? false,
  }

  return validateFinalCouponState(finalState)
}

export function normalizeAdminCouponPatch(
  payload: CouponPayload,
  existingCoupon: AdminCouponForValidation,
): CouponParseResult<AdminCouponUpdateInput> {
  const id = readCouponId(payload)
  if (!id.ok) return id

  const base = parseCouponFields(payload, false)
  if (!base.ok) return base

  const type = base.value.values.type || existingCoupon.type
  const value = base.value.touched.value
    ? normalizeCouponValue(type, base.value.valueInput)
    : { ok: true as const, value: existingCoupon.value }

  if (!value.ok) return value

  const finalState: AdminCouponMutationInput = {
    code: base.value.values.code ?? existingCoupon.code,
    type,
    value: value.value,
    active: base.value.values.active ?? existingCoupon.active,
    minQuantity: base.value.touched.minQuantity
      ? base.value.values.minQuantity ?? null
      : existingCoupon.minQuantity,
    minSubtotalCents: base.value.touched.minSubtotalCents
      ? base.value.values.minSubtotalCents ?? null
      : existingCoupon.minSubtotalCents,
    maxUsesPerEmail: base.value.touched.maxUsesPerEmail
      ? base.value.values.maxUsesPerEmail ?? null
      : existingCoupon.maxUsesPerEmail,
    usageLimit: base.value.touched.usageLimit
      ? base.value.values.usageLimit ?? null
      : existingCoupon.usageLimit,
    stackable: base.value.values.stackable ?? existingCoupon.stackable,
  }

  const validated = validateFinalCouponState(finalState)
  if (!validated.ok) return validated

  const update: AdminCouponUpdateInput = { id: id.value }
  if (base.value.touched.code) update.code = validated.value.code
  if (base.value.touched.type) update.type = validated.value.type
  if (base.value.touched.value) update.value = validated.value.value
  if (base.value.touched.active) update.active = validated.value.active
  if (base.value.touched.minQuantity) update.minQuantity = validated.value.minQuantity
  if (base.value.touched.minSubtotalCents) update.minSubtotalCents = validated.value.minSubtotalCents
  if (base.value.touched.maxUsesPerEmail) update.maxUsesPerEmail = validated.value.maxUsesPerEmail
  if (base.value.touched.usageLimit) update.usageLimit = validated.value.usageLimit
  if (base.value.touched.stackable) update.stackable = validated.value.stackable

  return {
    ok: true,
    value: update,
  }
}

function readCouponId(payload: CouponPayload): CouponParseResult<number> {
  const id = Number(payload.id)
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'Selecciona un cupon valido.' }
  }

  return { ok: true, value: id }
}

function parseCouponFields(
  payload: CouponPayload,
  requireAll: boolean,
): CouponParseResult<ParsedCouponFields> {
  const output: ParsedCouponFields = {
    values: {},
    valueInput: null,
    touched: {
      code: false,
      type: false,
      value: false,
      active: false,
      minQuantity: false,
      minSubtotalCents: false,
      maxUsesPerEmail: false,
      usageLimit: false,
      stackable: false,
    },
  }

  if (requireAll || typeof payload.code !== 'undefined') {
    const code = typeof payload.code === 'string' ? payload.code.trim().toUpperCase() : ''
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return { ok: false, message: 'El codigo debe tener de 3 a 32 caracteres.' }
    }
    output.values.code = code
    output.touched.code = true
  }

  if (requireAll || typeof payload.type !== 'undefined') {
    if (payload.type !== 'percent' && payload.type !== 'fixed') {
      return { ok: false, message: 'El tipo de cupon no es valido.' }
    }
    output.values.type = payload.type
    output.touched.type = true
  }

  if (requireAll || typeof payload.value !== 'undefined') {
    const value = Number(payload.value)
    if (!Number.isFinite(value) || value <= 0) {
      return { ok: false, message: 'El valor del cupon debe ser mayor a cero.' }
    }
    output.valueInput = value
    output.touched.value = true
  }

  const active = parseOptionalBoolean(payload.active, 'Activo debe ser verdadero o falso.')
  if (!active.ok) return active
  if (active.touched) {
    output.values.active = active.value
    output.touched.active = true
  }

  const stackable = parseOptionalBoolean(payload.stackable, 'Acumulable debe ser verdadero o falso.')
  if (!stackable.ok) return stackable
  if (stackable.touched) {
    output.values.stackable = stackable.value
    output.touched.stackable = true
  }

  const minQuantity = parseOptionalInteger(payload.minQuantity, 'La cantidad minima no es valida.')
  if (!minQuantity.ok) return minQuantity
  if (minQuantity.touched) {
    output.values.minQuantity = minQuantity.value
    output.touched.minQuantity = true
  }

  const minSubtotal = parseOptionalInteger(payload.minSubtotalCents, 'El subtotal minimo no es valido.')
  if (!minSubtotal.ok) return minSubtotal
  if (minSubtotal.touched) {
    output.values.minSubtotalCents = minSubtotal.value
    output.touched.minSubtotalCents = true
  }

  const maxUsesPerEmail = parseOptionalInteger(
    payload.maxUsesPerEmail,
    'El maximo por email debe ser mayor a cero o quedar vacio.',
    { min: 1 },
  )
  if (!maxUsesPerEmail.ok) return maxUsesPerEmail
  if (maxUsesPerEmail.touched) {
    output.values.maxUsesPerEmail = maxUsesPerEmail.value
    output.touched.maxUsesPerEmail = true
  }

  const usageLimit = parseOptionalInteger(
    payload.usageLimit,
    'El limite de usos debe ser mayor a cero o quedar vacio.',
    { min: 1 },
  )
  if (!usageLimit.ok) return usageLimit
  if (usageLimit.touched) {
    output.values.usageLimit = usageLimit.value
    output.touched.usageLimit = true
  }

  return { ok: true, value: output }
}

function normalizeCouponValue(type: CouponType, rawValue: number | null): CouponParseResult<number> {
  if (typeof rawValue !== 'number' || !Number.isFinite(rawValue) || rawValue <= 0) {
    return { ok: false, message: 'El valor del cupon debe ser mayor a cero.' }
  }

  if (type === 'percent') {
    if (!Number.isInteger(rawValue)) {
      return { ok: false, message: 'El porcentaje debe ser un numero entero.' }
    }
    if (rawValue > 100) {
      return { ok: false, message: 'El porcentaje no puede ser mayor a 100.' }
    }
    return { ok: true, value: rawValue }
  }

  return { ok: true, value: Math.round(rawValue * 100) }
}

function validateFinalCouponState(
  coupon: AdminCouponMutationInput,
): CouponParseResult<AdminCouponMutationInput> {
  if (coupon.type === 'percent' && coupon.value > 100) {
    return { ok: false, message: 'El porcentaje no puede ser mayor a 100.' }
  }

  if (coupon.value <= 0) {
    return { ok: false, message: 'El valor del cupon debe ser mayor a cero.' }
  }

  if (coupon.maxUsesPerEmail !== null && coupon.maxUsesPerEmail <= 0) {
    return { ok: false, message: 'El maximo por email debe ser mayor a cero o quedar vacio.' }
  }

  if (coupon.usageLimit !== null && coupon.usageLimit <= 0) {
    return { ok: false, message: 'El limite de usos debe ser mayor a cero o quedar vacio.' }
  }

  return { ok: true, value: coupon }
}

function parseOptionalBoolean(
  value: unknown,
  message: string,
): { ok: true; touched: boolean; value: boolean } | { ok: false; message: string } {
  if (typeof value === 'undefined') return { ok: true, touched: false, value: false }
  if (typeof value !== 'boolean') return { ok: false, message }

  return { ok: true, touched: true, value }
}

function parseOptionalInteger(
  value: unknown,
  message: string,
  options: { min?: number } = {},
): { ok: true; touched: boolean; value: number | null } | { ok: false; message: string } {
  if (typeof value === 'undefined') return { ok: true, touched: false, value: null }
  if (value === null || value === '') return { ok: true, touched: true, value: null }

  const numberValue = Number(value)
  if (!Number.isInteger(numberValue) || numberValue < (options.min ?? 0)) {
    return { ok: false, message }
  }

  return { ok: true, touched: true, value: numberValue }
}
