<script setup lang="ts">
import { computed, onMounted } from 'vue'
import KpiTile from '../components/KpiTile.vue'
import ExportButton from '../components/ExportButton.vue'
import { breakdownsToCsv, csvFileName } from '../domain/export'
import { MACHINES } from '../data/machines'
import { formatHours, machineIndicators, plantIndicators } from '../domain/metrics'
import { useBreakdownsStore } from '../stores/breakdowns'

const store = useBreakdownsStore()
onMounted(() => store.load())

const now = new Date()
const plant = computed(() => plantIndicators(store.items, now))
const rows = computed(() => machineIndicators(store.items, MACHINES, now))
const maxDowntime = computed(() => Math.max(...rows.value.map((r) => r.downtimeHours), 0))

function downloadCsv() {
  const now = new Date()
  const blob = new Blob([breakdownsToCsv(store.items, MACHINES, now)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = csvFileName(now)
  link.click()
  URL.revokeObjectURL(url)
}

function barWidth(hours: number): string {
  return maxDowntime.value > 0 ? `${(hours / maxDowntime.value) * 100}%` : '0%'
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Indicadores de mantenimiento</h1>
        <p class="text-sm text-slate-600">Qué máquinas paran más y cuánto se tarda en resolver sus averías.</p>
      </div>
      <ExportButton :disabled="plant.breakdowns === 0" @export="downloadCsv" />
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiTile label="Averías registradas" :value="String(plant.breakdowns)" />
      <KpiTile label="Pendientes ahora" :value="String(plant.open)" :accent="plant.open ? 'text-red-600' : 'text-emerald-600'" />
      <KpiTile label="Horas de parada" :value="formatHours(plant.downtimeHours)" hint="Solo averías con máquina parada" />
      <KpiTile label="MTTR de la planta" :value="formatHours(plant.mttrHours)" hint="Tiempo medio del aviso a la solución" />
    </div>

    <div v-if="plant.breakdowns === 0" class="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500" data-test="empty">
      Todavía no hay averías registradas. Los indicadores aparecerán con la primera.
    </div>

    <div v-else class="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead class="bg-slate-900 text-white">
          <tr>
            <th class="px-4 py-3 font-semibold">Máquina</th>
            <th class="px-4 py-3 text-right font-semibold">Averías</th>
            <th class="px-4 py-3 text-right font-semibold">Pendientes</th>
            <th class="px-4 py-3 font-semibold">Horas de parada</th>
            <th class="px-4 py-3 text-right font-semibold">MTTR</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.machine.id" class="border-t border-slate-100" :data-machine="r.machine.id">
            <td class="px-4 py-3">
              <span class="font-semibold text-slate-900">{{ r.machine.name }}</span>
              <span class="block text-xs text-slate-500">{{ r.machine.area }}</span>
            </td>
            <td class="px-4 py-3 text-right tabular-nums" data-col="breakdowns">{{ r.breakdowns }}</td>
            <td class="px-4 py-3 text-right tabular-nums" data-col="open" :class="r.open ? 'font-bold text-red-600' : 'text-slate-400'">{{ r.open }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="h-2.5 flex-1 rounded-full bg-slate-100">
                  <div class="h-2.5 rounded-full bg-orange-600" :style="{ width: barWidth(r.downtimeHours) }" />
                </div>
                <span class="w-16 text-right tabular-nums" data-col="downtime">{{ formatHours(r.downtimeHours) }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-right tabular-nums" data-col="mttr">{{ formatHours(r.mttrHours) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="plant.breakdowns > 0" class="mt-3 text-xs text-slate-500">
      Ordenadas por horas de parada. Las averías aún abiertas con la máquina parada suman parada hasta ahora.
    </p>
  </section>
</template>
