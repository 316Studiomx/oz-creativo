import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { jsonResponse, methodNotAllowed } from './_shared/book/http.mts'
import {
  getAdminDashboardMetrics,
  getAdminOrderDetail,
  listAdminOrders,
} from './_shared/book/repositories.mts'

export default async (req: Request) => {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  if (req.method !== 'GET') {
    return methodNotAllowed('GET')
  }

  const route = readAdminOrderRoute(new URL(req.url).pathname)

  try {
    if (route.kind === 'dashboard') {
      const metrics = await getAdminDashboardMetrics()
      return jsonResponse({ ok: true, metrics })
    }

    if (route.kind === 'detail') {
      const order = await getAdminOrderDetail(route.id)
      if (!order) {
        return jsonResponse({ ok: false, message: 'Pedido no encontrado.' }, 404)
      }

      return jsonResponse({ ok: true, order })
    }

    const orders = await listAdminOrders()
    return jsonResponse({ ok: true, orders })
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo consultar pedidos.' }, 500)
  }
}

export const config: Config = {
  path: ['/api/book/admin/dashboard', '/api/book/admin/orders', '/api/book/admin/orders/:id'],
}

function readAdminOrderRoute(pathname: string):
  | { kind: 'dashboard' }
  | { kind: 'list' }
  | { kind: 'detail'; id: number } {
  const parts = pathname.split('/').filter(Boolean)
  const last = parts[parts.length - 1] || ''

  if (last === 'dashboard') {
    return { kind: 'dashboard' }
  }

  if (last === 'orders') {
    return { kind: 'list' }
  }

  const id = Number(decodeURIComponent(last))
  if (Number.isInteger(id) && id > 0) {
    return { kind: 'detail', id }
  }

  return { kind: 'list' }
}
