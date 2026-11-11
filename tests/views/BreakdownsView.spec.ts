import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BreakdownsView from '../../src/views/BreakdownsView.vue'
import { loadBreakdowns, saveBreakdowns } from '../../src/services/breakdownService'
import { breakdown } from '../helpers'

async function mountWith(list: Parameters<typeof saveBreakdowns>[0]) {
  await saveBreakdowns(list)
  const wrapper = mount(BreakdownsView)
  await flushPromises()
  return wrapper
}

describe('BreakdownsView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows pending breakdowns in triage order', async () => {
    const wrapper = await mountWith([
      breakdown({ id: 'low', priority: 'low' }),
      breakdown({ id: 'high', priority: 'high' }),
      breakdown({ id: 'done', status: 'resolved', resolvedAt: '2026-11-10T09:00:00Z' }),
    ])
    const ids = wrapper.findAll('article').map((a) => a.attributes('data-id'))
    expect(ids).toEqual(['high', 'low'])
    expect(wrapper.find('[data-tab="pending"]').text()).toContain('(2)')
    expect(wrapper.find('[data-tab="resolved"]').text()).toContain('(1)')
  })

  it('moves a breakdown through its statuses and saves each change', async () => {
    const wrapper = await mountWith([breakdown({ id: 'x' })])
    await wrapper.find('[data-action="in_progress"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="status"]').text()).toBe('En reparación')
    expect((await loadBreakdowns())[0].status).toBe('in_progress')

    await wrapper.find('[data-action="resolved"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="empty"]').exists()).toBe(true)
    expect((await loadBreakdowns())[0].status).toBe('resolved')

    await wrapper.find('[data-tab="resolved"]').trigger('click')
    expect(wrapper.find('[data-test="status"]').text()).toBe('Resuelta')
    expect(wrapper.find('[data-action]').exists()).toBe(false)
  })

  it('shows an empty state when there are no breakdowns', async () => {
    const wrapper = await mountWith([])
    expect(wrapper.find('[data-test="empty"]').text()).toContain('No hay averías pendientes')
  })
})
