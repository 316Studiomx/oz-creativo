import { useEffect, useState } from 'react'

/**
 * Detects small screens / coarse pointers / low core count so we can swap the
 * heavy WebGL hero for a light CSS-parallax fallback.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const evaluate = () => {
      const smallScreen = window.innerWidth < breakpoint
      const coarse = window.matchMedia('(pointer: coarse)').matches
      const lowCores =
        typeof navigator.hardwareConcurrency === 'number' &&
        navigator.hardwareConcurrency <= 4
      setIsMobile(smallScreen || (coarse && lowCores))
    }
    evaluate()
    window.addEventListener('resize', evaluate)
    return () => window.removeEventListener('resize', evaluate)
  }, [breakpoint])

  return isMobile
}
