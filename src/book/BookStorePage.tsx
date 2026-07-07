import { BookCheckoutForm } from './BookCheckoutForm'
import { InternationalQuoteForm } from './InternationalQuoteForm'
import { BOOK_STORE_COPY } from './bookCopy'

export function BookStorePage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="container-x grid gap-10 pb-16 pt-20 md:pt-24 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
        <div className="min-w-0">
          <a href="/" className="link-underline text-sm font-semibold text-yellow">
            OZ CREATIVO
          </a>
          <p className="mt-10 text-xs uppercase tracking-[0.3em] text-yellow">/ Libro físico</p>
          <h1 className="display mt-6 text-6xl [letter-spacing:0] sm:text-7xl md:text-8xl lg:text-9xl">
            {BOOK_STORE_COPY.title}
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-tight text-paper/90 md:text-2xl">
            {BOOK_STORE_COPY.subtitle}
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {BOOK_STORE_COPY.hero}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {BOOK_STORE_COPY.details.map((detail) => (
              <span
                key={detail}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-paper/85"
              >
                {detail}
              </span>
            ))}
          </div>

          <figure className="mt-10 overflow-hidden rounded-lg border border-yellow/25 bg-yellow/10">
            <img
              src={BOOK_STORE_COPY.image}
              alt={BOOK_STORE_COPY.imageAlt}
              className="max-h-[560px] w-full object-cover"
            />
          </figure>
        </div>

        <BookCheckoutForm />
      </section>

      <section className="container-x border-t border-white/10 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-yellow">Lectura accionable</p>
            <h2 className="mt-4 font-display text-4xl font-semibold uppercase leading-none text-paper [letter-spacing:0] md:text-6xl">
              Lo que vas a encontrar
            </h2>
          </div>
          <div>
            <p className="max-w-3xl text-lg leading-relaxed text-muted">
              {BOOK_STORE_COPY.synopsis}
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {BOOK_STORE_COPY.learn.map((item) => (
                <div key={item} className="border-l border-yellow bg-white/[0.03] p-5 text-paper/90">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <InternationalQuoteForm />

      <footer className="container-x border-t border-white/10 py-10 text-sm text-muted">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>Soporte: {BOOK_STORE_COPY.supportEmail}</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <a className="link-underline" href="/politica-de-envios">
              Envíos
            </a>
            <a className="link-underline" href="/cambios-devoluciones-cancelaciones">
              Cambios
            </a>
            <a className="link-underline" href="/aviso-de-privacidad">
              Privacidad
            </a>
            <a className="link-underline" href="/terminos-y-condiciones">
              Términos
            </a>
            <a className="link-underline" href="/contacto">
              Contacto
            </a>
          </nav>
        </div>
      </footer>
    </main>
  )
}
