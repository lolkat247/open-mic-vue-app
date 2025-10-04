<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="dashboard-title">
            <Button
              icon="pi pi-arrow-left"
              text
              rounded
              @click="goHome"
              aria-label="Back to home"
              class="back-button"
            />
            <i class="pi pi-shield" aria-hidden="true"></i>
            Admin Dashboard
          </h1>
          <p v-if="userEmail" class="user-email">{{ userEmail }}</p>
        </div>
        <div class="header-actions">
          <Button
            label="Create Event"
            icon="pi pi-plus"
            @click="showCreateDialog = true"
            class="create-button"
          />
          <Button
            icon="pi pi-user"
            :label="userEmail || 'User'"
            text
            @click="toggleUserMenu"
            aria-haspopup="true"
            aria-controls="user_menu"
            class="user-menu-button"
          />
          <Menu ref="userMenu" id="user_menu" :model="userMenuItems" :popup="true" />
        </div>
      </div>
    </div>

    <div class="dashboard-container">
      <!-- Search and Filters -->
      <div class="dashboard-controls">
        <div class="search-bar">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Search events..."
              class="w-full"
            />
          </IconField>
        </div>
        <Select
          v-model="filterStatus"
          :options="filterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Filter by status"
          class="filter-dropdown"
        />
      </div>

      <!-- Loading State -->
      <LoadingState v-if="isLoading" message="Loading your events..." />

      <!-- Error State -->
      <Message v-else-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <!-- Empty State -->
      <div v-else-if="filteredEvents.length === 0 && !searchQuery" class="empty-state">
        <div class="empty-content">
          <i class="pi pi-calendar-plus empty-icon"></i>
          <h2>No Events Yet</h2>
          <p>Create your first event to get started managing open mic performances.</p>
          <Button
            label="Create Your First Event"
            icon="pi pi-plus"
            size="large"
            @click="showCreateDialog = true"
          />
        </div>
      </div>

      <!-- No Search Results -->
      <div v-else-if="filteredEvents.length === 0 && searchQuery" class="empty-state">
        <div class="empty-content">
          <i class="pi pi-search empty-icon"></i>
          <h2>No Results Found</h2>
          <p>No events match your search criteria.</p>
          <Button
            label="Clear Search"
            icon="pi pi-times"
            text
            @click="searchQuery = ''"
          />
        </div>
      </div>

      <!-- Events Grid -->
      <div v-else class="events-grid">
        <EventCard
          v-for="event in filteredEvents"
          :key="event.event_id"
          :event="event"
          @edit="handleEdit"
          @delete="handleDelete"
          @toggle-signups="handleToggleSignups"
          @manage="handleManage"
        />
      </div>
    </div>

    <!-- Event Form Dialog -->
    <EventForm
      v-model:visible="showFormDialog"
      :event="selectedEvent"
      :is-submitting="isSubmitting"
      @submit="handleSubmit"
    />

    <!-- Floating Action Button (Mobile) -->
    <Button
      icon="pi pi-plus"
      rounded
      size="large"
      class="fab"
      @click="showCreateDialog = true"
      aria-label="Create event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Menu from 'primevue/menu'
import Message from 'primevue/message'
import { useAuthStore } from '../stores/auth'
import { useAPI } from '../composables/useAPI'
import LoadingState from '../components/shared/LoadingState.vue'
import EventCard from '../components/admin/EventCard.vue'
import EventForm from '../components/admin/EventForm.vue'
import type { Event } from '../types/api'
import type { EventFormData } from '../types/views'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
const { apiService } = useAPI()

const events = ref<Event[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const filterStatus = ref('all')
const showFormDialog = ref(false)
const showCreateDialog = ref(false)
const selectedEvent = ref<Event | null>(null)
const isSubmitting = ref(false)
const userMenu = ref()

const userEmail = computed(() => authStore.userEmail)

const userMenuItems = computed(() => [
  {
    label: userEmail.value || 'User',
    disabled: true,
    class: 'user-menu-header'
  },
  {
    separator: true
  },
  {
    label: 'Change Password',
    icon: 'pi pi-key',
    command: () => {
      router.push({ name: 'admin-change-password' })
    }
  },
  {
    separator: true
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => {
      handleLogout()
    }
  }
])

const filterOptions = [
  { label: 'All Events', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'Signups Paused', value: 'paused' }
]

const filteredEvents = computed(() => {
  let filtered = events.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(event =>
      event.name.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (filterStatus.value !== 'all') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    filtered = filtered.filter(event => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)

      switch (filterStatus.value) {
        case 'upcoming':
          return eventDate >= today
        case 'past':
          return eventDate < today
        case 'paused':
          return event.signups_enabled === false
        default:
          return true
      }
    })
  }

  // Sort by date (upcoming first)
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  })
})

// Watch for create dialog
watch(showCreateDialog, (value) => {
  if (value) {
    selectedEvent.value = null
    showFormDialog.value = true
    showCreateDialog.value = false
  }
})

