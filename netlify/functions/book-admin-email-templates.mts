import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import {
  listEditableEmailTemplates,
  updateEditableEmailTemplate,
} from './_shared/book/repositories.mts'

type EmailTemplateBody = {
  subjectTemplate?: string
  headline?: string
  bodyTemplate?: string
  buttonLabel?: string
  footerNote?: string
}

export default async (req: Request) => {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  if (req.method === 'GET') {
    try {
      const templates = await listEditableEmailTemplates()
      return jsonResponse({ ok: true, templates })
    } catch {
      return jsonResponse({ ok: false, message: 'No se pudieron consultar templates.' }, 500)
    }
  }

  if (req.method !== 'PATCH') {
    return methodNotAllowed(['GET', 'PATCH'])
  }

  const key = readEmailTemplateKey(new URL(req.url).pathname)
  if (!key) {
    return jsonResponse({ ok: false, message: 'Template no encontrado.' }, 404)
  }

  let body: EmailTemplateBody
  try {
    body = await readJson<EmailTemplateBody>(req)
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const validation = validateEmailTemplateBody(body)
  if (validation) {
    return jsonResponse({ ok: false, message: validation }, 400)
  }

  try {
    const template = await updateEditableEmailTemplate({
      key,
      subjectTemplate: body.subjectTemplate!.trim(),
      headline: body.headline!.trim(),
      bodyTemplate: body.bodyTemplate!.trim(),
      buttonLabel: body.buttonLabel?.trim() ?? '',
      footerNote: body.footerNote?.trim() ?? '',
    })

    if (!template) {
      return jsonResponse({ ok: false, message: 'Template no encontrado.' }, 404)
    }

    return jsonResponse({ ok: true, template })
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo guardar el template.' }, 500)
  }
}

export const config: Config = {
  path: ['/api/book/admin/email-templates', '/api/book/admin/email-templates/:key'],
}

function readEmailTemplateKey(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)
  const key = decodeURIComponent(parts[parts.length - 1] || '')

  if (key !== 'purchase-confirmation' && key !== 'shipment-tracking') {
    return null
  }

  return key
}

function validateEmailTemplateBody(body: EmailTemplateBody): string {
  if (!body.subjectTemplate?.trim()) return 'El asunto es obligatorio.'
  if (!body.headline?.trim()) return 'El titulo es obligatorio.'
  if (!body.bodyTemplate?.trim()) return 'El cuerpo es obligatorio.'
  if (body.subjectTemplate.length > 180) return 'El asunto es demasiado largo.'
  if (body.headline.length > 160) return 'El titulo es demasiado largo.'
  if (body.bodyTemplate.length > 1800) return 'El cuerpo es demasiado largo.'
  if ((body.buttonLabel ?? '').length > 80) return 'El texto del boton es demasiado largo.'
  if ((body.footerNote ?? '').length > 220) return 'La nota final es demasiado larga.'
  return ''
}
