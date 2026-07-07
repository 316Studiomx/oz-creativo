import type { Config } from '@netlify/functions'

import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import { createInternationalQuoteLead } from './_shared/book/repositories.mts'
import { internationalQuoteSchema } from './_shared/book/validation.mts'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return methodNotAllowed('POST')
  }

  let payload: unknown
  try {
    payload = await readJson<unknown>(req)
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const parsed = internationalQuoteSchema.safeParse(payload)
  if (!parsed.success) {
    return jsonResponse({ ok: false, message: 'Datos de cotizacion invalidos.' }, 400)
  }

  try {
    const lead = await createInternationalQuoteLead(parsed.data)
    return jsonResponse({
      ok: true,
      message: 'Solicitud recibida.',
      leadId: lead?.id,
    })
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo guardar la solicitud.' }, 500)
  }
}

export const config: Config = {
  path: '/api/book/international-quotes',
}
