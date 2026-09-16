import type { Plan, Template } from './types'

export interface DurationOption {
  key: string
  label: string
  count: number
}

/** "60 min", "60min", "1t" and "60" all normalise so the filter groups them together. */
export function durationKey(raw: string): string {
  const text = raw.trim().toLowerCase()
  if (!text) return ''
  const hours = text.match(/^(\d+(?:[.,]\d+)?)\s*(t|h|time|timer|hour|hours)\b/)
  if (hours) return String(Math.round(parseFloat(hours[1]!.replace(',', '.')) * 60))
  const minutes = text.match(/(\d+)/)
  return minutes ? minutes[1]! : text
}

export function durationLabel(key: string): string {
  return /^\d+$/.test(key) ? `${key} min` : key
}

export function durationOptions(plans: Plan[]): DurationOption[] {
  const counts = new Map<string, number>()
  for (const plan of plans) {
    const key = durationKey(plan.duration)
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: durationLabel(key), count }))
    .sort((a, b) => {
      const an = Number(a.key), bn = Number(b.key)
      if (!isNaN(an) && !isNaN(bn)) return an - bn
      if (!isNaN(an)) return -1
      if (!isNaN(bn)) return 1
      return a.label.localeCompare(b.label)
    })
}

export interface SearchHit {
  sectionTitle: string
  line: string
}

export interface SearchResult {
  plan: Plan
  hits: SearchHit[]
}

function normalise(text: string): string {
  return text.toLowerCase().normalize('NFKC')
}

/**
 * Keyword search across the plan name and every section flagged `searchable`
 * in its template. All terms must match somewhere in the plan (AND), each term
 * as a substring, case-insensitive.
 */
export function searchPlans(
  plans: Plan[],
  templates: Template[],
  query: string,
  duration: string,
): SearchResult[] {
  const terms = normalise(query).split(/\s+/).filter(Boolean)
  const results: SearchResult[] = []

  for (const plan of plans) {
    if (duration && durationKey(plan.duration) !== duration) continue

    const template = templates.find((t) => t.id === plan.templateId)
    const fields: Array<{ title: string; text: string }> = [{ title: 'Navn', text: plan.name }]
    for (const section of template?.sections ?? []) {
      if (!section.searchable) continue
      if (section.kind === 'sequence') {
        for (const group of section.groups ?? []) {
          fields.push({ title: `${section.title} – ${group.title}`, text: plan.values[`${section.id}/${group.id}`] ?? '' })
        }
      } else {
        fields.push({ title: section.title, text: plan.values[section.id] ?? '' })
      }
    }

    if (terms.length === 0) {
      results.push({ plan, hits: [] })
      continue
    }

    const haystack = normalise(fields.map((f) => f.text).join('\n'))
    if (!terms.every((term) => haystack.includes(term))) continue

    const hits: SearchHit[] = []
    for (const field of fields) {
      if (field.title === 'Navn') continue
      for (const line of field.text.split('\n')) {
        const lower = normalise(line)
        if (line.trim() && terms.some((term) => lower.includes(term))) {
          hits.push({ sectionTitle: field.title, line: line.trim() })
          break
        }
      }
    }
    results.push({ plan, hits })
  }
  return results
}
