import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, Preload } from '@react-three/drei'
import { COLORS_HEX } from '../config/tokens'
import { CoffeeCup } from './CoffeeCup'
import { Particles } from './Particles'
import { CursorLight } from './CursorLight'
import { HeroPortrait } from './HeroPortrait'
import { usePointer } from '../hooks/usePointer'

/**
 * Single global WebGL stage. Fixed behind the DOM; everything reacts to the
 * shared scroll progress + pointer. Mounted lazily via Suspense from App.
 */
export default function Scene({ reduced }: { reduced: boolean }) {
  const pointer = usePointer()

  return (
    <Canvas
      className="!fixed inset-0"
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 6], fov: 42 }}
    >
      <color attach="background" args={[COLORS_HEX.ink]} />
      <fog attach="fog" args={[COLORS_HEX.ink, 6, 14]} />

      {/* Lighting: dim ambient + warm key from the cursor + a cool rim */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 4, 3]} intensity={0.6} color={COLORS_HEX.paper} />
      <CursorLight pointer={pointer} />

      <HeroPortrait pointer={pointer} reduced={reduced} imageUrl="/assets/retrato.png" />
      <CoffeeCup pointer={pointer} reduced={reduced} />
      <Particles reduced={reduced} count={reduced ? 60 : 140} />

      <AdaptiveDpr pixelated />
      <Preload all />
    </Canvas>
  )
}