async function loadEvents() {
  isLoading.value = true
  error.value = null

  try {
    const response = await apiService.getEvents()
    events.value = response.events || []
  } catch (err: any) {
    console.error('Failed to load events:', err)
    error.value = err.message || 'Failed to load events'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load events',
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

function handleEdit(event: Event) {
  selectedEvent.value = event
  showFormDialog.value = true
}

async function handleSubmit(formData: EventFormData) {
  isSubmitting.value = true

  try {
    if (selectedEvent.value) {
      // Update existing event
      const response = await apiService.updateEvent(selectedEvent.value.event_id, {
        name: formData.name,
        date: formData.date,
        curfew: formData.curfew,
        defaults: {
          slot_duration_minutes: formData.slot_duration_minutes,
          setup_time_minutes: formData.setup_time_minutes
        },
        policies: {
          max_slots_per_performer: formData.max_slots_per_performer,
          signup_deadline_hours: formData.signup_deadline_hours
        },
        house_rules: formData.house_rules
      })

      // Update in local list
      const index = events.value.findIndex(e => e.event_id === selectedEvent.value?.event_id)
      if (index >= 0) {
        events.value[index] = response.event
      }

      toast.add({
        severity: 'success',
        summary: 'Updated',
        detail: 'Event updated successfully',
        life: 3000
      })
    } else {
      // Create new event
      const response = await apiService.createEvent({
        name: formData.name,
        date: formData.date,
        curfew: formData.curfew,
        defaults: {
          slot_duration_minutes: formData.slot_duration_minutes,
          setup_time_minutes: formData.setup_time_minutes
        },
        policies: {
          max_slots_per_performer: formData.max_slots_per_performer,
          signup_deadline_hours: formData.signup_deadline_hours
        },
        house_rules: formData.house_rules
      })

      events.value.push(response.event)

      toast.add({
        severity: 'success',
        summary: 'Created',
        detail: 'Event created successfully',
        life: 3000
      })
    }

    showFormDialog.value = false
    selectedEvent.value = null
  } catch (err: any) {
    console.error('Failed to save event:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to save event',
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(eventId: string) {
  try {
    await apiService.deleteEvent(eventId)

    events.value = events.value.filter(e => e.event_id !== eventId)

    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'Event deleted successfully',
      life: 3000
    })
  } catch (err: any) {
    console.error('Failed to delete event:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to delete event',
      life: 5000
    })
  }
}

async function handleToggleSignups(eventId: string, enabled: boolean) {
  try {
    if (enabled) {
      await apiService.resumeSignups(eventId)
      toast.add({
        severity: 'success',
        summary: 'Signups Resumed',
        detail: 'Performers can now sign up',
        life: 3000
      })
    } else {
      await apiService.pauseSignups(eventId)
      toast.add({
        severity: 'warn',
        summary: 'Signups Paused',
        detail: 'New signups are temporarily disabled',
        life: 3000
      })
    }

    // Update in local list
    const event = events.value.find(e => e.event_id === eventId)
    if (event) {
      event.signups_enabled = enabled
    }
  } catch (err: any) {
    console.error('Failed to toggle signups:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to update signup status',
      life: 5000
    })
  }
}

function handleManage(eventId: string) {
  router.push({ name: 'admin-event', params: { eventId } })
}

function toggleUserMenu(e: PointerEvent) {
  userMenu.value.toggle(e)
}

function goHome() {
  router.push({ name: 'home' })
}

function handleLogout() {
  confirm.require({
    message: 'Are you sure you want to logout?',
    header: 'Confirm Logout',
    icon: 'pi pi-sign-out',
    acceptLabel: 'Logout',
    rejectLabel: 'Cancel',
    accept: () => {
      authStore.signOut()
      router.push({ name: 'home' })
      toast.add({
        severity: 'info',
        summary: 'Logged Out',
        detail: 'You have been logged out successfully',
        life: 3000
      })
    }
  })
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: var(--surface-ground);
  padding-bottom: 80px;
}

.dashboard-header {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  padding: 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.dashboard-title i {
  color: var(--primary-color);
  font-size: 1.5rem;
}

:deep(.back-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  margin-right: 0.5rem;
  padding: 0.25rem;
  border-radius: 6px;
  cursor: pointer;
}

:deep(.back-button .p-button-icon), :deep(.back-button .pi) {
  color: var(--text-color-secondary);
  font-size: 1.25rem;
  transition: color 120ms ease, opacity 120ms ease, background-color 120ms ease;
  opacity: 0.9;
}

:deep(.back-button:hover), :deep(.back-button:focus) {
  background: #ffffff;
}

:deep(.back-button:hover .p-button-icon), :deep(.back-button:focus .p-button-icon),
:deep(.back-button:hover .pi), :deep(.back-button:focus .pi) {
  color: var(--green-500);
  opacity: 1;
}

.user-email {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-menu-button {
  font-weight: 600;
}

:deep(.user-menu-header) {
  font-weight: 600 !important;
  color: var(--text-color) !important;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.dashboard-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-bar {
  flex: 1;
  max-width: 400px;
}

.filter-dropdown {
  min-width: 200px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 3rem;
}

.empty-content {
  text-align: center;
  max-width: 500px;
}

.empty-icon {
  font-size: 5rem;
  color: var(--surface-400);
  margin-bottom: 1.5rem;
}

.empty-content h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.75rem 0;
}

.empty-content p {
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: none;
}

.w-full {
  width: 100%;
}

@media (max-width: 1024px) {
  .events-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .create-button {
    display: none;
  }

  .fab {
    display: flex;
  }

  .dashboard-title {
    font-size: 1.5rem;
  }

  .dashboard-container {
    padding: 1.5rem 1rem;
  }

  .dashboard-controls {
    flex-direction: column;
  }

  .search-bar {
    max-width: none;
  }

  .filter-dropdown {
    width: 100%;
  }

  .events-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .empty-state {
    min-height: 300px;
    padding: 2rem 1rem;
  }

  .empty-icon {
    font-size: 4rem;
  }

  .empty-content h2 {
    font-size: 1.5rem;
  }
}
</style>