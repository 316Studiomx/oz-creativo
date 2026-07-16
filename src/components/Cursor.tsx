import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * Custom cursor: a yellow target sight with a soft glow and a click pulse.
 * Disabled on touch.
 */
export function Cursor() {
  const target = useRef<HTMLDivElement>(null)
  const pulse = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    let raf = 0
    let clickTimer = 0
    let pulseTimer = 0
    let hovering = false
    let pressing = false
    let nativeCursorZone = false

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const t = e.target as HTMLElement
      nativeCursorZone = !!t.closest(
        '.lead-form-modal, .admin-shell, input, textarea, select, [contenteditable="true"]',
      )
      hovering = !nativeCursorZone && !!t.closest('a, button, [data-hover]')
    }

    const onDown = () => {
      pressing = true
      if (pulse.current && !reduced) {
        pulse.current.classList.remove('cursor-target-pulse-run')
        void pulse.current.offsetWidth
        pulse.current.classList.add('cursor-target-pulse-run')
      }
      window.clearTimeout(clickTimer)
      window.clearTimeout(pulseTimer)
      clickTimer = window.setTimeout(() => {
        pressing = false
      }, 220)
      pulseTimer = window.setTimeout(() => {
        pulse.current?.classList.remove('cursor-target-pulse-run')
      }, 430)
    }

    const onUp = () => {
      window.clearTimeout(clickTimer)
      clickTimer = window.setTimeout(() => {
        pressing = false
      }, 120)
    }

    const loop = () => {
      const hoverScale = hovering ? 1.28 : 1
      const clickScale = pressing ? 0.72 : 1
      const glowFilter = pressing
        ? 'drop-shadow(0 0 12px rgba(255,212,0,0.95)) drop-shadow(0 0 44px rgba(255,212,0,0.62))'
        : hovering
          ? 'drop-shadow(0 0 10px rgba(255,212,0,0.85)) drop-shadow(0 0 34px rgba(255,212,0,0.5))'
          : 'drop-shadow(0 0 8px rgba(255,212,0,0.72)) drop-shadow(0 0 26px rgba(255,212,0,0.35))'

      if (target.current) {
        target.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) scale(${hoverScale * clickScale})`
        target.current.style.opacity = nativeCursorZone ? '0' : hovering ? '1' : '0.92'
        target.current.style.visibility = nativeCursorZone ? 'hidden' : 'visible'
        target.current.style.filter = glowFilter
      }
      if (pulse.current) {
        pulse.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`
        pulse.current.style.opacity = nativeCursorZone ? '0' : '1'
        pulse.current.style.visibility = nativeCursorZone ? 'hidden' : 'visible'
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.clearTimeout(clickTimer)
      window.clearTimeout(pulseTimer)
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] hidden md:block">
      <div
        ref={pulse}
        className="cursor-target-pulse absolute left-0 top-0 h-11 w-11"
      >
        <div className="cursor-target-pulse-ring absolute inset-0 rounded-full border border-yellow/70" />
      </div>
      <div ref={target} className="cursor-target-sight absolute left-0 top-0 h-9 w-9">
        <div className="absolute inset-0 rounded-full border-2 border-yellow bg-yellow/5" />
        <div className="absolute inset-[8px] rounded-full border-2 border-yellow/95 bg-ink/35" />
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-yellow/25" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-yellow/25" />
      </div>
    </div>
  )
}
