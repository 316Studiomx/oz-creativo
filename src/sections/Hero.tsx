import { motion } from 'framer-motion'
import { COPY } from '../config/copy'
import { Magnetic } from '../components/Magnetic'
import { useState } from 'react'

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.08 },
  }),
}

type Props = {
  onOpenForm: () => void
}

export function Hero({ onOpenForm }: Props) {
  const [egg, setEgg] = useState(false)

  return (
    <section id="inicio" className="relative flex min-h-[100svh] items-center pb-16 pt-32 md:pt-28">
      <div className="container-x grid grid-cols-1 items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        {/* Left: copy */}
        <div className="relative z-10">
          <motion.p
            custom={0}
            variants={reveal}
            initial="hidden"
            animate="show"
            className="mb-6 text-xs font-medium uppercase tracking-[0.28em] text-yellow md:text-sm"
          >
            {COPY.hero.eyebrow}
          </motion.p>

          <h1 className="display text-[clamp(2.4rem,6vw,5.4rem)]">
            {['Convierto ideas', 'en marcas, y', 'marcas en'].map((line, i) => (
              <motion.span
                key={line}
                custom={i + 1}
                variants={reveal}
                initial="hidden"
                animate="show"
                className="block"
              >
                {line}
              </motion.span>
            ))}
            <motion.span
              custom={4}
              variants={reveal}
              initial="hidden"
              animate="show"
              className="block text-yellow glow-yellow"
            >
              negocios que venden.
            </motion.span>
          </h1>

          <motion.p
            custom={5}
            variants={reveal}
            initial="hidden"
            animate="show"
            className="mt-8 max-w-xl text-base leading-relaxed text-muted md:text-lg"
          >
            {COPY.hero.subtitle}
          </motion.p>

          <motion.div
            custom={6}
            variants={reveal}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Magnetic strength={0.35}>
              <button
                type="button"
                onClick={onOpenForm}
                className="rounded-full bg-yellow px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] md:text-base"
              >
                {COPY.hero.ctaPrimary}
              </button>
            </Magnetic>
            <a
              href="#lo-que-hago"
              className="link-underline text-sm text-paper/90 md:text-base"
            >
              {COPY.hero.ctaSecondary} →
            </a>
          </motion.div>
        </div>

        {/* Right: portrait sits in the WebGL canvas behind; this is the
            interactive easter-egg zone over the glasses + a mobile fallback. */}
        <div className="relative hidden h-[60vh] md:block">
          <button
            aria-label="Easter egg"
            onMouseEnter={() => setEgg(true)}
            onMouseLeave={() => setEgg(false)}
            className="absolute left-1/2 top-[38%] h-16 w-40 -translate-x-1/2 rounded-full"
          />
          <motion.div
            initial={false}
            animate={{ opacity: egg ? 1 : 0, y: egg ? 0 : 8 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute left-1/2 top-[30%] z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-yellow/40 bg-ink/80 px-4 py-2 text-sm text-yellow backdrop-blur"
          >
            {COPY.hero.glassesEasterEgg}
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted"
      >
        <span className="inline-block animate-bounce">↓</span> scroll
      </motion.div>
    </section>
  )
}
