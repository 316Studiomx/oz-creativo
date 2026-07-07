import { motion } from 'framer-motion'
import { COPY } from '../config/copy'
import { Magnetic } from '../components/Magnetic'

export function Book() {
  const hasAmazonLink = COPY.book.amazonHref.length > 0
  const opensInNewTab = /^https?:\/\//.test(COPY.book.amazonHref)

  return (
    <section id="libro" className="relative overflow-hidden py-24 md:py-36">
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            'radial-gradient(720px circle at 12% 35%, rgba(255,212,0,0.12), transparent 60%)',
        }}
      />

      <div className="container-x relative z-10 grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <motion.figure
          initial={{ opacity: 0, y: 32, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-[340px] overflow-hidden rounded-lg border border-yellow/25 bg-yellow/10 md:min-h-[520px]"
        >
          <img
            src={COPY.book.src}
            alt={COPY.book.alt}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          <figcaption className="absolute bottom-0 left-0 right-0 px-5 py-5 md:px-7 md:py-7">
            <p className="text-xs uppercase tracking-[0.28em] text-yellow">{COPY.book.eyebrow}</p>
            <p className="mt-2 font-display text-3xl font-semibold uppercase leading-none text-paper md:text-5xl">
              {COPY.book.title}
            </p>
          </figcaption>
        </motion.figure>

        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-yellow">/ Libro</span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="display mt-6 max-w-4xl text-5xl [letter-spacing:0] sm:text-6xl md:text-7xl lg:text-8xl"
            aria-label={`También soy autor de ${COPY.book.title}.`}
          >
            <span className="block" aria-hidden="true">
              También soy
            </span>
            <span className="block" aria-hidden="true">
              autor de
            </span>
            <span className="block text-yellow glow-yellow" aria-hidden="true">
              {COPY.book.title}.
            </span>
          </motion.h2>

          <p className="mt-7 max-w-2xl text-xl leading-relaxed text-paper md:text-2xl">
            {COPY.book.subtitle}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {COPY.book.body}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {COPY.book.points.map((point) => (
              <div key={point} className="border-l border-yellow/70 bg-white/[0.03] px-4 py-4">
                <p className="text-sm leading-relaxed text-paper/85">{point}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            {hasAmazonLink ? (
              <Magnetic strength={0.28} className="inline-block">
                <a
                  href={COPY.book.amazonHref}
                  target={opensInNewTab ? '_blank' : undefined}
                  rel={opensInNewTab ? 'noreferrer' : undefined}
                  className="inline-flex items-center gap-3 rounded-full bg-yellow px-8 py-4 font-semibold text-ink transition-transform hover:scale-[1.03]"
                >
                  {COPY.book.cta}
                  <span aria-hidden>→</span>
                </a>
              </Magnetic>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex rounded-full border border-yellow/35 bg-yellow/10 px-8 py-4 font-semibold text-yellow/80"
              >
                {COPY.book.ctaPending}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
