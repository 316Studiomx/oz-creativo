import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const leadFormSource = readFileSync('src/components/LeadForm.tsx', 'utf8')
const leadFormModalSource = readFileSync('src/components/LeadFormModal.tsx', 'utf8')
const cursorSource = readFileSync('src/components/Cursor.tsx', 'utf8')
const stylesSource = readFileSync('src/styles/index.css', 'utf8')
const appsScriptSource = readFileSync('scripts/google-apps-script/contact-form.gs', 'utf8')
const proposalPageSource = readFileSync('src/components/ProposalPage.tsx', 'utf8')

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

test('form emails use a premium visual template for owner and client', () => {
  for (const expected of [
    'emailShell_',
    'emailButton_',
    'Resumen de solicitud',
    'Ficha del prospecto',
    'Tu propuesta privada ya está lista',
    'background:linear-gradient(135deg,#111111 0%,#181818 58%,#332b00 100%)',
  ]) {
    assert.equal(appsScriptSource.includes(expected), true, `Missing premium email marker: ${expected}`)
  }
})

test('private proposal page uses checkout buttons instead of transfer instructions', () => {
  assert.equal(proposalPageSource.includes('/api/payments/create'), true)
  assert.equal(proposalPageSource.includes('CLABE'), false)
  assert.equal(proposalPageSource.includes('Enviar comprobante'), false)
  assert.equal(proposalPageSource.includes('Mercado Pago'), true)
})

test('proposal modal keeps the cursor visible over form controls', () => {
  assert.equal(leadFormModalSource.includes('lead-form-modal'), true)
  assert.equal(leadFormSource.includes('name={name}'), true)
  assert.equal(cursorSource.includes('nativeCursorZone'), true)
  assert.equal(cursorSource.includes("visibility = nativeCursorZone ? 'hidden' : 'visible'"), true)
  assert.match(cursorSource, /z-\[\d+\]/)
  assert.match(stylesSource, /\.lead-form-modal[\s\S]*cursor: auto/)
  assert.match(stylesSource, /\.lead-form-modal[\s\S]*button[\s\S]*cursor: pointer/)
  assert.match(stylesSource, /\.lead-form-modal[\s\S]*input[\s\S]*cursor: text/)
  assert.match(stylesSource, /\.lead-form-modal[\s\S]*textarea[\s\S]*cursor: text/)
  assert.match(stylesSource, /\.lead-form-modal[\s\S]*select[\s\S]*cursor: pointer/)
})
