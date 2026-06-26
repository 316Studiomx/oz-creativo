import type {
  CheckoutOption,
  PaymentCurrency,
  PaymentProvider,
  PrivateProposal,
} from './proposals.mts'

export type CheckoutProvider = PaymentProvider

type CheckoutBuildInput = {
  proposal: PrivateProposal
  checkoutOption: CheckoutOption
  origin: string
}

export type MercadoPagoPreference = {
  items: Array<{
    id: string
    title: string
    description: string
    quantity: number
    unit_price: number
    currency_id: PaymentCurrency
  }>
  payer: {
    email: string
    name: string
  }
  back_urls: {
    success: string
    pending: string
    failure: string
  }
  payment_methods: {
    installments: number
  }
  auto_return: 'approved'
  notification_url: string
  external_reference: string
  metadata: {
    folio: string
    token: string
    provider: 'mercado-pago'
  }
}

export function buildStripeCheckoutParams({
  proposal,
  checkoutOption,
}: CheckoutBuildInput): URLSearchParams {
  const params = new URLSearchParams()
  params.set('mode', 'payment')
  params.set('customer_email', proposal.email)
  params.set('client_reference_id', proposal.folio)
  params.set('success_url', `${proposal.proposalUrl}?payment=stripe-success`)
  params.set('cancel_url', `${proposal.proposalUrl}?payment=cancelled`)
  params.set('metadata[folio]', proposal.folio)
  params.set('metadata[token]', proposal.token)
  params.set('metadata[provider]', 'stripe')
  params.set('line_items[0][quantity]', '1')
  params.set(
    'line_items[0][price_data][currency]',
    checkoutOption.amount.currency.toLowerCase(),
  )
  params.set(
    'line_items[0][price_data][unit_amount]',
    String(toStripeMinorUnits(checkoutOption.amount.value)),
  )
  params.set('line_items[0][price_data][product_data][name]', paymentTitle(proposal))
  params.set(
    'line_items[0][price_data][product_data][description]',
    trimDescription(proposal.serviceSubtitle),
  )
  return params
}

export function buildMercadoPagoPreference({
  proposal,
  checkoutOption,
  origin,
}: CheckoutBuildInput): MercadoPagoPreference {
  const normalizedOrigin = origin.replace(/\/$/, '')

  return {
    items: [
      {
        id: proposal.folio,
        title: paymentTitle(proposal),
        description: trimDescription(proposal.serviceSubtitle),
        quantity: 1,
        unit_price: roundMoney(checkoutOption.amount.value),
        currency_id: checkoutOption.amount.currency,
      },
    ],
    payer: {
      email: proposal.email,
      name: proposal.clientName,
    },
    back_urls: {
      success: `${proposal.proposalUrl}?payment=mercado-pago-success`,
      pending: `${proposal.proposalUrl}?payment=pending`,
      failure: `${proposal.proposalUrl}?payment=cancelled`,
    },
    payment_methods: {
      installments: 6,
    },
    auto_return: 'approved',
    notification_url: `${normalizedOrigin}/api/payments/mercado-pago-webhook`,
    external_reference: proposal.folio,
    metadata: {
      folio: proposal.folio,
      token: proposal.token,
      provider: 'mercado-pago',
    },
  }
}

export function findCheckoutOption(
  proposal: PrivateProposal,
  provider: PaymentProvider,
): CheckoutOption | null {
  if (proposal.payment.status !== 'enabled') {
    return null
  }

  return proposal.payment.checkoutOptions.find((option) => option.provider === provider) ?? null
}

export function markProposalPaid(
  proposal: PrivateProposal,
  payment: {
    provider: PaymentProvider
    providerPaymentId: string
    paidAt: string
  },
): PrivateProposal {
  if (proposal.payment.status !== 'enabled') {
    return proposal
  }

  return {
    ...proposal,
    payment: {
      ...proposal.payment,
      paidAt: payment.paidAt,
      paidProvider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
    },
  }
}

export function paymentSessionStorageKey(provider: PaymentProvider, sessionId: string): string {
  return `payment-sessions/${provider}/${cleanSegment(sessionId)}.json`
}

export function toStripeMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

function paymentTitle(proposal: PrivateProposal): string {
  return `${proposal.serviceTitle} · ${proposal.folio}`
}

function trimDescription(value: string): string {
  return value.slice(0, 240)
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function cleanSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96)
}
