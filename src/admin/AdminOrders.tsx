import { useEffect, useRef, useState } from 'react'

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
    quotationId: string | null
    rateId: string | null
    shipmentId: string | null
    carrier: string | null
    service: string | null
    trackingNumber: string | null
    trackingUrl: string | null
    labelUrl: string | null
    realShippingCostCents: number | null
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

type ShippingRate = {
  rateId: string
  carrier: string
  service: string
  totalCents: number
  currency: string
  estimatedDays: number | null
}

type ShippingActionResponse = {
  ok?: boolean
  message?: string
  quotationId?: string
  rates?: ShippingRate[]
  shipment?: OrderDetail['shipment']
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const detailRef = useRef<HTMLDivElement | null>(null)

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
        return null
      }

      setSelectedOrder(payload.order)
      return payload.order
    } catch {
      setError('No se pudo cargar detalle.')
      return null
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedOrder) return
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedOrder?.order.id])

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
                      <p className="mt-2 text-xs text-yellow">Guía pendiente o en proceso automático.</p>
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
                      {canManageShipping(order) ? (
                        <button
                          className="rounded border border-yellow/60 px-3 py-2 text-xs font-semibold text-yellow hover:bg-yellow hover:text-ink"
                          type="button"
                          onClick={() => loadDetail(order.id)}
                        >
                          Gestionar envío
                        </button>
                      ) : (
                        <button
                          className="rounded border border-paper/10 px-3 py-2 text-xs font-semibold text-muted"
                          type="button"
                          disabled
                        >
                          Envío no disponible
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      {detailLoading ? <AdminPanelMessage title="Cargando detalle..." /> : null}
      {selectedOrder ? (
        <div ref={detailRef}>
          <OrderDetailPanel
            detail={selectedOrder}
            onRefresh={() => loadDetail(selectedOrder.order.id)}
          />
        </div>
      ) : null}
    </div>
  )
}

