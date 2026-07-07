import assert from 'node:assert/strict'
import test from 'node:test'

import { calculateBookParcel } from '../netlify/functions/_shared/book/parcel.mts'

test('one book uses the base package', () => {
  assert.deepEqual(calculateBookParcel(1), {
    weightGrams: 300,
    lengthCm: 24,
    widthCm: 17,
    heightCm: 3,
  })
})

test('extra books add 180 grams each and increase height', () => {
  assert.deepEqual(calculateBookParcel(4), {
    weightGrams: 840,
    lengthCm: 24,
    widthCm: 17,
    heightCm: 6,
  })
})

test('ten books remain inside the public quantity limit', () => {
  assert.deepEqual(calculateBookParcel(10), {
    weightGrams: 1920,
    lengthCm: 24,
    widthCm: 17,
    heightCm: 12,
  })
})

test('decimal quantities are rejected', () => {
  assert.throws(() => calculateBookParcel(1.5), /cantidad debe estar entre 1 y 10/i)
})
