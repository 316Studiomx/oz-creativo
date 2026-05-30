import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * Custom cursor: a small dot + a trailing yellow halo that lerps toward the
 * pointer and grows when hovering interactive elements. Disabled on touch.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const halo = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const haloPos = { ...pos }
    let raf = 0
    let hovering = false

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const t = e.target as HTMLElement
      hovering = !!t.closest('a, button, [data-hover]')
    }

    const loop = () => {
      haloPos.x += (pos.x - haloPos.x) * (reduced ? 1 : 0.18)
      haloPos.y += (pos.y - haloPos.y) * (reduced ? 1 : 0.18)
      if (dot.current) {
        dot.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      }
      if (halo.current) {
        const s = hovering ? 2.4 : 1
        halo.current.style.transform = `translate(${haloPos.x}px, ${haloPos.y}px) translate(-50%, -50%) scale(${s})`
        halo.current.style.opacity = hovering ? '0.9' : '0.6'
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] hidden md:block">
      <div
        ref={halo}
        className="absolute left-0 top-0 h-10 w-10 rounded-full bg-yellow/20 blur-[2px] transition-opacity duration-200"
        style={{ boxShadow: '0 0 30px rgba(255,212,0,0.4)' }}
      />
      <div
        ref={dot}
        className="absolute left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow"
      />
    </div>
  )
}
