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

        <div className="mt-16 grid gap-4 md:grid-cols-6">
          {COPY.track.proofItems.map((item, i) => {
            const featured = i < 2

            return (
              <motion.figure
                key={item.src}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`group overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] ${
                  featured ? 'md:col-span-3' : 'md:col-span-2'
                }`}
              >
                <div className={`relative ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    sizes={
                      featured
                        ? '(min-width: 768px) 50vw, 100vw'
                        : '(min-width: 768px) 33vw, 100vw'
                    }
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-ink/82 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.22em] text-yellow">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-semibold uppercase leading-tight text-paper">
                      {item.label}
                    </h3>
                  </div>
                </div>
                <figcaption className="min-h-20 border-t border-white/10 px-4 py-4 text-sm leading-relaxed text-muted">
                  {item.caption}
                </figcaption>
              </motion.figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}
