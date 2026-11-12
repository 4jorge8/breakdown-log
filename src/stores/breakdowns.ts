import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Breakdown, BreakdownInput, Status, StorageMode } from '../types/breakdown'
import { connect, type BreakdownRepository } from '../services/breakdownService'
import { validateBreakdownInput } from '../domain/breakdowns'
import { sampleBreakdowns } from '../data/sampleData'

const ERROR_MESSAGE = 'No se ha podido guardar. Revisa la conexión e inténtalo de nuevo.'

export const useBreakdownsStore = defineStore('breakdowns', () => {
  const items = ref<Breakdown[]>([])
  const loaded = ref(false)
  const mode = ref<StorageMode | null>(null)
  const error = ref('')
  let repo: BreakdownRepository | null = null

  async function load() {
    if (!repo) {
      const connection = await connect()
      repo = connection.repo
      mode.value = repo.mode
      items.value = connection.items
    } else {
      items.value = await repo.list()
    }
    loaded.value = true
  }

  /** Reloads from storage; used to see breakdowns reported from other devices. */
  async function refresh() {
    if (!repo) return load()
    try {
      items.value = await repo.list()
    } catch {
      // keep the current list; a later refresh will try again
    }
  }

  async function withRepo<T>(action: (r: BreakdownRepository) => Promise<T>): Promise<T> {
    if (!repo) await load()
    error.value = ''
    try {
      return await action(repo!)
    } catch (e) {
      error.value = ERROR_MESSAGE
      throw e
    }
  }

  async function report(input: BreakdownInput): Promise<Breakdown> {
    if (Object.keys(validateBreakdownInput(input)).length > 0) {
      throw new Error('Invalid breakdown input') // never send invalid data to the server
    }
    const breakdown = await withRepo((r) => r.create(input))
    items.value = [...items.value.filter((b) => b.id !== breakdown.id), breakdown]
    return breakdown
  }

  async function setStatus(id: string, to: Status): Promise<void> {
    const updated = await withRepo((r) => r.updateStatus(id, to))
    items.value = items.value.map((b) => (b.id === id ? updated : b))
  }

  /** Demo only: replaces all data with realistic sample breakdowns. */
  async function loadSample(): Promise<void> {
    const sample = sampleBreakdowns(new Date())
    await withRepo((r) => r.replaceAll(sample))
    items.value = sample
  }

  async function clearAll(): Promise<void> {
    await withRepo((r) => r.replaceAll([]))
    items.value = []
  }

  return { items, loaded, mode, error, load, refresh, report, setStatus, loadSample, clearAll }
})
