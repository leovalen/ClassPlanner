<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePlannerStore } from '../stores/planner'
import { valueKey, type TemplateSection } from '../data/types'

const props = defineProps<{ id: string }>()
const store = usePlannerStore()

const plan = computed(() => store.planById(props.id))
const template = computed(() => (plan.value ? store.templateById(plan.value.templateId) : undefined))
const page1 = computed(() => template.value?.sections.filter((s) => s.page === 1) ?? [])
const page2 = computed(() => template.value?.sections.filter((s) => s.page === 2) ?? [])

function lines(section: TemplateSection, groupId?: string): string[] {
  const raw = plan.value?.values[valueKey(section.id, groupId)] ?? ''
  return raw
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
}

function formatDate(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function print() {
  window.print()
}

onMounted(() => {
  document.title = `${plan.value?.name || 'Class Planner'} – The Shala`
})
</script>

<template>
  <div v-if="plan && template" class="print">
    <div class="print__toolbar">
      <RouterLink :to="{ name: 'plan', params: { id: plan.id } }" class="btn btn--ghost">← Rediger</RouterLink>
      <button class="btn btn--primary" @click="print">Skriv ut / lagre som PDF</button>
    </div>

    <div class="sheet">
      <div class="sheet__head">
        <div class="brand brand--print">
          <span class="brand__ring"></span>
          <span class="brand__name">The Shala</span>
        </div>
        <h1>Class Planner</h1>
      </div>
      <div class="sheet__meta">
        <div class="meta-box"><div class="section-header"><span>Navn på klassen</span></div><div class="meta-box__value">{{ plan.name }}</div></div>
        <div class="meta-box"><div class="section-header"><span>Varighet</span></div><div class="meta-box__value">{{ plan.duration }}</div></div>
        <div class="meta-box"><div class="section-header"><span>Dato</span></div><div class="meta-box__value">{{ formatDate(plan.date) }}</div></div>
      </div>
      <div class="sheet__sections">
        <section v-for="section in page1" :key="section.id" class="section" :class="`section--${section.width}`">
          <div class="section-header"><span>{{ section.title }}</span></div>
          <ul v-if="lines(section).length" class="lines"><li v-for="(l, i) in lines(section)" :key="i">{{ l }}</li></ul>
          <ul v-else class="prompts"><li v-for="p in section.prompts" :key="p">{{ p }}</li></ul>
        </section>
      </div>
    </div>

    <div class="sheet">
      <div class="sheet__sections">
        <section v-for="section in page2" :key="section.id" class="section" :class="[`section--${section.width}`, { 'section--sequence': section.kind === 'sequence' }]">
          <div class="section-header"><span>{{ section.title }}</span></div>
          <template v-if="section.kind === 'sequence'">
            <div v-for="group in section.groups" :key="group.id" class="group">
              <div class="group__title">{{ group.title }}</div>
              <ul class="lines"><li v-for="(l, i) in lines(section, group.id)" :key="i">{{ l }}</li></ul>
            </div>
          </template>
          <template v-else>
            <ul v-if="lines(section).length" class="lines"><li v-for="(l, i) in lines(section)" :key="i">{{ l }}</li></ul>
            <ul v-else class="prompts"><li v-for="p in section.prompts" :key="p">{{ p }}</li></ul>
          </template>
        </section>
      </div>
      <div class="sheet__foot">
        <div class="brand brand--print">
          <span class="brand__ring"></span>
          <span class="brand__name">The Shala</span>
          <span class="brand__sub">Yoga &amp; Mindfulness</span>
        </div>
      </div>
    </div>
  </div>
</template>
