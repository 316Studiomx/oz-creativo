import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { jsonResponse, methodNotAllowed } from './_shared/book/http.mts'
import { listEmailEvents, retryEmailEvent } from './_shared/book/repositories.mts'

export default async (req: Request) => {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  if (req.method === 'GET') {
    try {
      const emails = await listEmailEvents()
      return jsonResponse({ ok: true, emails })
    } catch {
      return jsonResponse({ ok: false, message: 'No se pudieron consultar emails.' }, 500)
    }
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(['GET', 'POST'])
  }

  const route = readEmailRetryRoute(new URL(req.url).pathname)
  if (!route) {
    return jsonResponse({ ok: false, message: 'Ruta no encontrada.' }, 404)
  }

  try {
    const email = await retryEmailEvent(route.id)
    if (!email) {
      return jsonResponse({ ok: false, message: 'Solo puedes reintentar emails fallidos.' }, 400)
    }

    return jsonResponse({ ok: true, email })
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo reintentar el email.' }, 500)
  }
}

export const config: Config = {
  path: ['/api/book/admin/emails', '/api/book/admin/emails/:id/retry'],
}

function readEmailRetryRoute(pathname: string): { id: number } | null {
  const parts = pathname.split('/').filter(Boolean)
  const retry = parts[parts.length - 1]
  const rawId = parts[parts.length - 2] || ''
  const id = Number(decodeURIComponent(rawId))

  if (retry !== 'retry' || !Number.isInteger(id) || id <= 0) {
    return null
  }

  return { id }
}
