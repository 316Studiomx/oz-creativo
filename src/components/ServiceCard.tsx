import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Magnetic } from './Magnetic'
import { COPY } from '../config/copy'

type Props = {
  n: string
  title: string
  body: string
  cta: string
  onContactClick: () => void
  index: number
}

/**
 * Numbered service card (01–04). On hover: the Oz mark spins, a glow
 * sweeps, and the card lifts. The spinning mark is CSS (cheap) — no extra WebGL
 * context per card.
 */
export function ServiceCard({ n, title, body, cta, onContactClick, index }: Props) {
  const [hover, setHover] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <motion.article
      ref={ref}
      data-hover
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative overflow-hidden border-t border-white/10 py-10 transition-colors duration-500 hover:border-yellow/40 md:py-14"
    >
      {/* glow sweep */}
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(600px circle at 20% 0%, rgba(255,212,0,0.08), transparent 60%)',
        }}
      />

      <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-10">
        {/* Number + spinning brand accent */}
        <div className="flex items-center gap-4">
          <span className="font-display text-3xl font-bold text-muted transition-colors duration-500 group-hover:text-yellow md:text-5xl">
            {n}
          </span>
          <img
            src={COPY.brand.logo}
            alt=""
            className="h-7 w-7 rounded-full object-cover transition-transform duration-700 will-change-transform md:h-9 md:w-9"
            style={{
              transform: hover ? 'rotate(180deg) scale(1.15)' : 'rotate(0deg) scale(1)',
              filter: 'drop-shadow(0 0 10px rgba(255,212,0,0.5))',
            }}
            aria-hidden
          />
        </div>

        <div className="max-w-2xl">
          <h3 className="font-display text-2xl font-semibold uppercase leading-tight tracking-tight md:text-4xl">
            {title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{body}</p>
        </div>

        <Magnetic strength={0.3} className="md:self-center">
          <button
            type="button"
            onClick={onContactClick}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-yellow/50 px-5 py-2.5 text-sm font-medium text-yellow transition-colors duration-300 hover:bg-yellow hover:text-ink"
          >
            {cta}
            <span aria-hidden>→</span>
          </button>
        </Magnetic>
      </div>
    </motion.article>
  )
}
