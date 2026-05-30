import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS_HEX } from '../config/tokens'
import { scroll } from './scrollStore'
import type { Pointer } from '../hooks/usePointer'

type Props = {
  pointer: React.MutableRefObject<Pointer>
  reduced: boolean
}

/**
 * Floating coffee mug accent (replaces the old asterisk). Yellow ceramic with a
 * dark coffee surface, a handle, and a couple of subtle rising steam puffs.
 * Slow spin + cursor tilt + scroll drift, same behavior as the previous accent.
 */
export function CoffeeCup({ pointer, reduced }: Props) {
  const group = useRef<THREE.Group>(null)
  const steam = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    // Slow turn so the handle sweeps past
    g.rotation.y += delta * (reduced ? 0.05 : 0.4)

    // Drift away as the user scrolls past the hero
    const p = scroll.progress
    g.position.y = 0.55 - p * 3.4 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.06)
    g.position.x = 3.15 + Math.sin(p * Math.PI) * 0.5

    if (!reduced) {
      // Gentle tilt toward the cursor (kept small so it never "spills")
      const tx = pointer.current.nx * 0.25
      const ty = -pointer.current.ny * 0.2
      g.rotation.z += (tx - g.rotation.z) * 0.05
      g.rotation.x += (ty - g.rotation.x) * 0.05

      // Rising, fading steam
      if (steam.current) {
        steam.current.children.forEach((puff, i) => {
          const m = puff as THREE.Mesh
          const t = (state.clock.elapsedTime * 0.5 + i * 0.5) % 1
          m.position.y = 0.7 + t * 0.9
          m.position.x = Math.sin(t * Math.PI * 2 + i) * 0.1
          const mat = m.material as THREE.MeshBasicMaterial
          mat.opacity = (1 - t) * 0.25
          const s = 0.12 + t * 0.18
          m.scale.set(s, s, s)
        })
      }
    }
  })

  return (
    <group ref={group} position={[3.15, 0.55, 0.5]} scale={0.55}>
      {/* Mug body (tapered) */}
      <mesh>
        <cylinderGeometry args={[0.85, 0.68, 1.1, 40, 1, false]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellow}
          emissive={COLORS_HEX.yellow}
          emissiveIntensity={0.35}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Coffee surface, sunk just below the rim */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 40]} />
        <meshStandardMaterial color={0x241308} roughness={0.25} metalness={0.2} />
      </mesh>

      {/* Handle */}
      <mesh position={[0.95, 0, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.4, 0.1, 16, 32]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellow}
          emissive={COLORS_HEX.yellow}
          emissiveIntensity={0.35}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Steam */}
      <group ref={steam} position={[0, 0, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.7, 0]}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial
              color={COLORS_HEX.paper}
              transparent
              opacity={0.2}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
