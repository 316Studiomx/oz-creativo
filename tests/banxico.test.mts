import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BANXICO_FIX_SERIES,
  isFreshRate,
  parseBanxicoFix,
} from '../netlify/functions/_shared/banxico.mts'

test('parseBanxicoFix returns the latest FIX rate from Banxico payload', () => {
  const parsed = parseBanxicoFix(
    {
      bmx: {
        series: [
          {
            idSerie: BANXICO_FIX_SERIES,
            datos: [{ fecha: '20/06/2026', dato: '18.4321' }],
          },
        ],
      },
    },
    new Date('2026-06-22T12:00:00.000Z'),
  )

  assert.deepEqual(parsed, {
    source: 'banxico',
    series: BANXICO_FIX_SERIES,
    rate: 18.4321,
    rateDate: '20/06/2026',
    fetchedAt: '2026-06-22T12:00:00.000Z',
  })
})

test('parseBanxicoFix accepts comma-formatted rates', () => {
  const parsed = parseBanxicoFix({
    bmx: {
      series: [
        {
          idSerie: BANXICO_FIX_SERIES,
          datos: [{ fecha: '20/06/2026', dato: '18,432.1234' }],
        },
      ],
    },
  })

  assert.equal(parsed.rate, 18432.1234)
})

test('parseBanxicoFix rejects payloads without a valid rate', () => {
  assert.throws(
    () =>
      parseBanxicoFix({
        bmx: {
          series: [
            {
              idSerie: BANXICO_FIX_SERIES,
              datos: [{ fecha: '20/06/2026', dato: 'N/E' }],
            },
          ],
        },
      }),
    /No se pudo leer el tipo de cambio FIX/,
  )
})

test('isFreshRate keeps cached rates for less than one day', () => {
  const cached = {
    source: 'banxico' as const,
    series: BANXICO_FIX_SERIES,
    rate: 18.4321,
    rateDate: '20/06/2026',
    fetchedAt: '2026-06-22T08:00:00.000Z',
  }

  assert.equal(isFreshRate(cached, new Date('2026-06-22T20:00:00.000Z')), true)
  assert.equal(isFreshRate(cached, new Date('2026-06-23T09:00:01.000Z')), false)
})
