<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlannerStore } from '../stores/planner'

const store = usePlannerStore()
const router = useRouter()

async function create() {
  const plan = await store.createPlan()
  router.push({ name: 'plan', params: { id: plan.id } })
}

async function duplicate(id: string) {
  const copy = await store.duplicatePlan(id)
  if (copy) router.push({ name: 'plan', params: { id: copy.id } })
}

async function remove(id: string, name: string) {
  if (confirm(`Slette «${name || 'Uten navn'}»?`)) await store.deletePlan(id)
}

function formatDate(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
</script>

<template>
  <div class="page-wrap">
    <div class="toolbar">
      <h1>Klasseplaner</h1>
      <button class="btn btn--primary" @click="create">+ Ny plan</button>
    </div>

    <p v-if="store.sortedPlans.length === 0" class="empty">
      Ingen planer ennå. Lag din første plan med knappen over.
    </p>

    <ul v-else class="plan-list">
      <li v-for="plan in store.sortedPlans" :key="plan.id" class="plan-card">
        <RouterLink :to="{ name: 'plan', params: { id: plan.id } }" class="plan-card__main">
          <span class="plan-card__name">{{ plan.name || 'Uten navn' }}</span>
          <span class="plan-card__meta">
            {{ formatDate(plan.date) }}<template v-if="plan.duration"> · {{ plan.duration }}</template>
          </span>
          <span v-if="plan.values.tema" class="plan-card__theme">{{ plan.values.tema.split('\n')[0] }}</span>
        </RouterLink>
        <div class="plan-card__actions">
          <RouterLink class="btn btn--ghost" :to="{ name: 'print', params: { id: plan.id } }">Skriv ut</RouterLink>
          <button class="btn btn--ghost" @click="duplicate(plan.id)">Kopier</button>
          <button class="btn btn--ghost btn--danger" @click="remove(plan.id, plan.name)">Slett</button>
        </div>
      </li>
    </ul>
  </div>
</template>
