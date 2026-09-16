<script setup lang="ts">
import { computed } from 'vue'
import { usePlannerStore } from '../stores/planner'
import type { TemplateSection } from '../data/types'
import { useAutosave } from '../composables/useAutosave'

const store = usePlannerStore()
const template = computed(() => store.defaultTemplate)
const { statusText } = useAutosave(template, (t) => store.saveTemplate(t))

function slug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[æ]/g, 'ae')
      .replace(/[ø]/g, 'o')
      .replace(/[å]/g, 'a')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || crypto.randomUUID().slice(0, 8)
  )
}

function addSection(page: 1 | 2) {
  const id = `seksjon-${crypto.randomUUID().slice(0, 8)}`
  template.value?.sections.push({ id, title: 'Ny seksjon', kind: 'text', width: 'full', page, prompts: [] })
}
function removeSection(section: TemplateSection) {
  if (!template.value || !confirm(`Fjerne seksjonen «${section.title}»? Innhold i eksisterende planer beholdes, men vises ikke lenger.`)) return
  template.value.sections = template.value.sections.filter((s) => s !== section)
}
function move(section: TemplateSection, delta: number) {
  const list = template.value!.sections
  const i = list.indexOf(section)
  const j = i + delta
  if (j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j]!, list[i]!]
}
function addGroup(section: TemplateSection) {
  section.groups ??= []
  const title = 'Ny gruppe'
  section.groups.push({ id: `${slug(title)}-${crypto.randomUUID().slice(0, 4)}`, title })
}
function removeGroup(section: TemplateSection, index: number) {
  section.groups?.splice(index, 1)
}
function promptsText(section: TemplateSection) {
  return section.prompts.join('\n')
}
function setPrompts(section: TemplateSection, event: Event) {
  section.prompts = (event.target as HTMLTextAreaElement).value.split('\n').map((s) => s.trim()).filter(Boolean)
}
function onKindChange(section: TemplateSection) {
  if (section.kind === 'sequence' && !section.groups?.length) addGroup(section)
}
</script>

<template>
  <div v-if="template" class="page-wrap">
    <div class="toolbar">
      <h1>Mal</h1>
      <span class="status">{{ statusText }}</span>
    </div>
    <p class="hint">
      Endringer i malen gjelder alle planer. Seksjonens id-er beholdes, så eksisterende innhold blir liggende
      der det hører hjemme selv om du endrer overskrifter eller rekkefølge.
    </p>

    <label class="field">
      <span class="field__label">Navn på mal</span>
      <input v-model="template.name" type="text" />
    </label>

    <div v-for="page in [1, 2]" :key="page" class="template-page">
      <h2>Side {{ page }}</h2>
      <div
        v-for="section in template.sections.filter((s) => s.page === page)"
        :key="section.id"
        class="template-section"
      >
        <div class="template-section__row">
          <input v-model="section.title" type="text" class="template-section__title" />
          <select v-model="section.kind" @change="onKindChange(section)">
            <option value="text">Tekst</option>
            <option value="sequence">Sekvens med grupper</option>
          </select>
          <select v-model="section.width">
            <option value="full">Full bredde</option>
            <option value="half">Halv bredde</option>
          </select>
          <select v-model.number="section.page">
            <option :value="1">Side 1</option>
            <option :value="2">Side 2</option>
          </select>
          <button class="btn btn--ghost" title="Flytt opp" @click="move(section, -1)">↑</button>
          <button class="btn btn--ghost" title="Flytt ned" @click="move(section, 1)">↓</button>
          <button class="btn btn--ghost btn--danger" @click="removeSection(section)">Fjern</button>
        </div>

        <label class="field">
          <span class="field__label">Hjelpetekster (én per linje)</span>
          <textarea :value="promptsText(section)" rows="3" @change="setPrompts(section, $event)"></textarea>
        </label>

        <div v-if="section.kind === 'sequence'" class="template-groups">
          <span class="field__label">Grupper</span>
          <div v-for="(group, i) in section.groups" :key="group.id" class="template-groups__row">
            <input v-model="group.title" type="text" />
            <button class="btn btn--ghost btn--danger" @click="removeGroup(section, i)">Fjern</button>
          </div>
          <button class="btn btn--ghost" @click="addGroup(section)">+ Gruppe</button>
        </div>
      </div>
      <button class="btn" @click="addSection(page as 1 | 2)">+ Seksjon på side {{ page }}</button>
    </div>
  </div>
</template>
