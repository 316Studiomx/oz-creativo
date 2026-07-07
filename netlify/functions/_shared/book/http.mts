type HeaderShape = HeadersInit | undefined

export function jsonResponse(body: unknown, status = 200, headers?: HeaderShape): Response {
  const responseHeaders = new Headers(headers)
  if (!responseHeaders.has('cache-control')) {
    responseHeaders.set('cache-control', 'private, no-store')
  }
  if (!responseHeaders.has('content-type')) {
    responseHeaders.set('content-type', 'application/json; charset=utf-8')
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  })
}

export function methodNotAllowed(allow: string | string[]): Response {
  const methods = Array.isArray(allow) ? allow.join(', ') : allow
  return jsonResponse({ ok: false, message: 'Metodo no permitido.' }, 405, {
    Allow: methods,
  })
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new Error('Formato invalido.')
  }
}

export function getSiteUrl(req: Request): string {
  return normalizeSiteUrl(process.env.SITE_URL || req.headers.get('origin') || new URL(req.url).origin)
}

function normalizeSiteUrl(value: string): string {
  return value.replace(/\/+$/, '')
}
