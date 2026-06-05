import type { Config } from '@netlify/functions'

declare const Netlify: {
  env: {
    get: (key: string) => string | undefined
  }
}

type LeadPayload = {
  nombre?: unknown
  apellido?: unknown
  telefono?: unknown
  email?: unknown
  tipoOrganizacion?: unknown
  institucion?: unknown
  serviciosInteres?: unknown
  lugarFecha?: unknown
  comoTeEnteraste?: unknown
  presupuesto?: unknown
  objetivo?: unknown
  website?: unknown
}

type NormalizedLead = {
  nombre: string
  apellido: string
  telefono: string
  email: string
  tipoOrganizacion: string
  institucion: string
  serviciosInteres: string[]
  lugarFecha: string
  comoTeEnteraste: string
  presupuesto: string
  objetivo: string
  submittedAt: string
  sourceUrl: string
  userAgent: string
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ message: 'Metodo no permitido.' }, 405)
  }

  const webhookUrl = Netlify.env.get('GOOGLE_SCRIPT_WEBHOOK_URL')
  if (!webhookUrl) {
    return json(
      {
        message:
          'El formulario ya esta montado, pero falta activar la conexion con Google Sheets.',
      },
      503,
    )
  }

  let payload: LeadPayload
  try {
    payload = await req.json()
  } catch {
    return json({ message: 'Formato invalido.' }, 400)
  }

  const normalized = normalizeLead(payload, req)
  if ('message' in normalized) {
    return json({ message: normalized.message }, normalized.status)
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
    })
    const text = await response.text()
    const result = parseJson(text)

    if (!response.ok || result?.ok === false) {
      return json(
        { message: result?.message || 'No se pudo registrar la solicitud.' },
        502,
      )
    }

    return json({ ok: true, message: 'Solicitud recibida.' })
  } catch {
    return json({ message: 'No se pudo conectar con Google Sheets.' }, 502)
  }
}

export const config: Config = {
  path: '/api/contact',
}

function normalizeLead(payload: LeadPayload, req: Request): NormalizedLead | { message: string; status: number } {
  if (text(payload.website)) {
    return { message: 'Solicitud recibida.', status: 200 }
  }

  const lead = {
    nombre: text(payload.nombre),
    apellido: text(payload.apellido),
    telefono: text(payload.telefono),
    email: text(payload.email).toLowerCase(),
    tipoOrganizacion: text(payload.tipoOrganizacion),
    institucion: text(payload.institucion),
    serviciosInteres: Array.isArray(payload.serviciosInteres)
      ? payload.serviciosInteres.map(text).filter(Boolean)
      : [],
    lugarFecha: text(payload.lugarFecha),
    comoTeEnteraste: text(payload.comoTeEnteraste),
    presupuesto: text(payload.presupuesto),
    objetivo: text(payload.objetivo),
    submittedAt: new Date().toISOString(),
    sourceUrl: req.headers.get('referer') || 'ozcreativo.com',
    userAgent: req.headers.get('user-agent') || '',
  }

  const required = [
    lead.nombre,
    lead.apellido,
    lead.telefono,
    lead.email,
    lead.tipoOrganizacion,
    lead.institucion,
    lead.comoTeEnteraste,
    lead.presupuesto,
    lead.objetivo,
  ]

  if (required.some((value) => value.length === 0) || lead.serviciosInteres.length === 0) {
    return { message: 'Completa los campos obligatorios.', status: 400 }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return { message: 'Escribe un email valido.', status: 400 }
  }

  return lead
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 2500) : ''
}

function parseJson(textValue: string): { ok?: boolean; message?: string } | null {
  try {
    return JSON.parse(textValue)
  } catch {
    return null
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
