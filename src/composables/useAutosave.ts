import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * Debounced autosave for a reactive record. Compares a serialised snapshot
 * (ignoring `updatedAt`) so that the save itself never re-triggers a save,
 * while edits made during a save are still picked up.
 */
export function useAutosave<T extends { updatedAt: string }>(
  record: Ref<T | undefined>,
  save: (record: T) => Promise<void>,
  delay = 600,
) {
  const status = ref<'idle' | 'dirty' | 'saving' | 'saved'>('idle')
  let timer: ReturnType<typeof setTimeout> | undefined

  const serialize = (r: T) => {
    const { updatedAt: _ignored, ...rest } = r
    return JSON.stringify(rest)
  }
  let lastSaved = record.value ? serialize(record.value) : ''

  function schedule() {
    status.value = 'dirty'
    clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }

  async function flush() {
    clearTimeout(timer)
    if (!record.value || status.value !== 'dirty') return
    status.value = 'saving'
    const snapshot = serialize(record.value)
    try {
      await save(record.value)
      lastSaved = snapshot
      status.value = 'saved'
    } catch (err) {
      status.value = 'dirty'
      console.error('Autosave failed', err)
    }
  }

  watch(
    record,
    (value) => {
      if (!value) return
      if (serialize(value) !== lastSaved) schedule()
    },
    { deep: true },
  )
  onBeforeUnmount(flush)

  const statusText = computed(
    () => ({ idle: '', dirty: 'Endret…', saving: 'Lagrer…', saved: 'Lagret' })[status.value],
  )

  return { status, statusText, flush }
}
