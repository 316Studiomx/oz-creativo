import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const adminApiFiles = [
  {
    path: 'netlify/functions/book-admin-orders.mts',
    routes: ['/api/book/admin/dashboard', '/api/book/admin/orders', '/api/book/admin/orders/:id'],
  },
  {
    path: 'netlify/functions/book-admin-inventory.mts',
    routes: ['/api/book/admin/inventory'],
  },
  {
    path: 'netlify/functions/book-admin-coupons.mts',
    routes: ['/api/book/admin/coupons'],
  },
  {
    path: 'netlify/functions/book-admin-international-quotes.mts',
    routes: ['/api/book/admin/international-quotes'],
  },
  {
    path: 'netlify/functions/book-admin-emails.mts',
    routes: ['/api/book/admin/emails', '/api/book/admin/emails/:id/retry'],
  },
  {
    path: 'netlify/functions/book-admin-email-templates.mts',
    routes: ['/api/book/admin/email-templates', '/api/book/admin/email-templates/:key'],
  },
  {
    path: 'netlify/functions/book-admin-reviews.mts',
    routes: ['/api/book/admin/reviews'],
  },
  {
    path: 'netlify/functions/book-admin-shipping.mts',
    routes: [
      '/api/book/admin/orders/:id/quote-shipping',
      '/api/book/admin/orders/:id/create-shipment',
      '/api/book/admin/orders/:id/auto-shipment',
    ],
  },
]

const adminUiFiles = [
  'src/admin/AdminDashboard.tsx',
  'src/admin/AdminOrders.tsx',
  'src/admin/AdminInventory.tsx',
  'src/admin/AdminCoupons.tsx',
  'src/admin/AdminInternationalQuotes.tsx',
  'src/admin/AdminEmails.tsx',
  'src/admin/AdminEmailTemplates.tsx',
  'src/admin/AdminReviews.tsx',
]

test('admin management API files declare protected endpoint paths', () => {
  for (const file of adminApiFiles) {
    assert.equal(existsSync(file.path), true, `${file.path} should exist`)
    const source = readFileSync(file.path, 'utf8')

    for (const route of file.routes) {
      assert.equal(source.includes(route), true, `${file.path} should declare ${route}`)
    }

    assert.equal(source.includes('requireAdminSession'), true, `${file.path} should require admin session`)
  }
})

test('admin session helper validates cookie token hashes against stored sessions', () => {
  const helperPath = 'netlify/functions/_shared/book/admin-session.mts'
  assert.equal(existsSync(helperPath), true)
  const source = readFileSync(helperPath, 'utf8')

  assert.equal(source.includes('readSessionToken'), true)
  assert.equal(source.includes('hashSessionToken'), true)
  assert.equal(source.includes('findValidAdminSession'), true)
  assert.equal(source.includes('401'), true)
  assert.equal(source.includes('tokenHash'), false, 'helper should not expose tokenHash in responses')
})

test('admin repository helpers list only safe management data', () => {
  const source = readFileSync('netlify/functions/_shared/book/repositories.mts', 'utf8')

  for (const exportName of [
    'getAdminDashboardMetrics',
    'listAdminOrders',
    'getAdminOrderDetail',
    'getInventorySummary',
    'adjustInventory',
    'listCoupons',
    'createCoupon',
    'updateCoupon',
    'listInternationalQuoteLeads',
    'updateInternationalQuoteLead',
    'listEmailEvents',
    'retryEmailEvent',
    'listEditableEmailTemplates',
    'findEditableEmailTemplate',
    'updateEditableEmailTemplate',
    'listBookReviews',
    'listPublicBookReviews',
    'createBookReview',
  ]) {
    assert.equal(source.includes(`export async function ${exportName}`), true, `${exportName} missing`)
  }

  assert.equal(source.includes('publicToken: schema.orders.publicToken'), false)
  assert.equal(source.includes('tokenHash: schema.adminSessions.tokenHash'), false)
  assert.equal(source.includes('rawResponseJson: schema.shipments.rawResponseJson'), false)
})

