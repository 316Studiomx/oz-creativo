import { useEffect } from 'react'
import { LeadForm } from './LeadForm'

type Props = {
  open: boolean
  onClose: () => void
}

export function LeadFormModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6 md:px-8">
      <button
        type="button"
        aria-label="Cerrar formulario"
        onClick={onClose}
        className="absolute inset-0 bg-ink/85 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Formulario de contacto"
        className="relative z-10 w-full max-w-5xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-ink text-xl leading-none text-paper transition-colors hover:border-yellow hover:text-yellow"
          aria-label="Cerrar formulario"
        >
          ×
        </button>
        <LeadForm />
      </div>
    </div>
  )
}
