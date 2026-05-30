import { motion } from 'framer-motion'
import { COPY } from '../config/copy'

export function Track() {
  return (
    <section id="trayectoria" className="relative py-24 md:py-36">
      <div className="container-x">
        <span className="text-xs uppercase tracking-[0.3em] text-yellow">/ Trayectoria</span>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="display mt-6 max-w-3xl text-[clamp(2rem,5vw,4.2rem)]"
        >
          Escenarios, marcas y <span className="text-yellow glow-yellow">reconocimientos.</span>
        </motion.h2>
        <p className="mt-6 max-w-xl text-muted">{COPY.track.intro}</p>

        {/* Badges */}
        <div className="mt-12 flex flex-wrap gap-3">
          {COPY.track.badges.map((b) => (
            <span
              key={b}
              className="rounded-full border border-yellow/30 px-4 py-2 text-sm text-paper/80"
            >
              {b}
            </span>
          ))}
        </div>

        {/* Editable logo grid (placeholder) */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3 lg:grid-cols-6">
          {COPY.track.logos.map((logo) => (
            <div
              key={logo}
              className="flex aspect-[3/2] items-center justify-center bg-ink px-4 text-center text-sm text-muted transition-colors hover:text-yellow"
            >
              {logo}
            </div>
          ))}
        </div>

        {/* Testimonials (placeholder) */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {COPY.track.testimonials.map((t, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-white/10 p-6 transition-colors hover:border-yellow/40"
            >
              <div className="mb-4 text-2xl text-yellow">✳</div>
              <blockquote className="text-paper/90">“{t.quote}”</blockquote>
              <figcaption className="mt-5 text-sm text-muted">
                <span className="text-paper">{t.name}</span> · {t.role}, {t.company}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
