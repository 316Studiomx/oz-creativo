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
  const { bodyShape, handleShape, extrudeSettings } = useMemo(() => {
    const body = new THREE.Shape()
    body.moveTo(-0.68, 0.52)
    body.bezierCurveTo(-0.68, 0.66, 0.68, 0.66, 0.68, 0.52)
    body.lineTo(0.68, -0.5)
    body.bezierCurveTo(0.68, -0.64, -0.68, -0.64, -0.68, -0.5)
    body.lineTo(-0.68, 0.52)

    const handle = new THREE.Shape()
    handle.absellipse(0.9, 0.02, 0.43, 0.5, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absellipse(0.91, 0.02, 0.27, 0.35, 0, Math.PI * 2, true)
    handle.holes.push(hole)

    return {
      bodyShape: body,
      handleShape: handle,
      extrudeSettings: {
        depth: 0.18,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.028,
        bevelSegments: 6,
        curveSegments: 48,
      },
    }
  }, [])

  useFrame((state) => {
    const g = group.current
    if (!g) return

    // Drift away as the user scrolls past the hero
    const p = scroll.progress
    g.position.y = 0.55 - p * 3.4 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.06)
    g.position.x = 3.15 + Math.sin(p * Math.PI) * 0.5
    g.rotation.y = 0.16 + Math.sin(state.clock.elapsedTime * (reduced ? 0.12 : 0.28)) * 0.05

    if (!reduced) {
      // Gentle tilt toward the cursor while keeping the frontal silhouette.
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
    <group ref={group} position={[3.15, 0.55, 0.5]} rotation={[0, 0.16, 0]} scale={0.58}>
      {/* The handle sits slightly behind the body so the body masks its left side. */}
      <mesh position={[0, 0, -0.08]}>
        <extrudeGeometry args={[handleShape, extrudeSettings]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellow}
          emissive={COLORS_HEX.yellowWarm}
          emissiveIntensity={0.08}
          roughness={0.58}
          metalness={0.02}
        />
      </mesh>

      {/* Main 2D mug silhouette extruded into a ceramic slab. */}
      <mesh position={[0, 0, 0]}>
        <extrudeGeometry args={[bodyShape, extrudeSettings]} />
        <meshStandardMaterial
          color={COLORS_HEX.yellow}
          emissive={COLORS_HEX.yellowWarm}
          emissiveIntensity={0.1}
          roughness={0.54}
          metalness={0.02}
        />
      </mesh>

      {/* Top opening and rim, kept subtle like the 2D reference. */}
      <mesh position={[0, 0.54, 0.205]} scale={[1.05, 0.25, 1]}>
        <circleGeometry args={[0.52, 72]} />
        <meshBasicMaterial color={0x8c7700} transparent opacity={0.34} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.55, 0.215]} scale={[1.05, 0.25, 1]}>
        <torusGeometry args={[0.52, 0.035, 16, 72]} />
        <meshStandardMaterial color={COLORS_HEX.yellowWarm} roughness={0.5} metalness={0.02} />
      </mesh>

      {/* Soft vertical highlights from the flat artwork. */}
      {[
        [-0.24, 0.08, 0.18, 0.95, 0.08],
        [0.22, 0.12, 0.12, 0.9, 0.04],
      ].map(([x, y, opacity, height, width]) => (
        <mesh key={`${x}-${y}`} position={[x, y, 0.23]} scale={[width, height, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={COLORS_HEX.paper}
            transparent
            opacity={opacity}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh position={[0.08, -0.68, -0.16]} scale={[1.28, 0.14, 1]}>
        <circleGeometry args={[0.6, 48]} />
        <meshBasicMaterial color={0x000000} transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}
