import { db, snapshot } from './db'
import { migratePlan, migrateTemplate } from './migrations'
import type { ExportFile, Plan, Template } from './types'
import { CURRENT_SCHEMA_VERSION } from './types'

export async function exportAll(): Promise<ExportFile> {
  const [plans, templates] = await Promise.all([db.plans.toArray(), db.templates.toArray()])
  return {
    app: 'shala-class-planner',
    exportedAt: new Date().toISOString(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    templates,
    plans,
  }
}

export async function downloadExport(): Promise<void> {
  const data = await exportAll()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `class-planner-${data.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface ImportResult {
  plans: number
  templates: number
}

/** Merges an export file into the database. Existing records with the same id are overwritten. */
export async function importFromFile(file: File): Promise<ImportResult> {
  const text = await file.text()
  const parsed = JSON.parse(text) as Partial<ExportFile>
  if (parsed.app !== 'shala-class-planner' || !Array.isArray(parsed.plans) || !Array.isArray(parsed.templates)) {
    throw new Error('Filen er ikke en gyldig Class Planner-eksport.')
  }
  const plans = parsed.plans.map((p) => migratePlan(p as Plan))
  const templates = parsed.templates.map((t) => migrateTemplate(t as Template))

  await snapshot('pre-import')
  await db.transaction('rw', db.plans, db.templates, async () => {
    await db.templates.bulkPut(templates)
    await db.plans.bulkPut(plans)
  })
  return { plans: plans.length, templates: templates.length }
}
