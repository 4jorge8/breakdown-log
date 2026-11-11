<script setup lang="ts">
defineProps<{ label: string; value: string; hint?: string; accent?: string }>()
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ label }}</p>
    <p class="mt-1 text-3xl font-extrabold" :class="accent ?? 'text-slate-900'" data-test="kpi-value">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
