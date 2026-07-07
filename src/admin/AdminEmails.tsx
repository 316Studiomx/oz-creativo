import { useEffect, useState } from 'react'

import { AdminPanelMessage, AdminSection, StatusPill, formatDate, readAdminResponse } from './AdminApp'

type EmailEvent = {
  id: number
  to: string
  subject: string
  template: string
  status: 'queued' | 'sent' | 'failed'
  error: string | null
  relatedOrderId: number | null
  relatedLeadId: number | null
  sentAt: string | null
  createdAt: string
}

type EmailsResponse = {
  ok?: boolean
  message?: string
  emails?: EmailEvent[]
  email?: EmailEvent
}

export function AdminEmails() {
  const [emails, setEmails] = useState<EmailEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    fetch('/api/book/admin/emails', {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await readAdminResponse<EmailsResponse>(response)
        if (!active) return

        if (!response.ok || !payload.emails) {
          setError(payload.message || 'No se pudo cargar emails.')
          return
        }

        setEmails(payload.emails)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar emails.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const retryEmail = async (id: number) => {
    setRetryingId(id)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`/api/book/admin/emails/${id}/retry`, {
        method: 'POST',
        credentials: 'include',
      })
      const payload = await readAdminResponse<EmailsResponse>(response)

      if (!response.ok || !payload.email) {
        setError(payload.message || 'No se pudo reintentar email.')
        return
      }

      setEmails((items) => items.map((item) => (item.id === payload.email?.id ? payload.email : item)))
      setMessage('Email marcado para retry.')
    } catch {
      setError('No se pudo reintentar email.')
    } finally {
      setRetryingId(null)
    }
  }

  if (loading) return <AdminPanelMessage title="Cargando emails..." />
  if (error && emails.length === 0) return <AdminPanelMessage title={error} tone="error" />
  if (emails.length === 0) return <AdminPanelMessage title="Sin emails registrados." />

  return (
    <div className="grid gap-4">
      {error ? <AdminPanelMessage title={error} tone="error" /> : null}
      {message ? <AdminPanelMessage title={message} /> : null}
      <AdminSection title="Emails">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase text-muted [letter-spacing:0]">
              <tr className="border-b border-paper/10">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Para</th>
                <th className="px-3 py-2">Asunto</th>
                <th className="px-3 py-2">Plantilla</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Relacionado</th>
                <th className="px-3 py-2">Error</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr key={email.id} className="border-b border-paper/5 align-top">
                  <td className="px-3 py-3 text-muted">{formatDate(email.createdAt)}</td>
                  <td className="px-3 py-3">{email.to}</td>
                  <td className="px-3 py-3">{email.subject}</td>
                  <td className="px-3 py-3 text-muted">{email.template}</td>
                  <td className="px-3 py-3">
                    <StatusPill label={email.status} />
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {email.relatedOrderId ? `Pedido ${email.relatedOrderId}` : ''}
                    {email.relatedLeadId ? `Lead ${email.relatedLeadId}` : ''}
                    {!email.relatedOrderId && !email.relatedLeadId ? 'Sin relación' : ''}
                  </td>
                  <td className="max-w-[260px] px-3 py-3 text-red-100">{email.error || 'Sin error'}</td>
                  <td className="px-3 py-3">
                    {email.status === 'failed' ? (
                      <button
                        className="rounded border border-paper/15 px-3 py-2 text-xs font-semibold hover:border-yellow hover:text-yellow disabled:cursor-wait disabled:opacity-60"
                        type="button"
                        onClick={() => retryEmail(email.id)}
                        disabled={retryingId === email.id}
                      >
                        {retryingId === email.id ? 'Retry...' : 'Reintentar retry'}
                      </button>
                    ) : (
                      <span className="text-xs text-muted">No aplica</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </div>
  )
}
