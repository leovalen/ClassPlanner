<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlannerStore } from '../stores/planner'
import { durationOptions, searchPlans } from '../data/search'

const store = usePlannerStore()
const router = useRouter()

const query = ref('')
const duration = ref('')

const durations = computed(() => durationOptions(store.plans))
const results = computed(() => searchPlans(store.sortedPlans, store.templates, query.value, duration.value))
const filtering = computed(() => query.value.trim() !== '' || duration.value !== '')

function clearFilters() {
  query.value = ''
  duration.value = ''
}

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

    <div v-if="store.plans.length" class="filters">
      <input
        v-model="query"
        type="search"
        class="filters__search"
        placeholder="Søk i navn, læringsmål og åpning…"
        autocomplete="off"
      />
      <select v-model="duration" class="filters__duration">
        <option value="">Alle varigheter</option>
        <option v-for="d in durations" :key="d.key" :value="d.key">{{ d.label }} ({{ d.count }})</option>
      </select>
      <button v-if="filtering" class="btn btn--ghost" @click="clearFilters">Nullstill</button>
    </div>

    <p v-if="store.plans.length === 0" class="empty">
      Ingen planer ennå. Lag din første plan med knappen over.
    </p>
    <p v-else-if="results.length === 0" class="empty">Ingen planer passer søket.</p>

    <ul v-else class="plan-list">
      <li v-for="{ plan, hits } in results" :key="plan.id" class="plan-card">
        <RouterLink :to="{ name: 'plan', params: { id: plan.id } }" class="plan-card__main">
          <span class="plan-card__name">{{ plan.name || 'Uten navn' }}</span>
          <span class="plan-card__meta">
            {{ formatDate(plan.date) }}<template v-if="plan.duration"> · {{ plan.duration }}</template>
          </span>
          <span v-if="hits.length === 0 && plan.values.tema" class="plan-card__theme">{{ plan.values.tema.split('\n')[0] }}</span>
          <span v-for="hit in hits" :key="hit.sectionTitle" class="plan-card__hit">
            <span class="plan-card__hit-label">{{ hit.sectionTitle }}:</span> {{ hit.line }}
          </span>
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
