import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

import { COPY } from '../src/config/copy.ts'

test('brand uses the Oz logo asset instead of the star glyph', () => {
  const brand = COPY.brand as unknown as { logo?: string; star?: string }

  assert.equal(brand.logo, '/assets/brand/oz-logo.png')
  assert.equal('star' in brand, false)
  assert.ok(statSync(resolve('public', brand.logo.replace(/^\//, ''))).size > 10_000)
})

test('about section includes four company logo cards with short descriptions', () => {
  const companies = (COPY.about as unknown as {
    companies?: Array<{
      name: string
      description: string
      href: string
      src: string
      alt: string
    }>
  }).companies

  assert.ok(Array.isArray(companies))
  assert.deepEqual(
    companies.map((company) => company.name),
    ['316Studio', 'Cúspide Mx', 'Plexx', 'Propulsor'],
  )

  for (const company of companies) {
    assert.match(company.href, /^(https?:\/\/|#)/)
    assert.match(company.src, /^\/assets\/(companies|track)\//)
    assert.ok(statSync(resolve('public', company.src.replace(/^\//, ''))).size > 50_000)
    assert.ok(company.alt.length > 20)
    assert.ok(company.description.length > 0)
    assert.ok(company.description.split(/\s+/).length <= 20)
  }
})

test('track section uses the requested scenario proof items', () => {
  const proofItems = (COPY.track as unknown as { proofItems?: Array<Record<string, string>> }).proofItems

  assert.ok(Array.isArray(proofItems))
  assert.deepEqual(
    proofItems.map((item) => item.label),
    [
      'Entrepreneur México',
      'Lead Summit (Maxwell Leadership)',
      'Gigantes del futuro',
      'Escenario compartido',
      '+150 Conferencias',
      '+50 Workshops corporativos',
      '+40 ciudades en 6 países',
      '+80,000 personas',
    ],
  )

  const serializedProofItems = JSON.stringify(proofItems)
  assert.equal(serializedProofItems.includes('316 Studio'), false)
  assert.equal(serializedProofItems.includes('Hazlo Magnífico'), false)

  const expectedScenarioImages = new Map([
    ['Entrepreneur México', '/assets/scenarios/entrepreneur-mexico.jpg'],
    ['Lead Summit (Maxwell Leadership)', '/assets/scenarios/lead-summit-stage.jpg'],
    ['Gigantes del futuro', '/assets/scenarios/gigantes-del-futuro.jpg'],
    ['Escenario compartido', '/assets/scenarios/escenario-compartido-selfie.jpg'],
    ['+150 Conferencias', '/assets/scenarios/150-conferencias.jpg'],
    ['+50 Workshops corporativos', '/assets/scenarios/50-workshops-corporativos.jpg'],
    ['+40 ciudades en 6 países', '/assets/scenarios/40-ciudades-6-paises.jpg'],
    ['+80,000 personas', '/assets/scenarios/80000-personas.jpg'],
  ])

  for (const item of proofItems) {
    assert.equal(item.src, expectedScenarioImages.get(item.label))
    assert.ok(statSync(resolve('public', item.src.replace(/^\//, ''))).size > 20_000)
    assert.ok(item.alt.length > 20)
    assert.ok(item.label.length > 0)
    assert.ok(item.caption.length > 0)
    assert.match(item.href, /^(https?:\/\/|#)/)
  }
})

test('track section is renamed to escenarios and does not publish keyword capsules', () => {
  const serializedTrack = JSON.stringify(COPY.track)

  assert.equal(COPY.track.title, 'Escenarios')
  assert.equal('badges' in COPY.track, false)
  assert.equal(serializedTrack.includes('Logo 03'), false)
  assert.equal(serializedTrack.includes('placeholder editable'), false)
  assert.equal(serializedTrack.includes('Escenarios, marcas y reconocimientos'), false)
})

test('book section presents Hazlo Magnifico with a pending Amazon link', () => {
  const book = COPY.book as unknown as {
    title?: string
    eyebrow?: string
    subtitle?: string
    body?: string
    src?: string
    alt?: string
    amazonHref?: string
    cta?: string
    ctaPending?: string
  }

  assert.equal(book.title, 'Hazlo Magnífico')
  assert.equal(book.eyebrow, 'Autor')
  assert.match(book.subtitle || '', /emprender tus sueños/i)
  assert.match(book.body || '', /sin perder el alma/i)
  assert.equal(book.src, '/assets/track/hazlo-magnifico-libro.jpg')
  assert.ok(statSync(resolve('public', book.src.replace(/^\//, ''))).size > 20_000)
  assert.ok((book.alt || '').length > 20)
  assert.equal(book.amazonHref, '')
  assert.equal(book.cta, 'Comprar en Amazon')
  assert.equal(book.ctaPending, 'Link de Amazon pendiente')
})

test('accreditations section lists clickable visual credentials', () => {
  const accreditations = (COPY.track as unknown as {
    accreditations?: Array<{ label: string; caption: string; src: string; alt: string; href: string }>
  }).accreditations

  assert.ok(Array.isArray(accreditations))
  assert.equal(accreditations.length, 8)
  assert.ok(accreditations.some((item) => item.label.includes('Harvard Business School')))
  assert.ok(accreditations.some((item) => item.label.includes('StartUp México')))
  assert.ok(accreditations.some((item) => item.label.includes('Meta')))
  assert.ok(accreditations.some((item) => item.label.includes('Forbes')))

  const srcByLabel = new Map(accreditations.map((item) => [item.label, item.src]))
  assert.equal(srcByLabel.get('StartUp México'), '/assets/accreditations/startup-mexico.jpg')
  assert.equal(srcByLabel.get('Meta Marketing Digital'), '/assets/accreditations/meta-marketing-digital.jpg')
  assert.equal(srcByLabel.get('Hora Cero'), '/assets/accreditations/hora-cero.jpg')
  assert.equal(srcByLabel.get('Forbes 2026'), '/assets/accreditations/forbes-2026.jpg')
  assert.equal(srcByLabel.get('Lead Summit'), '/assets/accreditations/lead-summit.jpg')
  assert.equal(srcByLabel.get('Mejor Q’ Ayer'), '/assets/accreditations/mejor-que-ayer.jpg')
  assert.equal(srcByLabel.get('+$1M USD en anuncios'), '/assets/accreditations/inversion-anuncios.jpg')

  for (const item of accreditations) {
    assert.match(item.src, /^\/assets\/(accreditations|track)\//)
    assert.ok(statSync(resolve('public', item.src.replace(/^\//, ''))).size > 20_000)
    assert.ok(item.alt.length > 20)
    assert.ok(item.caption.length > 0)
    assert.match(item.href, /^(https?:\/\/|#)/)
  }
})
