import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildMercadoPagoPreference,
  buildStripeCheckoutParams,
  markProposalPaid,
} from '../netlify/functions/_shared/payments.mts'
import { buildPrivateProposal, type LeadForProposal } from '../netlify/functions/_shared/proposals.mts'

const lead: LeadForProposal = {
  servicioPrincipal: 'conference',
  nombre: 'OZ',
  apellido: 'EJEMPLO',
  telefono: '8999110922',
  email: 'oz@expocuspide.com',
  tipoOrganizacion: 'Pequeña o mediana empresa',
  institucion: 'Propulsor',
  serviciosInteres: ['Conferencias y masterclasses'],
  formatoEvento: 'Conferencia / masterclass de 60 a 90 minutos',
  temaInteres: 'Hazlo Magnífico',
  planViaje: 'arrive-and-return-extra',
  paqueteMentoria: 'one',
  productoConsultoria: 'Fábrica de Clientes',
  lugarFecha: 'Monterrey, 30 de julio de 2026',
  comoTeEnteraste: 'Google',
  objetivo: 'Validar pago automático.',
  contextoProyecto: 'Prueba técnica.',
}

const proposal = buildPrivateProposal(lead, {
  origin: 'https://ozcreativo.com',
  now: new Date('2026-06-24T15:00:00.000Z'),
  token: 'abcdef1234567890abcdef1234567890',
})

test('Stripe checkout params include exact proposal amount and private return URL', () => {
  assert.equal(proposal.payment.status, 'enabled')
  if (proposal.payment.status !== 'enabled') return

  const stripeOption = proposal.payment.checkoutOptions.find((option) => option.provider === 'stripe')
  assert.ok(stripeOption)

  const params = buildStripeCheckoutParams({
    proposal,
    checkoutOption: stripeOption,
    origin: 'https://ozcreativo.com',
  })

  assert.equal(params.get('mode'), 'payment')
  assert.equal(params.get('customer_email'), 'oz@expocuspide.com')
  assert.equal(params.get('client_reference_id'), proposal.folio)
  assert.equal(params.get('metadata[folio]'), proposal.folio)
  assert.equal(params.get('metadata[token]'), proposal.token)
  assert.equal(params.get('line_items[0][price_data][currency]'), 'mxn')
  assert.equal(params.get('line_items[0][price_data][unit_amount]'), '2900000')
  assert.equal(params.get('success_url'), `${proposal.proposalUrl}?payment=stripe-success`)
  assert.equal(params.get('cancel_url'), `${proposal.proposalUrl}?payment=cancelled`)
})

test('Mercado Pago preference includes notification URL and folio reference', () => {
  assert.equal(proposal.payment.status, 'enabled')
  if (proposal.payment.status !== 'enabled') return

  const mercadoPagoOption = proposal.payment.checkoutOptions.find(
    (option) => option.provider === 'mercado-pago',
  )
  assert.ok(mercadoPagoOption)

  const preference = buildMercadoPagoPreference({
    proposal,
    checkoutOption: mercadoPagoOption,
    origin: 'https://ozcreativo.com',
  })

  assert.equal(preference.external_reference, proposal.folio)
  assert.equal(preference.notification_url, 'https://ozcreativo.com/api/payments/mercado-pago-webhook')
  assert.equal(preference.items[0].title, `${proposal.serviceTitle} · ${proposal.folio}`)
  assert.equal(preference.items[0].currency_id, 'MXN')
  assert.equal(preference.items[0].unit_price, 29000)
  assert.equal(preference.metadata.folio, proposal.folio)
  assert.equal(preference.metadata.token, proposal.token)
})

test('paid proposals keep the payment provider confirmation', () => {
  const paidProposal = markProposalPaid(proposal, {
    provider: 'stripe',
    providerPaymentId: 'cs_test_123',
    paidAt: '2026-06-25T18:00:00.000Z',
  })

  assert.equal(paidProposal.payment.status, 'enabled')
  if (paidProposal.payment.status !== 'enabled') return

  assert.equal(paidProposal.payment.paidAt, '2026-06-25T18:00:00.000Z')
  assert.equal(paidProposal.payment.paidProvider, 'stripe')
  assert.equal(paidProposal.payment.providerPaymentId, 'cs_test_123')
})
