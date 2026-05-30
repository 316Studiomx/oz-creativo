import { useEffect, useRef } from 'react'

export type Pointer = { x: number; y: number; nx: number; ny: number }

/**
 * Shared, allocation-free pointer state.
 * `x/y` are pixel coords; `nx/ny` are normalized to [-1, 1] from screen center.
 * Read from a ref so consumers (canvas useFrame, cursor light) don't re-render.
 */
export function usePointer() {
  const pointer = useRef<Pointer>({ x: 0, y: 0, nx: 0, ny: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX
      pointer.current.y = e.clientY
      pointer.current.nx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.ny = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return pointer
}
