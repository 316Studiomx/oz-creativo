import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import {
  listInternationalQuoteLeads,
  updateInternationalQuoteLead,
  type InternationalLeadStatus,
} from './_shared/book/repositories.mts'

const leadStatuses = new Set<InternationalLeadStatus>([
  'nuevo',
  'cotizado',
  'esperando_respuesta',
  'convertido',
  'cerrado',
])

type LeadUpdatePayload = {
  id?: unknown
  status?: unknown
  notes?: unknown
}

export default async (req: Request) => {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  if (req.method === 'GET') {
    try {
      const leads = await listInternationalQuoteLeads()
      return jsonResponse({ ok: true, leads })
    } catch {
      return jsonResponse({ ok: false, message: 'No se pudieron consultar cotizaciones.' }, 500)
    }
  }

  if (req.method !== 'PATCH') {
    return methodNotAllowed(['GET', 'PATCH'])
  }

  let payload: LeadUpdatePayload
  try {
    payload = await readJson<LeadUpdatePayload>(req)
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const parsed = parseLeadUpdate(payload)
  if (!parsed.ok) {
    return jsonResponse({ ok: false, message: parsed.message }, 400)
  }

  try {
    const lead = await updateInternationalQuoteLead(parsed.value)
    if (!lead) {
      return jsonResponse({ ok: false, message: 'Lead no encontrado.' }, 404)
    }

    return jsonResponse({ ok: true, lead })
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo actualizar la cotizacion.' }, 500)
  }
}

export const config: Config = {
  path: '/api/book/admin/international-quotes',
}

function parseLeadUpdate(payload: LeadUpdatePayload):
  | {
      ok: true
      value: {
        id: number
        status: InternationalLeadStatus
        notes: string | null
      }
    }
  | { ok: false; message: string } {
  const id = Number(payload.id)
  const status = typeof payload.status === 'string' ? payload.status : ''
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : ''

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: 'Selecciona un lead valido.' }
  }

  if (!leadStatuses.has(status as InternationalLeadStatus)) {
    return { ok: false, message: 'El status de cotizacion no es valido.' }
  }

  return {
    ok: true,
    value: {
      id,
      status: status as InternationalLeadStatus,
      notes: notes || null,
    },
  }
}
