<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ loadSample: []; clearAll: [] }>()
const confirming = ref<'' | 'load' | 'clear'>('')

function press(action: 'load' | 'clear') {
  if (confirming.value !== action) {
    confirming.value = action
    return
  }
  confirming.value = ''
  if (action === 'load') emit('loadSample')
  else emit('clearAll')
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
    <span>Modo demostración:</span>
    <button type="button" data-demo="load" class="rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100" @click="press('load')">
      {{ confirming === 'load' ? 'Se reemplazarán los datos. ¿Confirmar?' : 'Cargar datos de ejemplo' }}
    </button>
    <button type="button" data-demo="clear" class="rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100" @click="press('clear')">
      {{ confirming === 'clear' ? '¿Borrar todo? Pulsa otra vez' : 'Borrar todos los datos' }}
    </button>
  </div>
</template>
