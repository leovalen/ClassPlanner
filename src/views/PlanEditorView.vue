<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlannerStore } from '../stores/planner'
import { valueKey, type TemplateSection } from '../data/types'
import SectionHeader from '../components/SectionHeader.vue'
import { useAutosave } from '../composables/useAutosave'

const props = defineProps<{ id: string }>()
const store = usePlannerStore()
const router = useRouter()

const plan = computed(() => store.planById(props.id))
const template = computed(() => (plan.value ? store.templateById(plan.value.templateId) : undefined))
const page1 = computed(() => template.value?.sections.filter((s) => s.page === 1) ?? [])
const page2 = computed(() => template.value?.sections.filter((s) => s.page === 2) ?? [])

const { statusText, saveNow } = useAutosave(plan, (p) => store.savePlan(p))

async function saveAndBack() {
  await saveNow()
  router.push({ name: 'plans' })
}

function key(section: TemplateSection, groupId?: string) {
  return valueKey(section.id, groupId)
}

function autoGrow(event: Event) {
  const el = event.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
</script>

<template>
  <div v-if="plan && template" class="page-wrap editor">
    <div class="toolbar">
      <RouterLink to="/" class="btn btn--ghost">← Planer</RouterLink>
      <span class="status">{{ statusText }}</span>
      <div class="toolbar__actions">
        <RouterLink class="btn" :to="{ name: 'print', params: { id: plan.id } }">Skriv ut</RouterLink>
        <button class="btn" @click="saveNow">Lagre</button>
        <button class="btn btn--primary" @click="saveAndBack">Lagre og gå tilbake til oversikten</button>
      </div>
    </div>

    <div class="meta-grid">
      <label class="field">
        <span class="field__label">Navn på klassen</span>
        <input v-model="plan.name" type="text" autocomplete="off" />
      </label>
      <label class="field">
        <span class="field__label">Varighet</span>
        <input v-model="plan.duration" type="text" placeholder="60 min" autocomplete="off" />
      </label>
      <label class="field">
        <span class="field__label">Dato</span>
        <input v-model="plan.date" type="date" />
      </label>
    </div>

    <div class="editor-pages">
      <div v-for="(sections, pageIndex) in [page1, page2]" :key="pageIndex" class="editor-page">
        <section
          v-for="section in sections"
          :key="section.id"
          class="section"
          :class="`section--${section.width}`"
        >
          <SectionHeader :title="section.title" />
          <ul v-if="section.prompts.length" class="prompts">
            <li v-for="prompt in section.prompts" :key="prompt">{{ prompt }}</li>
          </ul>

          <template v-if="section.kind === 'sequence'">
            <div v-for="group in section.groups" :key="group.id" class="group">
              <div class="group__title">{{ group.title }}</div>
              <textarea
                v-model="plan.values[key(section, group.id)]"
                rows="3"
                @input="autoGrow"
                @focus="autoGrow"
              ></textarea>
            </div>
          </template>
          <textarea
            v-else
            v-model="plan.values[key(section)]"
            rows="3"
            @input="autoGrow"
            @focus="autoGrow"
          ></textarea>
        </section>
      </div>
    </div>
  </div>
  <div v-else class="page-wrap">
    <p class="empty">Fant ikke planen.</p>
    <RouterLink to="/" class="btn">← Planer</RouterLink>
  </div>
</template>
