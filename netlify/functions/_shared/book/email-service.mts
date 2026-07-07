import { Resend } from 'resend'

import {
  renderInternalPaidOrderEmail,
  renderPurchaseConfirmationEmail,
} from './email-templates.mts'
import {
  createQueuedEmailEvent,
  loadPaidOrderEmailSummary,
  markEmailEventFailed,
  markEmailEventSent,
  type PaidOrderEmailSummary,
} from './repositories.mts'

const INTERNAL_ORDER_EMAIL = 'oz@expocuspide.com'

type EnvMap = Record<string, string | undefined>

type NetlifyRuntime = {
  env?: {
    get?: (key: string) => string | undefined
  }
}

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
}

type ProviderSendPayload = SendEmailInput & {
  from: string
}

type ProviderSendResult = {
  id?: string | null
}

type SendTransactionalEmailOptions = {
  env?: EnvMap
  send?: (payload: ProviderSendPayload) => Promise<ProviderSendResult>
}

type EmailEventRecord = {
  id: number
}

type QueuedEmailEventInput = {
  to: string
  subject: string
  template: string
  relatedOrderId?: number
  relatedLeadId?: number
  idempotencyKey: string
}

export type SendPaidOrderEmailsDeps = {
  loadPaidOrderEmailSummary: (orderId: number) => Promise<PaidOrderEmailSummary | null>
  createQueuedEmailEvent: (input: QueuedEmailEventInput) => Promise<EmailEventRecord | null>
  markEmailEventSent: (id: number, providerMessageId: string) => Promise<void>
  markEmailEventFailed: (id: number, error: string) => Promise<void>
  sendTransactionalEmail: (input: SendEmailInput) => Promise<string>
}

export async function sendTransactionalEmail(
  input: SendEmailInput,
  options: SendTransactionalEmailOptions = {},
): Promise<string> {
  const configuredApiKey = readEnvValue('RESEND_API_KEY', options.env)?.trim() || ''
  const configuredFrom = readEnvValue('ORDER_FROM_EMAIL', options.env)?.trim() || ''
  const missing = [
    !configuredApiKey ? 'RESEND_API_KEY' : '',
    !configuredFrom ? 'ORDER_FROM_EMAIL' : '',
  ].filter(Boolean)

  if (missing.length > 0) {
    throw new Error(`Falta configurar ${missing.join(' y ')} para enviar correos transaccionales.`)
  }

  const payload = {
    from: configuredFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  }
  const result = options.send
    ? await options.send(payload)
    : await sendWithResend(configuredApiKey, payload)

  if (!result.id) {
    throw new Error('Resend no devolvio identificador del correo transaccional.')
  }

  return result.id
}

export async function sendPaidOrderEmails(
  orderId: number,
  deps: SendPaidOrderEmailsDeps = defaultPaidOrderEmailDeps,
): Promise<void> {
  const summary = await deps.loadPaidOrderEmailSummary(orderId)
  if (!summary) {
    throw new Error(`No se pudo cargar el resumen del pedido pagado ${orderId}.`)
  }

  const purchaseEmail = renderPurchaseConfirmationEmail(summary)
  const internalEmail = renderInternalPaidOrderEmail(summary)
  const jobs = [
    {
      to: summary.customerEmail,
      email: purchaseEmail,
      template: 'purchase-confirmation',
      idempotencyKey: `purchase-confirmation:${summary.orderId}`,
    },
    {
      to: INTERNAL_ORDER_EMAIL,
      email: internalEmail,
      template: 'internal-paid-order',
      idempotencyKey: `internal-paid-order:${summary.orderId}`,
    },
  ]

  const failures: Error[] = []

  for (const job of jobs) {
    const event = await deps.createQueuedEmailEvent({
      to: job.to,
      subject: job.email.subject,
      template: job.template,
      relatedOrderId: summary.orderId,
      idempotencyKey: job.idempotencyKey,
    })

    if (!event) {
      continue
    }

    try {
      const providerMessageId = await deps.sendTransactionalEmail({
        to: job.to,
        subject: job.email.subject,
        html: job.email.html,
        text: job.email.text,
      })
      await deps.markEmailEventSent(event.id, providerMessageId)
    } catch (error) {
      const failure = normalizeError(error, 'No se pudo enviar el correo transaccional.')
      await deps.markEmailEventFailed(event.id, failure.message)
      failures.push(failure)
    }
  }

  if (failures.length > 0) {
    throw failures[0]
  }
}

const defaultPaidOrderEmailDeps: SendPaidOrderEmailsDeps = {
  loadPaidOrderEmailSummary,
  createQueuedEmailEvent,
  markEmailEventSent,
  markEmailEventFailed,
  sendTransactionalEmail,
}

async function sendWithResend(
  apiKey: string,
  payload: ProviderSendPayload,
): Promise<ProviderSendResult> {
  const resend = new Resend(apiKey)
  const result = await resend.emails.send(payload)
  const errorMessage = readProviderError(result)

  if (errorMessage) {
    throw new Error(errorMessage)
  }

  return {
    id: readProviderId(result),
  }
}

function readEnvValue(key: string, env?: EnvMap): string | undefined {
  if (env && Object.prototype.hasOwnProperty.call(env, key)) {
    return env[key]
  }

  const netlify = (globalThis as typeof globalThis & { Netlify?: NetlifyRuntime }).Netlify
  return netlify?.env?.get?.(key) || process.env[key]
}

function readProviderId(result: unknown): string | undefined {
  if (!isRecord(result)) {
    return undefined
  }

  if (typeof result.id === 'string') {
    return result.id
  }

  if (isRecord(result.data) && typeof result.data.id === 'string') {
    return result.data.id
  }

  return undefined
}

function readProviderError(result: unknown): string | undefined {
  if (!isRecord(result) || !isRecord(result.error)) {
    return undefined
  }

  return typeof result.error.message === 'string'
    ? result.error.message
    : 'Resend rechazo el correo transaccional.'
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    return error
  }

  return new Error(typeof error === 'string' && error.trim() ? error : fallback)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
