import { describe, expect, it } from 'vitest'
import { CSV_HEADERS, breakdownsToCsv, csvFileName } from '../../src/domain/export'
import { MACHINES } from '../../src/data/machines'
import { breakdown } from '../helpers'

const now = new Date('2026-11-12T12:00:00Z')

function rows(csv: string): string[] {
  return csv.replace('﻿', '').trimEnd().split('\r\n')
}

describe('breakdownsToCsv', () => {
  it('starts with a UTF-8 BOM and the Spanish headers separated by ";"', () => {
    const csv = breakdownsToCsv([], MACHINES, now)
    expect(csv.startsWith('﻿')).toBe(true)
    expect(rows(csv)).toEqual([CSV_HEADERS.join(';')])
  })

  it('writes one row per breakdown with labels in Spanish, most recent first', () => {
    const list = [
      breakdown({ id: 'old', reportedAt: '2026-11-01T08:00:00Z' }),
      breakdown({
        id: 'new',
        machineId: 'bob-1',
        priority: 'high',
        machineStopped: true,
        status: 'resolved',
        reportedAt: '2026-11-10T08:00:00Z',
        startedAt: '2026-11-10T08:30:00Z',
        resolvedAt: '2026-11-10T10:30:00Z',
      }),
    ]
    const [, first, second] = rows(breakdownsToCsv(list, MACHINES, now))
    const cells = first.split(';')
    expect(cells[0]).toBe('new')
    expect(cells[1]).toBe('Bobinadora 1')
    expect(cells[2]).toBe('Bobinado')
    expect(cells[4]).toBe('Alta')
    expect(cells[5]).toBe('Sí')
    expect(cells[7]).toBe('Resuelta')
    expect(cells[8]).toMatch(/^10\/11\/2026 \d\d:00$/)
    expect(cells[11]).toBe('2,50') // downtime with decimal comma
    expect(cells[12]).toBe('2,50')
    expect(second.split(';')[0]).toBe('old')
  })

  it('leaves empty cells for dates and hours that do not exist yet', () => {
    const [, row] = rows(breakdownsToCsv([breakdown({ machineStopped: false })], MACHINES, now))
    const cells = row.split(';')
    expect(cells[5]).toBe('No')
    expect(cells[9]).toBe('')
    expect(cells[10]).toBe('')
    expect(cells[11]).toBe('0,00')
    expect(cells[12]).toBe('')
  })

  it('escapes separators, quotes and line breaks in free text', () => {
    const csv = breakdownsToCsv([breakdown({ description: 'Ruido; "fuerte"\nen el eje' })], MACHINES, now)
    expect(csv).toContain('"Ruido; ""fuerte""\nen el eje"')
  })

  it('does not let Excel run user text as a formula (CSV injection)', () => {
    const [, row] = rows(breakdownsToCsv([breakdown({ description: '=HYPERLINK("http://x")', reportedBy: '+Ana' })], MACHINES, now))
    expect(row).toContain(`"'=HYPERLINK(""http://x"")"`)
    expect(row.split(';')[6]).toBe("'+Ana")
  })

  it('keeps unknown machines visible by their id', () => {
    const [, row] = rows(breakdownsToCsv([breakdown({ machineId: 'old-press' })], MACHINES, now))
    expect(row.split(';')[1]).toBe('old-press')
  })
})

describe('csvFileName', () => {
  it('uses the date of the export', () => {
    expect(csvFileName(new Date(2026, 10, 5, 9, 0))).toBe('averias-2026-11-05.csv')
  })
})
