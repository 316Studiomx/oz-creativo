import { sendShipmentTrackingEmail } from './email-service.mts'
import { calculateBookParcel } from './parcel.mts'
import {
  getAdminOrderDetail,
  markOrderShipmentCreated,
  markOrderShipmentError,
  markOrderShippingQuoted,
} from './repositories.mts'
import {
  createQuotation,
  createShipment,
  getQuotationRates,
  sanitizeSkydropxError,
  type NormalizedSkydropxRate,
  type NormalizedSkydropxShipment,
  type SkydropxAddress,
} from './skydropx.mts'

type AdminShippingOrderState = {
  paymentStatus: string
  shippingStatus: string
  shipmentStatus: string | null
  trackingNumber: string | null
}

type AdminOrderDetail = NonNullable<Awaited<ReturnType<typeof getAdminOrderDetail>>>

export type AutomaticShipmentResult =
  | {
      status: 'created'
      quotationId: string
      rate: NormalizedSkydropxRate
      shipment: NormalizedSkydropxShipment & { raw: unknown }
    }
  | {
      status: 'skipped'
      reason: string
    }

export async function createAutomaticShipmentForOrder(
  orderId: number,
  options: {
    sendTrackingEmail?: (orderId: number) => Promise<void>
    logError?: (...args: unknown[]) => void
  } = {},
): Promise<AutomaticShipmentResult> {
  try {
    const detail = await getAdminOrderDetail(orderId)
    if (!detail) {
      return { status: 'skipped', reason: 'Pedido no encontrado.' }
    }

    if (!canCreateShipmentForOrderState(toShippingState(detail))) {
      return { status: 'skipped', reason: 'El pedido no esta listo para crear guia.' }
    }

    const input = buildShipmentInputFromOrderDetail(detail)
    const quotation = await createQuotation(input)
    await markOrderShippingQuoted({
      orderId,
      quotationId: quotation.quotationId,
      rawResponseJson: quotation.raw,
    })

    const rates = await getQuotationRates(quotation.quotationId)
    const rate = selectAutomaticSkydropxRate(rates)
    const shipment = await createShipment({
      ...input,
      quotationId: quotation.quotationId,
      rateId: rate.rateId,
      declaredValueCents: detail.order.totalCents,
      consignmentNote: readOptionalEnv('SKYDROPX_CONSIGNMENT_NOTE'),
      packageType: readOptionalEnv('SKYDROPX_PACKAGE_TYPE'),
    })

    await persistCreatedShipment(orderId, quotation.quotationId, rate.rateId, shipment)

    try {
      await (options.sendTrackingEmail ?? sendShipmentTrackingEmail)(orderId)
    } catch (error) {
      ;(options.logError ?? console.error)('Book shipment email delivery failed.', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    return {
      status: 'created',
      quotationId: quotation.quotationId,
      rate,
      shipment,
    }
  } catch (error) {
    const message = sanitizeSkydropxError(error)
    await markOrderShipmentError(orderId, message)
    throw new Error(message)
  }
}

export function selectAutomaticSkydropxRate(rates: NormalizedSkydropxRate[]): NormalizedSkydropxRate {
  const validRates = rates
    .map((rate, index) => ({ rate, index }))
    .filter(({ rate }) => rate.rateId && Number.isFinite(rate.totalCents) && rate.totalCents > 0)

  if (validRates.length === 0) {
    throw new Error('Skydropx no devolvio tarifas de envio utilizables.')
  }

  validRates.sort((left, right) => {
    const costDiff = left.rate.totalCents - right.rate.totalCents
    if (costDiff !== 0) return costDiff

    const leftDays = left.rate.estimatedDays ?? Number.POSITIVE_INFINITY
    const rightDays = right.rate.estimatedDays ?? Number.POSITIVE_INFINITY
    const daysDiff = leftDays - rightDays
    if (daysDiff !== 0) return daysDiff

    return left.index - right.index
  })

  return validRates[0].rate
}

export function canCreateShipmentForOrderState(order: AdminShippingOrderState): boolean {
  if (order.paymentStatus !== 'paid') {
    return false
  }
  if (order.trackingNumber) {
    return false
  }
  const state = order.shipmentStatus || order.shippingStatus
  return state === 'label_pending' || state === 'label_error'
}

export function buildShipmentInputFromOrderDetail(detail: AdminOrderDetail) {
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
      company: detail.order.customerName,
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

export async function persistCreatedShipment(
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

export function readOptionalEnv(key: string): string | undefined {
  const netlify = (globalThis as typeof globalThis & {
    Netlify?: { env?: { get?: (name: string) => string | undefined } }
  }).Netlify
  const value = netlify?.env?.get?.(key) || process.env[key]
  return value?.trim() || undefined
}

function toShippingState(detail: AdminOrderDetail): AdminShippingOrderState {
  return {
    paymentStatus: detail.order.paymentStatus,
    shippingStatus: detail.order.shippingStatus,
    shipmentStatus: detail.shipment?.status ?? null,
    trackingNumber: detail.shipment?.trackingNumber ?? null,
  }
}

function readOriginAddress(): SkydropxAddress {
  return {
    name: requireEnv('SKYDROPX_ORIGIN_NAME'),
    company: readOptionalEnv('SKYDROPX_ORIGIN_COMPANY'),
    phone: requireEnv('SKYDROPX_ORIGIN_PHONE'),
    email: readOptionalEnv('SKYDROPX_ORIGIN_EMAIL'),
    reference: readOptionalEnv('SKYDROPX_ORIGIN_REFERENCE'),
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
