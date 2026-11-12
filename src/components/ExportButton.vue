<script setup lang="ts">
defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ export: [] }>()
</script>

<template>
  <button
    type="button"
    data-test="export"
    :disabled="disabled"
    class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
    @click="emit('export')"
  >
    <svg aria-hidden="true" viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 3v10m0 0-4-4m4 4 4-4M4 15v2h12v-2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    Exportar a Excel (CSV)
  </button>
</template>
