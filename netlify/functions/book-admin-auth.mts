import type { Config } from '@netlify/functions'

import {
  AdminAuthConfigError,
  buildSessionCookie,
  clearSessionCookie,
  createSessionToken,
  hashSessionToken,
  readSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifyAdminPassword,
} from './_shared/book/auth.mts'
import { jsonResponse, methodNotAllowed, readJson } from './_shared/book/http.mts'
import {
  createAdminSession,
  deleteAdminSession,
  findValidAdminSession,
} from './_shared/book/repositories.mts'
import { loginSchema } from './_shared/book/validation.mts'

type AdminAuthAction = 'login' | 'logout' | 'me'

export default async (req: Request) => {
  const action = readAdminAuthAction(new URL(req.url).pathname)

  if (!action) {
    return jsonResponse({ ok: false, message: 'Ruta no encontrada.' }, 404)
  }

  if (action === 'login') {
    return handleLogin(req)
  }

  if (action === 'logout') {
    return handleLogout(req)
  }

  return handleMe(req)
}

export const config: Config = {
  path: ['/api/book/admin/login', '/api/book/admin/logout', '/api/book/admin/me'],
}

async function handleLogin(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return methodNotAllowed('POST')
  }

  let payload: unknown
  try {
    payload = await readJson<unknown>(req)
  } catch {
    return jsonResponse({ ok: false, message: 'Formato invalido.' }, 400)
  }

  const parsed = loginSchema.safeParse(payload)
  if (!parsed.success) {
    return jsonResponse({ ok: false, message: 'Datos de acceso invalidos.' }, 400)
  }

  try {
    const passwordMatches = await verifyAdminPassword(parsed.data.email, parsed.data.password)
    if (!passwordMatches) {
      return unauthorizedLogin()
    }

    const token = createSessionToken()
    const tokenHash = hashSessionToken(token)
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)

    await createAdminSession(parsed.data.email, tokenHash, expiresAt)

    return jsonResponse({ ok: true }, 200, {
      'Set-Cookie': buildSessionCookie(token),
    })
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      return jsonResponse({ ok: false, message: error.message }, 503)
    }

    return jsonResponse({ ok: false, message: 'No se pudo iniciar sesion.' }, 500)
  }
}

async function handleMe(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return methodNotAllowed('GET')
  }

  const token = readSessionToken(req)
  if (!token) {
    return unauthorizedSession()
  }

  try {
    const session = await findValidAdminSession(hashSessionToken(token))
    if (!session) {
      return unauthorizedSession()
    }

    return jsonResponse({ ok: true, email: session.email })
  } catch {
    return jsonResponse({ ok: false, message: 'No se pudo validar la sesion.' }, 500)
  }
}

async function handleLogout(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return methodNotAllowed('POST')
  }

  const token = readSessionToken(req)
  if (token) {
    try {
      await deleteAdminSession(hashSessionToken(token))
    } catch {
      // Logout must still clear the browser cookie even if the session row is already gone.
    }
  }

  return jsonResponse({ ok: true }, 200, {
    'Set-Cookie': clearSessionCookie(),
  })
}

function readAdminAuthAction(pathname: string): AdminAuthAction | null {
  const parts = pathname.split('/').filter(Boolean)
  const action = parts[parts.length - 1]
  if (action === 'login' || action === 'logout' || action === 'me') {
    return action
  }

  return null
}

function unauthorizedLogin(): Response {
  return jsonResponse({ ok: false, message: 'No se pudo iniciar sesion.' }, 401)
}

function unauthorizedSession(): Response {
  return jsonResponse({ ok: false, message: 'Sesion no valida.' }, 401)
}
