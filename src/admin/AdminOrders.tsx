import { useEffect, useState } from 'react'

import {
  AdminPanelMessage,
  AdminSection,
  StatusPill,
  formatDate,
  formatMoney,
  readAdminResponse,
} from './AdminApp'

type AdminOrder = {
  id: number
  orderNumber: string
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  quantity: number | null
  totalCents: number
  currency: string
  paymentStatus: string
  shippingStatus: string
  couponCode: string | null
}

type OrderDetail = {
  order: AdminOrder & {
    status: string
    notes: string | null
  }
  address: {
    street: string
    exteriorNumber: string
    interiorNumber: string | null
    neighborhood: string
    city: string
    state: string
    postalCode: string
    references: string | null
  } | null
  shipment: {
    carrier: string | null
    service: string | null
    trackingNumber: string | null
    trackingUrl: string | null
    labelUrl: string | null
    status: string
    error: string | null
  } | null
}

type OrdersResponse = {
  ok?: boolean
  message?: string
  orders?: AdminOrder[]
  order?: OrderDetail
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetch('/api/book/admin/orders', {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await readAdminResponse<OrdersResponse>(response)
        if (!active) return

        if (!response.ok || !payload.orders) {
          setError(payload.message || 'No se pudo cargar pedidos.')
          return
        }

        setOrders(payload.orders)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar pedidos.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const loadDetail = async (orderId: number) => {
    setDetailLoading(true)
    setSelectedOrder(null)
    setError('')

    try {
      const response = await fetch(`/api/book/admin/orders/${orderId}`, {
        credentials: 'include',
      })
      const payload = await readAdminResponse<OrdersResponse>(response)

      if (!response.ok || !payload.order) {
        setError(payload.message || 'No se pudo cargar detalle.')
        return
      }

      setSelectedOrder(payload.order)
    } catch {
      setError('No se pudo cargar detalle.')
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) return <AdminPanelMessage title="Cargando pedidos..." />
  if (error && orders.length === 0) return <AdminPanelMessage title={error} tone="error" />
  if (orders.length === 0) return <AdminPanelMessage title="Aun no hay pedidos." />

  return (
    <div className="grid gap-4">
      {error ? <AdminPanelMessage title={error} tone="error" /> : null}
      <AdminSection title="Pedidos">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase text-muted [letter-spacing:0]">
              <tr className="border-b border-paper/10">
                <th className="px-3 py-2">Pedido</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Pago</th>
                <th className="px-3 py-2">Envío</th>
                <th className="px-3 py-2">Cupón</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-paper/5 align-top">
                  <td className="px-3 py-3 font-semibold text-paper">{order.orderNumber}</td>
                  <td className="px-3 py-3 text-muted">{formatDate(order.createdAt)}</td>
                  <td className="px-3 py-3">{order.customerName}</td>
                  <td className="px-3 py-3 text-muted">{order.customerEmail}</td>
                  <td className="px-3 py-3 text-muted">{order.customerPhone}</td>
                  <td className="px-3 py-3">{order.quantity ?? 0}</td>
                  <td className="px-3 py-3">{formatMoney(order.totalCents, order.currency)}</td>
                  <td className="px-3 py-3">
                    <StatusPill label={order.paymentStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill label={order.shippingStatus} />
                    {order.shippingStatus === 'label_pending' ? (
                      <p className="mt-2 text-xs text-yellow">label_pending: guía pendiente para Task 11.</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">{order.couponCode || 'Sin cupón'}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded border border-paper/15 px-3 py-2 text-xs font-semibold text-paper hover:border-yellow hover:text-yellow"
                        type="button"
                        onClick={() => loadDetail(order.id)}
                      >
                        Detalle
                      </button>
                      <button
                        className="rounded border border-paper/10 px-3 py-2 text-xs font-semibold text-muted"
                        type="button"
                        disabled
                      >
                        Envío futuro
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      {detailLoading ? <AdminPanelMessage title="Cargando detalle..." /> : null}
      {selectedOrder ? <OrderDetailPanel detail={selectedOrder} /> : null}
    </div>
  )
}

function OrderDetailPanel({ detail }: { detail: OrderDetail }) {
  const address = detail.address
  const shipment = detail.shipment

  return (
    <AdminSection title={`Detalle ${detail.order.orderNumber}`}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-muted [letter-spacing:0]">Cliente</p>
          <p className="mt-1 font-semibold">{detail.order.customerName}</p>
          <p className="text-sm text-muted">{detail.order.customerEmail}</p>
          <p className="text-sm text-muted">{detail.order.customerPhone}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted [letter-spacing:0]">Dirección</p>
          <p className="mt-1 text-sm">
            {address
              ? `${address.street} #${address.exteriorNumber}${address.interiorNumber ? ` Int. ${address.interiorNumber}` : ''}, ${address.neighborhood}, ${address.city}, ${address.state}, CP ${address.postalCode}`
              : 'Sin dirección'}
          </p>
          {address?.references ? <p className="mt-1 text-sm text-muted">{address.references}</p> : null}
        </div>
        <div>
          <p className="text-xs uppercase text-muted [letter-spacing:0]">Envío</p>
          <p className="mt-1 text-sm">{shipment?.status || detail.order.shippingStatus}</p>
          <p className="text-sm text-muted">{shipment?.carrier || 'Sin paquetería asignada'}</p>
          {shipment?.error ? <p className="mt-1 text-sm text-red-100">{shipment.error}</p> : null}
        </div>
      </div>
    </AdminSection>
  )
}
