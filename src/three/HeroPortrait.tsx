import { Suspense, useMemo, useRef, useEffect } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from '../config/tokens'
import { scroll } from './scrollStore'
import type { Pointer } from '../hooks/usePointer'

// Matches the real photo aspect ratio (1122×1402 ≈ 4:5)
const WIDTH = 3.2
const HEIGHT = 4.0

/**
 * Draws a stylized placeholder portrait to a 2D canvas:
 * dark studio gradient, vertical neon stripe, a charcoal figure silhouette and
 * the signature yellow glasses. Designed to be replaced by a real PNG later by
 * passing `imageUrl`.
 */
function buildPlaceholderTexture(): THREE.CanvasTexture {
  const w = 600
  const h = 840
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Card frame so the plane reads as a framed portrait, not floating glasses
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#1f1f1f')
  bg.addColorStop(0.55, '#161616')
  bg.addColorStop(1, '#0d0d0d')
  ctx.fillStyle = bg
  roundedRect(ctx, 6, 6, w - 12, h - 12, 28)
  ctx.fill()
  // subtle yellow frame
  ctx.strokeStyle = 'rgba(255,212,0,0.22)'
  ctx.lineWidth = 3
  roundedRect(ctx, 6, 6, w - 12, h - 12, 28)
  ctx.stroke()

  // Vertical warm neon stripe (right third) with glow
  const stripeX = w * 0.78
  const glow = ctx.createLinearGradient(stripeX - 90, 0, stripeX + 90, 0)
  glow.addColorStop(0, 'rgba(255,212,0,0)')
  glow.addColorStop(0.5, 'rgba(255,224,0,0.4)')
  glow.addColorStop(1, 'rgba(255,212,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(stripeX - 90, 20, 180, h - 40)
  ctx.fillStyle = COLORS.yellowWarm
  ctx.fillRect(stripeX - 4, 50, 8, h - 100)

  // Figure silhouette (shoulders + head) — lighter so it reads as a person
  ctx.fillStyle = '#2e2e2e'
  ctx.beginPath()
  ctx.moveTo(w * 0.16, h - 14)
  ctx.quadraticCurveTo(w * 0.2, h * 0.6, w * 0.34, h * 0.54)
  ctx.lineTo(w * 0.62, h * 0.54)
  ctx.quadraticCurveTo(w * 0.78, h * 0.6, w * 0.82, h - 14)
  ctx.closePath()
  ctx.fill()

  // Yellow rim light down the figure's right edge (stage lighting)
  ctx.strokeStyle = 'rgba(255,212,0,0.5)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(w * 0.62, h * 0.56)
  ctx.quadraticCurveTo(w * 0.78, h * 0.62, w * 0.82, h - 14)
  ctx.stroke()

  // Head
  ctx.fillStyle = '#363636'
  ctx.beginPath()
  ctx.ellipse(w * 0.48, h * 0.4, w * 0.135, h * 0.135, 0, 0, Math.PI * 2)
  ctx.fill()

  // Hair hint
  ctx.fillStyle = '#404040'
  ctx.beginPath()
  ctx.ellipse(w * 0.48, h * 0.31, w * 0.135, h * 0.075, 0, Math.PI, Math.PI * 2)
  ctx.fill()

  // Signature yellow glasses
  ctx.strokeStyle = COLORS.yellow
  ctx.lineWidth = 7
  ctx.lineJoin = 'round'
  const gy = h * 0.4
  const lx = w * 0.42
  const rx = w * 0.54
  const r = 26
  roundedRect(ctx, lx - r, gy - r * 0.7, r * 1.7, r * 1.4, 10)
  ctx.stroke()
  roundedRect(ctx, rx - r * 0.7, gy - r * 0.7, r * 1.7, r * 1.4, 10)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(lx + r, gy)
  ctx.lineTo(rx - r * 0.7, gy)
  ctx.stroke()

  // Subtle vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.7)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

type Props = {
  pointer: React.MutableRefObject<Pointer>
  reduced: boolean
  /** Optional real photo. When set, replaces the placeholder. */
  imageUrl?: string
}

export function HeroPortrait({ pointer, reduced, imageUrl }: Props) {
  const group = useRef<THREE.Group>(null)

  const placeholder = useMemo(() => (imageUrl ? null : buildPlaceholderTexture()), [imageUrl])
  useEffect(() => () => placeholder?.dispose(), [placeholder])

  return (
    <group ref={group} position={[2.3, -0.1, 0]}>
      {imageUrl ? (
        <Suspense fallback={null}>
          <PhotoPlane url={imageUrl} />
        </Suspense>
      ) : (
        <mesh>
          <planeGeometry args={[WIDTH, HEIGHT]} />
          <meshBasicMaterial map={placeholder!} toneMapped={false} transparent />
        </mesh>
      )}

      <PortraitMotion group={group} pointer={pointer} reduced={reduced} />
    </group>
  )
}

function PhotoPlane({ url }: { url: string }) {
  const tex = useLoader(THREE.TextureLoader, url)
  tex.colorSpace = THREE.SRGBColorSpace
  return (
    <mesh>
      <planeGeometry args={[WIDTH, HEIGHT]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

/** Parallax tilt + scroll drift. Split out to keep hooks tidy. */
function PortraitMotion({
  group,
  pointer,
  reduced,
}: {
  group: React.RefObject<THREE.Group>
  pointer: React.MutableRefObject<Pointer>
  reduced: boolean
}) {
  useFrame(() => {
    const g = group.current
    if (!g) return
    const p = scroll.progress

    // Drift up and back as you scroll out of the hero
    g.position.y = -0.1 + p * 1.6
    g.position.z = -p * 1.5

    // Fade the whole portrait out once the hero is behind us, so it doesn't
    // linger over later sections.
    const fade = 1 - THREE.MathUtils.smoothstep(p, 0.07, 0.22)
    g.visible = fade > 0.001
    const portrait = g.children[0] as THREE.Mesh
    const pmat = portrait?.material as THREE.MeshBasicMaterial | undefined
    if (pmat) pmat.opacity = fade

    if (!reduced) {
      const tx = pointer.current.nx * 0.18
      const ty = -pointer.current.ny * 0.12
      g.rotation.y += (tx - g.rotation.y) * 0.06
      g.rotation.x += (ty - g.rotation.x) * 0.06
      g.position.x += (2.3 + pointer.current.nx * 0.15 - g.position.x) * 0.06
    }
  })

  return null
}
