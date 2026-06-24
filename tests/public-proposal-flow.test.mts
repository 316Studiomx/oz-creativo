import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const leadFormSource = readFileSync('src/components/LeadForm.tsx', 'utf8')
const appsScriptSource = readFileSync('scripts/google-apps-script/contact-form.gs', 'utf8')

test('public lead form captures proposal requests without exposing quote pricing', () => {
  assert.equal(leadFormSource.includes('/ Solicitud de propuesta'), true)
  assert.equal(leadFormSource.includes('La inversión se enviará por correo'), true)

  for (const forbidden of [
    '/ Cotizador',
    'Estimado',
    'formatMxn',
    'formatUsd(',
    'formatUsdToMxnEstimate',
    'calculateEventQuote',
    'CONSULTING_STARTS_AT_USD',
    'Banxico FIX',
    'Agendar después del pago',
    'Agendar descubrimiento',
  ]) {
    assert.equal(leadFormSource.includes(forbidden), false, `Unexpected public quote marker: ${forbidden}`)
  }
})

test('form emails do not include estimated quote fields before private proposal review', () => {
  for (const forbidden of ['Cotizacion', 'Monto estimado']) {
    assert.equal(appsScriptSource.includes(forbidden), false, `Unexpected email quote field: ${forbidden}`)
  }
})

test('form emails send a private proposal link instead of a generic follow-up', () => {
  assert.equal(appsScriptSource.includes('proposalUrl'), true)
  assert.equal(appsScriptSource.includes('Ver propuesta privada'), true)
  assert.equal(appsScriptSource.includes('Tu propuesta privada está lista'), true)
})
