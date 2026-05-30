import { motion } from 'framer-motion'
import { COPY } from '../config/copy'
import { PullQuote } from '../components/PullQuote'

export function About() {
  return (
    <section id="sobre-mi" className="relative py-28 md:py-40">
      <div className="container-x">
        <span className="text-xs uppercase tracking-[0.3em] text-yellow">/ Sobre mí</span>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="display mt-6 max-w-4xl text-[clamp(2.2rem,6vw,5rem)]"
        >
          Mucho gusto, <span className="text-yellow glow-yellow">soy Oz.</span>
        </motion.h2>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-16">
          {COPY.about.paragraphs.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-base leading-relaxed text-muted md:text-lg"
            >
              {p}
            </motion.p>
          ))}
        </div>

        <PullQuote text={COPY.about.quote.text} cite={COPY.about.quote.cite} />
      </div>
    </section>
  )
}
