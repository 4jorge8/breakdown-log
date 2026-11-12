<script setup lang="ts">
import type { StorageMode } from '../types/breakdown'

defineProps<{ mode: StorageMode | null }>()
</script>

<template>
  <p v-if="mode === 'cloud'" class="flex items-center gap-1.5 text-xs font-semibold text-emerald-700" data-test="storage-mode">
    <span class="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
    Datos compartidos: todos los dispositivos ven las mismas averías.
  </p>
  <p v-else-if="mode === 'local'" class="flex items-center gap-1.5 text-xs font-semibold text-amber-700" data-test="storage-mode">
    <span class="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
    Datos guardados solo en este navegador.
  </p>
</template>
