import assert from 'node:assert/strict'
import test from 'node:test'

import {
  sendPaidOrderEmailsAfterStripeMark,
  shouldSendPaidOrderEmailsForStripeMark,
} from '../netlify/functions/book-stripe-webhook.mts'
import {
  applyEmailTemplate,
  renderInternalPaidOrderEmail,
  renderPurchaseConfirmationEmail,
  renderShipmentEmail,
} from '../netlify/functions/_shared/book/email-templates.mts'
import { sendPaidOrderEmails, sendTransactionalEmail } from '../netlify/functions/_shared/book/email-service.mts'

const paidOrder = {
  orderId: 42,
  orderNumber: 'HM-20260706-ABC123',
  customerName: 'Oz <script>alert(1)</script>',
  customerEmail: 'lector@example.com',
  customerPhone: '8999110922',
  quantity: 2,
  totalCents: 99800,
  address: 'Calle 1 #2, Colonia, Monterrey, Nuevo Leon, 64000',
}

test('purchase confirmation includes order details, free shipping, support, and invoicing', () => {
  const email = renderPurchaseConfirmationEmail(paidOrder)

  assert.equal(email.subject, 'Confirmamos tu pedido de Hazlo Magnífico - HM-20260706-ABC123')
  assert.match(email.html, /envío gratis dentro de México/i)
  assert.match(email.html, /HM-20260706-ABC123/)
  assert.match(email.html, /2 libros/)
  assert.match(email.html, /\$998\.00/)
  assert.match(email.html, /Calle 1 #2/)
  assert.match(email.text, /oz@expocuspide.com/)
  assert.match(email.text, /factura/i)
})

test('email shell stays readable in dark-mode email clients', () => {
  const purchaseEmail = renderPurchaseConfirmationEmail(paidOrder)
  const shipmentEmail = renderShipmentEmail({
    ...paidOrder,
    carrier: 'DHL',
    service: 'Express',
    trackingNumber: 'TRACK123',
    trackingUrl: 'https://tracking.example/TRACK123',
  })

  for (const html of [purchaseEmail.html, shipmentEmail.html]) {
    assert.match(html, /color-scheme:\s*light only/i)
    assert.match(html, /background:\s*#ffffff/i)
    assert.match(html, /color:\s*#141414/i)
    assert.match(html, /data-ogsc/i)
    assert.doesNotMatch(html, /background:#111111;color:#242424/i)
  }
})

test('editable customer email templates interpolate allowed variables safely', () => {
  const custom = applyEmailTemplate(
    {
      key: 'purchase-confirmation',
      subjectTemplate: 'Pedido {{orderNumber}} listo para {{customerName}}',
      headline: 'Hola {{customerName}}',
      bodyTemplate:
        'Tu pedido {{orderNumber}} por {{total}} ya está confirmado.\nCantidad: {{quantityLabel}}.',
      buttonLabel: 'Ver mi pedido',
      footerNote: 'Gracias por comprar {{bookTitle}}.',
    },
    paidOrder,
  )

  assert.equal(custom.subject, 'Pedido HM-20260706-ABC123 listo para Oz <script>alert(1)</script>')
  assert.match(custom.html, /Hola Oz &lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.match(custom.html, /Tu pedido HM-20260706-ABC123 por \$998\.00 MXN/)
  assert.match(custom.html, /Ver mi pedido/)
  assert.match(custom.text, /Gracias por comprar Hazlo Magnífico/)
  assert.doesNotMatch(custom.html, /<script>/)
})

test('email templates escape customer-controlled HTML', () => {
  const email = renderPurchaseConfirmationEmail(paidOrder)

  assert.doesNotMatch(email.html, /<script>/)
  assert.match(email.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
})

test('internal paid order email includes buyer, order, address, phone, and email', () => {
  const email = renderInternalPaidOrderEmail(paidOrder)

  assert.equal(email.subject, 'Pedido pagado Hazlo Magnífico - HM-20260706-ABC123')
  assert.match(email.html, /lector@example.com/)
  assert.match(email.html, /8999110922/)
  assert.match(email.html, /Calle 1 #2/)
  assert.match(email.text, /HM-20260706-ABC123/)
  assert.match(email.text, /2 libros/)
})

test('shipment email includes tracking button, carrier, service, address, and courier reminder', () => {
  const email = renderShipmentEmail({
    ...paidOrder,
    carrier: 'DHL',
    service: 'Express',
    trackingNumber: 'TRACK123',
    trackingUrl: 'https://tracking.example/TRACK123',
  })

  assert.equal(email.subject, 'Tu pedido de Hazlo Magnífico ya va en camino - HM-20260706-ABC123')
  assert.match(email.html, /Rastrear mi pedido/)
  assert.match(email.html, /https:\/\/tracking\.example\/TRACK123/)
  assert.match(email.html, /DHL/)
  assert.match(email.text, /Express/)
  assert.match(email.text, /TRACK123/)
  assert.match(email.text, /pendiente de llamadas o mensajes de paquetería/i)
  assert.match(email.text, /Calle 1 #2/)
})

test('shipment email does not render an unsafe tracking URL as a link', () => {
  const email = renderShipmentEmail({
    ...paidOrder,
    carrier: 'DHL',
    service: 'Express',
    trackingNumber: 'TRACK123',
    trackingUrl: 'javascript:alert(1)',
  })

  assert.doesNotMatch(email.html, /href="javascript:alert\(1\)"/i)
  assert.doesNotMatch(email.html, /Rastrear mi pedido/)
  assert.match(email.html, /TRACK123/)
  assert.match(email.text, /rastreo manual/i)
  assert.match(email.text, /oz@expocuspide.com/)
})

test('sendTransactionalEmail returns the provider id without real credentials when injected', async () => {
  const providerId = await sendTransactionalEmail(
    {
      to: 'lector@example.com',
      subject: 'Subject',
      html: '<p>Hola</p>',
      text: 'Hola',
    },
    {
      env: {
        RESEND_API_KEY: 're_test',
        ORDER_FROM_EMAIL: 'Oz Creativo <pedidos@example.com>',
      },
      send: async (payload) => {
        assert.equal(payload.from, 'Oz Creativo <pedidos@example.com>')
        assert.equal(payload.to, 'lector@example.com')
        return { id: 'email_123' }
      },
    },
  )

  assert.equal(providerId, 'email_123')
})

test('sendTransactionalEmail throws a clear configuration error when Resend config is missing', async () => {
  await assert.rejects(
    () =>
      sendTransactionalEmail(
        {
          to: 'lector@example.com',
          subject: 'Subject',
          html: '<p>Hola</p>',
          text: 'Hola',
        },
        { env: {}, send: async () => ({ id: 'unused' }) },
      ),
    /Falta configurar RESEND_API_KEY y ORDER_FROM_EMAIL/,
  )
})

test('sendPaidOrderEmails sends customer and internal messages idempotently', async () => {
  const events: Array<{ id: number; key: string; to: string }> = []
  const sent: Array<{ to: string; subject: string }> = []
  const markedSent: Array<{ id: number; providerId: string }> = []

  await sendPaidOrderEmails(42, {
    loadPaidOrderEmailSummary: async (orderId) => ({ ...paidOrder, orderId }),
    createQueuedEmailEvent: async (input) => {
      const event = { id: events.length + 1, key: input.idempotencyKey, to: input.to }
      events.push(event)
      return event
    },
    markEmailEventSent: async (id, providerId) => {
      markedSent.push({ id, providerId })
    },
    markEmailEventFailed: async () => {
      throw new Error('No debio fallar')
    },
    sendTransactionalEmail: async (input) => {
      sent.push({ to: input.to, subject: input.subject })
      return `provider_${sent.length}`
    },
  })

  assert.deepEqual(
    events.map((event) => event.key),
    ['purchase-confirmation:42', 'internal-paid-order:42'],
  )
  assert.deepEqual(
    sent.map((email) => email.to),
    ['lector@example.com', 'oz@expocuspide.com'],
  )
  assert.deepEqual(markedSent, [
    { id: 1, providerId: 'provider_1' },
    { id: 2, providerId: 'provider_2' },
  ])
})

test('sendPaidOrderEmails skips email events that already exist as sent', async () => {
  const sent: string[] = []

  await sendPaidOrderEmails(42, {
    loadPaidOrderEmailSummary: async (orderId) => ({ ...paidOrder, orderId }),
    createQueuedEmailEvent: async () => null,
    markEmailEventSent: async () => {
      throw new Error('No debio marcar enviado')
    },
    markEmailEventFailed: async () => {
      throw new Error('No debio marcar fallido')
    },
    sendTransactionalEmail: async (input) => {
      sent.push(input.to)
      return 'provider_unused'
    },
  })

  assert.deepEqual(sent, [])
})

test('sendPaidOrderEmails retries claimed failed email events', async () => {
  const sent: string[] = []
  const markedSent: Array<{ id: number; providerId: string }> = []

  await sendPaidOrderEmails(42, {
    loadPaidOrderEmailSummary: async (orderId) => ({ ...paidOrder, orderId }),
    createQueuedEmailEvent: async (input) => ({
      id: input.idempotencyKey.startsWith('purchase-confirmation') ? 77 : 78,
    }),
    markEmailEventSent: async (id, providerId) => {
      markedSent.push({ id, providerId })
    },
    markEmailEventFailed: async () => {
      throw new Error('No debio fallar')
    },
    sendTransactionalEmail: async (input) => {
      sent.push(input.to)
      return `retry_${sent.length}`
    },
  })

  assert.deepEqual(sent, ['lector@example.com', 'oz@expocuspide.com'])
  assert.deepEqual(markedSent, [
    { id: 77, providerId: 'retry_1' },
    { id: 78, providerId: 'retry_2' },
  ])
})

test('sendPaidOrderEmails records failed email events and continues other sends', async () => {
  const failed: Array<{ id: number; message: string }> = []
  const sent: string[] = []

  await assert.rejects(
    () =>
      sendPaidOrderEmails(42, {
        loadPaidOrderEmailSummary: async (orderId) => ({ ...paidOrder, orderId }),
        createQueuedEmailEvent: async (input) => ({
          id: input.idempotencyKey.startsWith('purchase-confirmation') ? 1 : 2,
        }),
        markEmailEventSent: async () => undefined,
        markEmailEventFailed: async (id, message) => {
          failed.push({ id, message })
        },
        sendTransactionalEmail: async (input) => {
          sent.push(input.to)
          if (sent.length === 1) {
            throw new Error('Resend rechazo el correo')
          }
          return 'provider_internal'
        },
      }),
    /Resend rechazo el correo/,
  )

  assert.deepEqual(sent, ['lector@example.com', 'oz@expocuspide.com'])
  assert.deepEqual(failed, [{ id: 1, message: 'Resend rechazo el correo' }])
})

test('Stripe webhook email helper only sends for newly marked paid orders', async () => {
  const nonEmailResult = {
    order: { id: 42 },
    shouldSendPaidEmails: false,
  }
  const emailResult = {
    order: { id: 43 },
    shouldSendPaidEmails: true,
  }
  const sent: number[] = []

  assert.equal(shouldSendPaidOrderEmailsForStripeMark(null), false)
  assert.equal(shouldSendPaidOrderEmailsForStripeMark(nonEmailResult), false)
  assert.equal(shouldSendPaidOrderEmailsForStripeMark(emailResult), true)

  await sendPaidOrderEmailsAfterStripeMark(nonEmailResult, async (orderId) => {
    sent.push(orderId)
  })
  await sendPaidOrderEmailsAfterStripeMark(emailResult, async (orderId) => {
    sent.push(orderId)
  })

  assert.deepEqual(sent, [43])
})

test('Stripe webhook email helper catches delivery failures', async () => {
  const logged: unknown[] = []

  await sendPaidOrderEmailsAfterStripeMark(
    { order: { id: 42 }, shouldSendPaidEmails: true },
    async () => {
      throw new Error('Resend rechazo el correo')
    },
    (...args) => {
      logged.push(args)
    },
  )

  assert.equal(logged.length, 1)
})

test('Stripe webhook shipment helper only runs for newly marked paid orders', async () => {
  const webhook = await import('../netlify/functions/book-stripe-webhook.mts')
  assert.equal(typeof webhook.createShipmentAfterStripeMark, 'function')

  const calls: number[] = []

  await webhook.createShipmentAfterStripeMark(null, async (orderId: number) => {
    calls.push(orderId)
  })
  await webhook.createShipmentAfterStripeMark(
    { order: { id: 42 }, shouldSendPaidEmails: false },
    async (orderId: number) => {
      calls.push(orderId)
    },
  )
  await webhook.createShipmentAfterStripeMark(
    { order: { id: 43 }, shouldSendPaidEmails: true },
    async (orderId: number) => {
      calls.push(orderId)
    },
  )

  assert.deepEqual(calls, [43])
})

test('Stripe webhook shipment helper logs failures without throwing', async () => {
  const webhook = await import('../netlify/functions/book-stripe-webhook.mts')
  const logged: unknown[] = []

  await webhook.createShipmentAfterStripeMark(
    { order: { id: 42 }, shouldSendPaidEmails: true },
    async () => {
      throw new Error('Skydrop rechazo la guia')
    },
    (...args: unknown[]) => {
      logged.push(args)
    },
  )

  assert.equal(logged.length, 1)
})
