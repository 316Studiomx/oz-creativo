import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

import { proposalStorageKey } from './_shared/proposals.mts'

type ProposalResponse = {
  ok: boolean
  proposal?: unknown
  message?: string
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return json({ ok: false, message: 'Metodo no permitido.' }, 405, {
      Allow: 'GET',
    })
  }

  const folio = context.params.folio || ''
  const token = context.params.token || ''
  if (!folio || !token) {
    return json({ ok: false, message: 'Falta folio o token.' }, 400)
  }

  const proposal = await getStore({ name: 'oz-proposals', consistency: 'strong' }).get(
    proposalStorageKey(folio, token),
    { type: 'json' },
  )

  if (!proposal) {
    return json({ ok: false, message: 'Propuesta no encontrada.' }, 404)
  }

  return json({ ok: true, proposal })
}

export const config: Config = {
  path: '/api/proposals/:folio/:token',
}

function json(
  body: ProposalResponse,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      ...headers,
    },
  })
}
