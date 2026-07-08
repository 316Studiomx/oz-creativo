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

export type EditableEmailTemplateKey = 'purchase-confirmation' | 'shipment-tracking'

export type EditableEmailTemplate = {
  key: EditableEmailTemplateKey
  subjectTemplate: string
  headline: string
  bodyTemplate: string
  buttonLabel: string
  footerNote: string
}

const SUPPORT_EMAIL = 'oz@expocuspide.com'
const TEXT_COLOR = '#141414'
const MUTED_COLOR = '#555555'
const YELLOW = '#ffd400'

export const DEFAULT_EDITABLE_EMAIL_TEMPLATES: Record<EditableEmailTemplateKey, EditableEmailTemplate> = {
  'purchase-confirmation': {
    key: 'purchase-confirmation',
    subjectTemplate: `Confirmamos tu pedido de {{bookTitle}} - {{orderNumber}}`,
    headline: `Gracias por comprar {{bookTitle}}.`,
    bodyTemplate: [
      'Hola {{customerName}}, recibimos tu compra.',
      '',
      'Tu compra incluye envío gratis dentro de México.',
      '',
      'Estamos preparando tu pedido. Recibirás otro correo con tu número de guía cuando sea entregado a paquetería.',
      '',
      'Si requieres factura, escríbenos a {{supportEmail}} con tu número de pedido y tus datos fiscales.',
    ].join('\n'),
    buttonLabel: '',
    footerNote: `{{bookAuthor}} / {{bookTitle}}`,
  },
  'shipment-tracking': {
    key: 'shipment-tracking',
    subjectTemplate: `Tu pedido de {{bookTitle}} ya va en camino - {{orderNumber}}`,
    headline: 'Tu pedido ya va en camino.',
    bodyTemplate: [
      'Hola {{customerName}}, tu libro fue entregado a paquetería.',
      '',
      'Te recomendamos estar pendiente de llamadas o mensajes de paquetería para facilitar la entrega.',
    ].join('\n'),
    buttonLabel: 'Rastrear mi pedido',
    footerNote: `{{bookAuthor}} / {{bookTitle}}`,
  },
}

type ApplyEmailTemplateOptions = {
  details?: Array<[label: string, value: string]>
  buttonUrl?: string | null
  fallbackTrackingNumber?: string
}

