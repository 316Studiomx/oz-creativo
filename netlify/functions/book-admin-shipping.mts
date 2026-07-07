import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { sendShipmentTrackingEmail } from './_shared/book/email-service.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import { calculateBookParcel } from './_shared/book/parcel.mts'
import {
  getAdminOrderDetail,
  markOrderShipmentCreated,
  markOrderShipmentError,
  markOrderShippingQuoted,
} from './_shared/book/repositories.mts'
import {
  createQuotation,
  createShipment,
  getQuotationRates,
  sanitizeSkydropxError,
  type NormalizedSkydropxShipment,
  type SkydropxAddress,
} from './_shared/book/skydropx.mts'

type AdminShippingOrderState = {
  paymentStatus: string
  shippingStatus: string
  shipmentStatus: string | null
  trackingNumber: string | null
}

type CreateShipmentBody = {
  quotationId?: string
  rateId?: string
}

export default async (req: Request) => {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  if (req.method !== 'POST') {
    return methodNotAllowed('POST')
  }

  const action = readAdminShippingAction(new URL(req.url).pathname)
  if (action.kind === 'invalid') {
    return jsonResponse({ ok: false, message: 'Ruta de envio invalida.' }, 400)
  }

  try {
    if (action.kind === 'quote') {
      return await quoteShipping(action.orderId)
    }
    return await createOrderShipment(req, action.orderId)
  } catch (error) {
    const message = sanitizeSkydropxError(error)
    if (action.kind === 'create') {
      await markOrderShipmentError(action.orderId, message)
    }
    return jsonResponse({ ok: false, message }, 502)
  }
}

export const config: Config = {
  path: [
    '/api/book/admin/orders/:id/quote-shipping',
    '/api/book/admin/orders/:id/create-shipment',
  ],
}

export function readAdminShippingAction(pathname: string):
  | { kind: 'quote'; orderId: number }
  | { kind: 'create'; orderId: number }
  | { kind: 'invalid' } {
  const parts = pathname.split('/').filter(Boolean)
  const action = parts[parts.length - 1]
  const id = Number(parts[parts.length - 2])
  if (!Number.isInteger(id) || id <= 0) {
    return { kind: 'invalid' }
  }
  if (action === 'quote-shipping') {
    return { kind: 'quote', orderId: id }
  }
  if (action === 'create-shipment') {
    return { kind: 'create', orderId: id }
  }
  return { kind: 'invalid' }
}

export function canCreateShipmentForAdminOrder(order: AdminShippingOrderState): boolean {
  if (order.paymentStatus !== 'paid') {
    return false
  }
  if (order.trackingNumber) {
    return false
  }
  const state = order.shipmentStatus || order.shippingStatus
  return state === 'label_pending' || state === 'label_error'
}

async function quoteShipping(orderId: number): Promise<Response> {
  const detail = await getAdminOrderDetail(orderId)
  if (!detail) {
    return jsonResponse({ ok: false, message: 'Pedido no encontrado.' }, 404)
  }

  if (!canCreateShipmentForAdminOrder(toShippingState(detail))) {
    return jsonResponse({ ok: false, message: 'El pedido no esta listo para cotizar envio.' }, 409)
  }

  const shipmentInput = buildShipmentInput(detail)
  const quotation = await createQuotation(shipmentInput)
  await markOrderShippingQuoted({
    orderId,
    quotationId: quotation.quotationId,
    rawResponseJson: quotation.raw,
  })
  const rates = await getQuotationRates(quotation.quotationId)

  return jsonResponse({
    ok: true,
    quotationId: quotation.quotationId,
    rates,
  })
}

