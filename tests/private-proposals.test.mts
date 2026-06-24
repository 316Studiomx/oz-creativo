import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildPrivateProposal,
  proposalStorageKey,
  type LeadForProposal,
} from '../netlify/functions/_shared/proposals.mts'

const baseLead: LeadForProposal = {
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
  objetivo: 'Validar el flujo privado de propuesta.',
  contextoProyecto: 'Prueba técnica.',
}

const fixedOptions = {
  origin: 'https://ozcreativo.com',
  now: new Date('2026-06-24T15:00:00.000Z'),
  token: 'abcdef1234567890abcdef1234567890',
}

test('event proposals generate a private URL with the exact travel quote', () => {
  const proposal = buildPrivateProposal(baseLead, fixedOptions)

  assert.equal(proposal.folio, 'OZ-20260624-ABCDEF')
  assert.equal(
    proposal.proposalUrl,
    'https://ozcreativo.com/propuesta/OZ-20260624-ABCDEF/abcdef1234567890abcdef1234567890',
  )
  assert.equal(proposal.investment.amount, '$29,000 MXN')
  assert.ok(proposal.investment.breakdown.some((item) => item.value === '$10,000 MXN'))
  assert.equal(proposal.payment.status, 'enabled')
  if (proposal.payment.status === 'enabled') {
    assert.equal(proposal.payment.reference, proposal.folio)
    assert.equal(proposal.payment.clabe, '014822605719781690')
  }
})

test('mentoring proposals show USD plus Banxico MXN estimate when available', () => {
  const proposal = buildPrivateProposal(
    {
      ...baseLead,
      servicioPrincipal: 'mentoring',
      serviciosInteres: ['Mentoría 1:1'],
      paqueteMentoria: 'one',
    },
    {
      ...fixedOptions,
      exchangeRate: { rate: 17.348, rateDate: '24/06/2026' },
    },
  )

  assert.equal(proposal.serviceTitle, 'Sesión de Estrategia Magnífica 1:1')
  assert.equal(proposal.investment.amount, '$249 USD / $4,320 MXN aprox.')
})

test('consulting proposals move to discovery instead of inventing a final price', () => {
  const proposal = buildPrivateProposal(
    {
      ...baseLead,
      servicioPrincipal: 'consulting',
      serviciosInteres: ['Consultoría'],
      productoConsultoria: 'Tu Agencia In-House',
    },
    fixedOptions,
  )

  assert.equal(proposal.investment.amount, 'Desde $9,000 USD')
  assert.equal(proposal.payment.status, 'discovery')
})

test('proposal storage key is scoped by folio and token', () => {
  assert.equal(
    proposalStorageKey('OZ-20260624-ABCDEF', 'abcdef123456'),
    'proposals/OZ-20260624-ABCDEF-abcdef123456.json',
  )
})