test('admin app exposes all management tabs and components', () => {
  const appSource = readFileSync('src/admin/AdminApp.tsx', 'utf8')

  for (const tab of [
    'dashboard',
    'orders',
    'inventory',
    'coupons',
    'international',
    'emails',
    'emailTemplates',
    'reviews',
  ]) {
    assert.equal(appSource.includes(`'${tab}'`), true, `missing ${tab} tab`)
  }

  for (const component of [
    'AdminDashboard',
    'AdminOrders',
    'AdminInventory',
    'AdminCoupons',
    'AdminInternationalQuotes',
    'AdminEmails',
    'AdminEmailTemplates',
    'AdminReviews',
  ]) {
    assert.equal(appSource.includes(component), true, `missing ${component}`)
  }
})

test('admin management screens fetch with credentials include and expected endpoints', () => {
  for (const file of adminUiFiles) {
    assert.equal(existsSync(file), true, `${file} should exist`)
    const source = readFileSync(file, 'utf8')
    assert.equal(source.includes("credentials: 'include'"), true, `${file} must send admin cookie`)
    assert.match(source, /loading|Cargando/i, `${file} should render loading state`)
    assert.match(source, /error|Error|No se pudo/i, `${file} should render error state`)
    assert.match(source, /empty|Aun no|Sin|No hay/i, `${file} should render empty state`)
  }

  assert.equal(readFileSync('src/admin/AdminDashboard.tsx', 'utf8').includes('/api/book/admin/dashboard'), true)
  assert.equal(readFileSync('src/admin/AdminOrders.tsx', 'utf8').includes('/api/book/admin/orders'), true)
  assert.equal(readFileSync('src/admin/AdminInventory.tsx', 'utf8').includes('/api/book/admin/inventory'), true)
  assert.equal(readFileSync('src/admin/AdminCoupons.tsx', 'utf8').includes('/api/book/admin/coupons'), true)
  assert.equal(
    readFileSync('src/admin/AdminInternationalQuotes.tsx', 'utf8').includes(
      '/api/book/admin/international-quotes',
    ),
    true,
  )
  assert.equal(readFileSync('src/admin/AdminEmails.tsx', 'utf8').includes('/api/book/admin/emails'), true)
  assert.equal(
    readFileSync('src/admin/AdminEmailTemplates.tsx', 'utf8').includes('/api/book/admin/email-templates'),
    true,
  )
  assert.equal(readFileSync('src/admin/AdminReviews.tsx', 'utf8').includes('/api/book/admin/reviews'), true)
})

test('admin screens expose operational management fields', () => {
  const ordersSource = readFileSync('src/admin/AdminOrders.tsx', 'utf8')
  for (const label of [
    'Pedido',
    'Fecha',
    'Cliente',
    'Email',
    'Teléfono',
    'Cantidad',
    'Total',
    'Pago',
    'Envío',
    'Cupón',
    'label_pending',
  ]) {
    assert.equal(ordersSource.includes(label), true, `orders missing ${label}`)
  }

  const inventorySource = readFileSync('src/admin/AdminInventory.tsx', 'utf8')
  for (const label of ['Inicial', 'Disponible', 'Vendido', 'Reservado', 'Razón']) {
    assert.equal(inventorySource.includes(label), true, `inventory missing ${label}`)
  }

  const couponsSource = readFileSync('src/admin/AdminCoupons.tsx', 'utf8')
  for (const label of [
    'Código',
    'Tipo',
    'Valor',
    'Activo',
    'Cantidad mínima',
    'Subtotal mínimo',
    'Máximo por email',
    'Límite de usos',
    'Acumulable',
  ]) {
    assert.equal(couponsSource.includes(label), true, `coupons missing ${label}`)
  }

  const quotesSource = readFileSync('src/admin/AdminInternationalQuotes.tsx', 'utf8')
  for (const status of ['nuevo', 'cotizado', 'esperando_respuesta', 'convertido', 'cerrado']) {
    assert.equal(quotesSource.includes(status), true, `quotes missing ${status}`)
  }

  const emailsSource = readFileSync('src/admin/AdminEmails.tsx', 'utf8')
  assert.equal(emailsSource.includes('failed'), true)
  assert.equal(emailsSource.includes('retry'), true)

  const templatesSource = readFileSync('src/admin/AdminEmailTemplates.tsx', 'utf8')
  for (const label of [
    'Confirmación de compra',
    'Seguimiento al paquete',
    'Asunto',
    'Título',
    'Cuerpo',
    'Texto del botón',
    'Guardar template',
    '{{orderNumber}}',
  ]) {
    assert.equal(templatesSource.includes(label), true, `email templates missing ${label}`)
  }

  const reviewsSource = readFileSync('src/admin/AdminReviews.tsx', 'utf8')
  for (const label of ['Autor', 'Cargo / rol', 'Reseña', 'Visible', 'Agregar reseña']) {
    assert.equal(reviewsSource.includes(label), true, `reviews missing ${label}`)
  }
})

