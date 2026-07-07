import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const appSource = readFileSync('src/App.tsx', 'utf8')
const repositoriesSource = readFileSync('netlify/functions/_shared/book/repositories.mts', 'utf8')

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

test('book store page exposes urgency, richer product proof, reviews, faq, and flags', () => {
  const pageSource = readFileSync('src/book/BookStorePage.tsx', 'utf8')
  const formSource = readFileSync('src/book/BookCheckoutForm.tsx', 'utf8')
  const copySource = readFileSync('src/book/bookCopy.ts', 'utf8')

  assert.equal(pageSource.includes('PromoTicker'), true)
  assert.equal(pageSource.includes('HeroBookCarousel'), true)
  assert.equal(pageSource.includes('BOOK_STORE_COPY.heroImages.map'), true)
  assert.equal(pageSource.includes('Anterior imagen del libro'), true)
  assert.equal(pageSource.includes('Siguiente imagen del libro'), true)
  assert.equal(pageSource.includes('Fotos del libro'), false)
  assert.equal(pageSource.includes('ProductStorySection'), true)
  assert.equal(pageSource.includes('BookReviewsSection'), true)
  assert.equal(pageSource.includes('BookFaqSection'), true)
  assert.equal(pageSource.includes('ForYouIfSection'), true)
  assert.equal(pageSource.includes('AuthorBioSection'), true)
  assert.equal(formSource.includes('$599'), true)
  assert.equal(formSource.includes('$499'), true)
  assert.equal(formSource.includes('03:16'), true)
  assert.match(copySource, /Env[ií]o gratis comprando/i)
  assert.match(copySource, /Qu[eé] dolor escoger[ií]as/i)
  assert.match(copySource, /Rappi/i)
  assert.match(copySource, /Airbnb/i)
  assert.match(copySource, /Cirque du Soleil/i)
  assert.match(copySource, /A-D105/i)
  assert.match(copySource, /necesitas a Dios/i)
  assert.match(copySource, /Resumen largo/i)
  assert.match(copySource, /Caracter[ií]sticas/i)
  assert.match(copySource, /Reseñas/i)
  assert.match(copySource, /Preguntas frecuentes/i)
  assert.match(copySource, /Susi Vereecken/i)
  assert.match(copySource, /Marcus Dantus/i)
  assert.match(copySource, /Este libro es para ti si/i)
  assert.match(copySource, /sue[ñn]as con serlo/i)
  assert.match(copySource, /Oz Creativo ayuda a emprendedores/i)
  assert.match(copySource, /Durante m[aá]s de 12 a[ñn]os/i)
  assert.equal(copySource.includes('heroLines'), true)
  assert.equal((copySource.match(/Hazlo Magnífico/g) ?? []).length >= 4, true)

  for (const question of [
    '¿El libro es físico o digital?',
    '¿Cuánto cuesta?',
    '¿Hay descuentos por volumen?',
    '¿Puedo usar cupón?',
    '¿El libro puede ir firmado o dedicado?',
    '¿Puedo pedir factura?',
    '¿Cómo recibo mi guía?',
    '¿Qué pasa si pongo mal mi dirección?',
  ]) {
    assert.equal(copySource.includes(question), true)
  }

  for (const country of [
    'Estados Unidos',
    'Colombia',
    'Argentina',
    'Guatemala',
    'Perú',
    'Ecuador',
    'Honduras',
    'El Salvador',
    'Venezuela',
  ]) {
    assert.equal(copySource.includes(country), true)
  }

  for (const asset of [
    'public/assets/book/hazlo-magnifico-lectura-oz.jpg',
    'public/assets/book/hazlo-magnifico-portada-manos.jpg',
    'public/assets/book/hazlo-magnifico-abierto.jpg',
    'public/assets/book/hazlo-magnifico-detalle-portada.jpg',
    'public/assets/book/hazlo-magnifico-portada-completa.jpg',
  ]) {
    assert.equal(existsSync(asset), true)
    assert.equal(copySource.includes(asset.replace('public', '')), true)
  }
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

test('book public API endpoints exist and use safe repository helpers', () => {
  const orderStatusSource = readFileSync('netlify/functions/book-order-status.mts', 'utf8')
  const internationalSource = readFileSync('netlify/functions/book-international-quotes.mts', 'utf8')

  assert.equal(existsSync('netlify/functions/book-order-status.mts'), true)
  assert.equal(existsSync('netlify/functions/book-international-quotes.mts'), true)
  assert.equal(orderStatusSource.includes("path: '/api/book/orders/:orderNumber'"), true)
  assert.equal(orderStatusSource.includes('findPublicOrderStatus'), true)
  assert.equal(internationalSource.includes("path: '/api/book/international-quotes'"), true)
  assert.equal(internationalSource.includes('internationalQuoteSchema'), true)
  assert.equal(internationalSource.includes('createInternationalQuoteLead'), true)
  assert.equal(repositoriesSource.includes('findPublicOrderStatus'), true)
  assert.equal(repositoriesSource.includes('createInternationalQuoteLead'), true)
})

test('public book flow sanitizes redirect and tracking URLs', () => {
  const checkoutSource = readFileSync('src/book/BookCheckoutForm.tsx', 'utf8')
  const statusSource = readFileSync('src/book/OrderStatusPage.tsx', 'utf8')
  const apiSource = readFileSync('src/book/api.ts', 'utf8')

  assert.equal(checkoutSource.includes('safeCheckoutUrl'), true)
  assert.equal(checkoutSource.includes('javascript:'), true)
  assert.equal(statusSource.includes('safeTrackingUrl'), true)
  assert.equal(statusSource.includes('http:'), true)
  assert.equal(statusSource.includes('https:'), true)
  assert.equal(apiSource.includes('signal?: AbortSignal'), true)
  assert.equal(statusSource.includes('signal: controller.signal'), true)
})
