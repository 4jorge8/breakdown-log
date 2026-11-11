<script setup lang="ts">
import { computed } from 'vue'
import type { Breakdown, Status } from '../types/breakdown'
import { PRIORITY_LABELS, STATUS_LABELS, allowedTransitions, formatDuration } from '../domain/breakdowns'
import { machineName } from '../data/machines'

const props = defineProps<{ breakdown: Breakdown; now: Date }>()
const emit = defineEmits<{ changeStatus: [id: string, to: Status] }>()

const actions = computed(() => allowedTransitions(props.breakdown.status))
const actionLabel: Record<Status, string> = {
  open: '',
  in_progress: 'Empezar reparación',
  resolved: 'Marcar resuelta',
}
const priorityClass = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}
const statusClass: Record<Status, string> = {
  open: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
}

const elapsed = computed(() => {
  const b = props.breakdown
  const end = b.resolvedAt ? new Date(b.resolvedAt) : props.now
  return formatDuration(end.getTime() - new Date(b.reportedAt).getTime())
})
const reportedAt = computed(() =>
  new Date(props.breakdown.reportedAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
)
</script>

<template>
  <article
    class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    :class="{ 'border-l-4 border-l-red-600': breakdown.priority === 'high' && breakdown.status !== 'resolved' }"
    :data-id="breakdown.id"
  >
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="mr-auto text-base font-bold text-slate-900">{{ machineName(breakdown.machineId) }}</h2>
      <span class="rounded-full border px-2 py-0.5 text-xs font-bold" :class="priorityClass[breakdown.priority]" data-test="priority">
        {{ PRIORITY_LABELS[breakdown.priority] }}
      </span>
      <span v-if="breakdown.machineStopped" class="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">Máquina parada</span>
      <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="statusClass[breakdown.status]" data-test="status">
        {{ STATUS_LABELS[breakdown.status] }}
      </span>
    </div>
    <p class="mt-2 text-slate-700">{{ breakdown.description }}</p>
    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
      <span>Avisó: <b class="text-slate-700">{{ breakdown.reportedBy }}</b> · {{ reportedAt }}</span>
      <span>{{ breakdown.status === 'resolved' ? 'Resuelta en' : 'Hace' }} <b class="text-slate-700">{{ elapsed }}</b></span>
      <div class="ml-auto flex gap-2">
        <button
          v-for="to in actions"
          :key="to"
          type="button"
          :data-action="to"
          class="rounded-lg px-3 py-2 text-sm font-bold"
          :class="to === 'resolved' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'"
          @click="emit('changeStatus', breakdown.id, to)"
        >{{ actionLabel[to] }}</button>
      </div>
    </div>
  </article>
</template>
