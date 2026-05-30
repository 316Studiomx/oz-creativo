/**
 * Allocation-free bridge between Lenis scroll (DOM) and the R3F render loop.
 * Lenis writes `progress` (0..1 of full page) every frame; useFrame reads it.
 * Using a plain mutable object avoids React re-renders on scroll.
 */
export const scroll = {
  progress: 0,   // 0..1 over the whole document
  velocity: 0,   // signed, for subtle motion reactions
}
