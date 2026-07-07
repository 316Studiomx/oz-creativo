import { hashSessionToken, readSessionToken } from './auth.mts'
import { jsonResponse } from './http.mts'
import { findValidAdminSession, type AdminSession } from './repositories.mts'

export type AdminSessionResult =
  | {
      ok: true
      session: AdminSession
    }
  | {
      ok: false
      response: Response
    }

export async function requireAdminSession(req: Request): Promise<AdminSessionResult> {
  const token = readSessionToken(req)
  if (!token) {
    return invalidAdminSession()
  }

  const hashedToken = hashSessionToken(token)
  const session = await findValidAdminSession(hashedToken)
  if (!session) {
    return invalidAdminSession()
  }

  return { ok: true, session }
}

function invalidAdminSession(): AdminSessionResult {
  return {
    ok: false,
    response: jsonResponse({ ok: false, message: 'Sesion no valida.' }, 401),
  }
}
