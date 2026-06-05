import { motion } from 'framer-motion'
import { COPY } from '../config/copy'
import { ServiceCard } from '../components/ServiceCard'
import { CONTACT_FORM_ANCHOR } from '../config/contactForm'

export function Services() {
  return (
    <section id="lo-que-hago" className="relative py-24 md:py-36">
      <div className="container-x">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-yellow">/ Lo que hago</span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="display mt-6 text-[clamp(2.2rem,6vw,5rem)]"
            >
              Cómo te <span className="text-yellow glow-yellow">ayudo.</span>
            </motion.h2>
          </div>
          <p className="max-w-sm text-sm text-muted md:text-base">
            Cuatro formas de trabajar juntos, del escenario a la trinchera de tu negocio.
          </p>
        </div>

        <div className="mt-14 border-b border-white/10">
          {COPY.services.items.map((s, i) => (
            <ServiceCard
              key={s.n}
              n={s.n}
              title={s.title}
              body={s.body}
              cta={s.cta}
              href={CONTACT_FORM_ANCHOR}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
