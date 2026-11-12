<script setup lang="ts">
import { ref } from 'vue'
import BreakdownForm from '../components/BreakdownForm.vue'
import { MACHINES, machineName } from '../data/machines'
import { useBreakdownsStore } from '../stores/breakdowns'
import type { BreakdownInput } from '../types/breakdown'

const store = useBreakdownsStore()
const confirmation = ref('')

async function onSubmit(input: BreakdownInput) {
  confirmation.value = ''
  try {
    const breakdown = await store.report(input)
    confirmation.value = `Avería registrada en ${machineName(breakdown.machineId)}. Mantenimiento ya la tiene en su lista.`
  } catch {
    // the store shows the error banner
  }
}
</script>

<template>
  <section class="mx-auto max-w-xl rounded-xl bg-white p-5 shadow-sm sm:p-6">
    <h1 class="text-xl font-bold text-slate-900">Registrar una avería</h1>
    <p class="mt-1 text-sm text-slate-600">Rellénalo en menos de un minuto. Mantenimiento lo verá al momento.</p>
    <p
      v-if="confirmation"
      role="status"
      class="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
    >
      ✓ {{ confirmation }}
    </p>
    <div class="mt-5">
      <BreakdownForm :machines="MACHINES" @submit="onSubmit" />
    </div>
  </section>
</template>
