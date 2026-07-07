import { useEffect, useState } from 'react'

import { AdminLogin } from './AdminLogin'

type SessionState = {
  ready: boolean
  loggedIn: boolean
  email: string | null
}

type MeResponse = {
  ok?: boolean
  email?: string
}

export function AdminApp() {
  const [session, setSession] = useState<SessionState>({
    ready: false,
    loggedIn: false,
    email: null,
  })
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
    <main className="min-h-screen bg-ink px-5 py-8 text-paper md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-paper/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-yellow [letter-spacing:0]">
              {session.email || 'Admin'}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none md:text-5xl [letter-spacing:0]">
              Admin Hazlo Magnífico
            </h1>
            <p className="mt-3 text-muted">Pedidos, inventario, cupones y envíos.</p>
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

        <section className="grid gap-3 md:grid-cols-4">
          {['Pedidos', 'Inventario', 'Cupones', 'Envíos'].map((label) => (
            <div key={label} className="rounded border border-paper/10 bg-paper/[0.04] p-4">
              <p className="text-sm font-semibold text-paper">{label}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

async function readMeResponse(response: Response): Promise<MeResponse> {
  try {
    return (await response.json()) as MeResponse
  } catch {
    return {}
  }
}
