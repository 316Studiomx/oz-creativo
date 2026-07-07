import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { compare, hash } from 'bcryptjs'

import adminAuthHandler from '../netlify/functions/book-admin-auth.mts'

const authPath = 'netlify/functions/_shared/book/auth.mts'
const authFunctionPath = 'netlify/functions/book-admin-auth.mts'
const appPath = 'src/App.tsx'
const adminAppPath = 'src/admin/AdminApp.tsx'
const adminLoginPath = 'src/admin/AdminLogin.tsx'
const adminEmail = 'admin@ozcreativo.test'
const adminPassword = 'correct-admin-password'

test('admin auth helper builds secure cookies and hashes tokens', async () => {
  assert.equal(existsSync(authPath), true)
  const auth = await import('../netlify/functions/_shared/book/auth.mts')

  const cookie = auth.buildSessionCookie('plain-session-token')
  assert.equal(cookie.includes('oz_book_admin=plain-session-token'), true)
  assert.equal(cookie.includes('Path=/'), true)
  assert.equal(cookie.includes('HttpOnly'), true)
  assert.equal(cookie.includes('Secure'), true)
  assert.equal(cookie.includes('SameSite=Lax'), true)
  assert.equal(cookie.includes('Max-Age=28800'), true)

  const clearCookie = auth.clearSessionCookie()
  assert.equal(clearCookie.includes('oz_book_admin='), true)
  assert.equal(clearCookie.includes('Max-Age=0'), true)

  const req = new Request('https://ozcreativo.com/api/book/admin/me', {
    headers: {
      cookie: 'theme=dark; oz_book_admin=plain-session-token; other=value',
    },
  })
  assert.equal(auth.readSessionToken(req), 'plain-session-token')

  const tokenHash = auth.hashSessionToken('plain-session-token')
  assert.match(tokenHash, /^[a-f0-9]{64}$/)
  assert.notEqual(tokenHash, 'plain-session-token')
})

test('verifyAdminPassword still pays bcrypt cost when email does not match', async () => {
  const auth = await import('../netlify/functions/_shared/book/auth.mts')
  const passwordHash = await hash(adminPassword, 10)

  await withAdminEnv({ email: adminEmail, passwordHash }, async () => {
    const baselineStart = process.hrtime.bigint()
    await compare('wrong-password', passwordHash)
    const baselineMs = elapsedMs(baselineStart)

    const mismatchStart = process.hrtime.bigint()
    const verified = await auth.verifyAdminPassword('intruso@ozcreativo.test', 'wrong-password')
    const mismatchMs = elapsedMs(mismatchStart)

    assert.equal(verified, false)
    assert.ok(
      mismatchMs >= Math.max(5, baselineMs * 0.35),
      `email mismatch returned before bcrypt compare (${mismatchMs.toFixed(2)}ms vs ${baselineMs.toFixed(2)}ms)`,
    )
  })
})

test('admin login returns 503 when admin auth env is missing', async () => {
  await withAdminEnv({ email: '', passwordHash: '' }, async () => {
    const response = await adminAuthHandler(
      buildLoginRequest({
        email: adminEmail,
        password: adminPassword,
      }),
    )
    const body = (await response.json()) as { ok?: boolean; message?: string }

    assert.equal(response.status, 503)
    assert.equal(body.ok, false)
    assert.equal(body.message, 'Falta configurar ADMIN_EMAIL o ADMIN_PASSWORD_HASH.')
  })
})

test('admin login uses the same response for wrong email and wrong password', async () => {
  const passwordHash = await hash(adminPassword, 6)

  await withAdminEnv({ email: adminEmail, passwordHash }, async () => {
    const wrongEmailResponse = await adminAuthHandler(
      buildLoginRequest({
        email: 'intruso@ozcreativo.test',
        password: adminPassword,
      }),
    )
    const wrongPasswordResponse = await adminAuthHandler(
      buildLoginRequest({
        email: adminEmail,
        password: 'wrong-admin-password',
      }),
    )

    assert.equal(wrongEmailResponse.status, 401)
    assert.equal(wrongPasswordResponse.status, 401)
    assert.deepEqual(await wrongEmailResponse.json(), await wrongPasswordResponse.json())
  })
})

