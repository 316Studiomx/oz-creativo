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

        <div className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {COPY.about.companies.map((company, i) => (
            <motion.a
              key={company.name}
              href={company.href}
              target={company.href.startsWith('http') ? '_blank' : undefined}
              rel={company.href.startsWith('http') ? 'noreferrer' : undefined}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="group min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transition duration-300 hover:border-yellow/70 hover:bg-yellow/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow"
            >
              <div className="relative aspect-square overflow-hidden md:aspect-[4/5]">
                <img
                  src={company.src}
                  alt={company.alt}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05] group-hover:saturate-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent opacity-85 transition duration-300 group-hover:opacity-70" />
                <div className="absolute inset-x-0 bottom-0 px-3 py-3 md:px-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.2em] text-yellow">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold uppercase leading-tight text-paper transition duration-300 group-hover:text-yellow md:text-xl">
                    {company.name}
                  </h3>
                </div>
              </div>
              <p className="min-h-[88px] border-t border-white/10 px-3 py-3 text-xs leading-relaxed text-muted transition duration-300 group-hover:text-paper/90 md:min-h-[116px] md:px-4 md:text-sm">
                {company.description}
              </p>
            </motion.a>
          ))}
        </div>

        <PullQuote text={COPY.about.quote.text} cite={COPY.about.quote.cite} />
      </div>
    </section>
  )
}
