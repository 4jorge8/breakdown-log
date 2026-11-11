import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Breakdown, BreakdownInput } from '../types/breakdown'
import { createBreakdown } from '../domain/breakdowns'
import { loadBreakdowns, newId, saveBreakdowns } from '../services/breakdownService'

export const useBreakdownsStore = defineStore('breakdowns', () => {
  const items = ref<Breakdown[]>([])
  const loaded = ref(false)

  async function load() {
    items.value = await loadBreakdowns()
    loaded.value = true
  }

  async function report(input: BreakdownInput): Promise<Breakdown> {
    if (!loaded.value) await load()
    const breakdown = createBreakdown(input, new Date(), newId())
    items.value = [...items.value, breakdown]
    await saveBreakdowns(items.value)
    return breakdown
  }

  return { items, loaded, load, report }
})
