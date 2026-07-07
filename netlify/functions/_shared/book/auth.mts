import { createHash, randomBytes } from 'node:crypto'
import { compare } from 'bcryptjs'

declare const Netlify:
  | {
      env?: {
        get?: (key: string) => string | undefined
      }
    }
  | undefined

export const ADMIN_COOKIE_NAME = 'oz_book_admin'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

export class AdminAuthConfigError extends Error {
  constructor(message = 'Falta configurar la autenticacion del admin.') {
    super(message)
    this.name = 'AdminAuthConfigError'
  }
}

export async function verifyAdminPassword(email: string, password: string): Promise<boolean> {
  const adminEmail = readFunctionEnv('ADMIN_EMAIL')
  const passwordHash = readFunctionEnv('ADMIN_PASSWORD_HASH')

  if (!adminEmail || !passwordHash) {
    throw new AdminAuthConfigError('Falta configurar ADMIN_EMAIL o ADMIN_PASSWORD_HASH.')
  }

  const emailMatches = email.trim().toLowerCase() === adminEmail.trim().toLowerCase()
  const passwordMatches = await compare(password, passwordHash)

  return emailMatches && passwordMatches
}

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function buildSessionCookie(token: string): string {
  return [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ].join('; ')
}

export function clearSessionCookie(): string {
  return [
    `${ADMIN_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=0',
  ].join('; ')
}

export function readSessionToken(req: Request): string {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';')

  for (const cookie of cookies) {
    const trimmed = cookie.trim()
    if (!trimmed) continue

    const equalsIndex = trimmed.indexOf('=')
    const name = equalsIndex >= 0 ? trimmed.slice(0, equalsIndex).trim() : trimmed
    if (name !== ADMIN_COOKIE_NAME) continue

    const rawValue = equalsIndex >= 0 ? trimmed.slice(equalsIndex + 1).trim() : ''
    try {
      return decodeURIComponent(rawValue)
    } catch {
      return rawValue
    }
  }

  return ''
}

export function readFunctionEnv(key: string): string {
  const netlifyValue =
    typeof Netlify !== 'undefined' && Netlify?.env?.get ? Netlify.env.get(key) : undefined
  return netlifyValue || process.env[key] || ''
}
