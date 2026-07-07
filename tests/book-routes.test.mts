import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const appSource = readFileSync('src/App.tsx', 'utf8')

test('App routes dedicated book store paths before proposal and landing pages', () => {
  const bookRouteIndex = appSource.indexOf('getBookRoute')
  const proposalRouteIndex = appSource.indexOf('getProposalRoute')

  assert.ok(bookRouteIndex >= 0)
  assert.ok(proposalRouteIndex >= 0)
  assert.ok(bookRouteIndex < proposalRouteIndex)
  assert.equal(appSource.includes('BookStorePage'), true)
  assert.equal(appSource.includes('ThankYouPage'), true)
  assert.equal(appSource.includes('OrderStatusPage'), true)
  assert.equal(appSource.includes('LegalPage'), true)
})

test('book store page posts to the book checkout endpoint', () => {
  const bookSource = readFileSync('src/book/BookCheckoutForm.tsx', 'utf8')
  const copySource = readFileSync('src/book/bookCopy.ts', 'utf8')

  assert.equal(bookSource.includes('/api/book/checkout/create-session'), true)
  assert.equal(bookSource.includes('Comprar con Stripe'), true)
  assert.equal(bookSource.includes('Envío gratis dentro de México'), true)
  assert.equal(copySource.includes('Hazlo Magnífico'), true)
  assert.equal(copySource.includes('$499 MXN'), true)
})

test('public legal and order routes are declared for the book flow', () => {
  const legalSource = readFileSync('src/book/LegalPages.tsx', 'utf8')
  const statusSource = readFileSync('src/book/OrderStatusPage.tsx', 'utf8')

  for (const slug of [
    'politica-de-envios',
    'cambios-devoluciones-cancelaciones',
    'aviso-de-privacidad',
    'terminos-y-condiciones',
    'contacto',
  ]) {
    assert.equal(appSource.includes(slug), true)
    assert.equal(legalSource.includes(slug), true)
  }

  assert.equal(statusSource.includes('/api/book/orders/'), true)
  assert.equal(statusSource.includes('token'), true)
})
