import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import { adjustInventory, getInventorySummary } from './_shared/book/repositories.mts'

type InventoryAdjustmentPayload = {
  inventoryId?: unknown
  deltaAvailable?: unknown
  reason?: unknown
}

export default async (req: Request) => {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  if (req.method === 'GET') {
    try {
      const inventory = await getInventorySummary()
      return jsonResponse({ ok: true, inventory })
    } catch {
      return jsonResponse({ ok: false, message: 'No se pudo consultar inventario.' }, 500)
    }
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return methodNotAllowed(['GET', 'POST', 'PATCH'])
  }

  let payload: InventoryAdjustmentPayload
  try {
    payload = await readJson<InventoryAdjustmentPayload>(req)
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const parsed = parseInventoryAdjustment(payload)
  if (!parsed.ok) {
    return jsonResponse({ ok: false, message: parsed.message }, 400)
  }

  try {
    const inventory = await adjustInventory({
      ...parsed.value,
      createdBy: session.session.email,
    })

    if (!inventory) {
      return jsonResponse({ ok: false, message: 'Inventario no encontrado.' }, 404)
    }

    return jsonResponse({ ok: true, inventory })
  } catch (error) {
    return jsonResponse(
      { ok: false, message: error instanceof Error ? error.message : 'No se pudo ajustar inventario.' },
      400,
    )
  }
}

export const config: Config = {
  path: '/api/book/admin/inventory',
}

function parseInventoryAdjustment(payload: InventoryAdjustmentPayload):
  | {
      ok: true
      value: {
        inventoryId: number
        deltaAvailable: number
        reason: string
      }
    }
  | { ok: false; message: string } {
  const inventoryId = Number(payload.inventoryId)
  const deltaAvailable = Number(payload.deltaAvailable)
  const reason = typeof payload.reason === 'string' ? payload.reason.trim() : ''

  if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
    return { ok: false, message: 'Selecciona un inventario valido.' }
  }

  if (!Number.isInteger(deltaAvailable) || deltaAvailable === 0) {
    return { ok: false, message: 'Indica un ajuste entero distinto de cero.' }
  }

  if (reason.length < 4) {
    return { ok: false, message: 'La razon del ajuste es obligatoria.' }
  }

  return {
    ok: true,
    value: {
      inventoryId,
      deltaAvailable,
      reason,
    },
  }
}
