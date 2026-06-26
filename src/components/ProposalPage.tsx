import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type PaymentProvider = 'stripe' | 'mercado-pago'

type PrivateProposal = {
  folio: string
  createdAt: string
  validUntil: string
  serviceTitle: string
  serviceSubtitle: string
  clientName: string
  institution: string
  email: string
  phone: string
  investment: {
    label: string
    amount: string
    note: string
    breakdown: Array<{ label: string; value: string }>
  }
  scope: Array<{ title: string; body: string }>
  requirements: string[]
  nextSteps: string[]
  payment:
    | {
        status: 'enabled'
        method: 'checkout'
        reference: string
        checkoutOptions: Array<{
          provider: PaymentProvider
          label: string
          amount: {
            value: number
            currency: 'MXN' | 'USD'
          }
        }>
        note: string
        paidAt?: string
        paidProvider?: PaymentProvider
        providerPaymentId?: string
        calendarUrl?: string
      }
    | {
        status: 'discovery'
        calendarUrl: string
        note: string
      }
}

type ApiResponse = {
  ok: boolean
  proposal?: PrivateProposal
  message?: string
}

type PaymentCreateResponse = {
  ok: boolean
  checkoutUrl?: string
  message?: string
}

type Props = {
  folio: string
  token: string
}

export function ProposalPage({ folio, token }: Props) {
  const [proposal, setProposal] = useState<PrivateProposal | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetch(`/api/proposals/${encodeURIComponent(folio)}/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const result = (await response.json()) as ApiResponse
        if (!response.ok || !result.ok || !result.proposal) {
          throw new Error(result.message || 'No se pudo abrir la propuesta.')
        }
        if (active) setProposal(result.proposal)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo abrir la propuesta.')
      })

    return () => {
      active = false
    }
  }, [folio, token])

  if (error) {
    return (
      <main className="min-h-screen bg-ink px-6 py-12 text-paper">
        <div className="mx-auto max-w-3xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow">Propuesta privada</p>
          <h1 className="mt-4 font-display text-4xl font-semibold uppercase">No encontramos esta propuesta.</h1>
          <p className="mt-4 text-muted">{error}</p>
          <a href="/" className="mt-8 inline-flex rounded-full bg-yellow px-6 py-3 font-semibold text-ink">
            Volver a Oz Creativo
          </a>
        </div>
      </main>
    )
  }

  if (!proposal) {
    return (
      <main className="min-h-screen bg-ink px-6 py-12 text-paper">
        <div className="mx-auto max-w-3xl border border-yellow/30 bg-yellow/10 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow">Propuesta privada</p>
          <h1 className="mt-4 font-display text-4xl font-semibold uppercase">Cargando propuesta...</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="border-b border-white/10 px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <a href="/" className="font-display text-2xl font-semibold uppercase text-yellow">
            OZ CREATIVO
          </a>
          <div className="text-sm text-muted md:text-right">
            <p>Folio {proposal.folio}</p>
            <p>Vigencia: {formatDate(proposal.validUntil)}</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 md:px-10 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-yellow">Propuesta privada</p>
            <h1 className="mt-4 font-display text-5xl font-semibold uppercase leading-none md:text-7xl">
              {proposal.serviceTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {proposal.serviceSubtitle}
            </p>
          </div>

          <div className="border border-yellow/30 bg-yellow/10 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-yellow">{proposal.investment.label}</p>
            <p className="mt-3 font-display text-4xl font-semibold uppercase leading-none text-paper">
              {proposal.investment.amount}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-paper/80">{proposal.investment.note}</p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <Panel title="Datos">
              <DataRow label="Cliente" value={proposal.clientName} />
              <DataRow label="Institución" value={proposal.institution} />
              <DataRow label="Correo" value={proposal.email} />
              <DataRow label="Teléfono" value={proposal.phone} />
              <DataRow label="Emisión" value={formatDate(proposal.createdAt)} />
            </Panel>

            <Panel title="Desglose">
              {proposal.investment.breakdown.map((item) => (
                <DataRow key={item.label} label={item.label} value={item.value} />
              ))}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Alcance">
              <div className="space-y-5">
                {proposal.scope.map((item) => (
                  <div key={item.title}>
                    <h3 className="font-display text-xl font-semibold uppercase">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Requisitos">
              <BulletList items={proposal.requirements} />
            </Panel>

            <Panel title="Siguientes pasos">
              <BulletList items={proposal.nextSteps} />
            </Panel>

            <PaymentPanel proposal={proposal} token={token} />
          </div>
        </div>
      </section>
    </main>
  )
}

function PaymentPanel({ proposal, token }: { proposal: PrivateProposal; token: string }) {
  const [pendingProvider, setPendingProvider] = useState<PaymentProvider | ''>('')
  const [paymentError, setPaymentError] = useState('')

  if (proposal.payment.status === 'discovery') {
    return (
      <Panel title="Agenda">
        <p className="text-sm leading-relaxed text-muted">{proposal.payment.note}</p>
        <a
          href={proposal.payment.calendarUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-full bg-yellow px-6 py-3 font-semibold text-ink"
        >
          Agendar descubrimiento
        </a>
      </Panel>
    )
  }

  if (proposal.payment.paidAt) {
    return (
      <Panel title="Pago confirmado">
        <p className="text-sm leading-relaxed text-muted">
          El pago del folio {proposal.folio} ya quedó confirmado por {providerLabel(proposal.payment.paidProvider)}.
        </p>
        {proposal.payment.calendarUrl ? (
          <a
            href={proposal.payment.calendarUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full bg-yellow px-6 py-3 font-semibold text-ink"
          >
            Agendar sesión
          </a>
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-paper/80">
            El siguiente paso es contrato, coordinación y liberación de fecha por parte de Oz Creativo.
          </p>
        )}
      </Panel>
    )
  }

  const paymentHint = new URLSearchParams(window.location.search).get('payment') || ''
  const isReturningFromProvider = paymentHint.includes('success') || paymentHint === 'pending'

  async function startCheckout(provider: PaymentProvider) {
    setPaymentError('')
    setPendingProvider(provider)

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folio: proposal.folio,
          token,
          provider,
        }),
      })
      const result = (await response.json()) as PaymentCreateResponse

      if (!response.ok || !result.ok || !result.checkoutUrl) {
        throw new Error(result.message || 'No se pudo abrir el checkout.')
      }

      window.location.assign(result.checkoutUrl)
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'No se pudo abrir el checkout.')
      setPendingProvider('')
    }
  }

  return (
    <Panel title="Forma de pago">
      <p className="text-sm leading-relaxed text-muted">{proposal.payment.note}</p>
      {isReturningFromProvider ? (
        <p className="mt-4 border border-yellow/30 bg-yellow/10 px-4 py-3 text-sm leading-relaxed text-paper">
          Estamos confirmando el pago con el proveedor. Si ya quedó aprobado, actualiza esta página en unos segundos.
        </p>
      ) : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {proposal.payment.checkoutOptions.map((option) => (
          <button
            key={option.provider}
            type="button"
            onClick={() => startCheckout(option.provider)}
            disabled={pendingProvider !== ''}
            className="rounded-full border border-yellow/50 bg-yellow px-5 py-3 text-sm font-semibold text-ink transition hover:bg-paper disabled:cursor-wait disabled:opacity-60"
          >
            {pendingProvider === option.provider
              ? 'Abriendo checkout...'
              : `Pagar con ${providerLabel(option.provider)}`}
            <span className="block text-xs font-medium text-ink/70">
              {formatCheckoutAmount(option.amount.value, option.amount.currency)}
            </span>
          </button>
        ))}
      </div>
      {paymentError ? <p className="mt-4 text-sm text-yellow">{paymentError}</p> : null}
    </Panel>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <h2 className="font-display text-2xl font-semibold uppercase text-yellow">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-5 border-b border-white/10 py-3 text-sm last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="max-w-[62%] text-right font-semibold text-paper">{value || '-'}</span>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-relaxed text-muted">
      {items.map((item) => (
        <li key={item} className="border-l border-yellow/60 pl-4">
          {item}
        </li>
      ))}
    </ul>
  )
}

function providerLabel(provider?: PaymentProvider): string {
  if (provider === 'mercado-pago') return 'Mercado Pago'
  if (provider === 'stripe') return 'Stripe'
  return 'el proveedor de pago'
}

function formatCheckoutAmount(value: number, currency: 'MXN' | 'USD'): string {
  return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
  }).format(new Date(value))
}
