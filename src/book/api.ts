export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await readResponseBody(response)

  if (!response.ok) {
    throw new Error(readMessage(result, response.status))
  }

  return result as T
}

export async function getJson<T>(
  url: string,
  options: { signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: options.signal,
  })
  const result = await readResponseBody(response)

  if (!response.ok) {
    throw new Error(readMessage(result, response.status))
  }

  return result as T
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text.trim()) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return { message: text }
  }
}

function readMessage(value: unknown, status: number): string {
  if (typeof value === 'object' && value && 'message' in value) {
    const message = (value as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }

  if (status === 404) return 'Este servicio todavía no está disponible.'
  return 'No se pudo completar la solicitud.'
}
