/**
 * Data model. Every stored record carries `schemaVersion` so the app can
 * migrate old records forward (see migrations.ts). Rules for changing this file:
 *
 *  - Never rename or repurpose an existing field.
 *  - New fields get a default in a migration step.
 *  - Bump CURRENT_SCHEMA_VERSION and add a step in migrations.ts for every change.
 */
export const CURRENT_SCHEMA_VERSION = 1

export type SectionKind = 'text' | 'sequence'
export type SectionWidth = 'full' | 'half'
export type PageNumber = 1 | 2

export interface TemplateGroup {
  id: string
  title: string
}

export interface TemplateSection {
  id: string
  title: string
  kind: SectionKind
  width: SectionWidth
  page: PageNumber
  /** Grey helper prompts shown in the editor and, if the section is empty, on print. */
  prompts: string[]
  /** Sub-headings for `sequence` sections, e.g. Standing / Peak / Twists. */
  groups?: TemplateGroup[]
}

export interface Template {
  id: string
  schemaVersion: number
  name: string
  sections: TemplateSection[]
  createdAt: string
  updatedAt: string
}

export interface Plan {
  id: string
  schemaVersion: number
  templateId: string
  name: string
  duration: string
  /** ISO date, yyyy-mm-dd. */
  date: string
  /** Keyed by section id, or `${sectionId}/${groupId}` for sequence groups. */
  values: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface Backup {
  id?: number
  createdAt: string
  reason: string
  payload: string
}

export interface ExportFile {
  app: 'bergamot-class-planner'
  exportedAt: string
  schemaVersion: number
  templates: Template[]
  plans: Plan[]
}

export function valueKey(sectionId: string, groupId?: string): string {
  return groupId ? `${sectionId}/${groupId}` : sectionId
}
