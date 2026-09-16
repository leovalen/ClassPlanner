import { CURRENT_SCHEMA_VERSION } from './types'

/**
 * Forward-only migrations. The key is the version a record is migrated FROM;
 * the function returns the record at version key + 1.
 *
 * Example for a future change that adds `minutes` to plans:
 *
 *   2: (plan) => ({ ...plan, minutes: {} }),
 *
 * and bump CURRENT_SCHEMA_VERSION to 3 in types.ts.
 */
type Step = (record: any) => any

const planSteps: Record<number, Step> = {}
const templateSteps: Record<number, Step> = {}

export class SchemaTooNewError extends Error {
  readonly found: number
  constructor(found: number) {
    super(
      `Data has schema version ${found} but this app understands up to ${CURRENT_SCHEMA_VERSION}. ` +
        'Reload to get the latest version of the app.',
    )
    this.found = found
  }
}

function run(record: any, steps: Record<number, Step>): any {
  let current = record
  let version: number = typeof current.schemaVersion === 'number' ? current.schemaVersion : 1
  if (version > CURRENT_SCHEMA_VERSION) throw new SchemaTooNewError(version)
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = steps[version]
    if (!step) throw new Error(`Missing migration step from schema version ${version}`)
    current = step(current)
    version += 1
    current.schemaVersion = version
  }
  return current
}

export function migratePlan<T extends { schemaVersion: number }>(plan: T): T {
  return run(plan, planSteps)
}

export function migrateTemplate<T extends { schemaVersion: number }>(template: T): T {
  return run(template, templateSteps)
}

export function needsMigration(records: Array<{ schemaVersion: number }>): boolean {
  return records.some((r) => r.schemaVersion !== CURRENT_SCHEMA_VERSION)
}
