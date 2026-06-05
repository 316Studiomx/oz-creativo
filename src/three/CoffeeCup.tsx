import { useMemo, useRef } from 'react'
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
 * Floating ceramic mug accent. Clean yellow form inspired by a simple 3D cup:
 * rounded rim, shaded hollow interior, and a soft C-shaped handle.
 */
export function CoffeeCup({ pointer, reduced }: Props) {
  const group = useRef<THREE.Group>(null)
  const handleJoins = useMemo(
    () =>
      ({
        topJoin: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.66, 0.27, 0.03),
          new THREE.Vector3(-0.78, 0.29, 0.1),
          new THREE.Vector3(-0.93, 0.26, 0.16),
        ]),
        bottomJoin: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.66, -0.28, 0.03),
          new THREE.Vector3(-0.78, -0.3, 0.1),
          new THREE.Vector3(-0.93, -0.28, 0.16),
        ]),
      }),
    []
  )

  useFrame((state) => {
    const g = group.current
    if (!g) return

    // Drift away as the user scrolls past the hero
    const p = scroll.progress
    g.position.y = 0.55 - p * 3.4 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.06)
    g.position.x = 3.15 + Math.sin(p * Math.PI) * 0.5
    g.rotation.y = -0.64 + Math.sin(state.clock.elapsedTime * (reduced ? 0.12 : 0.28)) * 0.1

    if (!reduced) {
      // Gentle tilt toward the cursor (kept small so it never "spills")
      const tx = pointer.current.nx * 0.18
      const ty = 0.32 - pointer.current.ny * 0.14
      g.rotation.z += (tx - g.rotation.z) * 0.05
      g.rotation.x += (ty - g.rotation.x) * 0.05
    } else {
      g.rotation.x = 0.32
      g.rotation.z = 0
    }
  })

  return (
    <group ref={group} position={[3.15, 0.55, 0.5]} rotation={[0.32, -0.64, 0]} scale={0.55}>
      {/* Matte ceramic body, slightly narrower at the base like the reference. */}
      <mesh>
        <cylinderGeometry args={[0.78, 0.7, 1.18, 72, 8, true]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellow}
          emissive={COLORS_HEX.yellowWarm}
          emissiveIntensity={0.08}
          roughness={0.62}
          metalness={0.02}
        />
      </mesh>

      {/* Thick rounded lip and a subtle foot ring make the silhouette less flat. */}
      <mesh position={[0, 0.61, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.065, 20, 72]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellowWarm}
          emissive={COLORS_HEX.yellow}
          emissiveIntensity={0.06}
          roughness={0.56}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.61, 0.035, 14, 72]} />
        <meshStandardMaterial color={COLORS_HEX.yellow} roughness={0.68} metalness={0.02} />
      </mesh>

      {/* Shaded hollow interior, kept yellow-gray instead of coffee-dark. */}
      <mesh position={[0, 0.57, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 72]} />
        <meshStandardMaterial color={0xc8b545} roughness={0.72} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.62, 0.54, 0.16, 72, 1, true]} />
        <meshStandardMaterial
          color={0xbda923}
          side={THREE.BackSide}
          roughness={0.78}
          metalness={0.02}
        />
      </mesh>

      {/* C-shaped handle like the reference, built from a visible oval plus ceramic joins. */}
      <mesh position={[-1.17, -0.01, 0.17]} scale={[0.72, 1.08, 0.92]}>
        <torusGeometry args={[0.38, 0.095, 24, 72]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellow}
          emissive={COLORS_HEX.yellowWarm}
          emissiveIntensity={0.08}
          roughness={0.6}
          metalness={0.02}
        />
      </mesh>
      {[handleJoins.topJoin, handleJoins.bottomJoin].map((curve, index) => (
        <mesh key={index === 0 ? 'top-handle-join' : 'bottom-handle-join'}>
          <tubeGeometry args={[curve, 24, 0.105, 22, false]} />
          <meshStandardMaterial
            color={COLORS_HEX.yellowWarm}
            emissive={COLORS_HEX.yellow}
            emissiveIntensity={0.06}
            roughness={0.58}
            metalness={0.02}
          />
        </mesh>
      ))}
      {[
        [-0.68, 0.27, 0.03, 0.24, 0.14, 0.18],
        [-0.68, -0.28, 0.03, 0.24, 0.14, 0.18],
      ].map(([x, y, z, sx, sy, sz]) => (
        <mesh key={`${x}-${y}`} position={[x, y, z]} scale={[sx, sy, sz]}>
          <sphereGeometry args={[1, 28, 18]} />
          <meshStandardMaterial
            color={COLORS_HEX.yellowWarm}
            emissive={COLORS_HEX.yellow}
            emissiveIntensity={0.06}
            roughness={0.58}
            metalness={0.02}
          />
        </mesh>
      ))}
    </group>
  )
}
