import type { FormEvent } from 'react'
import { useState } from 'react'

type AdminLoginProps = {
  onLoggedIn: () => void
}

type LoginResponse = {
  ok?: boolean
  message?: string
}

export function AdminLogin({ onLoggedIn }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/book/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const payload = await readLoginResponse(response)
        setError(payload.message || 'No se pudo iniciar sesión. Revisa tus datos.')
        return
      }

      onLoggedIn()
    } catch {
      setError('No se pudo iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-shell flex min-h-screen items-center justify-center bg-ink px-5 py-10 text-paper">
      <section className="w-full max-w-[420px] rounded border border-paper/10 bg-paper/[0.04] p-6 shadow-2xl shadow-black/30">
        <p className="text-xs font-semibold uppercase text-yellow [letter-spacing:0]">Hazlo Magnífico</p>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-none [letter-spacing:0]">
          Admin
        </h1>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-muted">
            Email
            <input
              className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-base text-paper outline-none transition focus:border-yellow"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm text-muted">
            Contraseña
            <input
              className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-base text-paper outline-none transition focus:border-yellow"
              type="password"
              autoComplete="current-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? (
            <p className="rounded border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <button
            className="w-full rounded bg-yellow px-4 py-3 text-sm font-bold uppercase text-ink transition hover:bg-yellow-warm disabled:cursor-wait disabled:opacity-70"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

async function readLoginResponse(response: Response): Promise<LoginResponse> {
  try {
    return (await response.json()) as LoginResponse
  } catch {
    return {}
  }
}
