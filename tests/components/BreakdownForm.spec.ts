import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BreakdownForm from '../../src/components/BreakdownForm.vue'
import { MACHINES } from '../../src/data/machines'

function mountForm() {
  return mount(BreakdownForm, { props: { machines: MACHINES } })
}

describe('BreakdownForm', () => {
  it('lists every machine of the plant', () => {
    const options = mountForm().findAll('#machine option:not([disabled])')
    expect(options).toHaveLength(MACHINES.length)
  })

  it('shows errors in Spanish and does not submit an empty form', async () => {
    const wrapper = mountForm()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.find('[data-error="machineId"]').text()).toContain('máquina')
    expect(wrapper.find('[data-error="description"]').exists()).toBe(true)
    expect(wrapper.find('[data-error="priority"]').exists()).toBe(true)
    expect(wrapper.find('[data-error="reportedBy"]').exists()).toBe(true)
  })

  it('emits the report and clears the form, keeping the operator name', async () => {
    const wrapper = mountForm()
    await wrapper.find('#machine').setValue('bob-1')
    await wrapper.find('#description').setValue('Se atasca la bobina al cambiar')
    await wrapper.find('input[value="medium"]').setValue(true)
    await wrapper.find('#stopped').setValue(false)
    await wrapper.find('#reportedBy').setValue('Luis')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')![0][0]).toEqual({
      machineId: 'bob-1',
      description: 'Se atasca la bobina al cambiar',
      priority: 'medium',
      machineStopped: false,
      reportedBy: 'Luis',
    })
    expect((wrapper.find('#description').element as HTMLTextAreaElement).value).toBe('')
    expect((wrapper.find('#reportedBy').element as HTMLInputElement).value).toBe('Luis')
  })
})
