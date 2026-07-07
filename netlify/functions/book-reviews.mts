import type { Config } from '@netlify/functions'

import { jsonResponse, methodNotAllowed } from './_shared/book/http.mts'
import { listPublicBookReviews } from './_shared/book/repositories.mts'

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return methodNotAllowed(['GET'])
  }

  try {
    const reviews = await listPublicBookReviews()
    return jsonResponse({ ok: true, reviews })
  } catch {
    return jsonResponse({ ok: false, reviews: [] })
  }
}

export const config: Config = {
  path: '/api/book/reviews',
}
