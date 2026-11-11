<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const links = [
  { to: '/', label: 'Registrar' },
  { to: '/breakdowns', label: 'Averías' },
  { to: '/indicators', label: 'Indicadores' },
]
</script>

<template>
  <header class="bg-slate-900 text-white">
    <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
      <RouterLink to="/" class="flex items-center gap-2 text-lg font-bold">
        <img src="/favicon.svg" alt="" class="h-7 w-7" />
        Registro de Averías
      </RouterLink>
      <nav class="flex gap-1 text-sm font-semibold">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="rounded-md px-3 py-2 text-slate-300 hover:text-white"
          exact-active-class="bg-white/10 text-white"
        >{{ l.label }}</RouterLink>
      </nav>
    </div>
  </header>
  <main class="mx-auto max-w-5xl p-4 sm:p-6">
    <RouterView />
  </main>
</template>
