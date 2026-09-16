<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="app" :class="{ 'app--print': route.meta.print }">
    <header v-if="!route.meta.print" class="topbar">
      <RouterLink to="/" class="brand">
        <span class="brand__ring"></span>
        <span class="brand__name">The Shala</span>
        <span class="brand__sub">Class Planner</span>
      </RouterLink>
      <nav class="topbar__nav">
        <RouterLink to="/">Planer</RouterLink>
        <RouterLink to="/template">Mal</RouterLink>
        <RouterLink to="/settings">Backup</RouterLink>
      </nav>
    </header>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>