function OrderDetailPanel({
  detail,
  onRefresh,
}: {
  detail: OrderDetail
  onRefresh: () => Promise<OrderDetail | null>
}) {
  const address = detail.address
  const shipment = detail.shipment
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [quotationId, setQuotationId] = useState(shipment?.quotationId || '')
  const [selectedRateId, setSelectedRateId] = useState(shipment?.rateId || '')
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingMessage, setShippingMessage] = useState('')
  const [shippingError, setShippingError] = useState('')
  const safeTrackingUrl = safeHttpUrl(shipment?.trackingUrl)
  const safeLabelUrl = safeHttpUrl(shipment?.labelUrl)

  const quoteShipping = async () => {
    setShippingLoading(true)
    setShippingError('')
    setShippingMessage('')
    try {
      const response = await fetch(`/api/book/admin/orders/${detail.order.id}/quote-shipping`, {
        method: 'POST',
        credentials: 'include',
      })
      const payload = await readAdminResponse<ShippingActionResponse>(response)
      if (!response.ok || !payload.rates || !payload.quotationId) {
        setShippingError(payload.message || 'No se pudo cotizar envío.')
        return
      }
      setQuotationId(payload.quotationId)
      setRates(payload.rates)
      setSelectedRateId(payload.rates[0]?.rateId || '')
      setShippingMessage('Cotización lista. Selecciona una tarifa para crear guía.')
      await onRefresh()
    } catch {
      setShippingError('No se pudo cotizar envío.')
    } finally {
      setShippingLoading(false)
    }
  }

  const createShipment = async () => {
    if (!quotationId || !selectedRateId) {
      setShippingError('Selecciona una tarifa antes de crear guía.')
      return
    }
    const selectedRate = rates.find((rate) => rate.rateId === selectedRateId)
    const label = selectedRate
      ? `${selectedRate.carrier} ${selectedRate.service} por ${formatMoney(selectedRate.totalCents, selectedRate.currency)}`
      : selectedRateId
    if (!window.confirm(`Crear guía con ${label}?`)) return

    setShippingLoading(true)
    setShippingError('')
    setShippingMessage('')
    try {
      const response = await fetch(`/api/book/admin/orders/${detail.order.id}/create-shipment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId, rateId: selectedRateId }),
      })
      const payload = await readAdminResponse<ShippingActionResponse>(response)
      if (!response.ok || !payload.shipment) {
        setShippingError(payload.message || 'No se pudo crear guía.')
        await onRefresh()
        return
      }
      setShippingMessage('Guía creada. El correo de rastreo se intentó enviar una sola vez.')
      await onRefresh()
    } catch {
      setShippingError('No se pudo crear guía.')
    } finally {
      setShippingLoading(false)
    }
  }

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
          <p className="text-sm text-muted">
            {shipment?.carrier ? `${shipment.carrier}${shipment.service ? ` · ${shipment.service}` : ''}` : 'Sin paquetería asignada'}
          </p>
          {shipment?.trackingNumber ? (
            <p className="mt-1 text-sm text-paper">Guía: {shipment.trackingNumber}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {safeTrackingUrl ? (
              <a
                className="rounded border border-paper/15 px-3 py-2 text-xs font-semibold text-paper hover:border-yellow hover:text-yellow"
                href={safeTrackingUrl}
                rel="noreferrer"
                target="_blank"
              >
                Abrir rastreo
              </a>
            ) : null}
            {shipment?.trackingUrl && !safeTrackingUrl ? (
              <span className="text-xs text-muted">Rastreo manual: URL no válida</span>
            ) : null}
            {safeLabelUrl ? (
              <a
                className="rounded border border-paper/15 px-3 py-2 text-xs font-semibold text-paper hover:border-yellow hover:text-yellow"
                href={safeLabelUrl}
                rel="noreferrer"
                target="_blank"
              >
                Abrir etiqueta
              </a>
            ) : null}
            {shipment?.labelUrl && !safeLabelUrl ? (
              <span className="text-xs text-muted">Etiqueta sin URL válida</span>
            ) : null}
          </div>
          {shipment?.error ? <p className="mt-1 text-sm text-red-100">{shipment.error}</p> : null}
        </div>
      </div>
      <div className="mt-5 border-t border-paper/10 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded border border-yellow/70 px-3 py-2 text-xs font-semibold text-yellow hover:bg-yellow hover:text-ink disabled:cursor-not-allowed disabled:border-paper/10 disabled:text-muted"
            type="button"
            disabled={!canManageShipping(detail.order) || shippingLoading}
            onClick={quoteShipping}
          >
            {shippingLoading ? 'Procesando...' : 'Cotizar envío'}
          </button>
          {shipment?.trackingNumber ? (
            <StatusPill label="label_created" />
          ) : (
            <span className="text-xs text-muted">Disponible solo para pedidos pagados con guía pendiente.</span>
          )}
        </div>
        {shippingError ? <p className="mt-3 text-sm text-red-100">{shippingError}</p> : null}
        {shippingMessage ? <p className="mt-3 text-sm text-yellow">{shippingMessage}</p> : null}
        {rates.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {rates.map((rate) => (
              <label
                key={rate.rateId}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-paper/10 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <input
                    checked={selectedRateId === rate.rateId}
                    name={`rate-${detail.order.id}`}
                    type="radio"
                    value={rate.rateId}
                    onChange={() => setSelectedRateId(rate.rateId)}
                  />
                  <span>
                    <strong>{rate.carrier || 'Paquetería'}</strong>
                    {rate.service ? ` · ${rate.service}` : ''}
                  </span>
                </span>
                <span className="text-muted">
                  {formatMoney(rate.totalCents, rate.currency)}
                  {rate.estimatedDays ? ` · ${rate.estimatedDays} días` : ''}
                </span>
              </label>
            ))}
            <button
              className="mt-2 w-fit rounded bg-yellow px-4 py-2 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:bg-paper/20 disabled:text-muted"
              type="button"
              disabled={!selectedRateId || shippingLoading}
              onClick={createShipment}
            >
              Crear guía
            </button>
          </div>
        ) : null}
      </div>
    </AdminSection>
  )
}

function canManageShipping(order: Pick<AdminOrder, 'paymentStatus' | 'shippingStatus'>): boolean {
  return order.paymentStatus === 'paid' && (order.shippingStatus === 'label_pending' || order.shippingStatus === 'label_error')
}

function safeHttpUrl(value?: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}
