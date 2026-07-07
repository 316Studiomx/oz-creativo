import type { Config } from '@netlify/functions'

import { jsonResponse, methodNotAllowed } from './_shared/book/http.mts'
import { findPublicOrderStatus } from './_shared/book/repositories.mts'

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return methodNotAllowed('GET')
  }

  const url = new URL(req.url)
  const orderNumber = readOrderNumber(url.pathname)
  const token = url.searchParams.get('token') || ''

  if (!orderNumber || !token.trim()) {
    return jsonResponse({ ok: false, message: 'Falta el token del pedido.' }, 400)
  }

  try {
    const order = await findPublicOrderStatus(orderNumber, token)
    if (!order) {
      return jsonResponse({ ok: false, message: 'Pedido no encontrado o token invalido.' }, 404)
    }

    return jsonResponse({ ok: true, order })
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo consultar el pedido.' }, 500)
  }
}

export const config: Config = {
  path: '/api/book/orders/:orderNumber',
}

function readOrderNumber(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  const orderNumber = parts[parts.length - 1] || ''
  return decodeURIComponent(orderNumber).trim()
}
