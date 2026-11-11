<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BreakdownCard from '../components/BreakdownCard.vue'
import { pendingForTriage, resolvedHistory } from '../domain/breakdowns'
import { useBreakdownsStore } from '../stores/breakdowns'
import type { Status } from '../types/breakdown'

const store = useBreakdownsStore()
const tab = ref<'pending' | 'resolved'>('pending')
const now = ref(new Date())
let timer: number | undefined

onMounted(() => {
  store.load()
  timer = window.setInterval(() => (now.value = new Date()), 60_000)
})
onUnmounted(() => window.clearInterval(timer))

const pending = computed(() => pendingForTriage(store.items))
const resolved = computed(() => resolvedHistory(store.items))
const shown = computed(() => (tab.value === 'pending' ? pending.value : resolved.value))

function onChangeStatus(id: string, to: Status) {
  store.setStatus(id, to)
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Averías</h1>
        <p class="text-sm text-slate-600">Ordenadas por prioridad: primero lo urgente y las máquinas paradas.</p>
      </div>
      <div class="flex rounded-lg bg-slate-200 p-1 text-sm font-semibold" role="tablist">
        <button
          type="button" role="tab" data-tab="pending" :aria-selected="tab === 'pending'"
          class="rounded-md px-3 py-1.5" :class="tab === 'pending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'"
          @click="tab = 'pending'"
        >Pendientes ({{ pending.length }})</button>
        <button
          type="button" role="tab" data-tab="resolved" :aria-selected="tab === 'resolved'"
          class="rounded-md px-3 py-1.5" :class="tab === 'resolved' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'"
          @click="tab = 'resolved'"
        >Resueltas ({{ resolved.length }})</button>
      </div>
    </div>

    <div class="mt-4 space-y-3">
      <BreakdownCard v-for="b in shown" :key="b.id" :breakdown="b" :now="now" @change-status="onChangeStatus" />
      <p v-if="shown.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500" data-test="empty">
        {{ tab === 'pending' ? 'No hay averías pendientes. Todo en marcha.' : 'Aún no hay averías resueltas.' }}
      </p>
    </div>
  </section>
</template>
