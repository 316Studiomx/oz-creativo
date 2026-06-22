import { getStore } from '@netlify/blobs'

export const BANXICO_FIX_SERIES = 'SF43718'

const BANXICO_FIX_URL = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${BANXICO_FIX_SERIES}/datos/oportuno`
const CACHE_STORE = 'oz-exchange-rate'
const CACHE_KEY = 'usd-mxn-fix'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

type BanxicoDato = {
  fecha?: unknown
  dato?: unknown
}

type BanxicoSeries = {
  idSerie?: unknown
  datos?: BanxicoDato[]
}

type BanxicoPayload = {
  bmx?: {
    series?: BanxicoSeries[]
  }
}

type Fetcher = typeof fetch

export type BanxicoRate = {
  source: 'banxico'
  series: typeof BANXICO_FIX_SERIES
  rate: number
  rateDate: string
  fetchedAt: string
}

export type ExchangeRateResult = BanxicoRate & {
  stale: boolean
}

export function parseBanxicoFix(payload: unknown, now = new Date()): BanxicoRate {
  const root = isRecord(payload) ? (payload as BanxicoPayload) : {}
  const series =
    root.bmx?.series?.find((item) => item.idSerie === BANXICO_FIX_SERIES) ??
    root.bmx?.series?.[0]
  const latest = series?.datos?.[0]
  const rateDate = typeof latest?.fecha === 'string' ? latest.fecha.trim() : ''
  const rate = parseRate(latest?.dato)

  if (!rateDate || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('No se pudo leer el tipo de cambio FIX de Banxico.')
  }

  return {
    source: 'banxico',
    series: BANXICO_FIX_SERIES,
    rate,
    rateDate,
    fetchedAt: now.toISOString(),
  }
}

export function isFreshRate(
  rate: Pick<BanxicoRate, 'fetchedAt'>,
  now = new Date(),
  maxAgeMs = ONE_DAY_MS,
): boolean {
  const fetchedAt = Date.parse(rate.fetchedAt)
  if (!Number.isFinite(fetchedAt)) {
    return false
  }

  const age = now.getTime() - fetchedAt
  return age >= 0 && age < maxAgeMs
}

export async function fetchBanxicoFixRate(
  token: string,
  fetcher: Fetcher = fetch,
  now = new Date(),
): Promise<BanxicoRate> {
  const response = await fetcher(BANXICO_FIX_URL, {
    headers: {
      Accept: 'application/json',
      'Bmx-Token': token,
    },
  })

  if (!response.ok) {
    throw new Error(`Banxico respondio con estatus ${response.status}.`)
  }

  return parseBanxicoFix(await response.json(), now)
}

export async function getDailyExchangeRate(
  token: string,
  fetcher: Fetcher = fetch,
  now = new Date(),
): Promise<ExchangeRateResult> {
  const cached = await readCachedRate()

  if (cached && isFreshRate(cached, now)) {
    return { ...cached, stale: false }
  }

  try {
    const fresh = await fetchBanxicoFixRate(token, fetcher, now)
    await writeCachedRate(fresh)
    return { ...fresh, stale: false }
  } catch (error) {
    if (cached) {
      return { ...cached, stale: true }
    }

    throw error
  }
}

function parseRate(value: unknown): number {
  if (typeof value !== 'string') {
    return Number.NaN
  }

  return Number(value.trim().replace(/,/g, ''))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isBanxicoRate(value: unknown): value is BanxicoRate {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.source === 'banxico' &&
    value.series === BANXICO_FIX_SERIES &&
    typeof value.rate === 'number' &&
    Number.isFinite(value.rate) &&
    value.rate > 0 &&
    typeof value.rateDate === 'string' &&
    typeof value.fetchedAt === 'string'
  )
}

async function readCachedRate(): Promise<BanxicoRate | null> {
  try {
    const store = getStore(CACHE_STORE)
    const cached = await store.get(CACHE_KEY, { type: 'json' })
    return isBanxicoRate(cached) ? cached : null
  } catch {
    return null
  }
}

async function writeCachedRate(rate: BanxicoRate): Promise<void> {
  try {
    const store = getStore(CACHE_STORE)
    await store.setJSON(CACHE_KEY, rate, {
      metadata: {
        source: rate.source,
        series: rate.series,
        rateDate: rate.rateDate,
        fetchedAt: rate.fetchedAt,
      },
    })
  } catch {
    // The endpoint can still answer with the fresh Banxico value if local Blobs are unavailable.
  }
}
