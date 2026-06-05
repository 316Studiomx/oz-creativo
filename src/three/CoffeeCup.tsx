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
 * Floating ceramic mug accent: a simple yellow cylinder with a clean circular
 * handle, built from native 3D geometry so the silhouette stays precise.
 */
export function CoffeeCup({ pointer, reduced }: Props) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = group.current
    if (!g) return

    // Drift away as the user scrolls past the hero
    const p = scroll.progress
    g.position.y = 0.55 - p * 3.4 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.06)
    g.position.x = 3.15 + Math.sin(p * Math.PI) * 0.5
    g.rotation.y = -0.22 + Math.sin(state.clock.elapsedTime * (reduced ? 0.12 : 0.28)) * 0.06

    if (!reduced) {
      // Gentle tilt toward the cursor while preserving the clean cylinder.
      const tx = pointer.current.nx * 0.12
      const ty = -pointer.current.ny * 0.08
      g.rotation.z += (tx - g.rotation.z) * 0.05
      g.rotation.x += (ty - g.rotation.x) * 0.05
    } else {
      g.rotation.x = 0
      g.rotation.z = 0
    }
  })

  return (
    <group ref={group} position={[3.15, 0.55, 0.5]} rotation={[0, -0.22, 0]} scale={0.72}>
      <mesh position={[0.78, 0.02, -0.04]}>
        <torusGeometry args={[0.34, 0.06, 28, 96]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellow}
          emissive={COLORS_HEX.yellowWarm}
          emissiveIntensity={0.12}
          roughness={0.42}
          metalness={0.02}
        />
      </mesh>

      <mesh>
        <cylinderGeometry args={[0.55, 0.55, 1.12, 128, 1, true]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellow}
          emissive={COLORS_HEX.yellowWarm}
          emissiveIntensity={0.11}
          roughness={0.4}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0.565, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.045, 24, 128]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellowWarm}
          emissive={COLORS_HEX.yellow}
          emissiveIntensity={0.08}
          roughness={0.38}
          metalness={0.02}
        />
      </mesh>

      <mesh position={[0, 0.535, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.46, 96]} />
        <meshStandardMaterial color={0x3f3300} roughness={0.72} metalness={0} />
      </mesh>

      <mesh position={[0, -0.565, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.51, 0.035, 18, 96]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellow}
          emissive={COLORS_HEX.yellowWarm}
          emissiveIntensity={0.08}
          roughness={0.42}
          metalness={0.02}
        />
      </mesh>

      {[
        [-0.22, 0.04, 0.568, 0.12, 0.88, 0.13],
        [0.14, 0.1, 0.57, 0.06, 0.75, 0.07],
      ].map(([x, y, z, width, height, opacity]) => (
        <mesh key={`${x}-${y}`} position={[x, y, z]} scale={[width, height, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={COLORS_HEX.paper}
            transparent
            opacity={opacity}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh position={[0.08, -0.68, -0.18]} scale={[1.18, 0.14, 1]}>
        <circleGeometry args={[0.6, 48]} />
        <meshBasicMaterial color={0x000000} transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}
