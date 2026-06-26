import type { Config } from '@netlify/functions'

import {
  lookupPaymentSession,
  markStoredProposalPaid,
} from './_shared/payment-store.mts'

declare const Netlify: {
  env: {
    get: (key: string) => string | undefined
  }
}

type StripeWebhookResponse = {
  received: boolean
  ok?: boolean
  message?: string
}

type StripeEvent = {
  type?: unknown
  data?: {
    object?: unknown
  }
}

type StripeCheckoutSession = {
  id?: unknown
  payment_status?: unknown
  client_reference_id?: unknown
  metadata?: {
    folio?: unknown
    token?: unknown
  }
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ received: false, message: 'Metodo no permitido.' }, 405, {
      Allow: 'POST',
    })
  }

  const rawBody = await req.text()
  const webhookSecret = Netlify.env.get('STRIPE_WEBHOOK_SECRET')
  if (webhookSecret) {
    const signature = req.headers.get('stripe-signature') || ''
    const verified = await verifyStripeSignature(rawBody, signature, webhookSecret)
    if (!verified) {
      return json({ received: false, message: 'Firma invalida.' }, 400)
    }
  }

  let event: StripeEvent
  try {
    event = JSON.parse(rawBody) as StripeEvent
  } catch {
    return json({ received: false, message: 'Payload invalido.' }, 400)
  }

  if (event.type !== 'checkout.session.completed') {
    return json({ received: true, ok: true })
  }

  const session = event.data?.object as StripeCheckoutSession | undefined
  const sessionId = text(session?.id)
  const paid = session?.payment_status === 'paid'

  if (!sessionId || !paid) {
    return json({ received: true, ok: true })
  }

  const sessionLookup = await lookupPaymentSession('stripe', sessionId)
  const folio = text(session?.metadata?.folio) || text(session?.client_reference_id) || sessionLookup?.folio || ''
  const token = text(session?.metadata?.token) || sessionLookup?.token || ''

  if (!folio || !token) {
    return json({ received: false, message: 'No se pudo resolver la propuesta.' }, 400)
  }

  const proposal = await markStoredProposalPaid({
    folio,
    token,
    provider: 'stripe',
    providerPaymentId: sessionId,
    paidAt: new Date().toISOString(),
  })

  if (!proposal) {
    return json({ received: false, message: 'Propuesta no encontrada.' }, 404)
  }

  return json({ received: true, ok: true })
}

export const config: Config = {
  path: '/api/payments/stripe-webhook',
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = signatureHeader.split(',').map((part) => part.trim())
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) || ''
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))
    .filter(Boolean)

  if (!timestamp || signatures.length === 0) {
    return false
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${payload}`)
  return signatures.some((signature) => constantTimeEqual(signature, expected))
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false
  }

  let diff = 0
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return diff === 0
}

function json(
  body: StripeWebhookResponse,
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
