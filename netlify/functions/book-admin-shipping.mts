import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { sendShipmentTrackingEmail } from './_shared/book/email-service.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import {
  getAdminOrderDetail,
  markOrderShipmentError,
  markOrderShippingQuoted,
} from './_shared/book/repositories.mts'
import {
  buildShipmentInputFromOrderDetail,
  canCreateShipmentForOrderState,
  createAutomaticShipmentForOrder,
  persistCreatedShipment,
  readOptionalEnv,
} from './_shared/book/shipping-fulfillment.mts'
import {
  createQuotation,
  createShipment,
  getQuotationRates,
  sanitizeSkydropxError,
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
    if (action.kind === 'auto') {
      return await createAutomaticOrderShipment(action.orderId)
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
    '/api/book/admin/orders/:id/auto-shipment',
  ],
}

export function readAdminShippingAction(pathname: string):
  | { kind: 'quote'; orderId: number }
  | { kind: 'create'; orderId: number }
  | { kind: 'auto'; orderId: number }
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
  if (action === 'auto-shipment') {
    return { kind: 'auto', orderId: id }
  }
  return { kind: 'invalid' }
}

export function canCreateShipmentForAdminOrder(order: AdminShippingOrderState): boolean {
  return canCreateShipmentForOrderState(order)
}

async function quoteShipping(orderId: number): Promise<Response> {
  const detail = await getAdminOrderDetail(orderId)
  if (!detail) {
    return jsonResponse({ ok: false, message: 'Pedido no encontrado.' }, 404)
  }

  if (!canCreateShipmentForAdminOrder(toShippingState(detail))) {
    return jsonResponse({ ok: false, message: 'El pedido no esta listo para cotizar envio.' }, 409)
  }

  const shipmentInput = buildShipmentInputFromOrderDetail(detail)
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

  const input = buildShipmentInputFromOrderDetail(detail)
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

async function createAutomaticOrderShipment(orderId: number): Promise<Response> {
  const result = await createAutomaticShipmentForOrder(orderId)

  if (result.status === 'skipped') {
    return jsonResponse({ ok: false, message: result.reason }, 409)
  }

  return jsonResponse({
    ok: true,
    quotationId: result.quotationId,
    rate: result.rate,
    shipment: result.shipment,
  })
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
