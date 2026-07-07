import { BOOK_STORE_COPY } from './bookCopy'

export function ThankYouPage() {
  const params = new URLSearchParams(window.location.search)
  const order = params.get('order') || ''
  const token = params.get('token') || ''
  const orderHref = order
    ? `/pedido/${encodeURIComponent(order)}${token ? `?token=${encodeURIComponent(token)}` : ''}`
    : ''

  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="container-x flex min-h-screen items-center py-20">
        <div className="max-w-3xl">
          <a href="/" className="link-underline text-sm font-semibold text-yellow">
            OZ CREATIVO
          </a>
          <p className="mt-12 text-xs uppercase tracking-[0.3em] text-yellow">Gracias por tu compra</p>
          <h1 className="mt-5 font-display text-5xl font-semibold uppercase leading-none text-paper [letter-spacing:0] md:text-7xl">
            Estamos preparando tu pedido.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Si el pago fue confirmado por Stripe, recibirás un correo con los datos de tu compra y
            las instrucciones de seguimiento. No reclamamos envío hasta tener guía o rastreo listo.
          </p>

          <div className="mt-8 border border-yellow/30 bg-yellow/10 p-5 text-paper">
            <p className="font-semibold">Libro físico: {BOOK_STORE_COPY.title}</p>
            {order ? <p className="mt-2 text-sm text-paper/80">Pedido: {order}</p> : null}
            <p className="mt-2 text-sm text-paper/80">
              Soporte: <a href={`mailto:${BOOK_STORE_COPY.supportEmail}`}>{BOOK_STORE_COPY.supportEmail}</a>
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {orderHref ? (
              <a
                href={orderHref}
                className="inline-flex justify-center rounded-full bg-yellow px-6 py-3 font-semibold text-ink"
              >
                Ver estado del pedido
              </a>
            ) : null}
            <a
              href="/libro"
              className="inline-flex justify-center rounded-full border border-yellow/50 px-6 py-3 font-semibold text-yellow hover:bg-yellow hover:text-ink"
            >
              Volver al libro
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
