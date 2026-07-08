import { useEffect, useMemo, useState } from 'react'

import { AdminPanelMessage, AdminSection, formatDate, readAdminResponse } from './AdminApp'

type EmailTemplate = {
  id: number
  key: 'purchase-confirmation' | 'shipment-tracking'
  label: string
  description: string
  subjectTemplate: string
  headline: string
  bodyTemplate: string
  buttonLabel: string
  footerNote: string
  updatedAt: string
}

type EmailTemplatesResponse = {
  ok?: boolean
  message?: string
  templates?: EmailTemplate[]
  template?: EmailTemplate
}

const availableVariables = [
  '{{orderNumber}}',
  '{{customerName}}',
  '{{bookTitle}}',
  '{{bookAuthor}}',
  '{{quantityLabel}}',
  '{{total}}',
  '{{totalMxn}}',
  '{{address}}',
  '{{supportEmail}}',
  '{{carrier}}',
  '{{service}}',
  '{{trackingNumber}}',
  '{{trackingUrl}}',
]

const sampleVariables: Record<string, string> = {
  orderNumber: 'HM-20260708-70DNCH',
  customerName: 'Oz Creativo',
  bookTitle: 'Hazlo Magnífico',
  bookAuthor: 'Oz Creativo',
  quantityLabel: '1 libro',
  totalMxn: '$499.00 MXN',
  total: '$499.00',
  address: 'Venecia #904, Vista Hermosa, Reynosa, Tamaulipas, CP 88710',
  supportEmail: 'oz@expocuspide.com',
  carrier: 'afimex',
  service: 'Servicio estandar',
  trackingNumber: '46212777',
  trackingUrl: 'https://afimex.net/rastrea-envio',
}

export function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    fetch('/api/book/admin/email-templates', {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await readAdminResponse<EmailTemplatesResponse>(response)
        if (!active) return

        if (!response.ok || !payload.templates) {
          setError(payload.message || 'No se pudieron cargar templates.')
          return
        }

        setTemplates(payload.templates)
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar templates.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const updateTemplate = (key: EmailTemplate['key'], patch: Partial<EmailTemplate>) => {
    setTemplates((items) => items.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  const saveTemplate = async (template: EmailTemplate) => {
    setSavingKey(template.key)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`/api/book/admin/email-templates/${template.key}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectTemplate: template.subjectTemplate,
          headline: template.headline,
          bodyTemplate: template.bodyTemplate,
          buttonLabel: template.buttonLabel,
          footerNote: template.footerNote,
        }),
      })
      const payload = await readAdminResponse<EmailTemplatesResponse>(response)

      if (!response.ok || !payload.template) {
        setError(payload.message || 'No se pudo guardar template.')
        return
      }

      setTemplates((items) => items.map((item) => (item.key === payload.template?.key ? payload.template : item)))
      setMessage(`Template guardado: ${payload.template.label}`)
    } catch {
      setError('No se pudo guardar template.')
    } finally {
      setSavingKey(null)
    }
  }

  const variableText = useMemo(() => availableVariables.join(' '), [])

  if (loading) return <AdminPanelMessage title="Cargando templates..." />
  if (error && templates.length === 0) return <AdminPanelMessage title={error} tone="error" />
  if (templates.length === 0) return <AdminPanelMessage title="Sin templates editables." />

  return (
    <div className="grid gap-4">
      {error ? <AdminPanelMessage title={error} tone="error" /> : null}
      {message ? <AdminPanelMessage title={message} /> : null}

      <AdminSection title="Templates de correo">
        <div className="grid gap-5">
          <div className="rounded border border-paper/10 bg-ink/60 p-4 text-sm text-muted">
            <p className="font-semibold text-paper">Variables disponibles</p>
            <p className="mt-2 leading-relaxed">{variableText}</p>
          </div>

          {templates.map((template) => (
            <section key={template.key} className="grid gap-4 border-t border-paper/10 pt-5 first:border-t-0 first:pt-0">
              <div>
                <p className="text-xs font-semibold uppercase text-yellow [letter-spacing:0]">
                  {template.key === 'purchase-confirmation' ? 'Confirmación de compra' : 'Seguimiento al paquete'}
                </p>
                <h3 className="mt-1 text-xl font-bold text-paper">{template.label}</h3>
                <p className="mt-1 text-sm text-muted">{template.description}</p>
                <p className="mt-1 text-xs text-muted">Actualizado: {formatDate(template.updatedAt)}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid gap-3">
                  <label className="grid gap-2 text-sm font-semibold text-paper">
                    Asunto
                    <input
                      className="rounded border border-paper/15 bg-ink px-3 py-2 text-paper outline-none focus:border-yellow"
                      value={template.subjectTemplate}
                      onChange={(event) => updateTemplate(template.key, { subjectTemplate: event.target.value })}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-paper">
                    Título
                    <input
                      className="rounded border border-paper/15 bg-ink px-3 py-2 text-paper outline-none focus:border-yellow"
                      value={template.headline}
                      onChange={(event) => updateTemplate(template.key, { headline: event.target.value })}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-paper">
                    Cuerpo
                    <textarea
                      className="min-h-[180px] rounded border border-paper/15 bg-ink px-3 py-2 text-paper outline-none focus:border-yellow"
                      value={template.bodyTemplate}
                      onChange={(event) => updateTemplate(template.key, { bodyTemplate: event.target.value })}
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold text-paper">
                      Texto del botón
                      <input
                        className="rounded border border-paper/15 bg-ink px-3 py-2 text-paper outline-none focus:border-yellow"
                        value={template.buttonLabel}
                        onChange={(event) => updateTemplate(template.key, { buttonLabel: event.target.value })}
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-paper">
                      Nota final
                      <input
                        className="rounded border border-paper/15 bg-ink px-3 py-2 text-paper outline-none focus:border-yellow"
                        value={template.footerNote}
                        onChange={(event) => updateTemplate(template.key, { footerNote: event.target.value })}
                      />
                    </label>
                  </div>

                  <button
                    className="w-full rounded bg-yellow px-4 py-3 text-sm font-bold text-ink transition hover:bg-paper disabled:cursor-wait disabled:opacity-60 md:w-fit"
                    type="button"
                    onClick={() => saveTemplate(template)}
                    disabled={savingKey === template.key}
                  >
                    {savingKey === template.key ? 'Guardando...' : 'Guardar template'}
                  </button>
                </div>

                <div className="rounded border border-paper/10 bg-paper p-4 text-ink">
                  <p className="text-xs font-bold uppercase text-neutral-500 [letter-spacing:0]">Vista previa</p>
                  <p className="mt-3 text-sm font-semibold">{previewText(template.subjectTemplate)}</p>
                  <h4 className="mt-4 text-2xl font-black leading-tight">{previewText(template.headline)}</h4>
                  <div className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-700">
                    {previewText(template.bodyTemplate)}
                  </div>
                  <dl className="mt-4 grid gap-1 text-xs text-neutral-600">
                    <div>
                      <dt className="inline font-bold">Pedido: </dt>
                      <dd className="inline">{sampleVariables.orderNumber}</dd>
                    </div>
                    {template.key === 'shipment-tracking' ? (
                      <div>
                        <dt className="inline font-bold">Guía: </dt>
                        <dd className="inline">{sampleVariables.trackingNumber}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {template.buttonLabel ? (
                    <p className="mt-4 inline-block rounded bg-yellow px-4 py-3 text-sm font-black text-ink">
                      {previewText(template.buttonLabel)}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ))}
        </div>
      </AdminSection>
    </div>
  )
}

function previewText(value: string): string {
  return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => sampleVariables[key] ?? '')
}
