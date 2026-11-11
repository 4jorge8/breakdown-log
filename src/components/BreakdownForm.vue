<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { BreakdownInput, InputErrors, Machine, Priority } from '../types/breakdown'
import { DESCRIPTION_MAX, PRIORITY_LABELS, emptyInput, validateBreakdownInput } from '../domain/breakdowns'

defineProps<{ machines: Machine[] }>()
const emit = defineEmits<{ submit: [input: BreakdownInput] }>()

const form = reactive<BreakdownInput>(emptyInput())
const errors = ref<InputErrors>({})
const priorities: Priority[] = ['high', 'medium', 'low']

function onSubmit() {
  errors.value = validateBreakdownInput(form)
  if (Object.keys(errors.value).length > 0) return
  emit('submit', { ...form })
  Object.assign(form, emptyInput(), { reportedBy: form.reportedBy })
}

const priorityStyle: Record<Priority, string> = {
  high: 'peer-checked:bg-red-600 peer-checked:border-red-600',
  medium: 'peer-checked:bg-amber-500 peer-checked:border-amber-500',
  low: 'peer-checked:bg-emerald-600 peer-checked:border-emerald-600',
}
</script>

<template>
  <form class="space-y-5" novalidate @submit.prevent="onSubmit">
    <div>
      <label for="machine" class="block text-sm font-semibold text-slate-700">Máquina</label>
      <select
        id="machine"
        v-model="form.machineId"
        class="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-base"
      >
        <option value="" disabled>Elige una máquina…</option>
        <option v-for="m in machines" :key="m.id" :value="m.id">{{ m.name }} · {{ m.area }}</option>
      </select>
      <p v-if="errors.machineId" class="mt-1 text-sm text-red-600" data-error="machineId">{{ errors.machineId }}</p>
    </div>

    <div>
      <label for="description" class="block text-sm font-semibold text-slate-700">¿Qué ha pasado?</label>
      <textarea
        id="description"
        v-model="form.description"
        rows="3"
        :maxlength="DESCRIPTION_MAX"
        placeholder="Ej.: ruido metálico en el rodillo de salida y la lámina se rompe"
        class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base"
      />
      <p v-if="errors.description" class="mt-1 text-sm text-red-600" data-error="description">{{ errors.description }}</p>
    </div>

    <fieldset>
      <legend class="text-sm font-semibold text-slate-700">Prioridad</legend>
      <div class="mt-1 grid grid-cols-3 gap-2">
        <label v-for="p in priorities" :key="p" class="cursor-pointer">
          <input v-model="form.priority" type="radio" name="priority" :value="p" class="peer sr-only" />
          <span
            class="block rounded-lg border border-slate-300 bg-white p-3 text-center font-semibold text-slate-700 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-slate-900"
            :class="priorityStyle[p]"
          >{{ PRIORITY_LABELS[p] }}</span>
        </label>
      </div>
      <p v-if="errors.priority" class="mt-1 text-sm text-red-600" data-error="priority">{{ errors.priority }}</p>
    </fieldset>

    <label class="flex items-center gap-3 rounded-lg border border-slate-300 bg-white p-3">
      <input id="stopped" v-model="form.machineStopped" type="checkbox" class="h-5 w-5 accent-orange-700" />
      <span class="font-medium text-slate-800">La máquina está parada</span>
    </label>

    <div>
      <label for="reportedBy" class="block text-sm font-semibold text-slate-700">Tu nombre</label>
      <input
        id="reportedBy"
        v-model="form.reportedBy"
        type="text"
        autocomplete="name"
        class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base"
      />
      <p v-if="errors.reportedBy" class="mt-1 text-sm text-red-600" data-error="reportedBy">{{ errors.reportedBy }}</p>
    </div>

    <button type="submit" class="w-full rounded-lg bg-orange-700 p-4 text-lg font-bold text-white hover:bg-orange-800">
      Registrar avería
    </button>
  </form>
</template>
