import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'

type Props = {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
}

/** Counts up from 0 to `value` once when it scrolls into view. */
export function Counter({ value, prefix = '', suffix = '', duration = 1600 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setDisplay(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(Math.round(eased * value))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
