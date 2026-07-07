import { type FormEvent, useEffect, useState } from 'react'

import { AdminPanelMessage, AdminSection, formatDate, readAdminResponse } from './AdminApp'

type InventoryItem = {
  id: number
  productId: number
  sku: string | null
  title: string | null
  stockInitial: number
  stockAvailable: number
  stockSold: number
  stockReserved: number
  updatedAt: string
}

type InventoryResponse = {
  ok?: boolean
  message?: string
  inventory?: InventoryItem[] | InventoryItem
}

export function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryId, setInventoryId] = useState('')
  const [deltaAvailable, setDeltaAvailable] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadInventory = async (active = true) => {
    try {
      const response = await fetch('/api/book/admin/inventory', {
        credentials: 'include',
      })
      const payload = await readAdminResponse<InventoryResponse>(response)
      if (!active) return

      if (!response.ok || !Array.isArray(payload.inventory)) {
        setError(payload.message || 'No se pudo cargar inventario.')
        return
      }

      setInventory(payload.inventory)
      setInventoryId(String(payload.inventory[0]?.id || ''))
    } catch {
      if (active) setError('No se pudo cargar inventario.')
    } finally {
      if (active) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    void loadInventory(active)
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/book/admin/inventory', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventoryId: Number(inventoryId),
          deltaAvailable: Number(deltaAvailable),
          reason,
        }),
      })
      const payload = await readAdminResponse<InventoryResponse>(response)

      if (!response.ok || !payload.inventory || Array.isArray(payload.inventory)) {
        setError(payload.message || 'No se pudo ajustar inventario.')
        return
      }

      const updatedInventory = payload.inventory
      setInventory((items) =>
        items.map((item) => (item.id === updatedInventory.id ? updatedInventory : item)),
      )
      setDeltaAvailable('')
      setReason('')
      setMessage('Inventario ajustado.')
    } catch {
      setError('No se pudo ajustar inventario.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminPanelMessage title="Cargando inventario..." />
  if (error && inventory.length === 0) return <AdminPanelMessage title={error} tone="error" />
  if (inventory.length === 0) return <AdminPanelMessage title="Sin inventario registrado." />

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <AdminSection title="Inventario">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-muted [letter-spacing:0]">
              <tr className="border-b border-paper/10">
                <th className="px-3 py-2">Libro</th>
                <th className="px-3 py-2">Inicial</th>
                <th className="px-3 py-2">Disponible</th>
                <th className="px-3 py-2">Vendido</th>
                <th className="px-3 py-2">Reservado</th>
                <th className="px-3 py-2">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-paper/5">
                  <td className="px-3 py-3">
                    <p className="font-semibold">{item.title || 'Hazlo Magnífico'}</p>
                    <p className="text-xs text-muted">{item.sku || `Producto ${item.productId}`}</p>
                  </td>
                  <td className="px-3 py-3">{item.stockInitial}</td>
                  <td className="px-3 py-3 font-semibold text-yellow">{item.stockAvailable}</td>
                  <td className="px-3 py-3">{item.stockSold}</td>
                  <td className="px-3 py-3">{item.stockReserved}</td>
                  <td className="px-3 py-3 text-muted">{formatDate(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      <AdminSection title="Ajuste">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="text-sm text-muted">
            Libro
            <select
              className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
              value={inventoryId}
              onChange={(event) => setInventoryId(event.target.value)}
              required
            >
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title || item.sku || item.id}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-muted">
            Ajuste disponible
            <input
              className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
              type="number"
              step="1"
              value={deltaAvailable}
              onChange={(event) => setDeltaAvailable(event.target.value)}
              required
            />
          </label>

          <label className="text-sm text-muted">
            Razón
            <textarea
              className="mt-2 min-h-24 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </label>

          {error ? <AdminPanelMessage title={error} tone="error" /> : null}
          {message ? <AdminPanelMessage title={message} /> : null}

          <button
            className="rounded bg-yellow px-4 py-3 text-sm font-bold uppercase text-ink transition hover:bg-yellow-warm disabled:cursor-wait disabled:opacity-70"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar ajuste'}
          </button>
        </form>
      </AdminSection>
    </div>
  )
}
