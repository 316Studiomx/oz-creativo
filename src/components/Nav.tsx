import { useEffect, useState } from 'react'
import { COPY } from '../config/copy'
import { Magnetic } from './Magnetic'

type Props = {
  onOpenForm: () => void
}

export function Nav({ onOpenForm }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-ink/70 py-3 backdrop-blur-md' : 'py-5'
      }`}
    >
      <nav className="container-x flex items-center justify-between">
        <a href="#inicio" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <img src={COPY.brand.logo} alt="" className="h-7 w-7 rounded-full object-cover" aria-hidden />
          <span>{COPY.brand.name}</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 text-sm text-muted md:flex">
          {COPY.nav.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="link-underline transition-colors hover:text-paper">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Magnetic strength={0.35}>
            <button
              type="button"
              onClick={onOpenForm}
              className="rounded-full bg-yellow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              {COPY.nav.cta}
            </button>
          </Magnetic>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-6">
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-paper transition-transform duration-300 ${
                open ? 'top-1.5 rotate-45' : 'top-0'
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 block h-0.5 w-6 bg-paper transition-opacity ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-paper transition-transform duration-300 ${
                open ? 'top-1.5 -rotate-45' : 'top-3'
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden bg-ink/95 backdrop-blur-md transition-[max-height] duration-500 md:hidden ${
          open ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <ul className="container-x flex flex-col gap-5 py-6 text-lg">
          {COPY.nav.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="text-muted hover:text-paper">
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onOpenForm()
              }}
              className="inline-block rounded-full bg-yellow px-5 py-2.5 font-semibold text-ink"
            >
              {COPY.nav.cta}
            </button>
          </li>
        </ul>
      </div>
    </header>
  )
}
