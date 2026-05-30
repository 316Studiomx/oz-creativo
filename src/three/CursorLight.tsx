import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS_HEX, MOTION } from '../config/tokens'
import type { Pointer } from '../hooks/usePointer'

/** A warm yellow point light that trails the cursor across the 3D stage. */
export function CursorLight({ pointer }: { pointer: React.MutableRefObject<Pointer> }) {
  const ref = useRef<THREE.PointLight>(null)
  const { viewport } = useThree()

  useFrame(() => {
    const l = ref.current
    if (!l) return
    const targetX = (pointer.current.nx * viewport.width) / 2
    const targetY = (-pointer.current.ny * viewport.height) / 2
    l.position.x += (targetX - l.position.x) * MOTION.lerp
    l.position.y += (targetY - l.position.y) * MOTION.lerp
  })

  return (
    <pointLight
      ref={ref}
      color={COLORS_HEX.yellowWarm}
      intensity={28}
      distance={9}
      decay={2}
      position={[0, 0, 2.5]}
    />
  )
}
