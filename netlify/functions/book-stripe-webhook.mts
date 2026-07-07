import type { Config } from '@netlify/functions'
import Stripe from 'stripe'

import { sendPaidOrderEmails } from './_shared/book/email-service.mts'
import { jsonResponse, methodNotAllowed } from './_shared/book/http.mts'
import {
  markOrderPaidByStripe,
  type MarkOrderPaidByStripeResult,
} from './_shared/book/repositories.mts'

declare const Netlify: {
  env: {
    get: (key: string) => string | undefined
  }
}

type StripeCheckoutSession = {
  id?: string | null
  metadata?: Record<string, string | undefined> | null
  payment_status?: string | null
  payment_intent?: string | { id?: string | null } | null
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return methodNotAllowed('POST')
  }

  const webhookSecret = Netlify.env.get('STRIPE_WEBHOOK_SECRET_BOOK')
  if (!webhookSecret) {
    return jsonResponse({ received: false, message: 'Falta configurar Stripe.' }, 503)
  }

  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Firma invalida.'
    return jsonResponse({ received: false, message }, 400)
  }

  if (event.type !== 'checkout.session.completed') {
    return jsonResponse({ received: true, ignored: true })
  }

  const session = event.data.object as StripeCheckoutSession
  if (session.metadata?.flow !== 'book-store') {
    return jsonResponse({ received: true, ignored: true })
  }

  if (session.payment_status !== 'paid' || !session.id) {
    return jsonResponse({ received: true, ignored: true })
  }

  const paidOrderResult = await markOrderPaidByStripe({
    sessionId: session.id,
    paymentIntentId: extractPaymentIntentId(session.payment_intent),
    stripeEventId: event.id,
    stripeEventType: event.type,
  })

  await sendPaidOrderEmailsAfterStripeMark(paidOrderResult)

  return jsonResponse({ received: true, ok: true })
}

export const config: Config = {
  path: '/api/book/webhooks/stripe',
}

function extractPaymentIntentId(value: StripeCheckoutSession['payment_intent']): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (value && typeof value === 'object' && typeof value.id === 'string' && value.id.trim()) {
    return value.id.trim()
  }

  return null
}

export function shouldSendPaidOrderEmailsForStripeMark(
  result: MarkOrderPaidByStripeResult | null,
): result is MarkOrderPaidByStripeResult {
  return Boolean(result?.order && result.shouldSendPaidEmails)
}

export async function sendPaidOrderEmailsAfterStripeMark(
  result: MarkOrderPaidByStripeResult | null,
  send: (orderId: number) => Promise<void> = sendPaidOrderEmails,
  logError: (...args: unknown[]) => void = console.error,
): Promise<void> {
  if (!shouldSendPaidOrderEmailsForStripeMark(result)) {
    return
  }

  try {
    await send(result.order.id)
  } catch (error) {
    logError('Book paid-order email delivery failed.', {
      orderId: result.order.id,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
