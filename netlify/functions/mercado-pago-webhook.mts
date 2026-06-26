import type { Config } from '@netlify/functions'

import {
  lookupPaymentSession,
  lookupProposalToken,
  markStoredProposalPaid,
} from './_shared/payment-store.mts'

declare const Netlify: {
  env: {
    get: (key: string) => string | undefined
  }
}

type MercadoPagoWebhookResponse = {
  received: boolean
  ok?: boolean
  message?: string
}

type MercadoPagoNotification = {
  type?: unknown
  topic?: unknown
  id?: unknown
  data?: {
    id?: unknown
  }
}

type MercadoPagoPayment = {
  id?: unknown
  status?: unknown
  external_reference?: unknown
  order?: {
    id?: unknown
  }
  metadata?: {
    folio?: unknown
    token?: unknown
  }
}

export default async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return json({ received: false, message: 'Metodo no permitido.' }, 405, {
      Allow: 'POST, GET',
    })
  }

  const notification = await readNotification(req)
  const topic = text(notification.type) || text(notification.topic)
  const paymentId = text(notification.data?.id) || text(notification.id)

  if (topic && topic !== 'payment') {
    return json({ received: true, ok: true })
  }

  if (!paymentId) {
    return json({ received: false, message: 'Falta id de pago.' }, 400)
  }

  const accessToken = Netlify.env.get('MERCADO_PAGO_ACCESS_TOKEN')
  if (!accessToken) {
    return json({ received: false, message: 'Falta configurar Mercado Pago.' }, 503)
  }

  const payment = await fetchMercadoPagoPayment(paymentId, accessToken)
  if (!payment || payment.status !== 'approved') {
    return json({ received: true, ok: true })
  }

  const preferenceLookup = await lookupPaymentSession('mercado-pago', text(payment.order?.id))
  const folio = text(payment.metadata?.folio) || text(payment.external_reference) || preferenceLookup?.folio || ''
  const token =
    text(payment.metadata?.token) || preferenceLookup?.token || (folio ? await lookupProposalToken(folio) : '')

  if (!folio || !token) {
    return json({ received: false, message: 'No se pudo resolver la propuesta.' }, 400)
  }

  const proposal = await markStoredProposalPaid({
    folio,
    token,
    provider: 'mercado-pago',
    providerPaymentId: paymentId,
    paidAt: new Date().toISOString(),
  })

  if (!proposal) {
    return json({ received: false, message: 'Propuesta no encontrada.' }, 404)
  }

  return json({ received: true, ok: true })
}

export const config: Config = {
  path: '/api/payments/mercado-pago-webhook',
}

async function readNotification(req: Request): Promise<MercadoPagoNotification> {
  const url = new URL(req.url)
  const fromQuery: MercadoPagoNotification = {
    type: url.searchParams.get('type') || url.searchParams.get('topic') || '',
    id: url.searchParams.get('id') || url.searchParams.get('data.id') || '',
  }

  if (req.method === 'GET') {
    return fromQuery
  }

  try {
    const body = (await req.json()) as MercadoPagoNotification
    return {
      ...fromQuery,
      ...body,
      data: {
        id: text(body.data?.id) || text(fromQuery.id),
      },
    }
  } catch {
    return fromQuery
  }
}

async function fetchMercadoPagoPayment(
  paymentId: string,
  accessToken: string,
): Promise<MercadoPagoPayment | null> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as MercadoPagoPayment
}

function json(
  body: MercadoPagoWebhookResponse,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      ...headers,
    },
  })
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
