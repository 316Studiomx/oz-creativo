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

        <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
              className="group min-h-[136px] border border-white/10 bg-white/[0.03] p-4 transition duration-300 hover:border-yellow/70 hover:bg-yellow/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow md:min-h-[150px]"
            >
              <CompanyLogo name={company.name} />
              <p className="mt-4 text-xs leading-relaxed text-muted transition duration-300 group-hover:text-paper/90 md:text-sm">
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

function CompanyLogo({ name }: { name: string }) {
  if (name === '316Studio') {
    return (
      <span className="block font-display text-2xl font-semibold uppercase leading-none text-paper transition duration-300 group-hover:text-yellow md:text-3xl">
        316Studio
      </span>
    )
  }

  if (name === 'Cúspide Mx') {
    return (
      <span className="block font-display text-2xl font-semibold uppercase leading-none text-paper transition duration-300 group-hover:text-yellow md:text-3xl">
        Cúspide
        <span className="ml-1 text-sm text-yellow md:text-base">Mx</span>
      </span>
    )
  }

  if (name === 'Plexx') {
    return (
      <span className="block font-display text-3xl font-semibold lowercase leading-none text-paper transition duration-300 group-hover:text-yellow md:text-4xl">
        plexx
      </span>
    )
  }

  return (
    <span className="block font-display text-2xl font-semibold uppercase leading-none text-paper transition duration-300 group-hover:text-yellow md:text-3xl">
      Propulsor
    </span>
  )
}
