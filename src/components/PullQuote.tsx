import { motion } from 'framer-motion'

/** Editorial pull-quote in yellow with a scripture-style citation. */
export function PullQuote({ text, cite }: { text: string; cite: string }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="my-16 border-l-2 border-yellow pl-6 md:pl-10"
    >
      <blockquote className="font-display text-2xl font-semibold leading-tight text-yellow glow-yellow md:text-4xl">
        “{text}”
      </blockquote>
      <figcaption className="mt-4 text-sm uppercase tracking-[0.2em] text-muted">
        — {cite}
      </figcaption>
    </motion.figure>
  )
}
