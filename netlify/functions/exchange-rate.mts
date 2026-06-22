import type { Config } from '@netlify/functions'

import { getDailyExchangeRate } from './_shared/banxico.mts'

declare const Netlify: {
  env: {
    get: (key: string) => string | undefined
  }
}

type ExchangeRateResponse = {
  ok: boolean
  base?: 'USD'
  quote?: 'MXN'
  rate?: number
  rateDate?: string
  fetchedAt?: string
  source?: string
  stale?: boolean
  message?: string
}

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return json({ ok: false, message: 'Metodo no permitido.' }, 405, {
      Allow: 'GET',
    })
  }

  const token = Netlify.env.get('BANXICO_TOKEN')
  if (!token) {
    return json(
      {
        ok: false,
        message: 'Falta configurar el token de Banxico.',
      },
      503,
    )
  }

  try {
    const rate = await getDailyExchangeRate(token)

    return json(
      {
        ok: true,
        base: 'USD',
        quote: 'MXN',
        rate: rate.rate,
        rateDate: rate.rateDate,
        fetchedAt: rate.fetchedAt,
        source: `Banxico FIX ${rate.series}`,
        stale: rate.stale,
      },
      200,
      {
        'Cache-Control': 'public, max-age=3600',
      },
    )
  } catch {
    return json(
      {
        ok: false,
        message: 'No se pudo consultar el tipo de cambio de Banxico.',
      },
      502,
    )
  }
}

export const config: Config = {
  path: '/api/exchange-rate',
}

function json(
  body: ExchangeRateResponse,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}
