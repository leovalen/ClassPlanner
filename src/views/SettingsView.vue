<script setup lang="ts">
import { ref } from 'vue'
import { downloadExport, importFromFile } from '../data/backup'
import { db } from '../data/db'
import { usePlannerStore } from '../stores/planner'
import { CURRENT_SCHEMA_VERSION } from '../data/types'

const store = usePlannerStore()
const message = ref('')
const fileInput = ref<HTMLInputElement>()

async function onImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!confirm('Importere? Planer med samme id blir overskrevet. En sikkerhetskopi tas først.')) return
  try {
    const result = await importFromFile(file)
    await store.load()
    message.value = `Importerte ${result.plans} planer og ${result.templates} maler.`
  } catch (err) {
    message.value = (err as Error).message
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function restoreLatestSnapshot() {
  const latest = await db.backups.orderBy('createdAt').last()
  if (!latest) {
    message.value = 'Ingen interne sikkerhetskopier finnes.'
    return
  }
  if (!confirm(`Gjenopprette intern sikkerhetskopi fra ${latest.createdAt.slice(0, 16).replace('T', ' ')} (${latest.reason})? Dette overskriver nåværende data.`)) return
  const payload = JSON.parse(latest.payload)
  await db.transaction('rw', db.plans, db.templates, async () => {
    await db.plans.clear()
    await db.templates.clear()
    await db.plans.bulkPut(payload.plans)
    await db.templates.bulkPut(payload.templates)
  })
  location.reload()
}
</script>

<template>
  <div class="page-wrap">
    <div class="toolbar"><h1>Backup</h1></div>

    <p class="hint">
      Planene lagres bare i denne nettleseren på denne enheten. Last ned en sikkerhetskopi jevnlig, og bruk den
      til å flytte planer til en annen enhet.
    </p>

    <div class="settings-block">
      <h2>Eksporter</h2>
      <button class="btn btn--primary" @click="downloadExport">Last ned alle planer (JSON)</button>
    </div>

    <div class="settings-block">
      <h2>Importer</h2>
      <input ref="fileInput" type="file" accept="application/json,.json" @change="onImport" />
    </div>

    <div class="settings-block">
      <h2>Intern sikkerhetskopi</h2>
      <p class="hint">Appen tar automatisk kopi før oppgraderinger og importer.</p>
      <button class="btn" @click="restoreLatestSnapshot">Gjenopprett siste interne kopi</button>
    </div>

    <p v-if="message" class="status">{{ message }}</p>
    <p class="hint small">Dataversjon {{ CURRENT_SCHEMA_VERSION }} · {{ store.plans.length }} planer</p>
  </div>
</template>
