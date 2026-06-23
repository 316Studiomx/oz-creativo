import assert from 'node:assert/strict'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

import { COPY } from '../src/config/copy.ts'

test('track section uses real visual proof items instead of placeholder logos', () => {
  const proofItems = (COPY.track as unknown as { proofItems?: Array<Record<string, string>> })
    .proofItems

  assert.ok(Array.isArray(proofItems))
  assert.equal(proofItems.length, 5)

  for (const item of proofItems) {
    assert.match(item.src, /^\/assets\/track\//)
    assert.ok(statSync(resolve('public', item.src.replace(/^\//, ''))).size > 50_000)
    assert.ok(item.alt.length > 20)
    assert.ok(item.label.length > 0)
    assert.ok(item.caption.length > 0)
  }
})

test('track section does not publish placeholder evidence copy', () => {
  const serializedTrack = JSON.stringify(COPY.track)

  assert.equal(serializedTrack.includes('Logo 03'), false)
  assert.equal(serializedTrack.includes('placeholder editable'), false)
})
