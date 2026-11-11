import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DemoBar from '../../src/components/DemoBar.vue'

describe('DemoBar', () => {
  it('asks for a second click before replacing or deleting data', async () => {
    const wrapper = mount(DemoBar)
    await wrapper.find('[data-demo="clear"]').trigger('click')
    expect(wrapper.emitted('clearAll')).toBeUndefined()
    expect(wrapper.find('[data-demo="clear"]').text()).toContain('Pulsa otra vez')
    await wrapper.find('[data-demo="clear"]').trigger('click')
    expect(wrapper.emitted('clearAll')).toHaveLength(1)

    await wrapper.find('[data-demo="load"]').trigger('click')
    await wrapper.find('[data-demo="load"]').trigger('click')
    expect(wrapper.emitted('loadSample')).toHaveLength(1)
  })
})
