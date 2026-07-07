import { FormEvent, useMemo, useState } from 'react'

import { postJson } from './api'
import { BOOK_STORE_COPY } from './bookCopy'

type CheckoutResponse = {
  ok: boolean
  checkoutUrl?: string
  message?: string
}

type CheckoutFormState = {
  quantity: number
  coupon: string
  name: string
  email: string
  phone: string
  street: string
  exterior: string
  interior: string
  neighborhood: string
  city: string
  state: string
  postalCode: string
  references: string
}

const INITIAL_FORM: CheckoutFormState = {
  quantity: 1,
  coupon: '',
  name: '',
  email: '',
  phone: '',
  street: '',
  exterior: '',
  interior: '',
  neighborhood: '',
  city: '',
  state: '',
  postalCode: '',
  references: '',
}

export function BookCheckoutForm() {
  const [form, setForm] = useState<CheckoutFormState>(INITIAL_FORM)
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const subtotal = useMemo(
    () => BOOK_STORE_COPY.unitPrice * clampQuantity(form.quantity),
    [form.quantity],
  )

  const updateField = (field: keyof CheckoutFormState, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setMessage(null)

    const quantity = clampQuantity(form.quantity)
    const payload = {
      quantity,
      couponCode: form.coupon.trim(),
      customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      address: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        exteriorNumber: form.exterior.trim(),
        interiorNumber: form.interior.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        references: form.references.trim(),
      },
    }

    try {
      const result = await postJson<CheckoutResponse>(
        '/api/book/checkout/create-session',
        payload,
      )

      if (result.checkoutUrl) {
        const checkoutUrl = safeCheckoutUrl(result.checkoutUrl)
        if (!checkoutUrl) {
          setMessage('Stripe devolvió un link de pago inválido. Escríbenos para ayudarte.')
          return
        }

        window.location.href = checkoutUrl
        return
      }

      setMessage(result.message || 'No recibimos el link de pago. Escríbenos para ayudarte.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar el pago.')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full border border-yellow/30 bg-ink/90 p-5 shadow-[0_0_48px_rgba(255,212,0,0.12)] md:p-6 lg:sticky lg:top-6"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-yellow">Compra nacional</p>
          <h2 className="mt-2 font-display text-3xl font-semibold uppercase leading-none text-paper [letter-spacing:0]">
            {BOOK_STORE_COPY.price}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Envío gratis dentro de México. Pago seguro por Stripe.
          </p>
        </div>
        <div className="rounded-lg border border-yellow/35 bg-yellow/10 px-4 py-3 text-sm font-semibold text-yellow">
          Envío gratis dentro de México
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-1">
          <span className="text-sm font-medium text-paper">Cantidad</span>
          <select
            value={form.quantity}
            onChange={(event) => updateField('quantity', Number(event.target.value))}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-paper outline-none transition-colors focus:border-yellow"
          >
            {Array.from({ length: 10 }, (_, index) => index + 1).map((quantity) => (
              <option key={quantity} value={quantity} className="bg-ink text-paper">
                {quantity}
              </option>
            ))}
          </select>
        </label>

        <Field
          label="Cupón"
          value={form.coupon}
          onChange={(value) => updateField('coupon', value)}
          autoComplete="off"
          optional
        />
      </div>

      <div className="mt-5 border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-paper/90">
        <div className="flex items-center justify-between gap-4">
          <span>{clampQuantity(form.quantity)} x libro físico</span>
          <strong>${subtotal.toLocaleString('es-MX')} MXN</strong>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 text-muted">
          <span>Envío nacional</span>
          <span>$0 MXN</span>
        </div>
        {form.coupon.trim() ? (
          <p className="mt-3 text-xs leading-relaxed text-yellow">
            El cupón se validará al crear el checkout.
          </p>
        ) : null}
      </div>

      <fieldset className="mt-6 grid gap-4">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-yellow">
          Datos de contacto
        </legend>
        <Field
          label="Nombre completo"
          value={form.name}
          onChange={(value) => updateField('name', value)}
          autoComplete="name"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => updateField('email', value)}
            autoComplete="email"
            required
          />
          <Field
            label="Teléfono"
            type="tel"
            value={form.phone}
            onChange={(value) => updateField('phone', value)}
            autoComplete="tel"
            required
          />
        </div>
      </fieldset>

      <fieldset className="mt-6 grid gap-4">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-yellow">
          Dirección de envío
        </legend>
        <Field
          label="Calle"
          value={form.street}
          onChange={(value) => updateField('street', value)}
          autoComplete="address-line1"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Número exterior"
            value={form.exterior}
            onChange={(value) => updateField('exterior', value)}
            autoComplete="address-line2"
            required
          />
          <Field
            label="Interior"
            value={form.interior}
            onChange={(value) => updateField('interior', value)}
            optional
          />
        </div>
        <Field
          label="Colonia"
          value={form.neighborhood}
          onChange={(value) => updateField('neighborhood', value)}
          required
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Ciudad"
            value={form.city}
            onChange={(value) => updateField('city', value)}
            autoComplete="address-level2"
            required
          />
          <Field
            label="Estado"
            value={form.state}
            onChange={(value) => updateField('state', value)}
            autoComplete="address-level1"
            required
          />
          <Field
            label="C.P."
            value={form.postalCode}
            onChange={(value) => updateField('postalCode', value)}
            autoComplete="postal-code"
            inputMode="numeric"
            pattern="[0-9]{5}"
            required
          />
        </div>
        <TextArea
          label="Referencias"
          value={form.references}
          onChange={(value) => updateField('references', value)}
          optional
        />
      </fieldset>

      {message ? (
        <p className="mt-5 border border-yellow/30 bg-yellow/10 px-4 py-3 text-sm leading-relaxed text-paper">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-yellow px-6 py-4 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70 md:text-base"
      >
        {status === 'submitting' ? 'Creando checkout...' : 'Comprar con Stripe'}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Tus datos se usan para preparar el pedido y enviarte la confirmación por correo.
      </p>
    </form>
  )
}

function Field(props: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  optional?: boolean
  autoComplete?: string
  inputMode?: 'numeric' | 'text' | 'tel' | 'email'
  pattern?: string
}) {
  return (
    <label className="min-w-0">
      <span className="text-sm font-medium text-paper">
        {props.label}
        {props.optional ? <span className="text-muted"> opcional</span> : null}
      </span>
      <input
        type={props.type || 'text'}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        required={props.required}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        pattern={props.pattern}
        className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-paper outline-none transition-colors placeholder:text-muted focus:border-yellow"
      />
    </label>
  )
}

function TextArea(props: {
  label: string
  value: string
  onChange: (value: string) => void
  optional?: boolean
}) {
  return (
    <label>
      <span className="text-sm font-medium text-paper">
        {props.label}
        {props.optional ? <span className="text-muted"> opcional</span> : null}
      </span>
      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="mt-2 min-h-24 w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-paper outline-none transition-colors placeholder:text-muted focus:border-yellow"
      />
    </label>
  )
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(10, Math.max(1, Math.trunc(value)))
}

function safeCheckoutUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol === 'javascript:') return null
    if (url.protocol === 'https:') return url.toString()
    if (url.protocol === 'http:' && url.hostname === 'localhost') return url.toString()
    return null
  } catch {
    return null
  }
}