async function createOrderShipment(req: Request, orderId: number): Promise<Response> {
  let body: CreateShipmentBody
  try {
    body = await readJson<CreateShipmentBody>(req)
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const quotationId = body.quotationId?.trim()
  const rateId = body.rateId?.trim()
  if (!quotationId || !rateId) {
    return jsonResponse({ ok: false, message: 'Selecciona una tarifa de envio.' }, 400)
  }

  const detail = await getAdminOrderDetail(orderId)
  if (!detail) {
    return jsonResponse({ ok: false, message: 'Pedido no encontrado.' }, 404)
  }

  if (!canCreateShipmentForAdminOrder(toShippingState(detail))) {
    return jsonResponse({ ok: false, message: 'El pedido no puede crear otra guia.' }, 409)
  }

  const input = buildShipmentInput(detail)
  const shipment = await createShipment({
    ...input,
    quotationId,
    rateId,
    declaredValueCents: detail.order.totalCents,
    consignmentNote: readOptionalEnv('SKYDROPX_CONSIGNMENT_NOTE'),
    packageType: readOptionalEnv('SKYDROPX_PACKAGE_TYPE'),
  })
  await persistCreatedShipment(orderId, quotationId, rateId, shipment)

  if (shipment.trackingNumber) {
    try {
      await sendShipmentTrackingEmail(orderId)
    } catch (error) {
      console.error('Book shipment email delivery failed.', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return jsonResponse({ ok: true, shipment })
}

function toShippingState(detail: Awaited<ReturnType<typeof getAdminOrderDetail>>): AdminShippingOrderState {
  if (!detail) {
    return {
      paymentStatus: '',
      shippingStatus: '',
      shipmentStatus: null,
      trackingNumber: null,
    }
  }

  return {
    paymentStatus: detail.order.paymentStatus,
    shippingStatus: detail.order.shippingStatus,
    shipmentStatus: detail.shipment?.status ?? null,
    trackingNumber: detail.shipment?.trackingNumber ?? null,
  }
}

function buildShipmentInput(detail: NonNullable<Awaited<ReturnType<typeof getAdminOrderDetail>>>) {
  const item = detail.items[0]
  if (!item) {
    throw new Error('El pedido no tiene articulos para enviar.')
  }
  if (!detail.address) {
    throw new Error('El pedido no tiene direccion de envio.')
  }

  return {
    origin: readOriginAddress(),
    destination: {
      name: detail.address.name || detail.order.customerName,
      phone: detail.address.phone || detail.order.customerPhone,
      email: detail.order.customerEmail,
      street: detail.address.street,
      exteriorNumber: detail.address.exteriorNumber,
      interiorNumber: detail.address.interiorNumber,
      neighborhood: detail.address.neighborhood,
      city: detail.address.city,
      state: detail.address.state,
      postalCode: detail.address.postalCode,
      country: detail.address.country || 'MX',
      reference: detail.address.references,
    },
    parcel: calculateBookParcel(item.quantity),
  }
}

async function persistCreatedShipment(
  orderId: number,
  quotationId: string,
  rateId: string,
  shipment: NormalizedSkydropxShipment & { raw: unknown },
) {
  await markOrderShipmentCreated({
    orderId,
    quotationId,
    rateId,
    shipmentId: shipment.shipmentId,
    carrier: shipment.carrier,
    service: shipment.service,
    trackingNumber: shipment.trackingNumber,
    trackingUrl: shipment.trackingUrl,
    labelUrl: shipment.labelUrl,
    realShippingCostCents: shipment.totalCents,
    status: 'label_created',
    error: null,
    rawResponseJson: shipment.raw,
  })
}

function readOriginAddress(): SkydropxAddress {
  return {
    name: requireEnv('SKYDROPX_ORIGIN_NAME'),
    company: readOptionalEnv('SKYDROPX_ORIGIN_COMPANY'),
    phone: requireEnv('SKYDROPX_ORIGIN_PHONE'),
    email: readOptionalEnv('SKYDROPX_ORIGIN_EMAIL'),
    street: requireEnv('SKYDROPX_ORIGIN_STREET'),
    exteriorNumber: requireEnv('SKYDROPX_ORIGIN_EXTERIOR_NUMBER'),
    interiorNumber: readOptionalEnv('SKYDROPX_ORIGIN_INTERIOR_NUMBER'),
    neighborhood: requireEnv('SKYDROPX_ORIGIN_NEIGHBORHOOD'),
    city: requireEnv('SKYDROPX_ORIGIN_CITY'),
    state: requireEnv('SKYDROPX_ORIGIN_STATE'),
    postalCode: requireEnv('SKYDROPX_ORIGIN_POSTAL_CODE'),
    country: readOptionalEnv('SKYDROPX_ORIGIN_COUNTRY_CODE') || readOptionalEnv('SKYDROPX_ORIGIN_COUNTRY') || 'MX',
  }
}

function requireEnv(key: string): string {
  const value = readOptionalEnv(key)
  if (!value) {
    throw new Error(`Falta configurar ${key}.`)
  }
  return value
}

function readOptionalEnv(key: string): string {
  const netlify = (globalThis as typeof globalThis & {
    Netlify?: { env?: { get?: (name: string) => string | undefined } }
  }).Netlify
  return (netlify?.env?.get?.(key) || process.env[key] || '').trim()
}
