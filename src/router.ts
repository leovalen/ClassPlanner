import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'plans', component: () => import('./views/PlanListView.vue') },
    { path: '/plan/:id', name: 'plan', component: () => import('./views/PlanEditorView.vue'), props: true },
    {
      path: '/plan/:id/print',
      name: 'print',
      component: () => import('./views/PrintView.vue'),
      props: true,
      meta: { print: true },
    },
    { path: '/template', name: 'template', component: () => import('./views/TemplateEditorView.vue') },
    { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
