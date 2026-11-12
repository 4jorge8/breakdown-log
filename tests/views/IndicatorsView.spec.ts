import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import IndicatorsView from '../../src/views/IndicatorsView.vue'
import { saveBreakdowns } from '../../src/services/breakdownService'
import { MACHINES } from '../../src/data/machines'
import { breakdown } from '../helpers'

describe('IndicatorsView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows an empty state without breakdowns', async () => {
    const wrapper = mount(IndicatorsView)
    await flushPromises()
    expect(wrapper.find('[data-test="empty"]').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('shows one row per machine with its indicators, most downtime first', async () => {
    await saveBreakdowns([
      breakdown({ id: '1', machineId: 'bob-1', machineStopped: true, status: 'resolved', reportedAt: '2026-11-10T06:00:00Z', resolvedAt: '2026-11-10T09:00:00Z' }),
      breakdown({ id: '2', machineId: 'cmp-1', machineStopped: false, status: 'resolved', reportedAt: '2026-11-10T08:00:00Z', resolvedAt: '2026-11-10T09:00:00Z' }),
    ])
    const wrapper = mount(IndicatorsView)
    await flushPromises()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(MACHINES.length)
    expect(rows[0].attributes('data-machine')).toBe('bob-1')
    expect(rows[0].find('[data-col="downtime"]').text()).toBe('3,0 h')
    expect(rows[0].find('[data-col="mttr"]').text()).toBe('3,0 h')
    const kpis = wrapper.findAll('[data-test="kpi-value"]').map((k) => k.text())
    expect(kpis).toEqual(['2', '0', '3,0 h', '2,0 h'])
  })
})

describe('IndicatorsView · export', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('disables the export when there is nothing to export', async () => {
    const wrapper = mount(IndicatorsView)
    await flushPromises()
    expect(wrapper.find('[data-test="export"]').attributes('disabled')).toBeDefined()
  })

  it('downloads a CSV file named with the date', async () => {
    await saveBreakdowns([breakdown()])
    const created: string[] = []
    let downloaded = ''
    URL.createObjectURL = () => 'blob:test'
    URL.revokeObjectURL = () => {}
    const click = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () {
      created.push(this.href)
      downloaded = this.download
    }
    const wrapper = mount(IndicatorsView)
    await flushPromises()
    await wrapper.find('[data-test="export"]').trigger('click')
    HTMLAnchorElement.prototype.click = click
    expect(created).toEqual(['blob:test'])
    expect(downloaded).toMatch(/^averias-\d{4}-\d{2}-\d{2}\.csv$/)
  })
})
