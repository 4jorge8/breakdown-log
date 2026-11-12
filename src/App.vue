<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import DemoBar from './components/DemoBar.vue'
import StorageStatus from './components/StorageStatus.vue'
import { useBreakdownsStore } from './stores/breakdowns'

const store = useBreakdownsStore()
const links = [
  { to: '/', label: 'Registrar' },
  { to: '/breakdowns', label: 'Averías' },
  { to: '/indicators', label: 'Indicadores' },
]

// With shared storage, pick up breakdowns reported from other devices
const REFRESH_MS = 30_000
let timer: number | undefined
function refreshIfShared() {
  if (store.mode === 'cloud' && document.visibilityState === 'visible') store.refresh()
}
onMounted(() => {
  store.load()
  timer = window.setInterval(refreshIfShared, REFRESH_MS)
  document.addEventListener('visibilitychange', refreshIfShared)
})
onUnmounted(() => {
  window.clearInterval(timer)
  document.removeEventListener('visibilitychange', refreshIfShared)
})
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
  <div v-if="store.error" role="alert" class="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white" data-test="error">
    {{ store.error }}
  </div>
  <main class="mx-auto max-w-5xl p-4 sm:p-6">
    <RouterView />
  </main>
  <footer class="mx-auto max-w-5xl space-y-2 border-t border-slate-200 px-4 py-4 sm:px-6">
    <StorageStatus :mode="store.mode" />
    <DemoBar @load-sample="store.loadSample().catch(() => {})" @clear-all="store.clearAll().catch(() => {})" />
    <p class="text-xs text-slate-400">Proyecto final · Building Digital Products with Generative AI · 2026</p>
  </footer>
</template>