test('email template persistence has database schema and default customer templates', () => {
  const schemaSource = readFileSync('db/schema.ts', 'utf8')
  const migrationSource = readFileSync(
    'netlify/database/migrations/20260708182000_create-email-templates/migration.sql',
    'utf8',
  )

  assert.equal(schemaSource.includes('emailTemplates'), true)
  assert.equal(migrationSource.includes('CREATE TABLE IF NOT EXISTS email_templates'), true)
  assert.equal(migrationSource.includes('purchase-confirmation'), true)
  assert.equal(migrationSource.includes('shipment-tracking'), true)
  assert.equal(migrationSource.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON email_templates'), true)
})

test('admin orders renders shipment URLs only after safe http validation', () => {
  const ordersSource = readFileSync('src/admin/AdminOrders.tsx', 'utf8')

  assert.equal(ordersSource.includes('safeHttpUrl'), true)
  assert.equal(ordersSource.includes('href={shipment.trackingUrl}'), false)
  assert.equal(ordersSource.includes('href={shipment.labelUrl}'), false)
  assert.match(ordersSource, /URL\(value\)/)
  assert.match(ordersSource, /url\.protocol === 'http:' \|\| url\.protocol === 'https:'/)
})

test('admin orders shipping action scrolls into the selected order detail', () => {
  const ordersSource = readFileSync('src/admin/AdminOrders.tsx', 'utf8')

  assert.equal(ordersSource.includes('detailRef'), true)
  assert.equal(ordersSource.includes('scrollIntoView'), true)
  assert.equal(ordersSource.includes('Task 11'), false)
})

test('admin orders exposes automatic shipment retry for paid pending orders', () => {
  const ordersSource = readFileSync('src/admin/AdminOrders.tsx', 'utf8')

  assert.equal(ordersSource.includes('/auto-shipment'), true)
  assert.equal(ordersSource.includes('Crear guía automática'), true)
})

test('admin shipping path supplies complete Skydropx address fields from real order data', () => {
  const shippingSource = [
    readFileSync('netlify/functions/book-admin-shipping.mts', 'utf8'),
    readFileSync('netlify/functions/_shared/book/shipping-fulfillment.mts', 'utf8'),
  ].join('\n')
  const envExample = readFileSync('.env.example', 'utf8')

  assert.equal(shippingSource.includes('company: detail.order.customerName'), true)
  assert.equal(shippingSource.includes('email: detail.order.customerEmail'), true)
  assert.equal(shippingSource.includes('reference: detail.address.references'), true)
  assert.equal(shippingSource.includes("reference: readOptionalEnv('SKYDROPX_ORIGIN_REFERENCE')"), true)
  assert.match(envExample, /^SKYDROPX_ORIGIN_REFERENCE=$/m)
})
