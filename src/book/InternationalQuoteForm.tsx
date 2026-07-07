import { FormEvent, useState } from 'react'

import { postJson } from './api'
import { BOOK_STORE_COPY } from './bookCopy'

type QuoteFormState = {
  name: string
  email: string
  whatsapp: string
  country: string
  city: string
  postalCode: string
  quantity: number
  message: string
}

const INITIAL_QUOTE: QuoteFormState = {
  name: '',
  email: '',
  whatsapp: '',
  country: '',
  city: '',
  postalCode: '',
  quantity: 1,
  message: '',
}

export function InternationalQuoteForm() {
  const [form, setForm] = useState<QuoteFormState>(INITIAL_QUOTE)
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const updateField = (field: keyof QuoteFormState, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('sending')
    setMessage(null)

    const payload = {
      ...form,
      quantity: Math.min(50, Math.max(1, Math.trunc(form.quantity))),
      name: form.name.trim(),
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      message: form.message.trim(),
    }

    try {
      await postJson<{ ok: boolean; message?: string }>('/api/book/international-quotes', payload)
      setMessage(
        'Recibimos tu solicitud. Te responderemos con opciones de envío internacional antes de cobrar.',
      )
      setForm(INITIAL_QUOTE)
    } catch {
      setMessage(
        `Tu solicitud está lista para revisión. Escríbenos a ${BOOK_STORE_COPY.supportEmail} con tu país, ciudad, código postal y cantidad de libros.`,
      )
    } finally {
      setStatus('idle')
    }
  }

  return (
    <section className="container-x border-t border-white/10 py-16 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-yellow">Fuera de México</p>
          <h2 className="mt-4 font-display text-4xl font-semibold uppercase leading-none text-paper [letter-spacing:0] md:text-5xl">
            Cotización internacional
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            Por ahora las compras fuera de México se cotizan manualmente para confirmar costo,
            tiempos y disponibilidad antes del pago.
          </p>
          <div className="mt-6 flex max-w-xl flex-wrap gap-2">
            {BOOK_STORE_COPY.commonInternationalDestinations.map((destination) => (
              <span
                key={destination.country}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-paper/90"
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {destination.flag}
                </span>
                {destination.country}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <QuoteField
              label="Nombre"
              value={form.name}
              onChange={(value) => updateField('name', value)}
              required
            />
            <QuoteField
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => updateField('email', value)}
              required
            />
            <QuoteField
              label="WhatsApp"
              type="tel"
              value={form.whatsapp}
              onChange={(value) => updateField('whatsapp', value)}
              required
            />
            <QuoteField
              label="País"
              value={form.country}
              onChange={(value) => updateField('country', value)}
              required
            />
            <QuoteField
              label="Ciudad"
              value={form.city}
              onChange={(value) => updateField('city', value)}
              required
            />
            <QuoteField
              label="Código postal"
              value={form.postalCode}
              onChange={(value) => updateField('postalCode', value)}
              required
            />
            <label className="min-w-0">
              <span className="text-sm font-medium text-paper">Cantidad</span>
              <input
                type="number"
                min={1}
                max={50}
                value={form.quantity}
                onChange={(event) => updateField('quantity', Number(event.target.value))}
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-ink/80 px-4 py-3 text-paper outline-none transition-colors focus:border-yellow"
              />
            </label>
            <label className="min-w-0 md:col-span-2">
              <span className="text-sm font-medium text-paper">
                Mensaje <span className="text-muted">opcional</span>
              </span>
              <textarea
                value={form.message}
                onChange={(event) => updateField('message', event.target.value)}
                className="mt-2 min-h-28 w-full resize-y rounded-lg border border-white/10 bg-ink/80 px-4 py-3 text-paper outline-none transition-colors focus:border-yellow"
              />
            </label>
          </div>

          {message ? <p className="text-sm leading-relaxed text-yellow">{message}</p> : null}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex justify-center rounded-full border border-yellow/50 px-6 py-3 font-semibold text-yellow transition-colors hover:bg-yellow hover:text-ink disabled:cursor-wait disabled:opacity-70"
          >
            {status === 'sending' ? 'Preparando solicitud...' : 'Solicitar cotización'}
          </button>
        </form>
      </div>
    </section>
  )
}

function QuoteField(props: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-paper">{props.label}</span>
      <input
        type={props.type || 'text'}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        required={props.required}
        className="mt-2 w-full rounded-lg border border-white/10 bg-ink/80 px-4 py-3 text-paper outline-none transition-colors focus:border-yellow"
      />
    </label>
  )
}
