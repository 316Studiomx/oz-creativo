import { useEffect, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, WheelEvent as ReactWheelEvent } from 'react'
import { LeadForm } from './LeadForm'

type Props = {
  open: boolean
  onClose: () => void
}

export function LeadFormModal({ open, onClose }: Props) {
  const dialog = useRef<HTMLDivElement>(null)

  const scrollDialog = (amount: number) => {
    if (!dialog.current) return
    dialog.current.scrollTop += amount
  }

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    scrollDialog(event.deltaY)
  }

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return

    const page = dialog.current ? dialog.current.clientHeight * 0.82 : 520
    const keyMap: Record<string, number> = {
      ArrowDown: 72,
      ArrowUp: -72,
      PageDown: page,
      PageUp: -page,
      Home: Number.NEGATIVE_INFINITY,
      End: Number.POSITIVE_INFINITY,
    }

    const amount = keyMap[event.key]
    if (amount === undefined) return

    event.preventDefault()
    if (amount === Number.NEGATIVE_INFINITY) {
      dialog.current?.scrollTo({ top: 0 })
    } else if (amount === Number.POSITIVE_INFINITY) {
      dialog.current?.scrollTo({ top: dialog.current.scrollHeight })
    } else {
      scrollDialog(amount)
    }
  }

  useEffect(() => {
    if (!open) return

    requestAnimationFrame(() => {
      dialog.current?.focus()
      dialog.current?.scrollTo({ top: 0 })
    })

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
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-4 md:px-8 md:py-6">
      <button
        type="button"
        aria-label="Cerrar formulario"
        onClick={onClose}
        className="fixed inset-0 bg-ink/85 backdrop-blur-sm"
      />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Solicitud de propuesta"
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
        onWheel={onWheel}
        className="relative z-10 mx-auto max-h-[calc(100svh-2rem)] w-full max-w-5xl overflow-y-auto overscroll-contain outline-none md:max-h-[calc(100svh-3rem)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="fixed right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-ink text-xl leading-none text-paper transition-colors hover:border-yellow hover:text-yellow md:right-6 md:top-6"
          aria-label="Cerrar formulario"
        >
          ×
        </button>
        <LeadForm />
      </div>
    </div>
  )
}
