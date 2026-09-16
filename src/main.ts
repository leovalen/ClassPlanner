import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { prepareDatabase } from './data/db'
import { usePlannerStore } from './stores/planner'
import './style.css'

async function boot() {
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  try {
    await prepareDatabase()
    await usePlannerStore().load()
  } catch (err) {
    document.getElementById('app')!.innerHTML =
      `<div class="fatal"><h1>Kunne ikke åpne databasen</h1><p>${(err as Error).message}</p></div>`
    throw err
  }
  app.mount('#app')
}

boot()
