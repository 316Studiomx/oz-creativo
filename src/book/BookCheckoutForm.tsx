import { FormEvent, useMemo, useState } from 'react'

import { postJson } from './api'
import { BOOK_STORE_COPY } from './bookCopy'

type CheckoutResponse = {
  ok: boolean
  checkoutUrl?: string
  message?: string
}

type BookTotals = {
  currency: 'MXN'
  quantity: number
  unitPriceCents: number
  subtotalCents: number
  volumeDiscountPercent: number
  volumeDiscountCents: number
  couponCode: string | null
  couponDiscountCents: number
  totalDiscountCents: number
  shippingChargedCents: number
  totalCents: number
  discountLabel: string | null
}

type CouponValidationResponse = {
  ok: boolean
  totals?: BookTotals
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
  const [couponStatus, setCouponStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>(
    'idle',
  )
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [couponTotals, setCouponTotals] = useState<BookTotals | null>(null)

  const quantity = clampQuantity(form.quantity)
  const fallbackTotals = useMemo(
    () => buildFrontendEstimate(quantity),
    [form.quantity],
  )
  const activeCouponTotals =
    couponTotals &&
    couponTotals.quantity === quantity &&
    couponTotals.couponCode === form.coupon.trim().toUpperCase()
      ? couponTotals
      : null
  const displayedTotals = activeCouponTotals || fallbackTotals

  const updateField = (field: keyof CheckoutFormState, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'coupon' || field === 'quantity' || field === 'email') {
      setCouponStatus('idle')
      setCouponMessage(null)
      setCouponTotals(null)
    }
  }

  const handleValidateCoupon = async () => {
    const couponCode = form.coupon.trim()
    if (!couponCode) {
      setCouponStatus('invalid')
      setCouponMessage('Escribe un cupón antes de aplicarlo.')
      setCouponTotals(null)
      return
    }

    setCouponStatus('validating')
    setCouponMessage(null)

    try {
      const result = await postJson<CouponValidationResponse>('/api/book/coupons/validate', {
        quantity,
        couponCode,
        email: form.email.trim() || undefined,
      })

      if (!result.totals) {
        setCouponStatus('invalid')
        setCouponTotals(null)
        setCouponMessage(result.message || 'No se pudo validar el cupón.')
        return
      }

      setCouponStatus('valid')
      setCouponTotals(result.totals)
      setCouponMessage('Cupón aplicado. El total final se confirmará al crear el checkout.')
    } catch (error) {
      setCouponStatus('invalid')
      setCouponTotals(null)
      setCouponMessage(error instanceof Error ? error.message : 'No se pudo validar el cupón.')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setMessage(null)

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

        <div className="min-w-0 sm:col-span-1">
          <label>
            <span className="text-sm font-medium text-paper">
              Cupón <span className="text-muted">opcional</span>
            </span>
            <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={form.coupon}
                onChange={(event) => updateField('coupon', event.target.value)}
                autoComplete="off"
                className="w-full min-w-0 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-paper outline-none transition-colors placeholder:text-muted focus:border-yellow"
              />
              <button
                type="button"
                onClick={handleValidateCoupon}
                disabled={couponStatus === 'validating'}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-yellow/45 px-4 py-3 text-sm font-semibold text-yellow transition-colors hover:bg-yellow hover:text-ink disabled:cursor-wait disabled:opacity-70"
              >
                {couponStatus === 'validating' ? 'Validando...' : 'Aplicar cupón'}
              </button>
            </div>
          </label>
          {couponMessage ? (
            <p
              className={`mt-2 text-xs leading-relaxed ${
                couponStatus === 'invalid' ? 'text-paper' : 'text-yellow'
              }`}
            >
              {couponMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-paper/90">
        <div className="flex items-center justify-between gap-4">
          <span>{quantity} x libro físico</span>
          <strong>{formatMoney(displayedTotals.subtotalCents)}</strong>
        </div>
        {displayedTotals.volumeDiscountCents > 0 ? (
          <div className="mt-2 flex items-center justify-between gap-4 text-muted">
            <span>Descuento por volumen</span>
            <span>-{formatMoney(displayedTotals.volumeDiscountCents)}</span>
          </div>
        ) : null}
        {activeCouponTotals?.couponCode ? (
          <div className="mt-2 flex items-center justify-between gap-4 text-yellow">
            <span>Cupón {activeCouponTotals.couponCode}</span>
            <span>-{formatMoney(activeCouponTotals.couponDiscountCents)}</span>
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-4 text-muted">
          <span>Envío nacional</span>
          <span>{formatMoney(displayedTotals.shippingChargedCents)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-base text-paper">
          <span>Total estimado</span>
          <strong>{formatMoney(displayedTotals.totalCents)}</strong>
        </div>
        {!form.coupon.trim() ? (
          <p className="mt-3 text-xs leading-relaxed text-yellow">
            Descuento por volumen: 10% desde 5 libros y 20% al comprar 10.
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

function buildFrontendEstimate(quantity: number): BookTotals {
  const subtotalCents = quantity * BOOK_STORE_COPY.unitPrice * 100
  const volumeDiscountPercent = getVolumeDiscountPercent(quantity)
  const volumeDiscountCents = Math.round((subtotalCents * volumeDiscountPercent) / 100)

  return {
    currency: 'MXN',
    quantity,
    unitPriceCents: BOOK_STORE_COPY.unitPrice * 100,
    subtotalCents,
    volumeDiscountPercent,
    volumeDiscountCents,
    couponCode: null,
    couponDiscountCents: 0,
    totalDiscountCents: volumeDiscountCents,
    shippingChargedCents: 0,
    totalCents: Math.max(0, subtotalCents - volumeDiscountCents),
    discountLabel: volumeDiscountCents > 0 ? 'Descuento por volumen' : null,
  }
}

function getVolumeDiscountPercent(quantity: number): number {
  if (quantity === 10) return 20
  if (quantity >= 5) return 10
  return 0
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(cents / 100)
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
