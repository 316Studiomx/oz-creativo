import { useState } from 'react'

import { BookCheckoutForm } from './BookCheckoutForm'
import { InternationalQuoteForm } from './InternationalQuoteForm'
import { BOOK_STORE_COPY } from './bookCopy'

export function BookStorePage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      <PromoTicker />

      <section className="container-x grid gap-10 pb-16 pt-16 md:pt-20 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
        <div className="min-w-0 overflow-hidden">
          <a href="/" className="link-underline text-sm font-semibold text-yellow">
            OZ CREATIVO
          </a>
          <p className="mt-10 text-xs uppercase tracking-[0.3em] text-yellow">/ Libro físico</p>
          <h1 className="display mt-6 max-w-full break-words text-5xl [letter-spacing:0] sm:text-6xl md:text-8xl lg:text-9xl">
            {BOOK_STORE_COPY.title}
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-tight text-paper/90 md:text-2xl">
            {BOOK_STORE_COPY.subtitle}
          </p>
          <div className="mt-6 grid max-w-2xl gap-1 text-base leading-relaxed text-muted md:text-lg">
            {BOOK_STORE_COPY.heroLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-8 grid max-w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            {BOOK_STORE_COPY.details.map((detail) => (
              <span
                key={detail}
                className="min-w-0 max-w-full break-words rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-paper/85"
              >
                {detail}
              </span>
            ))}
          </div>

          <HeroBookCarousel />
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

      <ProductStorySection />
      <BookReviewsSection />
      <BookFaqSection />
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

function HeroBookCarousel() {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const lastImageIndex = BOOK_STORE_COPY.heroImages.length - 1

  const showPreviousImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === 0 ? lastImageIndex : currentIndex - 1,
    )
  }

  const showNextImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === lastImageIndex ? 0 : currentIndex + 1,
    )
  }

  return (
    <figure className="mt-14 overflow-hidden rounded-lg border border-yellow/25 bg-yellow/10 lg:mt-44">
      <div className="relative aspect-[16/11] max-h-[680px] overflow-hidden">
        {BOOK_STORE_COPY.heroImages.map((image, index) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${
              index === activeImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}

        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
          <button
            type="button"
            aria-label="Anterior imagen del libro"
            onClick={showPreviousImage}
            className="grid size-11 place-items-center rounded-full border border-yellow/40 bg-ink/70 text-lg font-black text-yellow shadow-[0_0_24px_rgba(255,221,0,0.25)] backdrop-blur transition hover:bg-yellow hover:text-ink"
          >
            {'<'}
          </button>
          <button
            type="button"
            aria-label="Siguiente imagen del libro"
            onClick={showNextImage}
            className="grid size-11 place-items-center rounded-full border border-yellow/40 bg-ink/70 text-lg font-black text-yellow shadow-[0_0_24px_rgba(255,221,0,0.25)] backdrop-blur transition hover:bg-yellow hover:text-ink"
          >
            {'>'}
          </button>
        </div>
      </div>

      <figcaption className="flex items-center justify-between gap-4 border-t border-yellow/25 bg-ink/75 px-4 py-3 text-xs uppercase text-muted [letter-spacing:0]">
        <span>Fotos del libro</span>
        <div className="flex gap-2">
          {BOOK_STORE_COPY.heroImages.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Ver imagen ${index + 1} del libro`}
              onClick={() => setActiveImageIndex(index)}
              className={`size-2.5 rounded-full transition ${
                index === activeImageIndex ? 'bg-yellow' : 'bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </figcaption>
    </figure>
  )
}

function PromoTicker() {
  const tickerItems = Array.from({ length: 8 }, (_, index) => index)

  return (
    <div className="overflow-hidden bg-yellow py-3 text-ink">
      <div className="promo-ticker__track flex w-max items-center gap-8 whitespace-nowrap">
        {[...tickerItems, ...tickerItems].map((_, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-8 text-sm font-black uppercase [letter-spacing:0] md:text-base"
          >
            {BOOK_STORE_COPY.promoTicker}
            <span aria-hidden="true">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function ProductStorySection() {
  return (
    <section className="container-x border-t border-white/10 py-16 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-yellow">
            {BOOK_STORE_COPY.longSummary.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold uppercase leading-none text-paper [letter-spacing:0] md:text-6xl">
            {BOOK_STORE_COPY.longSummary.title}
          </h2>
        </div>
        <div className="grid gap-6">
          {BOOK_STORE_COPY.longSummary.body.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-muted md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-yellow">
            {BOOK_STORE_COPY.specsTitle}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BOOK_STORE_COPY.specs.map((spec) => (
              <div
                key={spec.label}
                className="grid gap-1 border-l border-yellow bg-white/[0.03] px-5 py-4"
              >
                <span className="text-xs uppercase text-muted [letter-spacing:0]">
                  {spec.label}
                </span>
                <strong className="text-base font-semibold text-paper">{spec.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function BookReviewsSection() {
  return (
    <section className="container-x border-t border-white/10 py-16 md:py-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-yellow">Lectores</p>
          <h2 className="font-display text-4xl font-semibold uppercase leading-none text-paper [letter-spacing:0] md:text-6xl">
            {BOOK_STORE_COPY.reviewsTitle}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-muted md:text-base">
          Opiniones de personas que conectaron con la idea de emprender con claridad,
          dirección y alma.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {BOOK_STORE_COPY.reviews.map((review) => (
          <article
            key={review.author}
            className="flex min-h-56 flex-col justify-between rounded-lg border border-white/10 bg-white/[0.03] p-6"
          >
            <p className="text-lg leading-relaxed text-paper">“{review.quote}”</p>
            <div className="mt-8">
              <strong className="block text-yellow">{review.author}</strong>
              <span className="text-sm text-muted">{review.role}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function BookFaqSection() {
  return (
    <section className="container-x border-t border-white/10 py-16 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-yellow">Antes de comprar</p>
          <h2 className="mt-4 font-display text-4xl font-semibold uppercase leading-none text-paper [letter-spacing:0] md:text-6xl">
            {BOOK_STORE_COPY.faqTitle}
          </h2>
        </div>

        <div className="grid gap-3">
          {BOOK_STORE_COPY.faq.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-paper">
                <span>{item.question}</span>
                <span className="text-yellow transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
