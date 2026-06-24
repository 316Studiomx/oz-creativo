import { Suspense, lazy, useEffect, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { Nav } from './components/Nav'
import { Cursor } from './components/Cursor'
import { Grain } from './components/Grain'
import { HeroBackdropFallback } from './components/HeroBackdropFallback'
import { LeadFormModal } from './components/LeadFormModal'
import { ProposalPage } from './components/ProposalPage'
import { Hero } from './sections/Hero'
import { Stats } from './sections/Stats'
import { About } from './sections/About'
import { Book } from './sections/Book'
import { Services } from './sections/Services'
import { Track } from './sections/Track'
import { Contact } from './sections/Contact'
import { scroll } from './three/scrollStore'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useIsMobile } from './hooks/useIsMobile'

gsap.registerPlugin(ScrollTrigger)

// Heavy WebGL is code-split so first paint never waits on three.js.
const Scene = lazy(() => import('./three/Scene'))

export default function App() {
  const proposalRoute = getProposalRoute(window.location.pathname)
  const reduced = useReducedMotion()
  const isMobile = useIsMobile()
  const use3D = !isMobile // reduced-motion still gets a calm 3D version
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  useEffect(() => {
    // Smooth scroll. Reduced motion → near-instant (no easing).
    const lenis = new Lenis({
      lerp: reduced ? 1 : 0.1,
      smoothWheel: !reduced,
    })

    const update = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    // Feed scroll progress to the 3D store + keep ScrollTrigger in sync.
    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      scroll.progress = e.progress
      scroll.velocity = e.velocity
      ScrollTrigger.update()
    })

    return () => {
      gsap.ticker.remove(update)
      lenis.destroy()
    }
  }, [reduced])

  if (proposalRoute) {
    return (
      <>
        <Cursor />
        <Grain />
        <ProposalPage folio={proposalRoute.folio} token={proposalRoute.token} />
      </>
    )
  }

  return (
    <>
      <Cursor />
      <Grain />
      <Nav onOpenForm={() => setLeadFormOpen(true)} />
      <LeadFormModal open={leadFormOpen} onClose={() => setLeadFormOpen(false)} />

      {use3D ? (
        <Suspense fallback={<HeroBackdropFallback />}>
          <Scene reduced={reduced} />
        </Suspense>
      ) : (
        <HeroBackdropFallback />
      )}

      <main className="relative z-10">
        <Hero onOpenForm={() => setLeadFormOpen(true)} />
        <Stats />
        <About />
        <Book />
        <Services onOpenForm={() => setLeadFormOpen(true)} />
        <Track />
        <Contact onOpenForm={() => setLeadFormOpen(true)} />
      </main>
    </>
  )
}

function getProposalRoute(pathname: string): { folio: string; token: string } | null {
  const [, route, folio, token] = pathname.split('/')
  if (route !== 'propuesta' || !folio || !token) {
    return null
  }

  return { folio, token }
}
