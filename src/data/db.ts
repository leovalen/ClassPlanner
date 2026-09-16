import Dexie, { type Table } from 'dexie'
import type { Backup, Plan, Template } from './types'
import { CURRENT_SCHEMA_VERSION } from './types'
import { migratePlan, migrateTemplate, needsMigration } from './migrations'
import defaultTemplateJson from './defaultTemplate.json'

/**
 * IndexedDB via Dexie.
 *
 * Two independent version numbers exist:
 *  - Dexie's `version(n)` below covers the INDEXES. Only bump it when you add
 *    or change an index, and keep every older `version()` call in place.
 *  - `schemaVersion` on each record covers the SHAPE of the data, handled by
 *    migrations.ts. This is the one that changes most often.
 */
class PlannerDatabase extends Dexie {
  plans!: Table<Plan, string>
  templates!: Table<Template, string>
  backups!: Table<Backup, number>

  constructor() {
    super('bergamot-class-planner')
    this.version(1).stores({
      plans: 'id, templateId, date, updatedAt',
      templates: 'id, updatedAt',
      backups: '++id, createdAt',
    })
  }
}

export const db = new PlannerDatabase()

const MAX_BACKUPS = 5

export async function snapshot(reason: string): Promise<void> {
  const [plans, templates] = await Promise.all([db.plans.toArray(), db.templates.toArray()])
  await db.backups.add({
    createdAt: new Date().toISOString(),
    reason,
    payload: JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, plans, templates }),
  })
  const all = await db.backups.orderBy('createdAt').reverse().toArray()
  const stale = all.slice(MAX_BACKUPS).map((b) => b.id!).filter(Boolean)
  if (stale.length) await db.backups.bulkDelete(stale)
}

/**
 * Run on startup. Snapshots the raw data before migrating any record with an
 * old schemaVersion, then seeds the default template if none exists.
 */
export async function prepareDatabase(): Promise<void> {
  const [plans, templates] = await Promise.all([db.plans.toArray(), db.templates.toArray()])

  if (needsMigration(plans) || needsMigration(templates)) {
    await snapshot('pre-migration')
    await db.transaction('rw', db.plans, db.templates, async () => {
      await db.plans.bulkPut(plans.map(migratePlan))
      await db.templates.bulkPut(templates.map(migrateTemplate))
    })
  }

  if (templates.length === 0) {
    await db.templates.put(migrateTemplate(defaultTemplateJson as Template))
  }
}
