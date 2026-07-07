import { useEffect, useMemo, useState } from 'react'

import { getJson } from './api'
import { BOOK_STORE_COPY } from './bookCopy'

type OrderStatusPageProps = {
  orderNumber: string
}

type OrderLookupResponse = {
  ok?: boolean
  message?: string
  order?: {
    orderNumber?: string
    quantity?: number
    paymentStatus?: string
    shipmentStatus?: string
    shippingStatus?: string
    status?: string
    totalPaid?: string
    trackingCarrier?: string
    trackingService?: string
    trackingNumber?: string
    trackingUrl?: string
    addressSummary?: string
  }
}

export function OrderStatusPage({ orderNumber }: OrderStatusPageProps) {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', [])
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ready'; data: OrderLookupResponse }
    | { status: 'error'; message: string }
  >({ status: 'loading' })

  useEffect(() => {
    if (!token) {
      setState({
        status: 'error',
        message: 'Para consultar tu pedido necesitas abrir el enlace completo enviado por correo.',
      })
      return
    }

    const controller = new AbortController()
    const url = `/api/book/orders/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`

    getJson<OrderLookupResponse>(url, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return
        setState({ status: 'ready', data })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Todavía no pudimos consultar este pedido.',
        })
      })

    return () => controller.abort()
  }, [orderNumber, token])

  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="container-x py-20">
        <a href="/" className="link-underline text-sm font-semibold text-yellow">
          OZ CREATIVO
        </a>
        <p className="mt-12 text-xs uppercase tracking-[0.3em] text-yellow">Estado de pedido</p>
        <h1 className="mt-5 font-display text-5xl font-semibold uppercase leading-none text-paper [letter-spacing:0] md:text-7xl">
          {orderNumber}
        </h1>

        <div className="mt-10 max-w-3xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
          {state.status === 'loading' ? (
            <p className="text-muted">Consultando tu pedido...</p>
          ) : null}

          {state.status === 'error' ? (
            <StatusError message={state.message} />
          ) : null}

          {state.status === 'ready' ? (
            <OrderStatusDetails orderNumber={orderNumber} response={state.data} />
          ) : null}
        </div>
      </section>
    </main>
  )
}

function OrderStatusDetails(props: { orderNumber: string; response: OrderLookupResponse }) {
  const order = props.response.order

  if (!order) {
    return (
      <StatusError
        message={
          props.response.message ||
          'Todavía no hay información disponible para este pedido. Si acabas de pagar, espera unos minutos y revisa tu correo.'
        }
      />
    )
  }

  const rows = [
    ['Pedido', order.orderNumber || props.orderNumber],
    ['Cantidad', order.quantity ? `${order.quantity}` : 'Pendiente de confirmar'],
    ['Pago', order.paymentStatus || order.status || 'Pendiente'],
    ['Envío', order.shipmentStatus || order.shippingStatus || 'En preparación'],
    ['Total', order.totalPaid || 'Confirmado por Stripe'],
    ['Dirección', order.addressSummary || 'Guardada en tu orden'],
  ]
  const trackingHref = safeTrackingUrl(order.trackingUrl)
  const hasTracking = Boolean(
    order.trackingNumber || trackingHref || order.trackingCarrier || order.trackingService,
  )

  return (
    <div>
      <p className="text-lg font-semibold text-paper">Resumen</p>
      <dl className="mt-5 divide-y divide-white/10">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-2 py-4 sm:grid-cols-[160px_minmax(0,1fr)]">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="break-words text-sm font-medium text-paper">{value}</dd>
          </div>
        ))}
      </dl>

      {hasTracking ? (
        <div className="mt-6 border border-yellow/30 bg-yellow/10 p-4">
          <p className="font-semibold text-paper">Rastreo</p>
          {order.trackingCarrier || order.trackingService ? (
            <p className="mt-2 text-sm text-paper/80">
              {[order.trackingCarrier, order.trackingService].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          {order.trackingNumber ? (
            <p className="mt-2 text-sm text-paper/80">Número: {order.trackingNumber}</p>
          ) : null}
          {trackingHref ? (
            <a
              href={trackingHref}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full bg-yellow px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Abrir rastreo
            </a>
          ) : null}
          {order.trackingUrl && !trackingHref ? (
            <p className="mt-3 text-sm leading-relaxed text-paper/80">
              El enlace automático de rastreo no está disponible. Usa el número de guía para
              consultar directamente con la paquetería.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Tu pedido puede estar pagado y todavía no tener guía. Te enviaremos el rastreo por correo
          cuando esté listo.
        </p>
      )}
    </div>
  )
}

function safeTrackingUrl(value?: string): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString()
    }
    return null
  } catch {
    return null
  }
}

function StatusError({ message }: { message: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-paper">No pudimos mostrar el estado todavía.</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Para soporte, escribe a{' '}
        <a className="text-yellow" href={`mailto:${BOOK_STORE_COPY.supportEmail}`}>
          {BOOK_STORE_COPY.supportEmail}
        </a>
        .
      </p>
    </div>
  )
}
