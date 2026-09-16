import { defineStore } from 'pinia'
import { db } from '../data/db'
import type { Plan, Template } from '../data/types'
import { CURRENT_SCHEMA_VERSION } from '../data/types'

function now() {
  return new Date().toISOString()
}

/** Strip Vue reactivity so IndexedDB can structured-clone the record. */
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const usePlannerStore = defineStore('planner', {
  state: () => ({
    plans: [] as Plan[],
    templates: [] as Template[],
    loaded: false,
  }),

  getters: {
    sortedPlans: (state) => [...state.plans].sort((a, b) => (b.date + b.updatedAt).localeCompare(a.date + a.updatedAt)),
    planById: (state) => (id: string) => state.plans.find((p) => p.id === id),
    templateById: (state) => (id: string) => state.templates.find((t) => t.id === id),
    defaultTemplate: (state) => state.templates[0],
  },

  actions: {
    async load() {
      const [plans, templates] = await Promise.all([db.plans.toArray(), db.templates.toArray()])
      this.plans = plans
      this.templates = templates
      this.loaded = true
    },

    async createPlan(templateId?: string): Promise<Plan> {
      const template = templateId ? this.templateById(templateId) : this.defaultTemplate
      if (!template) throw new Error('Ingen mal tilgjengelig')
      const stamp = now()
      const plan: Plan = {
        id: crypto.randomUUID(),
        schemaVersion: CURRENT_SCHEMA_VERSION,
        templateId: template.id,
        name: '',
        duration: '',
        date: stamp.slice(0, 10),
        values: {},
        createdAt: stamp,
        updatedAt: stamp,
      }
      await db.plans.put(plan)
      this.plans.push(plan)
      return plan
    },

    async duplicatePlan(id: string): Promise<Plan | undefined> {
      const source = this.planById(id)
      if (!source) return
      const stamp = now()
      const copy: Plan = {
        ...toPlain(source),
        id: crypto.randomUUID(),
        name: source.name ? `${source.name} (kopi)` : '',
        date: stamp.slice(0, 10),
        createdAt: stamp,
        updatedAt: stamp,
      }
      await db.plans.put(copy)
      this.plans.push(copy)
      return copy
    },

    async savePlan(plan: Plan) {
      const record = toPlain(plan)
      record.updatedAt = now()
      await db.plans.put(record)
      plan.updatedAt = record.updatedAt
      const i = this.plans.findIndex((p) => p.id === plan.id)
      if (i >= 0) this.plans[i] = plan
      else this.plans.push(plan)
    },

    async deletePlan(id: string) {
      await db.plans.delete(id)
      this.plans = this.plans.filter((p) => p.id !== id)
    },

    async saveTemplate(template: Template) {
      const record = toPlain(template)
      record.updatedAt = now()
      await db.templates.put(record)
      template.updatedAt = record.updatedAt
      const i = this.templates.findIndex((t) => t.id === template.id)
      if (i >= 0) this.templates[i] = template
      else this.templates.push(template)
    },
  },
})
