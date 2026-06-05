/**
 * Lightweight, GPU-cheap stand-in for the WebGL hero used on mobile / low-power
 * / reduced-motion. Pure CSS: studio gradient glow + a floating coffee-cup motif.
 */
export function HeroBackdropFallback() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      {/* soft radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 75% 40%, rgba(255,212,0,0.12), transparent 70%)',
        }}
      />
      {/* floating coffee-cup motif */}
      <div className="absolute right-[10%] top-[28%] animate-float text-yellow opacity-80 glow-yellow">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" />
          <path d="M16 10h2.5a2.5 2.5 0 0 1 0 5H16" />
          <path d="M6 9a5.8 1.6 0 0 0 10 0" />
        </svg>
      </div>
    </div>
  )
}
