/**
 * Design tokens — single source of truth for color.
 * Change a value here and it propagates to CSS, Tailwind references and the 3D scene.
 */
export const COLORS = {
  ink: '#0A0A0A',
  yellow: '#FFD400',
  yellowWarm: '#FFE000',
  yellowDeep: '#F7D000',
  paper: '#FFFFFF',
  muted: '#9A9A9A',
} as const

/** Numeric versions for three.js materials/lights. */
export const COLORS_HEX = {
  ink: 0x0a0a0a,
  yellow: 0xffd400,
  yellowWarm: 0xffe000,
  paper: 0xffffff,
} as const

/** Global motion tuning. */
export const MOTION = {
  lerp: 0.08,          // cursor/parallax smoothing
  scrollEase: 0.1,     // lenis lerp
  parallaxStrength: 0.4,
} as const