export function renderPurchaseConfirmationEmail(
  input: PaidOrderEmailTemplateInput,
  template: EditableEmailTemplate | null = null,
): RenderedTransactionalEmail {
  const total = formatMxn(input.totalCents)
  const quantityLabel = formatBookQuantity(input.quantity)

  return applyEmailTemplate(template ?? DEFAULT_EDITABLE_EMAIL_TEMPLATES['purchase-confirmation'], input, {
    details: [
      ['Pedido', input.orderNumber],
      ['Cantidad', quantityLabel],
      ['Total pagado', `${total} MXN`],
      ['Dirección de envío', input.address],
    ],
  })
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
    ${headingHtml('Pedido pagado listo para preparar.')}
    ${detailsList([
      ['Pedido', input.orderNumber],
      ['Cantidad', quantityLabel],
      ['Total pagado', `${total} MXN`],
      ['Comprador', input.customerName],
      ['Email', input.customerEmail],
      ['Teléfono', input.customerPhone],
      ['Dirección', input.address],
    ])}
    ${paragraphHtml('Crear guía Skydropx y preparar envío del libro.')}
  `)

  return { subject, html, text }
}

export function renderShipmentEmail(
  input: ShipmentEmailTemplateInput,
  template: EditableEmailTemplate | null = null,
): RenderedTransactionalEmail {
  const trackingUrl = safeTrackingUrl(input.trackingUrl)
  const trackingText = trackingUrl
    ? `Rastreo: ${trackingUrl}`
    : `Rastreo manual: usa tu guía ${input.trackingNumber} con la paquetería o escríbenos a ${SUPPORT_EMAIL}.`
  const email = applyEmailTemplate(template ?? DEFAULT_EDITABLE_EMAIL_TEMPLATES['shipment-tracking'], input, {
    details: [
      ['Pedido', input.orderNumber],
      ['Paquetería', input.carrier],
      ['Servicio', input.service],
      ['Guía', input.trackingNumber],
      ['Dirección de envío', input.address],
    ],
    buttonUrl: trackingUrl,
    fallbackTrackingNumber: input.trackingNumber,
  })

  return {
    ...email,
    text: [email.text, trackingText].filter(Boolean).join('\n'),
  }
}

export function applyEmailTemplate(
  template: EditableEmailTemplate,
  input: PaidOrderEmailTemplateInput | ShipmentEmailTemplateInput,
  options: ApplyEmailTemplateOptions = {},
): RenderedTransactionalEmail {
  const variables = buildEmailVariables(input)
  const subject = interpolateTemplate(template.subjectTemplate, variables)
  const headline = interpolateTemplate(template.headline, variables)
  const body = interpolateTemplate(template.bodyTemplate, variables)
  const buttonLabel = interpolateTemplate(template.buttonLabel, variables).trim()
  const footerNote = interpolateTemplate(template.footerNote, variables).trim()
  const textSections = [
    subject,
    '',
    headline,
    '',
    body,
    '',
    ...(options.details ?? []).map(([label, value]) => `${label}: ${value}`),
    buttonLabel && options.buttonUrl ? `Botón: ${buttonLabel} - ${options.buttonUrl}` : '',
    footerNote,
    `Soporte: ${SUPPORT_EMAIL}`,
  ].filter(Boolean)

  const html = emailShell(`
    ${headingHtml(headline)}
    ${bodyHtml(body)}
    ${options.details?.length ? detailsList(options.details) : ''}
    ${buttonHtml(buttonLabel, options.buttonUrl ?? null, options.fallbackTrackingNumber)}
    ${footerNote ? paragraphHtml(footerNote, { muted: true }) : ''}
  `)

  return {
    subject,
    html,
    text: textSections.join('\n'),
  }
}

export function buildEmailVariables(input: PaidOrderEmailTemplateInput | ShipmentEmailTemplateInput) {
  const total = formatMxn(input.totalCents)
  const shipment = isShipmentInput(input) ? input : null

  return {
    bookTitle: BOOK_TITLE,
    bookAuthor: BOOK_AUTHOR,
    supportEmail: SUPPORT_EMAIL,
    orderNumber: input.orderNumber,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    quantity: String(input.quantity),
    quantityLabel: formatBookQuantity(input.quantity),
    total: `${total} MXN`,
    totalMxn: `${total} MXN`,
    address: input.address,
    carrier: shipment?.carrier ?? '',
    service: shipment?.service ?? '',
    trackingNumber: shipment?.trackingNumber ?? '',
    trackingUrl: safeTrackingUrl(shipment?.trackingUrl ?? '') ?? '',
  }
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

function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => variables[key] ?? '')
}

function formatBookQuantity(quantity: number): string {
  return `${quantity} ${quantity === 1 ? 'libro' : 'libros'}`
}

function safeTrackingUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function headingHtml(value: string): string {
  return `<h1 style="margin:0 0 18px;color:${TEXT_COLOR};font-family:Arial,sans-serif;font-size:28px;line-height:1.18;font-weight:800">${escapeHtml(value)}</h1>`
}

function bodyHtml(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => paragraphHtml(paragraph))
    .join('')
}

function paragraphHtml(value: string, options: { muted?: boolean } = {}): string {
  const color = options.muted ? MUTED_COLOR : TEXT_COLOR
  return `<p style="margin:0 0 16px;color:${color};font-family:Arial,sans-serif;font-size:16px;line-height:1.65">${escapeHtml(value).replace(/\n/g, '<br>')}</p>`
}

function buttonHtml(
  label: string,
  buttonUrl: string | null,
  fallbackTrackingNumber?: string,
): string {
  if (!label) {
    return fallbackTrackingNumber
      ? paragraphHtml(`Rastrea manualmente con la guía ${fallbackTrackingNumber} o escríbenos a ${SUPPORT_EMAIL}.`)
      : ''
  }

  if (!buttonUrl) {
    if (fallbackTrackingNumber) {
      return paragraphHtml(`Rastrea manualmente con la guía ${fallbackTrackingNumber} o escríbenos a ${SUPPORT_EMAIL}.`)
    }

    return `<p style="margin:24px 0 18px"><span style="display:inline-block;background:${YELLOW};color:#111111;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:800;padding:13px 18px;border-radius:6px">${escapeHtml(label)}</span></p>`
  }

  return `<p style="margin:24px 0 18px"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:${YELLOW};color:#111111;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:800;padding:13px 18px;border-radius:6px">${escapeHtml(label)}</a></p>`
}

function emailShell(body: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light">
    <style>
      :root { color-scheme: light only; supported-color-schemes: light; }
      body, table, td, p, li, h1, strong, a { color: ${TEXT_COLOR} !important; }
      [data-ogsc] body, [data-ogsc] table, [data-ogsc] td, [data-ogsc] p, [data-ogsc] li, [data-ogsc] h1 { color: ${TEXT_COLOR} !important; }
    </style>
  </head>
  <body data-ogsc style="margin:0;background:#f5f1df;color:${TEXT_COLOR};font-family:Arial,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1df;margin:0;padding:24px 12px;color:${TEXT_COLOR}">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;color:${TEXT_COLOR};border:1px solid #e7dfbd;border-radius:8px;overflow:hidden">
            <tr>
              <td style="padding:28px;color:${TEXT_COLOR};font-family:Arial,sans-serif">
                <p style="margin:0 0 20px;color:#806800;font-family:Arial,sans-serif;font-size:14px;font-weight:800;letter-spacing:0">${BOOK_AUTHOR} / ${BOOK_TITLE}</p>
                ${body}
                <p style="margin:28px 0 0;color:${MUTED_COLOR};font-family:Arial,sans-serif;font-size:14px;line-height:1.5">Soporte: <a href="mailto:${SUPPORT_EMAIL}" style="color:#0645d8;text-decoration:underline">${SUPPORT_EMAIL}</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function detailsList(rows: Array<[label: string, value: string]>): string {
  const items = rows
    .map(
      ([label, value]) =>
        `<li style="margin:0 0 7px;color:${TEXT_COLOR};font-family:Arial,sans-serif;font-size:15px;line-height:1.55"><strong style="color:${TEXT_COLOR};font-weight:800">${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`,
    )
    .join('')
  return `<ul style="margin:0 0 18px;padding-left:20px;color:${TEXT_COLOR};font-family:Arial,sans-serif">${items}</ul>`
}

function isShipmentInput(
  input: PaidOrderEmailTemplateInput | ShipmentEmailTemplateInput,
): input is ShipmentEmailTemplateInput {
  return 'trackingNumber' in input
}
