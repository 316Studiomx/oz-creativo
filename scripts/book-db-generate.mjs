#!/usr/bin/env node
import { readFile, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const migrationsDir = path.resolve('netlify/database/migrations')
const journalPath = path.resolve('netlify/database/migrations/meta/_journal.json')
const metaDir = path.resolve('netlify/database/migrations/meta')

const result = spawnSync('npx', ['drizzle-kit', 'generate'], { stdio: 'inherit', shell: process.platform === 'win32' })

if (result.status !== 0) {
  process.exit(result.status || 1)
}

if (!existsSync(journalPath)) {
  process.exit(0)
}

let journal
try {
  const journalRaw = await readFile(journalPath, 'utf8')
  journal = JSON.parse(journalRaw)
} catch {
  process.exit(0)
}

if (!Array.isArray(journal?.entries) || journal.entries.length > 0) {
  process.exit(0)
}

let hasRealMigrations = false
try {
  const entries = await readdir(migrationsDir, { withFileTypes: true })
  hasRealMigrations = entries.some((entry) => {
    if (entry.name === 'meta') return false
    return entry.isDirectory() || entry.isFile()
  })
} catch {
  hasRealMigrations = false
}

if (!hasRealMigrations) {
  await rm(journalPath, { force: true })
  await rm(metaDir, { recursive: true, force: true })
  await rm(migrationsDir, { recursive: true, force: true })
}
