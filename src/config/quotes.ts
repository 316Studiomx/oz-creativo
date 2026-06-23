export type EventTravelPlan =
  | 'same-day'
  | 'arrive-day-before'
  | 'return-day-after'
  | 'arrive-and-return-extra'

export type MentoringPackageId = 'one' | 'four' | 'twelve'

export const EVENT_BASE_PRICE_MXN = 19000
export const EVENT_EXTRA_TRAVEL_DAY_MXN = 5000
export const CONSULTING_STARTS_AT_USD = 9000

export const EVENT_TRAVEL_OPTIONS: Record<
  EventTravelPlan,
  { label: string; extraDays: number; note: string }
> = {
  'same-day': {
    label: 'Ir y volver el mismo día',
    extraDays: 0,
    note: 'Aplica cuando agenda, vuelos y horarios permiten resolver todo el mismo día.',
  },
  'arrive-day-before': {
    label: 'Viajar un día antes',
    extraDays: 1,
    note: 'Suma un día de disponibilidad por traslado previo al evento.',
  },
  'return-day-after': {
    label: 'Regresar un día después',
    extraDays: 1,
    note: 'Suma un día de disponibilidad posterior al evento.',
  },
  'arrive-and-return-extra': {
    label: 'Viajar un día antes y regresar un día después',
    extraDays: 2,
    note: 'Suma dos días de disponibilidad alrededor del evento.',
  },
}

export const MENTORING_PACKAGES = [
  {
    id: 'one',
    label: '1 sesión',
    priceUsd: 249,
    note: 'Diagnóstico estratégico y claridad sobre el siguiente movimiento.',
  },
  {
    id: 'four',
    label: '4 sesiones',
    priceUsd: 849,
    note: 'Paquete de avance para convertir la sesión inicial en plan accionable.',
  },
  {
    id: 'twelve',
    label: '12 sesiones',
    priceUsd: 1990,
    note: 'Acompañamiento estratégico completo para sostener ejecución y seguimiento.',
  },
] as const

export const EVENT_TOPICS = [
  'Marketing Magnífico',
  'Ventas Magníficas',
  'Hazlo Magnífico',
  'Marca personal y autoridad',
  'Inteligencia artificial aplicada a negocios',
  'Otro tema a diseñar',
] as const

export const CONSULTING_PRODUCTS = [
  'Fábrica de Clientes',
  'Tu Agencia In-House',
] as const

export function calculateEventQuote(plan: EventTravelPlan) {
  const option = EVENT_TRAVEL_OPTIONS[plan]
  const travelMxn = option.extraDays * EVENT_EXTRA_TRAVEL_DAY_MXN

  return {
    baseMxn: EVENT_BASE_PRICE_MXN,
    travelMxn,
    totalMxn: EVENT_BASE_PRICE_MXN + travelMxn,
    travelLabel: option.label,
    note: option.note,
  }
}

export function getMentoringPackage(id: MentoringPackageId) {
  const selected = MENTORING_PACKAGES.find((item) => item.id === id)
  if (!selected) {
    throw new Error('Paquete de mentoría no encontrado.')
  }

  return selected
}

export function formatUsdToMxnEstimate(usd: number, exchangeRate: number): string {
  const amount = Math.round(usd * exchangeRate)
  return formatMxn(amount)
}

export function formatMxn(amount: number): string {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)

  return `${formatted} MXN`
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}
