export type NormalizedSkydropxRate = {
  rateId: string
  carrier: string
  service: string
  totalCents: number
  currency: string
  estimatedDays: number | null
}

export type NormalizedSkydropxShipment = {
  shipmentId: string
  carrier: string
  service: string
  totalCents: number | null
  currency: string
  trackingNumber: string
  trackingUrl: string
  labelUrl: string
}

export type SkydropxAddress = {
  name: string
  company?: string
  phone: string
  email?: string
  street: string
  exteriorNumber: string
  interiorNumber?: string | null
  neighborhood: string
  city: string
  state: string
  postalCode: string
  country: string
  reference?: string | null
}

export type SkydropxParcel = {
  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
}

type SkydropxRequestOptions = {
  env?: Record<string, string | undefined>
  fetchImpl?: typeof fetch
}

export const SKYDROPX_ENDPOINTS = {
  token: '/api/v1/oauth/token',
  quotations: '/api/v1/quotations',
  quotationDetail: (quotationId: string) => `/api/v1/quotations/${encodeURIComponent(quotationId)}`,
  shipments: '/api/v1/shipments/',
  tracking: (trackingNumber: string, carrierName: string) => {
    const params = new URLSearchParams({
      tracking_number: trackingNumber,
      carrier_name: carrierName,
    })
    return `/api/v1/shipments/tracking?${params.toString()}`
  },
} as const

