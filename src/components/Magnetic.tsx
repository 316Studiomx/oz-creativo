import { useRef, type ReactNode } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

/** Wraps a child so it's gently pulled toward the cursor on hover. */
export function Magnetic({
  children,
  strength = 0.4,
  className,
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`
  }

  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)'
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={className}
      style={{ transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)' }}
    >
      {children}
    </div>
  )
}
