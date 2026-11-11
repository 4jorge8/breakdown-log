import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeView from '../src/views/HomeView.vue'

describe('HomeView', () => {
  it('shows the app name', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.text()).toContain('Registro de Averías')
  })
})
