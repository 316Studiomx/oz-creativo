import { BOOK_AUTHOR, BOOK_TITLE } from './constants.mts'

export type PaidOrderEmailTemplateInput = {
  orderId?: number
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  quantity: number
  totalCents: number
  address: string
}

export type ShipmentEmailTemplateInput = PaidOrderEmailTemplateInput & {
  carrier: string
  service: string
  trackingNumber: string
  trackingUrl: string
}

export type RenderedTransactionalEmail = {
  subject: string
  html: string
  text: string
}

const SUPPORT_EMAIL = 'oz@expocuspide.com'

export function renderPurchaseConfirmationEmail(
  input: PaidOrderEmailTemplateInput,
): RenderedTransactionalEmail {
  const total = formatMxn(input.totalCents)
  const subject = `Confirmamos tu pedido de ${BOOK_TITLE} - ${input.orderNumber}`
  const quantityLabel = formatBookQuantity(input.quantity)
  const text = [
    subject,
    '',
    `Hola ${input.customerName}, recibimos tu compra de ${BOOK_TITLE}.`,
    `Pedido: ${input.orderNumber}`,
    `Cantidad: ${quantityLabel}`,
    `Total pagado: ${total} MXN`,
    'Tu compra incluye envío gratis dentro de México.',
    `Dirección de envío: ${input.address}`,
    'Estamos preparando tu pedido. Recibirás otro correo con tu número de guía cuando sea entregado a paquetería.',
    `Si requieres factura, escríbenos a ${SUPPORT_EMAIL} con tu número de pedido y tus datos fiscales.`,
    '',
    `${BOOK_AUTHOR} / ${BOOK_TITLE}`,
    `Soporte: ${SUPPORT_EMAIL}`,
  ].join('\n')

  const html = emailShell(`
    <h1>Gracias por comprar ${escapeHtml(BOOK_TITLE)}.</h1>
    <p>Hola ${escapeHtml(input.customerName)}, recibimos tu compra.</p>
    ${detailsList([
      ['Pedido', input.orderNumber],
      ['Cantidad', quantityLabel],
      ['Total pagado', `${total} MXN`],
      ['Dirección de envío', input.address],
    ])}
    <p>Tu compra incluye <strong>envío gratis dentro de México</strong>.</p>
    <p>Estamos preparando tu pedido. Recibirás otro correo con tu número de guía cuando sea entregado a paquetería.</p>
    <p>Si requieres factura, escríbenos a <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> con tu número de pedido y tus datos fiscales.</p>
  `)

  return { subject, html, text }
}

export function renderInternalPaidOrderEmail(
  input: PaidOrderEmailTemplateInput,
): RenderedTransactionalEmail {
  const total = formatMxn(input.totalCents)
  const subject = `Pedido pagado ${BOOK_TITLE} - ${input.orderNumber}`
  const quantityLabel = formatBookQuantity(input.quantity)
  const text = [
    subject,
    '',
    'Pedido pagado listo para preparación.',
    `Pedido: ${input.orderNumber}`,
    `Cantidad: ${quantityLabel}`,
    `Total pagado: ${total} MXN`,
    `Comprador: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    `Teléfono: ${input.customerPhone}`,
    `Dirección: ${input.address}`,
  ].join('\n')

  const html = emailShell(`
    <h1>Pedido pagado listo para preparar.</h1>
    ${detailsList([
      ['Pedido', input.orderNumber],
      ['Cantidad', quantityLabel],
      ['Total pagado', `${total} MXN`],
      ['Comprador', input.customerName],
      ['Email', input.customerEmail],
      ['Teléfono', input.customerPhone],
      ['Dirección', input.address],
    ])}
    <p>Crear guía Skydropx y preparar envío del libro.</p>
  `)

  return { subject, html, text }
}

export function renderShipmentEmail(input: ShipmentEmailTemplateInput): RenderedTransactionalEmail {
  const subject = `Tu pedido de ${BOOK_TITLE} ya va en camino - ${input.orderNumber}`
  const text = [
    subject,
    '',
    `Hola ${input.customerName}, tu pedido ya fue entregado a paquetería.`,
    `Pedido: ${input.orderNumber}`,
    `Paquetería: ${input.carrier}`,
    `Servicio: ${input.service}`,
    `Guía: ${input.trackingNumber}`,
    `Rastreo: ${input.trackingUrl}`,
    `Dirección de envío: ${input.address}`,
    'Te recomendamos estar pendiente de llamadas o mensajes de paquetería para facilitar la entrega.',
    '',
    `${BOOK_AUTHOR} / ${BOOK_TITLE}`,
    `Soporte: ${SUPPORT_EMAIL}`,
  ].join('\n')

  const html = emailShell(`
    <h1>Tu pedido ya va en camino.</h1>
    <p>Hola ${escapeHtml(input.customerName)}, tu libro fue entregado a paquetería.</p>
    ${detailsList([
      ['Pedido', input.orderNumber],
      ['Paquetería', input.carrier],
      ['Servicio', input.service],
      ['Guía', input.trackingNumber],
      ['Dirección de envío', input.address],
    ])}
    <p><a href="${escapeHtml(input.trackingUrl)}" style="display:inline-block;background:#ffd400;color:#111111;text-decoration:none;font-weight:700;padding:12px 16px;border-radius:6px">Rastrear mi pedido</a></p>
    <p>Te recomendamos estar pendiente de llamadas o mensajes de paquetería para facilitar la entrega.</p>
  `)

  return { subject, html, text }
}

export function formatMxn(cents: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatBookQuantity(quantity: number): string {
  return `${quantity} ${quantity === 1 ? 'libro' : 'libros'}`
}

function emailShell(body: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#111111;color:#242424;font-family:Arial,sans-serif">
    <main style="max-width:640px;margin:0 auto;background:#ffffff;padding:28px">
      <p style="margin:0 0 20px;color:#806800;font-weight:700;letter-spacing:0">${BOOK_AUTHOR} / ${BOOK_TITLE}</p>
      ${body}
      <p style="margin-top:28px;color:#666666;font-size:14px">Soporte: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
    </main>
  </body>
</html>`
}

function detailsList(rows: Array<[label: string, value: string]>): string {
  const items = rows
    .map(
      ([label, value]) =>
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`,
    )
    .join('')
  return `<ul style="padding-left:20px;line-height:1.6">${items}</ul>`
}
