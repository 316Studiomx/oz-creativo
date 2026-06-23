import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CONSULTING_STARTS_AT_USD,
  calculateEventQuote,
  formatUsdToMxnEstimate,
  getMentoringPackage,
} from '../src/config/quotes.ts'

test('calculateEventQuote uses the base event price for same-day travel', () => {
  assert.equal(calculateEventQuote('same-day').totalMxn, 19000)
})

test('calculateEventQuote adds one extra travel day when arriving the day before', () => {
  assert.equal(calculateEventQuote('arrive-day-before').totalMxn, 24000)
})

test('calculateEventQuote adds two extra travel days when arriving before and returning after', () => {
  assert.equal(calculateEventQuote('arrive-and-return-extra').totalMxn, 29000)
})

test('getMentoringPackage exposes the full 12-session offer', () => {
  assert.deepEqual(getMentoringPackage('twelve'), {
    id: 'twelve',
    label: '12 sesiones',
    priceUsd: 1990,
    note: 'Acompañamiento estratégico completo para sostener ejecución y seguimiento.',
  })
})

test('formatUsdToMxnEstimate rounds USD packages to whole MXN amounts', () => {
  assert.equal(formatUsdToMxnEstimate(249, 17.348), '$4,320 MXN')
})

test('consulting services start at 9000 USD', () => {
  assert.equal(CONSULTING_STARTS_AT_USD, 9000)
})
