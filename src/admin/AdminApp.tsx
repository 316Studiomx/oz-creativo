import { type ReactNode, useEffect, useState } from 'react'

import { AdminCoupons } from './AdminCoupons'
import { AdminDashboard } from './AdminDashboard'
import { AdminEmails } from './AdminEmails'
import { AdminInternationalQuotes } from './AdminInternationalQuotes'
import { AdminInventory } from './AdminInventory'
import { AdminLogin } from './AdminLogin'
import { AdminOrders } from './AdminOrders'

type SessionState = {
  ready: boolean
  loggedIn: boolean
  email: string | null
}

const tabs = ['dashboard', 'orders', 'inventory', 'coupons', 'international', 'emails'] as const

type AdminTab = (typeof tabs)[number]

type MeResponse = {
  ok?: boolean
  email?: string
}

const tabLabels: Record<AdminTab, string> = {
  dashboard: 'Dashboard',
  orders: 'Pedidos',
  inventory: 'Inventario',
  coupons: 'Cupones',
  international: 'Internacional',
  emails: 'Emails',
}

export function AdminApp() {
  const [session, setSession] = useState<SessionState>({
    ready: false,
    loggedIn: false,
    email: null,
  })
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    let active = true

    fetch('/api/book/admin/me', {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await readMeResponse(response)
        if (!active) return

        setSession({
          ready: true,
          loggedIn: response.ok,
          email: response.ok ? payload.email || null : null,
        })
      })
      .catch(() => {
        if (!active) return
        setSession({ ready: true, loggedIn: false, email: null })
      })

    return () => {
      active = false
    }
  }, [])

  const handleLoggedIn = () => {
    setSession({ ready: true, loggedIn: true, email: null })
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/book/admin/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setLoggingOut(false)
      setSession({ ready: true, loggedIn: false, email: null })
    }
  }

  if (!session.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink p-8 text-paper">
        <p className="text-sm text-muted">Cargando...</p>
      </main>
    )
  }

  if (!session.loggedIn) {
    return <AdminLogin onLoggedIn={handleLoggedIn} />
  }

  return (
    <main className="min-h-screen bg-ink px-4 py-5 text-paper md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-paper/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-yellow [letter-spacing:0]">
              {session.email || 'Admin'}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold uppercase leading-none md:text-3xl [letter-spacing:0]">
              Admin Hazlo Magnífico
            </h1>
            <p className="mt-2 text-sm text-muted">Pedidos, inventario, cupones, envíos y operación.</p>
          </div>

          <button
            className="w-full rounded border border-paper/15 px-4 py-3 text-sm font-semibold text-paper transition hover:border-yellow hover:text-yellow md:w-auto disabled:cursor-wait disabled:opacity-60"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </header>

        <nav className="overflow-x-auto border-b border-paper/10 pb-2">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`rounded border px-3 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'border-yellow bg-yellow text-ink'
                    : 'border-paper/10 bg-paper/[0.04] text-muted hover:border-yellow hover:text-paper'
                }`}
                type="button"
                onClick={() => setActiveTab(tab)}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </nav>

        <section>
          {activeTab === 'dashboard' ? <AdminDashboard /> : null}
          {activeTab === 'orders' ? <AdminOrders /> : null}
          {activeTab === 'inventory' ? <AdminInventory /> : null}
          {activeTab === 'coupons' ? <AdminCoupons /> : null}
          {activeTab === 'international' ? <AdminInternationalQuotes /> : null}
          {activeTab === 'emails' ? <AdminEmails /> : null}
        </section>
      </div>
    </main>
  )
}

export function AdminPanelMessage({
  title,
  tone = 'muted',
}: {
  title: string
  tone?: 'muted' | 'error'
}) {
  return (
    <div
      className={`rounded border px-4 py-3 text-sm ${
        tone === 'error'
          ? 'border-red-400/30 bg-red-500/10 text-red-100'
          : 'border-paper/10 bg-paper/[0.04] text-muted'
      }`}
    >
      {title}
    </div>
  )
}

export function AdminSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded border border-paper/10 bg-paper/[0.03]">
      <div className="border-b border-paper/10 px-4 py-3">
        <h2 className="text-sm font-bold uppercase text-paper [letter-spacing:0]">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export async function readAdminResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text.trim()) return {} as T

  try {
    return JSON.parse(text) as T
  } catch {
    return {} as T
  }
}

export function formatMoney(cents: number | null | undefined, currency = 'MXN'): string {
  const value = Number(cents ?? 0)
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(value / 100)
  } catch {
    return `$${(value / 100).toLocaleString('es-MX')} ${currency}`
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded border border-paper/10 bg-ink px-2 py-1 text-xs font-semibold text-paper">
      {label}
    </span>
  )
}

async function readMeResponse(response: Response): Promise<MeResponse> {
  try {
    return (await response.json()) as MeResponse
  } catch {
    return {}
  }
}
