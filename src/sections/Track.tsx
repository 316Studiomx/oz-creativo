import { motion } from 'framer-motion'
import { COPY } from '../config/copy'

export function Track() {
  return (
    <section id="escenarios" className="relative py-24 md:py-36">
      <div className="container-x">
        <span className="text-xs uppercase tracking-[0.3em] text-yellow">/ Escenarios</span>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="display mt-6 max-w-3xl text-[clamp(2rem,5vw,4.2rem)]"
        >
          Escenarios.
        </motion.h2>
        <p className="mt-6 max-w-xl text-muted">{COPY.track.intro}</p>

        <div className="mt-12 grid gap-4 md:grid-cols-6">
          {COPY.track.proofItems.map((item, i) => {
            const featured = i < 2

            return (
              <VisualProofCard
                key={item.src}
                item={item}
                index={i}
                featured={featured}
                className={featured ? 'md:col-span-3' : 'md:col-span-2'}
              />
            )
          })}
        </div>

        <div id="acreditaciones" className="mt-24 md:mt-32">
          <span className="text-xs uppercase tracking-[0.3em] text-yellow">/ Acreditaciones</span>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="display mt-4 text-[clamp(2rem,4vw,3.5rem)]"
          >
            Acreditaciones:
          </motion.h2>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {COPY.track.accreditations.map((item, i) => (
              <VisualProofCard
                key={`${item.label}-${item.src}`}
                item={item}
                index={i}
                compact
                className="min-w-0"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

type VisualItem = {
  label: string
  caption: string
  src: string
  alt: string
  href: string
}

function VisualProofCard({
  item,
  index,
  featured = false,
  compact = false,
  className = '',
}: {
  item: VisualItem
  index: number
  featured?: boolean
  compact?: boolean
  className?: string
}) {
  const external = item.href.startsWith('http')

  return (
    <motion.a
      href={item.href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`group overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transition duration-300 hover:border-yellow/70 hover:bg-yellow/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow ${className}`}
    >
      <figure>
        <div
          className={`relative overflow-hidden ${
            compact ? 'aspect-[4/5]' : featured ? 'aspect-[16/10]' : 'aspect-[4/3]'
          }`}
        >
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            decoding="async"
            sizes={
              compact
                ? '(min-width: 768px) 25vw, 50vw'
                : featured
                  ? '(min-width: 768px) 50vw, 100vw'
                  : '(min-width: 768px) 33vw, 100vw'
            }
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05] group-hover:saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-80 transition duration-300 group-hover:opacity-65" />
          <div className="absolute inset-x-0 bottom-0 px-3 py-3 md:px-4">
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-yellow">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3
              className={`mt-1 font-display font-semibold uppercase leading-tight text-paper transition duration-300 group-hover:text-yellow ${
                compact ? 'text-base md:text-lg' : 'text-xl'
              }`}
            >
              {item.label}
            </h3>
          </div>
        </div>
        <figcaption
          className={`border-t border-white/10 px-3 py-3 leading-relaxed text-muted transition duration-300 group-hover:text-paper/90 md:px-4 ${
            compact ? 'min-h-[92px] text-xs md:min-h-[104px]' : 'min-h-20 text-sm'
          }`}
        >
          {item.caption}
        </figcaption>
      </figure>
    </motion.a>
  )
}
