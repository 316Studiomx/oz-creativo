import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const authPath = 'netlify/functions/_shared/book/auth.mts'
const authFunctionPath = 'netlify/functions/book-admin-auth.mts'
const appPath = 'src/App.tsx'
const adminAppPath = 'src/admin/AdminApp.tsx'
const adminLoginPath = 'src/admin/AdminLogin.tsx'

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