test('admin auth API declares login logout me paths and session helpers', () => {
  assert.equal(existsSync(authFunctionPath), true)
  const source = readFileSync(authFunctionPath, 'utf8')

  for (const path of ['/api/book/admin/login', '/api/book/admin/logout', '/api/book/admin/me']) {
    assert.equal(source.includes(path), true)
  }

  assert.equal(source.includes('loginSchema'), true)
  assert.equal(source.includes('verifyAdminPassword'), true)
  assert.equal(source.includes('createAdminSession'), true)
  assert.equal(source.includes('findValidAdminSession'), true)
  assert.equal(source.includes('deleteAdminSession'), true)
  assert.equal(source.includes('hashSessionToken'), true)
  assert.equal(source.includes('Set-Cookie'), true)
  assert.equal(source.includes('503'), true)
})

test('admin DB helpers persist token hashes instead of raw tokens', () => {
  const source = readFileSync('netlify/functions/_shared/book/repositories.mts', 'utf8')

  assert.equal(source.includes('createAdminSession'), true)
  assert.equal(source.includes('findValidAdminSession'), true)
  assert.equal(source.includes('deleteAdminSession'), true)
  assert.equal(source.includes('tokenHash'), true)
  assert.equal(source.includes('adminSessions.tokenHash'), true)
  assert.equal(source.includes('createAdminSession(email: string, tokenHash: string'), true)
})

test('App routes admin before public proposal and landing routes', () => {
  const source = readFileSync(appPath, 'utf8')
  const adminIndex = source.indexOf('isAdminRoute')
  const proposalIndex = source.indexOf('getProposalRoute')
  const sceneIndex = source.indexOf('<Scene')

  assert.equal(source.includes('AdminApp'), true)
  assert.equal(source.includes("pathname === '/admin'"), true)
  assert.equal(source.includes("pathname.startsWith('/admin/')"), true)
  assert.ok(adminIndex >= 0)
  assert.ok(proposalIndex >= 0)
  assert.ok(adminIndex < proposalIndex)
  assert.ok(sceneIndex < 0 || adminIndex < sceneIndex)
})

test('admin shell and login use credentialed requests', () => {
  assert.equal(existsSync(adminAppPath), true)
  assert.equal(existsSync(adminLoginPath), true)
  const appSource = readFileSync(adminAppPath, 'utf8')
  const loginSource = readFileSync(adminLoginPath, 'utf8')

  assert.equal(appSource.includes('/api/book/admin/me'), true)
  assert.equal(appSource.includes('/api/book/admin/logout'), true)
  assert.equal(appSource.includes("credentials: 'include'"), true)
  assert.equal(appSource.includes('Admin Hazlo Magnífico'), true)
  assert.equal(appSource.includes('Pedidos'), true)
  assert.equal(appSource.includes('inventario'), true)
  assert.equal(appSource.includes('cupones'), true)
  assert.equal(appSource.includes('envíos'), true)

  assert.equal(loginSource.includes('/api/book/admin/login'), true)
  assert.equal(loginSource.includes("credentials: 'include'"), true)
  assert.equal(loginSource.includes('No se pudo iniciar sesión'), true)
})

function buildLoginRequest(payload: { email: string; password: string }): Request {
  return new Request('https://ozcreativo.com/api/book/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

async function withAdminEnv(
  env: { email: string; passwordHash: string },
  callback: () => Promise<void>,
): Promise<void> {
  const previousEmail = process.env.ADMIN_EMAIL
  const previousPasswordHash = process.env.ADMIN_PASSWORD_HASH
  process.env.ADMIN_EMAIL = env.email
  process.env.ADMIN_PASSWORD_HASH = env.passwordHash

  try {
    await callback()
  } finally {
    restoreEnv('ADMIN_EMAIL', previousEmail)
    restoreEnv('ADMIN_PASSWORD_HASH', previousPasswordHash)
  }
}

function restoreEnv(key: 'ADMIN_EMAIL' | 'ADMIN_PASSWORD_HASH', value: string | undefined) {
  if (typeof value === 'undefined') {
    delete process.env[key]
    return
  }

  process.env[key] = value
}

function elapsedMs(start: bigint): number {
  return Number(process.hrtime.bigint() - start) / 1_000_000
}
