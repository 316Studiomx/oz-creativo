import { type FormEvent, useEffect, useState } from 'react'

import { AdminPanelMessage, AdminSection, StatusPill, formatDate, readAdminResponse } from './AdminApp'

type BookReview = {
  id: number
  author: string
  role: string
  quote: string
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

type ReviewsResponse = {
  ok?: boolean
  message?: string
  reviews?: BookReview[]
  review?: BookReview
}

const initialForm = {
  author: '',
  role: '',
  quote: '',
  active: true,
  sortOrder: '0',
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    fetch('/api/book/admin/reviews', {
      credentials: 'include',
    })
      .then(async (response) => {
        const payload = await readAdminResponse<ReviewsResponse>(response)
        if (!active) return

        if (!response.ok || !payload.reviews) {
          setError(payload.message || 'No se pudo cargar reseñas.')
          return
        }

        setReviews(payload.reviews)
      })
      .catch(() => {
        if (active) setError('No se pudo cargar reseñas.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const updateForm = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/book/admin/reviews', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: form.author,
          role: form.role,
          quote: form.quote,
          active: form.active,
          sortOrder: Number(form.sortOrder),
        }),
      })
      const payload = await readAdminResponse<ReviewsResponse>(response)

      if (!response.ok || !payload.review) {
        setError(payload.message || 'No se pudo guardar reseña.')
        return
      }

      setReviews((items) => [payload.review as BookReview, ...items])
      setForm(initialForm)
      setMessage('Reseña agregada.')
    } catch {
      setError('No se pudo guardar reseña.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminPanelMessage title="Cargando reseñas..." />

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <AdminSection title="Reseñas">
        {error && reviews.length === 0 ? <AdminPanelMessage title={error} tone="error" /> : null}
        {reviews.length === 0 && !error ? (
          <AdminPanelMessage title="Aun no hay reseñas agregadas desde el panel." />
        ) : null}

        {reviews.length > 0 ? (
          <div className="grid gap-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded border border-paper/10 bg-ink p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-paper">{review.author}</p>
                  <StatusPill label={review.active ? 'Visible' : 'Oculta'} />
                  <StatusPill label={`Orden ${review.sortOrder}`} />
                </div>
                <p className="mt-1 text-sm text-muted">{review.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-paper">“{review.quote}”</p>
                <p className="mt-3 text-xs text-muted">Creada: {formatDate(review.createdAt)}</p>
              </article>
            ))}
          </div>
        ) : null}
      </AdminSection>

      <AdminSection title="Agregar reseña">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="text-sm text-muted">
            Autor
            <input
              className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
              value={form.author}
              onChange={(event) => updateForm('author', event.target.value)}
              required
            />
          </label>

          <label className="text-sm text-muted">
            Cargo / rol
            <input
              className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
              value={form.role}
              onChange={(event) => updateForm('role', event.target.value)}
              required
            />
          </label>

          <label className="text-sm text-muted">
            Reseña
            <textarea
              className="mt-2 min-h-32 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
              value={form.quote}
              onChange={(event) => updateForm('quote', event.target.value)}
              required
            />
          </label>

          <label className="text-sm text-muted">
            Orden
            <input
              className="mt-2 w-full rounded border border-paper/15 bg-ink px-3 py-3 text-paper outline-none focus:border-yellow"
              min="0"
              step="1"
              type="number"
              value={form.sortOrder}
              onChange={(event) => updateForm('sortOrder', event.target.value)}
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-muted">
            <input
              checked={form.active}
              className="size-4 accent-yellow"
              onChange={(event) => updateForm('active', event.target.checked)}
              type="checkbox"
            />
            Visible
          </label>

          {error ? <AdminPanelMessage title={error} tone="error" /> : null}
          {message ? <AdminPanelMessage title={message} /> : null}

          <button
            className="rounded bg-yellow px-4 py-3 text-sm font-bold uppercase text-ink transition hover:bg-yellow-warm disabled:cursor-wait disabled:opacity-70"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Agregar reseña'}
          </button>
        </form>
      </AdminSection>
    </div>
  )
}
