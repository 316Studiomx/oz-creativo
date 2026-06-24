import { motion } from 'framer-motion'
import { COPY } from '../config/copy'
import { PullQuote } from '../components/PullQuote'
import { Magnetic } from '../components/Magnetic'

type Props = {
  onOpenForm: () => void
}

export function Contact({ onOpenForm }: Props) {
  return (
    <section id="hablemos" className="relative overflow-hidden py-28 md:py-40">
      {/* warm glow backdrop */}
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            'radial-gradient(800px circle at 50% 120%, rgba(255,212,0,0.12), transparent 60%)',
        }}
      />
      <div className="container-x relative z-10 text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-yellow">/ Hablemos</span>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="display mx-auto mt-6 max-w-5xl text-[clamp(2.4rem,7vw,6rem)]"
        >
          Tu próximo capítulo <span className="text-yellow glow-yellow">no se va a escribir solo.</span>
        </motion.h2>

        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          {COPY.contact.body}
        </p>

        <div className="mx-auto max-w-2xl text-left">
          <PullQuote text={COPY.contact.quote.text} cite={COPY.contact.quote.cite} />
        </div>

        <Magnetic strength={0.3} className="inline-block">
          <button
            type="button"
            onClick={onOpenForm}
            className="inline-flex items-center gap-3 rounded-full bg-yellow px-9 py-4 text-base font-semibold text-ink transition-transform hover:scale-[1.03] md:text-lg"
          >
            {COPY.contact.cta}
            <span aria-hidden>→</span>
          </button>
        </Magnetic>
      </div>

      {/* Footer */}
      <footer className="container-x relative z-10 mt-28 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-10 text-sm text-muted md:flex-row">
        <div className="flex items-center gap-2 font-display font-bold text-paper">
          <img src={COPY.brand.logo} alt="" className="h-6 w-6 rounded-full object-cover" aria-hidden />
          {COPY.footer.domain}
        </div>
        <div className="flex gap-6">
          {COPY.footer.socials.map((s) => (
            <a key={s.label} href={s.href} className="link-underline hover:text-paper">
              {s.label}
            </a>
          ))}
        </div>
      </footer>
    </section>
  )
}
