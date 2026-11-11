import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Breakdown, BreakdownInput, Status } from '../types/breakdown'
import { changeStatus, createBreakdown } from '../domain/breakdowns'
import { loadBreakdowns, newId, saveBreakdowns } from '../services/breakdownService'
import { sampleBreakdowns } from '../data/sampleData'

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

  async function setStatus(id: string, to: Status): Promise<void> {
    const current = items.value.find((b) => b.id === id)
    if (!current) throw new Error(`Breakdown not found: ${id}`)
    const updated = changeStatus(current, to, new Date())
    items.value = items.value.map((b) => (b.id === id ? updated : b))
    await saveBreakdowns(items.value)
  }

  /** Demo only: replaces all data with realistic sample breakdowns. */
  async function loadSample(): Promise<void> {
    items.value = sampleBreakdowns(new Date())
    await saveBreakdowns(items.value)
  }

  async function clearAll(): Promise<void> {
    items.value = []
    await saveBreakdowns(items.value)
  }

  return { items, loaded, load, report, setStatus, loadSample, clearAll }
})
