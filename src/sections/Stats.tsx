import { COPY } from '../config/copy'
import { Counter } from '../components/Counter'

export function Stats() {
  return (
    <section className="relative border-y border-white/10 py-16 md:py-20">
      <div className="container-x grid grid-cols-2 gap-y-10 md:grid-cols-4">
        {COPY.stats.map((s) => (
          <div key={s.label} className="text-center md:text-left">
            <div className="font-display text-4xl font-bold text-yellow glow-yellow md:text-6xl">
              <Counter value={s.value} prefix={s.prefix} suffix={'suffix' in s ? s.suffix : ''} />
            </div>
            <p className="mt-2 text-sm text-muted md:text-base">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