export async function getToken(options: SkydropxRequestOptions = {}): Promise<string> {
  const fetcher = options.fetchImpl ?? fetch
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: requireEnv('SKYDROPX_CLIENT_ID', options.env),
    client_secret: requireEnv('SKYDROPX_CLIENT_SECRET', options.env),
  })

  const response = await fetcher(`${getSkydropxBaseUrl(options.env)}${SKYDROPX_ENDPOINTS.token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const payload = await readJsonResponse(response)

  if (!response.ok || !isRecord(payload) || typeof payload.access_token !== 'string') {
    throw new Error(readSkydropxError(payload, 'Skydropx no entrego token.'))
  }

  return payload.access_token
}

export function buildSkydropxQuotationBody(input: {
  origin: SkydropxAddress
  destination: SkydropxAddress
  parcel: SkydropxParcel
}) {
  return {
    quotation: {
      address_from: toSkydropxApiAddress(input.origin),
      address_to: toSkydropxApiAddress(input.destination),
      parcels: [toSkydropxParcel(input.parcel)],
    },
  }
}

export function buildSkydropxShipmentBody(input: {
  quotationId?: string | null
  rateId: string
  origin: SkydropxAddress
  destination: SkydropxAddress
  parcel: SkydropxParcel
  declaredValueCents?: number | null
  consignmentNote?: string | null
  packageType?: string | null
}) {
  const pack: Record<string, string | number | boolean> = {
    package_number: '1',
    package_protected: false,
    ...toSkydropxParcel(input.parcel),
  }
  const declaredValue = centsToMoney(input.declaredValueCents)
  if (declaredValue != null) pack.declared_value = declaredValue
  if (input.consignmentNote?.trim()) pack.consignment_note = input.consignmentNote.trim()
  if (input.packageType?.trim()) pack.package_type = input.packageType.trim()

  return {
    shipment: {
      ...(input.quotationId?.trim() ? { quotation_id: input.quotationId.trim() } : {}),
      rate_id: input.rateId,
      unique_shipment: true,
      address_from: toSkydropxApiAddress(input.origin, { includeShipmentAliases: true }),
      address_to: toSkydropxApiAddress(input.destination, { includeShipmentAliases: true }),
      packages: [pack],
    },
  }
}

export async function createQuotation(
  input: {
    origin: SkydropxAddress
    destination: SkydropxAddress
    parcel: SkydropxParcel
  },
  options: SkydropxRequestOptions = {},
): Promise<{ quotationId: string; raw: unknown }> {
  const raw = await skydropxRequest(SKYDROPX_ENDPOINTS.quotations, {
    method: 'POST',
    body: buildSkydropxQuotationBody(input),
  }, options)
  const quotationId = readJsonApiId(raw)
  if (!quotationId) {
    throw new Error('Skydropx no devolvio identificador de cotizacion.')
  }

  return { quotationId, raw }
}

export async function getQuotationRates(
  quotationId: string,
  options: SkydropxRequestOptions = {},
): Promise<NormalizedSkydropxRate[]> {
  const raw = await skydropxRequest(SKYDROPX_ENDPOINTS.quotationDetail(quotationId), {
    method: 'GET',
  }, options)
  return normalizeSkydropxRates(raw)
}

export async function createShipment(
  input: {
    quotationId?: string
    rateId: string
    origin: SkydropxAddress
    destination: SkydropxAddress
    parcel: SkydropxParcel
    declaredValueCents?: number | null
    consignmentNote?: string | null
    packageType?: string | null
  },
  options: SkydropxRequestOptions = {},
): Promise<NormalizedSkydropxShipment & { raw: unknown }> {
  const raw = await skydropxRequest(SKYDROPX_ENDPOINTS.shipments, {
    method: 'POST',
    body: buildSkydropxShipmentBody(input),
  }, options)
  const shipment = normalizeSkydropxShipment(raw)
  assertSkydropxShipmentReady(shipment)
  return {
    ...shipment,
    raw,
  }
}

export async function getTracking(
  input: { trackingNumber: string; carrierName: string },
  options: SkydropxRequestOptions = {},
): Promise<{ trackingNumber: string; trackingUrl: string; raw: unknown }> {
  const raw = await skydropxRequest(
    SKYDROPX_ENDPOINTS.tracking(input.trackingNumber, input.carrierName),
    { method: 'GET' },
    options,
  )
  const record = flattenJsonApiRecord(raw)
  return {
    trackingNumber: readString(record, ['tracking_number', 'trackingNumber']) || input.trackingNumber,
    trackingUrl: readString(record, ['tracking_url_provider', 'tracking_url', 'trackingUrl']),
    raw,
  }
}

export function normalizeSkydropxRate(raw: unknown): NormalizedSkydropxRate {
  const record = flattenJsonApiRecord(raw)
  return {
    rateId: readString(record, ['id', 'rate_id', 'rateId']),
    carrier: readString(record, [
      'carrier',
      'carrier_name',
      'provider',
      'provider_name',
      'provider_display_name',
    ]),
    service: readString(record, [
      'service',
      'service_level',
      'service_level_name',
      'service_name',
      'provider_service_name',
      'provider_service_code',
    ]),
    totalCents: readMoneyCents(record, ['total', 'amount', 'price', 'total_price', 'cost']),
    currency: readString(record, ['currency', 'currency_code', 'currencyCode']) || 'MXN',
    estimatedDays: readNullableNumber(record, ['days', 'estimated_days', 'eta_days', 'delivery_days']),
  }
}

export function normalizeSkydropxRates(raw: unknown): NormalizedSkydropxRate[] {
  const candidates = collectRateCandidates(raw)
  return candidates.map(normalizeSkydropxRate).filter((rate) => rate.rateId)
}

export function normalizeSkydropxShipment(raw: unknown): NormalizedSkydropxShipment {
  const shipment = flattenJsonApiRecord(raw)
  const packageRecord = firstPackageRecord(raw)
  const trackingNumber =
    readString(packageRecord, ['tracking_number', 'trackingNumber']) ||
    readString(shipment, ['tracking_number', 'trackingNumber', 'master_tracking_number'])

  return {
    shipmentId: readString(shipment, ['id', 'shipment_id', 'shipmentId']),
    carrier: readString(shipment, ['carrier', 'carrier_name', 'provider', 'provider_name']),
    service: readString(shipment, ['service', 'service_level', 'service_level_name', 'service_name']),
    totalCents: readNullableMoneyCents(shipment, ['total', 'amount', 'price', 'total_price', 'cost']),
    currency: readString(shipment, ['currency', 'currency_code', 'currencyCode']) || 'MXN',
    trackingNumber,
    trackingUrl:
      readString(packageRecord, ['tracking_url_provider', 'tracking_url', 'trackingUrl']) ||
      readString(shipment, ['tracking_url_provider', 'tracking_url', 'trackingUrl']),
    labelUrl:
      readString(packageRecord, ['label_url', 'labelUrl']) ||
      readString(shipment, ['label_url', 'labelUrl']),
  }
}

export function assertSkydropxShipmentReady(shipment: NormalizedSkydropxShipment): void {
  if (!shipment.trackingNumber) {
    throw new Error('Skydropx creo el envio sin tracking number; no se puede marcar como guia creada.')
  }
  if (!shipment.labelUrl) {
    throw new Error('Skydropx creo el envio sin URL de etiqueta; no se puede marcar como guia creada.')
  }
}

export function sanitizeSkydropxError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || 'Error de Skydropx.')
  return message
    .replace(/(client_secret=)[^&\s]+/gi, '$1[redacted]')
    .replace(/(client_id=)[^&\s]+/gi, '$1[redacted]')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[redacted]')
    .slice(0, 500)
}

export function getSkydropxBaseUrl(env?: Record<string, string | undefined>): string {
  return (readEnvValue('SKYDROPX_BASE_URL', env) || 'https://api-pro.skydropx.com').replace(/\/+$/, '')
}

async function skydropxRequest(
  path: string,
  request: { method: 'GET' | 'POST'; body?: unknown },
  options: SkydropxRequestOptions,
): Promise<unknown> {
  const token = await getToken(options)
  const response = await (options.fetchImpl ?? fetch)(`${getSkydropxBaseUrl(options.env)}${path}`, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: request.body == null ? undefined : JSON.stringify(request.body),
  })
  const payload = await readJsonResponse(response)
  if (!response.ok) {
    throw new Error(readSkydropxError(payload, 'Skydropx rechazo la solicitud.'))
  }
  return payload
}

function toSkydropxApiAddress(
  address: SkydropxAddress,
  options: { includeShipmentAliases?: boolean } = {},
) {
  const apiAddress: Record<string, string> = {
    name: address.name,
    phone: address.phone,
    street1: address.street,
    street2: formatStreet2(address),
    country_code: address.country,
    postal_code: address.postalCode,
    area_level1: address.state,
    area_level2: address.city,
    area_level3: address.neighborhood,
  }
  if (address.company?.trim()) apiAddress.company = address.company.trim()
  if (address.email?.trim()) apiAddress.email = address.email.trim()
  if (address.reference?.trim()) apiAddress.reference = address.reference.trim()

  if (options.includeShipmentAliases) {
    apiAddress.province = address.state
    apiAddress.city = address.city
    apiAddress.neighborhood = address.neighborhood
    if (address.interiorNumber?.trim()) apiAddress.apartment_number = address.interiorNumber.trim()
    if (address.reference?.trim()) {
      apiAddress.further_information = address.reference.trim().slice(0, 70)
    }
  }

  return apiAddress
}

function toSkydropxParcel(parcel: SkydropxParcel) {
  return {
    length: parcel.lengthCm,
    width: parcel.widthCm,
    height: parcel.heightCm,
    weight: Number((parcel.weightGrams / 1000).toFixed(3)),
  }
}

function formatStreet2(address: SkydropxAddress): string {
  return [address.exteriorNumber, address.interiorNumber ? `Int. ${address.interiorNumber}` : '']
    .filter(Boolean)
    .join(' ')
}

function centsToMoney(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null
  }
  return Number((value / 100).toFixed(2))
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function requireEnv(key: string, env?: Record<string, string | undefined>): string {
  const value = readEnvValue(key, env)?.trim()
  if (!value) {
    throw new Error(`Falta configurar ${key}.`)
  }
  return value
}

function readEnvValue(key: string, env?: Record<string, string | undefined>): string | undefined {
  if (env && Object.prototype.hasOwnProperty.call(env, key)) {
    return env[key]
  }
  const netlify = (globalThis as typeof globalThis & {
    Netlify?: { env?: { get?: (name: string) => string | undefined } }
  }).Netlify
  return netlify?.env?.get?.(key) || process.env[key]
}

function readSkydropxError(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) {
    return fallback
  }
  const error = payload.error
  if (typeof error === 'string') return error
  if (isRecord(error) && typeof error.message === 'string') return error.message
  if (typeof payload.message === 'string') return payload.message
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0]
    if (typeof first === 'string') return first
    if (isRecord(first) && typeof first.detail === 'string') return first.detail
    if (isRecord(first) && typeof first.message === 'string') return first.message
  }
  return fallback
}

function collectRateCandidates(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  const record = isRecord(raw) ? raw : {}
  const data = record.data
  const dataRecord = isRecord(data) ? data : null
  const attributes = isRecord(dataRecord?.attributes) ? dataRecord.attributes : record
  const rates = attributes.rates || record.rates
  if (Array.isArray(rates)) return rates

  const includedRates = Array.isArray(record.included)
    ? record.included.filter((item) => isRecord(item) && String(item.type || '').includes('rate'))
    : []
  if (includedRates.length > 0) return includedRates

  return dataRecord ? [dataRecord] : [record]
}

function flattenJsonApiRecord(raw: unknown): Record<string, unknown> {
  const record = isRecord(raw) ? raw : {}
  const data = isRecord(record.data) ? record.data : record
  const attributes = isRecord(data.attributes) ? data.attributes : {}
  return {
    ...attributes,
    ...data,
    id: typeof data.id === 'string' || typeof data.id === 'number' ? data.id : record.id,
  }
}

function firstPackageRecord(raw: unknown): Record<string, unknown> {
  const record = isRecord(raw) ? raw : {}
  const included = Array.isArray(record.included) ? record.included : []
  const packageItem = included.find((item) => {
    if (!isRecord(item)) return false
    return String(item.type || '').toLowerCase().includes('package')
  })
  if (packageItem) return flattenJsonApiRecord(packageItem)

  const shipment = flattenJsonApiRecord(raw)
  const packages = shipment.packages
  if (Array.isArray(packages) && packages[0]) {
    return flattenJsonApiRecord(packages[0])
  }
  return {}
}

function readJsonApiId(raw: unknown): string {
  const record = flattenJsonApiRecord(raw)
  return readString(record, ['id', 'quotation_id', 'quotationId'])
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

function readNullableNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key]
    if (value == null || value === '') continue
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return null
}

function readMoneyCents(record: Record<string, unknown>, keys: string[]): number {
  return readNullableMoneyCents(record, keys) ?? 0
}

function readNullableMoneyCents(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key]
    if (value == null || value === '') continue
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return Math.round(numeric * 100)
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
