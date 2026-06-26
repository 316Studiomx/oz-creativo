import type { Config } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

import {
  buildMercadoPagoPreference,
  buildStripeCheckoutParams,
  findCheckoutOption,
} from './_shared/payments.mts'
import {
  rememberPaymentSession,
  rememberProposalLookup,
} from './_shared/payment-store.mts'
import {
  proposalStorageKey,
  type PaymentProvider,
  type PrivateProposal,
} from './_shared/proposals.mts'

declare const Netlify: {
  env: {
    get: (key: string) => string | undefined
  }
}

type PaymentCreatePayload = {
  folio?: unknown
  token?: unknown
  provider?: unknown
}

type PaymentCreateResponse = {
  ok: boolean
  checkoutUrl?: string
  provider?: PaymentProvider
  paid?: boolean
  message?: string
}

type StripeSessionResponse = {
  id?: unknown
  url?: unknown
  error?: { message?: unknown }
}

type MercadoPagoPreferenceResponse = {
  id?: unknown
  init_point?: unknown
  sandbox_init_point?: unknown
  message?: unknown
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ ok: false, message: 'Metodo no permitido.' }, 405, { Allow: 'POST' })
  }

  let payload: PaymentCreatePayload
  try {
    payload = await req.json()
  } catch {
    return json({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const folio = text(payload.folio)
  const token = text(payload.token)
  const provider = providerFromPayload(payload.provider)

  if (!folio || !token || !provider) {
    return json({ ok: false, message: 'Falta folio, token o proveedor de pago.' }, 400)
  }

  const proposal = await loadProposal(folio, token)
  if (!proposal) {
    return json({ ok: false, message: 'Propuesta no encontrada.' }, 404)
  }

  if (proposal.payment.status !== 'enabled') {
    return json({ ok: false, message: 'Esta propuesta requiere una reunion antes de pago.' }, 400)
  }

  if (proposal.payment.paidAt) {
    return json({
      ok: true,
      paid: true,
      checkoutUrl: proposal.proposalUrl,
      provider: proposal.payment.paidProvider,
    })
  }

  const checkoutOption = findCheckoutOption(proposal, provider)
  if (!checkoutOption) {
    return json({ ok: false, message: 'Este proveedor no esta disponible para esta propuesta.' }, 400)
  }

  await rememberProposalLookup(proposal)

  if (provider === 'stripe') {
    return createStripeCheckout(proposal, checkoutOption)
  }

  return createMercadoPagoCheckout(req, proposal, checkoutOption)
}

export const config: Config = {
  path: '/api/payments/create',
}

async function createStripeCheckout(
  proposal: PrivateProposal,
  checkoutOption: NonNullable<ReturnType<typeof findCheckoutOption>>,
): Promise<Response> {
  const secretKey = Netlify.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) {
    return json({ ok: false, message: 'Falta configurar Stripe.' }, 503)
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildStripeCheckoutParams({
      proposal,
      checkoutOption,
      origin: new URL(proposal.proposalUrl).origin,
    }),
  })
  const result = (await response.json()) as StripeSessionResponse
  const checkoutUrl = text(result.url)
  const sessionId = text(result.id)

  if (!response.ok || !checkoutUrl || !sessionId) {
    return json(
      {
        ok: false,
        message: text(result.error?.message) || 'No se pudo crear el checkout de Stripe.',
      },
      502,
    )
  }

  await rememberPaymentSession('stripe', sessionId, proposal)
  return json({ ok: true, checkoutUrl, provider: 'stripe' })
}

async function createMercadoPagoCheckout(
  req: Request,
  proposal: PrivateProposal,
  checkoutOption: NonNullable<ReturnType<typeof findCheckoutOption>>,
): Promise<Response> {
  const accessToken = Netlify.env.get('MERCADO_PAGO_ACCESS_TOKEN')
  if (!accessToken) {
    return json({ ok: false, message: 'Falta configurar Mercado Pago.' }, 503)
  }

  if (checkoutOption.amount.currency !== 'MXN') {
    return json(
      { ok: false, message: 'Mercado Pago requiere una cotizacion en MXN para esta cuenta.' },
      400,
    )
  }

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      buildMercadoPagoPreference({
        proposal,
        checkoutOption,
        origin: getOrigin(req),
      }),
    ),
  })
  const result = (await response.json()) as MercadoPagoPreferenceResponse
  const checkoutUrl = text(result.init_point) || text(result.sandbox_init_point)
  const preferenceId = text(result.id)

  if (!response.ok || !checkoutUrl || !preferenceId) {
    return json(
      {
        ok: false,
        message: text(result.message) || 'No se pudo crear el checkout de Mercado Pago.',
      },
      502,
    )
  }

  await rememberPaymentSession('mercado-pago', preferenceId, proposal)
  return json({ ok: true, checkoutUrl, provider: 'mercado-pago' })
}

async function loadProposal(folio: string, token: string): Promise<PrivateProposal | null> {
  const proposal = await getStore({ name: 'oz-proposals', consistency: 'strong' }).get(
    proposalStorageKey(folio, token),
    { type: 'json' },
  )
  return isPrivateProposal(proposal) ? proposal : null
}

function providerFromPayload(value: unknown): PaymentProvider | '' {
  return value === 'stripe' || value === 'mercado-pago' ? value : ''
}

function getOrigin(req: Request): string {
  const origin = req.headers.get('origin')
  return origin || new URL(req.url).origin
}

function json(
  body: PaymentCreateResponse,
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

function isPrivateProposal(value: unknown): value is PrivateProposal {
  return isRecord(value) && typeof value.folio === 'string' && typeof value.token === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
