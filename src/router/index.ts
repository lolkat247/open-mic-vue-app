// Vue Router configuration

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Route components (will be created)
const Home = () => import('../views/HomeView.vue')
const PublicQueueView = () => import('../views/PublicQueueView.vue')
const PerformerSignupView = () => import('../views/PerformerSignupView.vue')
const ManageSlotView = () => import('../views/ManageSlotView.vue')
const ProjectorView = () => import('../views/ProjectorView.vue')
const AdminLogin = () => import('../views/AdminLogin.vue')
const AdminDashboard = () => import('../views/AdminDashboard.vue')
const AdminEventView = () => import('../views/AdminEventView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'Open Mic Queue' }
  },
  {
    path: '/event/:eventId/queue',
    name: 'public-queue',
    component: PublicQueueView,
    meta: { title: 'Queue' }
  },
  {
    path: '/event/:eventId/signup',
    name: 'performer-signup',
    component: PerformerSignupView,
    meta: { title: 'Sign Up to Perform' }
  },
  {
    path: '/event/:eventId/manage-slot',
    name: 'manage-slot',
    component: ManageSlotView,
    meta: { title: 'Manage Your Slot' }
  },
  {
    path: '/event/:eventId/projector',
    name: 'projector',
    component: ProjectorView,
    meta: { title: 'Projector View' }
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLogin,
    meta: { title: 'Admin Login' }
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: AdminDashboard,
    meta: { title: 'Admin Dashboard', requiresAuth: true }
  },
  {
    path: '/admin/event/:eventId',
    name: 'admin-event',
    component: AdminEventView,
    meta: { title: 'Manage Event', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Update page title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Open Mic`
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // Try to restore session if not authenticated
    if (!authStore.isAuthenticated) {
      const restored = await authStore.restoreSession()
      if (!restored) {
        // Redirect to login if not authenticated
        next({ name: 'admin-login', query: { redirect: to.fullPath } })
        return
      }
    }
  }

  next()
})

export default router