import { useEffect, useState } from 'react'

import { AdminPanelMessage, AdminSection, formatMoney, readAdminResponse } from './AdminApp'

type DashboardMetrics = {
  totalOrders: number
  paidOrders: number
  unpaidOrders: number
  pendingLabels: number
  shippedOrders: number
  internationalLeads: number
  failedEmails: number
  revenueCents: number
}

type DashboardResponse = {
  ok?: boolean
  message?: string
  metrics?: DashboardMetrics
}

const metricLabels: Array<{ key: keyof DashboardMetrics; label: string; money?: boolean }> = [
  { key: 'totalOrders', label: 'Pedidos' },
  { key: 'paidOrders', label: 'Pagados' },
  { key: 'unpaidOrders', label: 'Pendientes de pago' },
  { key: 'pendingLabels', label: 'Guías pendientes' },
  { key: 'shippedOrders', label: 'Enviados' },
  { key: 'internationalLeads', label: 'Leads internacionales' },
  { key: 'failedEmails', label: 'Emails fallidos' },
  { key: 'revenueCents', label: 'Ingresos pagados', money: true },
]

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetch('/api/book/admin/dashboard', {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await readAdminResponse<DashboardResponse>(response)
        if (!active) return

        if (!response.ok || !payload.metrics) {
          setError(payload.message || 'No se pudo cargar dashboard.')
          return
        }

        setMetrics(payload.metrics)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar dashboard.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (loading) return <AdminPanelMessage title="Cargando dashboard..." />
  if (error) return <AdminPanelMessage title={error} tone="error" />
  if (!metrics) return <AdminPanelMessage title="Sin métricas todavía." />

  return (
    <AdminSection title="Dashboard">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricLabels.map((metric) => (
          <div key={metric.key} className="rounded border border-paper/10 bg-ink p-4">
            <p className="text-xs font-semibold uppercase text-muted [letter-spacing:0]">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-paper">
              {metric.money ? formatMoney(metrics[metric.key]) : metrics[metric.key]}
            </p>
          </div>
        ))}
      </div>
    </AdminSection>
  )
}
