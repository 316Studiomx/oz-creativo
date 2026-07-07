import { useEffect, useState } from 'react'

import { AdminPanelMessage, AdminSection, StatusPill, formatDate, readAdminResponse } from './AdminApp'

type LeadStatus = 'nuevo' | 'cotizado' | 'esperando_respuesta' | 'convertido' | 'cerrado'

type InternationalLead = {
  id: number
  name: string
  email: string
  whatsapp: string
  country: string
  city: string
  postalCode: string
  quantity: number
  message: string | null
  status: LeadStatus
  notes: string | null
  createdAt: string
}

type LeadsResponse = {
  ok?: boolean
  message?: string
  leads?: InternationalLead[]
  lead?: InternationalLead
}

const statuses: LeadStatus[] = ['nuevo', 'cotizado', 'esperando_respuesta', 'convertido', 'cerrado']

export function AdminInternationalQuotes() {
  const [leads, setLeads] = useState<InternationalLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetch('/api/book/admin/international-quotes', {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await readAdminResponse<LeadsResponse>(response)
        if (!active) return

        if (!response.ok || !payload.leads) {
          setError(payload.message || 'No se pudo cargar cotizaciones internacionales.')
          return
        }

        setLeads(payload.leads)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar cotizaciones internacionales.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const updateLead = (lead: InternationalLead) => {
    setLeads((items) => items.map((item) => (item.id === lead.id ? lead : item)))
  }

  if (loading) return <AdminPanelMessage title="Cargando cotizaciones internacionales..." />
  if (error && leads.length === 0) return <AdminPanelMessage title={error} tone="error" />
  if (leads.length === 0) return <AdminPanelMessage title="Aun no hay leads internacionales." />

  return (
    <div className="grid gap-4">
      {error ? <AdminPanelMessage title={error} tone="error" /> : null}
      <AdminSection title="Cotizaciones internacionales">
        <div className="grid gap-3">
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} onUpdated={updateLead} />
          ))}
        </div>
      </AdminSection>
    </div>
  )
}

function LeadRow({
  lead,
  onUpdated,
}: {
  lead: InternationalLead
  onUpdated: (lead: InternationalLead) => void
}) {
  const [status, setStatus] = useState<LeadStatus>(lead.status)
  const [notes, setNotes] = useState(lead.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleUpdate = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/book/admin/international-quotes', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: lead.id,
          status,
          notes,
        }),
      })
      const payload = await readAdminResponse<LeadsResponse>(response)

      if (!response.ok || !payload.lead) {
        setError(payload.message || 'No se pudo actualizar cotizacion.')
        return
      }

      onUpdated(payload.lead)
      setMessage('Lead actualizado.')
    } catch {
      setError('No se pudo actualizar cotizacion.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="rounded border border-paper/10 bg-ink p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{lead.name}</p>
            <StatusPill label={lead.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {lead.email} · {lead.whatsapp}
          </p>
          <p className="mt-1 text-sm">
            {lead.city}, {lead.country} · CP {lead.postalCode} · {lead.quantity} libros
          </p>
          <p className="mt-1 text-xs text-muted">{formatDate(lead.createdAt)}</p>
          {lead.message ? <p className="mt-3 text-sm text-paper">{lead.message}</p> : null}
        </div>

        <div className="grid gap-3">
          <label className="text-sm text-muted">
            Status
            <select
              className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
              value={status}
              onChange={(event) => setStatus(event.target.value as LeadStatus)}
            >
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-muted">
            Notas
            <textarea
              className="mt-2 min-h-20 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          {error ? <AdminPanelMessage title={error} tone="error" /> : null}
          {message ? <AdminPanelMessage title={message} /> : null}

          <button
            className="rounded bg-yellow px-4 py-3 text-sm font-bold uppercase text-ink hover:bg-yellow-warm disabled:cursor-wait disabled:opacity-70"
            type="button"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Actualizar status'}
          </button>
        </div>
      </div>
    </article>
  )
}
