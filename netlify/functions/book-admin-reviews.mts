import type { Config } from '@netlify/functions'

import { requireAdminSession } from './_shared/book/admin-session.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import {
  createBookReview,
  listBookReviews,
  type AdminBookReviewMutationInput,
} from './_shared/book/repositories.mts'

type BookReviewPayload = {
  author?: unknown
  role?: unknown
  quote?: unknown
  active?: unknown
  sortOrder?: unknown
}

type ReviewParseResult = { ok: true; value: AdminBookReviewMutationInput } | { ok: false; message: string }

export default async (req: Request) => {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  if (req.method === 'GET') {
    try {
      const reviews = await listBookReviews()
      return jsonResponse({ ok: true, reviews })
    } catch {
      return jsonResponse({ ok: false, message: 'No se pudieron consultar reseñas.' }, 500)
    }
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(['GET', 'POST'])
  }

  let payload: BookReviewPayload
  try {
    payload = await readJson<BookReviewPayload>(req)
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const parsed = normalizeAdminBookReviewCreate(payload)
  if (!parsed.ok) {
    return jsonResponse({ ok: false, message: parsed.message }, 400)
  }

  try {
    const review = await createBookReview(parsed.value)
    return jsonResponse({ ok: true, review }, 201)
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo crear la reseña.' }, 400)
  }
}

export const config: Config = {
  path: '/api/book/admin/reviews',
}

export function normalizeAdminBookReviewCreate(payload: BookReviewPayload): ReviewParseResult {
  const author = readRequiredText(payload.author)
  const role = readRequiredText(payload.role)
  const quote = readRequiredText(payload.quote)
  const sortOrder = Number(payload.sortOrder ?? 0)

  if (author.length < 2) {
    return { ok: false, message: 'Incluye el autor de la reseña.' }
  }

  if (role.length < 2) {
    return { ok: false, message: 'Incluye el cargo o rol.' }
  }

  if (quote.length < 10) {
    return { ok: false, message: 'La reseña debe tener al menos 10 caracteres.' }
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return { ok: false, message: 'El orden debe ser un entero positivo.' }
  }

  return {
    ok: true,
    value: {
      author,
      role,
      quote,
      active: typeof payload.active === 'boolean' ? payload.active : true,
      sortOrder,
    },
  }
}

function readRequiredText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
