#!/usr/bin/env node
import { mkdir, readFile, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const migrationsDir = path.resolve('netlify/database/migrations')
const journalPath = path.resolve('netlify/database/migrations/meta/_journal.json')

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

let hasMigrationFiles = false
try {
  const entries = await readdir(migrationsDir, { withFileTypes: true })
  hasMigrationFiles = entries.some((entry) => entry.isFile() || (entry.isDirectory() && entry.name !== 'meta'))
} catch {
  hasMigrationFiles = false
}

if (!hasMigrationFiles) {
  await rm(journalPath).catch(() => {})
  await rm(path.resolve('netlify/database/migrations/meta')).catch(() => {})
  await rm(path.resolve('netlify/database/migrations')).catch(() => {})
  await mkdir(migrationsDir, { recursive: true }).catch(() => {})
}
