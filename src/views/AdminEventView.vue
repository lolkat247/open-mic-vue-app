<template>
  <div class="admin-event-view">
    <div class="event-header">
      <div class="header-content">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          @click="goBack"
          aria-label="Back to dashboard"
          class="back-button"
        />
        <div class="header-info">
          <h1 class="event-title">
            <i class="pi pi-calendar"></i>
            {{ currentEvent?.name || 'Event' }}
          </h1>
          <div class="event-meta">
            <span class="meta-item">
              <i class="pi pi-calendar"></i>
              {{ formatDate(currentEvent?.date || '') }}
            </span>
            <span class="meta-item">
              <i class="pi pi-clock"></i>
              Curfew: {{ currentEvent?.curfew ? format12Hour(currentEvent.curfew) : '' }}
            </span>
            <Badge
              :value="signupStatus"
              :severity="signupSeverity"
              class="status-badge"
            />
          </div>
          <div v-if="currentEvent?.event_code" class="event-code-display">
            <span class="code-label">Event Code:</span>
            <span class="code-value">{{ currentEvent.event_code }}</span>
            <Button
              icon="pi pi-copy"
              text
              rounded
              size="small"
              @click="copyEventCode"
              v-tooltip.top="'Copy event code'"
              class="copy-button"
            />
          </div>
        </div>
        <div class="header-actions">
          <Button
            icon="pi pi-cog"
            text
            rounded
            @click="toggleMenu"
            aria-label="Event options"
            class="menu-button"
          />
          <Menu ref="menu" :model="menuItems" :popup="true" />
        </div>
      </div>
    </div>

    <div class="event-container">
      <!-- Loading State -->
      <LoadingState v-if="isLoading" message="Loading event data..." />

      <!-- Error State -->
      <Message v-else-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <!-- Main Content -->
      <div v-else class="event-content">
        <!-- Main Area: Queue Management -->
        <div class="main-area">
          <!-- Setting Up Section -->
          <div v-if="settingUpSlot" class="content-section setting-up-section">
            <SettingUpCard
              :slot="settingUpSlot"
              :has-current-performer="!!currentPerformer"
              @mark-up-next="handleMarkUpNext"
              @call-to-stage="handleCallToStage"
              @start="handleStart"
              @complete="handleComplete"
              @no-show="handleNoShow"
              @reinstate="handleReinstate"
            />
          </div>

          <!-- Up Next Section -->
          <div class="content-section up-next-section">
            <UpNextCard
              :slot="upNextSlot"
              :has-current-performer="!!currentPerformer"
              @mark-up-next="handleMarkUpNext"
              @call-to-stage="handleCallToStage"
              @start="handleStart"
              @complete="handleComplete"
              @no-show="handleNoShow"
              @reinstate="handleReinstate"
            />
          </div>

          <!-- Queue Section -->
          <div class="content-section queue-section">
            <div class="queue-wrapper">
              <QueueManager
                :slots="queueSlots"
                :is-reordering="isReordering"
                :has-current-performer="!!currentPerformer"
                @reorder="handleReorder"
                @edit="handleEdit"
                @mark-up-next="handleMarkUpNext"
                @call-to-stage="handleCallToStage"
                @start="handleStart"
                @complete="handleComplete"
                @no-show="handleNoShow"
                @reinstate="handleReinstate"
              />
            </div>
          </div>
        </div>

        <!-- Sidebar: Current Performer, Stats, History -->
        <div class="sidebar-area">
          <!-- Current Performer -->
          <div class="sidebar-section current-performer-section">
            <h3 class="sidebar-title">
              <i class="pi pi-play-circle"></i>
              Now Performing
            </h3>
            <div v-if="currentPerformer" class="current-performer-container">
              <PerformerTimer
                :slot="currentPerformer"
                @complete="handleComplete"
              />
            </div>
            <div v-else class="empty-performer">
              <i class="pi pi-microphone"></i>
              <p>No performer on stage</p>
              <small>Click "Call to Stage" to begin</small>
            </div>
          </div>

          <!-- Stats -->
          <div class="sidebar-section">
            <CompactStats
              :queued-count="queuedCount"
              :completed-count="completedCount"
              :no-show-count="noShowCount"
            />
          </div>

          <!-- History -->
          <div v-if="inactiveSlots.length > 0" class="sidebar-section history-section">
            <div class="history-header">
              <h3 class="sidebar-title">
                <i class="pi pi-history"></i>
                History
              </h3>
              <Button
                :icon="showHistory ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                text
                rounded
                size="small"
                @click="showHistory = !showHistory"
                v-tooltip.top="showHistory ? 'Hide history' : 'Show history'"
              />
            </div>

            <div v-if="showHistory" class="history-list">
              <div
                v-for="slot in inactiveSlots"
                :key="slot.slot_id"
                class="history-item"
                :class="{ 'no-show': slot.status === 'no_show' }"
              >
                <div class="history-info">
                  <h4 class="history-name">{{ slot.stage_name }}</h4>
                  <div class="history-actions">
                    <Badge
                      :value="slot.status === 'completed' ? 'Done' : 'No Show'"
                      :severity="slot.status === 'completed' ? 'success' : 'danger'"
                      size="small"
                    />
                    <Button
                      icon="pi pi-pencil"
                      text
                      rounded
                      size="small"
                      @click="handleEdit(slot.slot_id)"
                      v-tooltip.top="'Edit slot details'"
                      class="history-edit-btn"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Slot Dialog -->
    <AdminSlotEditDialog
      v-if="editingSlot"
      :slot="editingSlot"
      :visible="showEditDialog"
      :is-updating="isUpdatingSlot"
      @update="handleUpdateSlot"
      @close="handleCloseEditDialog"
    />

    <div class="footer-container">
      <Footer />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Menu from 'primevue/menu'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import { useEventStore } from '../stores/event'
import { useQueueStore } from '../stores/queue'
import { useAuthStore } from '../stores/auth'
import { useAPI } from '../composables/useAPI'
import { useWebSocket } from '../composables/useWebSocket'
import LoadingState from '../components/shared/LoadingState.vue'
import Footer from '../components/shared/Footer.vue'
import PerformerTimer from '../components/admin/PerformerTimer.vue'
import QueueManager from '../components/admin/QueueManager.vue'
import CompactStats from '../components/admin/CompactStats.vue'
import UpNextCard from '../components/admin/UpNextCard.vue'
import SettingUpCard from '../components/admin/SettingUpCard.vue'
import AdminSlotEditDialog from '../components/admin/AdminSlotEditDialog.vue'
import { formatDate, format12Hour } from '../utils/time'
import type { Slot } from '../types/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const eventStore = useEventStore()
const queueStore = useQueueStore()
const authStore = useAuthStore()
const { apiService } = useAPI()

const eventId = ref<string>('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const isReordering = ref(false)
const showHistory = ref(false)
const menu = ref()
const showEditDialog = ref(false)
const editingSlot = ref<Slot | null>(null)
const isUpdatingSlot = ref(false)

// WebSocket for real-time updates - will be initialized after we resolve eventId
let wsConnect: (() => void) | null = null
let wsDisconnect: (() => void) | null = null

const currentEvent = computed(() => eventStore.currentEvent)
const queueSlots = computed(() => queueStore.slots.filter(s => s.status === 'queued'))
const upNextSlot = computed(() => queueStore.slots.find(s => s.status === 'up_next'))
const settingUpSlot = computed(() => queueStore.slots.find(s => s.status === 'setting_up'))
const currentPerformer = computed(() => queueStore.currentSlot)
const inactiveSlots = computed(() =>
  queueStore.slots.filter(s => s.status === 'completed' || s.status === 'no_show')
)

const queuedCount = computed(() => queueSlots.value.length)
const completedCount = computed(() =>
  queueStore.slots.filter(s => s.status === 'completed').length
)
const noShowCount = computed(() =>
  queueStore.slots.filter(s => s.status === 'no_show').length
)

const signupStatus = computed(() =>
  currentEvent.value?.signups_enabled === false ? 'Paused' : 'Open'
)
const signupSeverity = computed(() =>
  currentEvent.value?.signups_enabled === false ? 'warn' : 'success'
)

const menuItems = computed(() => [
  {
    label: 'Edit Event',
    icon: 'pi pi-pencil',
    command: () => {
      router.push({ name: 'admin-dashboard' })
      toast.add({
        severity: 'info',
        summary: 'Edit Event',
        detail: 'Go to dashboard and click Edit on the event card',
        life: 3000
      })
    }
  },
  {
    label: currentEvent.value?.signups_enabled === false ? 'Resume Signups' : 'Pause Signups',
    icon: currentEvent.value?.signups_enabled === false ? 'pi pi-play' : 'pi pi-pause',
    command: () => handleToggleSignups()
  },
  {
    separator: true
  },
  {
    label: 'View Public Queue',
    icon: 'pi pi-external-link',
    command: () => {
      const url = router.resolve({
        name: 'public-queue',
        params: { eventId: eventId.value }
      }).href
      window.open(url, '_blank')
    }
  },
  {
    label: 'View Projector',
    icon: 'pi pi-desktop',
    command: () => {
      const url = router.resolve({
        name: 'projector',
        params: { eventId: eventId.value }
      }).href
      window.open(url, '_blank')
    }
  }
])

function toggleMenu(event: Event) {
  menu.value.toggle(event)
}

async function handleToggleSignups() {
  if (!currentEvent.value) return

  try {
    const currentlyEnabled = currentEvent.value.signups_enabled !== false
    const newEnabled = !currentlyEnabled

    if (newEnabled) {
      await apiService.resumeSignups(eventId.value)
      toast.add({
        severity: 'success',
        summary: 'Signups Resumed',
        detail: 'Performers can now sign up',
        life: 3000
      })
    } else {
      await apiService.pauseSignups(eventId.value)
      toast.add({
        severity: 'warn',
        summary: 'Signups Paused',
        detail: 'New signups are temporarily disabled',
        life: 3000
      })
    }

    // Update will come via WebSocket
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

async function handleReorder(slotIds: string[]) {
  isReordering.value = true

  try {
    // Send slot IDs in the new order
    await apiService.reorderQueue(eventId.value, { slot_order: slotIds })
    toast.add({
      severity: 'success',
      summary: 'Queue Reordered',
      detail: 'Queue order has been updated',
      life: 3000
    })
  } catch (err: any) {
    console.error('Failed to reorder queue:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to reorder queue',
      life: 5000
    })
  } finally {
    isReordering.value = false
  }
}

async function handleMarkUpNext(slotId: string) {
  try {
    await apiService.markUpNext(eventId.value, slotId)
    toast.add({
      severity: 'info',
      summary: 'Marked as Up Next',
      detail: 'Performer is now up next in queue',
      life: 3000
    })
  } catch (err: any) {
    console.error('Failed to mark as up next:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to mark performer as up next',
      life: 5000
    })
  }
}

async function handleCallToStage(slotId: string) {
  try {
    await apiService.callToStage(eventId.value, slotId)
    toast.add({
      severity: 'info',
      summary: 'Called to Stage',
      detail: 'Performer has been called to set up',
      life: 3000
    })
  } catch (err: any) {
    console.error('Failed to call to stage:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to call performer to stage',
      life: 5000
    })
  }
}

async function handleStart(slotId: string) {
  try {
    await apiService.startPerformance(eventId.value, slotId)
    toast.add({
      severity: 'success',
      summary: 'Performance Started',
      detail: 'Performer is now on stage',
      life: 3000
    })
  } catch (err: any) {
    console.error('Failed to start slot:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to start performance',
      life: 5000
    })
  }
}

async function handleComplete(slotId: string) {
  try {
    await apiService.completePerformance(eventId.value, slotId)
    toast.add({
      severity: 'success',
      summary: 'Performance Completed',
      detail: 'Performer marked as complete',
      life: 3000
    })
  } catch (err: any) {
    console.error('Failed to complete slot:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to complete performance',
      life: 5000
    })
  }
}

async function handleNoShow(slotId: string) {
  try {
    await apiService.markNoShow(eventId.value, slotId)
    toast.add({
      severity: 'warn',
      summary: 'Marked No Show',
      detail: 'Performer removed from queue',
      life: 3000
    })
  } catch (err: any) {
    console.error('Failed to mark no show:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to mark no show',
      life: 5000
    })
  }
}

async function handleReinstate(slotId: string) {
  try {
    await apiService.reinstateSlot(eventId.value, slotId)
    toast.add({
      severity: 'success',
      summary: 'Slot Reinstated',
      detail: 'Performer added back to queue',
      life: 3000
    })
  } catch (err: any) {
    console.error('Failed to reinstate slot:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to reinstate slot',
      life: 5000
    })
  }
}

function handleEdit(slotId: string) {
  const slot = queueStore.slots.find(s => s.slot_id === slotId)
  if (slot) {
    editingSlot.value = slot
    showEditDialog.value = true
  }
}

async function handleUpdateSlot(data: any) {
  if (!editingSlot.value) return

  isUpdatingSlot.value = true

  try {
    await apiService.updateSlotAsStaff(eventId.value, editingSlot.value.slot_id, data)

    toast.add({
      severity: 'success',
      summary: 'Slot Updated',
      detail: 'Slot details have been updated successfully',
      life: 3000
    })

    showEditDialog.value = false
    editingSlot.value = null
  } catch (err: any) {
    console.error('Failed to update slot:', err)
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: err.message || 'Failed to update slot details',
      life: 5000
    })
  } finally {
    isUpdatingSlot.value = false
  }
}

function handleCloseEditDialog() {
  showEditDialog.value = false
  editingSlot.value = null
}

function goBack() {
  router.push({ name: 'admin-dashboard' })
}

function copyEventCode() {
  if (currentEvent.value?.event_code) {
    navigator.clipboard.writeText(currentEvent.value.event_code)
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Event code copied to clipboard',
      life: 2000
    })
  }
}

onMounted(async () => {
  isLoading.value = true
  error.value = null

  try {
    const paramEventId = route.params.eventId as string | undefined

    if (!paramEventId) {
      error.value = 'No event ID or code provided'
      isLoading.value = false
      return
    }

    // Helper function to check if string looks like an event code (6 alphanumeric chars)
    const isEventCode = (str: string) => /^[A-Z0-9]{6}$/.test(str)

    // Normalize the input (trim and uppercase)
    const normalizedParam = paramEventId.trim().toUpperCase()

    // Check if paramEventId looks like an event code
    if (isEventCode(normalizedParam)) {
      // Look up event by code from route parameter
      try {
        const response = await apiService.getEventByCode(normalizedParam)
        if (response.event) {
          eventId.value = response.event.event_id
        } else {
          error.value = `Event not found with code: ${normalizedParam}`
          isLoading.value = false
          return
        }
      } catch (err: any) {
        console.error('Failed to look up event by code:', err)
        error.value = err.message || `Unable to find event with code: ${normalizedParam}`
        isLoading.value = false
        return
      }
    } else {
      // Use as event ID directly (UUID format)
      eventId.value = paramEventId.trim()
    }

    // Fetch event details via REST API
    const { event } = await apiService.getEvent(eventId.value)
    eventStore.setEvent(event)

    // Initialize and connect to WebSocket for real-time updates with current token
    const ws = useWebSocket(eventId.value, 'staff', toast, authStore.token)
    wsConnect = () => ws.connect(authStore.token)
    wsDisconnect = ws.disconnect

    // Connect to WebSocket
    wsConnect()

    // Wait for WebSocket connection to establish
    let attempts = 0
    while (!ws.isConnected.value && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    if (!ws.isConnected.value) {
      console.error('WebSocket failed to connect after 5 seconds')
      toast.add({
        severity: 'warn',
        summary: 'Connection Issue',
        detail: 'Real-time updates may not work. Try refreshing the page.',
        life: 5000
      })
    } else {
      // Request full state from server (can't be sent during $connect)
      ws.requestResync()
    }
  } catch (err: any) {
    console.error('Failed to load event:', err)
    error.value = err.message || 'Event not found'
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (wsDisconnect) {
    wsDisconnect()
  }
})
</script>

<style scoped>
.admin-event-view {
  min-height: 100vh;
  background-color: #1e1e1e;
  background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #1e1e1e 40px), repeating-linear-gradient(rgba(0, 206, 144, 0.33), rgb(0, 206, 144));
  padding-bottom: 2rem;
  position: relative;
}

.admin-event-view::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  pointer-events: none;
  z-index: 0;
}

.event-header {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow:
    0 2px 8px rgba(0, 206, 144, 0.15),
    0 4px 16px rgba(0, 206, 144, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.event-title i {
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.4));
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.meta-item i {
  color: rgba(0, 206, 144, 1);
}

.event-code-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 206, 144, 0.8);
  color: rgba(255, 255, 255, 1);
  border-radius: 8px;
  font-weight: 600;
  margin-top: 0.75rem;
  border: 2px solid rgba(0, 206, 144, 1);
  box-shadow: 0 0 20px rgba(0, 206, 144, 0.3);
}

.code-label {
  font-size: 0.85rem;
  opacity: 0.95;
}

.code-value {
  font-size: 1.1rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
  font-weight: 700;
}

.event-code-display .copy-button {
  color: rgba(255, 255, 255, 1);
  margin-left: 0.25rem;
}

.event-code-display .copy-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.header-actions {
  flex-shrink: 0;
}

.event-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  position: relative;
  z-index: 1;
}

.event-content {
  display: grid;
  grid-template-columns: 2fr 480px;
  gap: 1.5rem;
  min-height: calc(100vh - 180px);
}

.main-area {
  min-width: 0;
  min-height: 850px; /* Ensure enough space for queue */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar-area {
  position: sticky;
  top: 100px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow:
    0 2px 8px rgba(0, 206, 144, 0.15),
    0 4px 16px rgba(0, 206, 144, 0.1);
}

.setting-up-section {
  /* Specific styling for setting up section - inherits from .content-section */
  animation: fadeIn 0.3s ease-in-out;
}

.up-next-section {
  /* Specific styling for up next section - inherits from .content-section */
}

.queue-section {
  min-height: 800px; /* Account for 700px list + header + padding */
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.queue-wrapper {
  flex: 1;
  min-height: 750px; /* Account for 700px list + header */
}

.sidebar-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow:
    0 2px 8px rgba(0, 206, 144, 0.15),
    0 4px 16px rgba(0, 206, 144, 0.1);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 1rem 0;
}

.sidebar-title i {
  color: rgba(0, 206, 144, 1);
  font-size: 1.1rem;
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.4));
}

.current-performer-section {
  /* Special styling for performer section */
}

.current-performer-container {
  margin: 0;
}

.empty-performer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.empty-performer i {
  font-size: 3rem;
  color: rgba(0, 206, 144, 0.2);
  margin-bottom: 0.75rem;
}

.empty-performer p {
  margin: 0 0 0.25rem 0;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
}

.empty-performer small {
  font-size: 0.85rem;
}

.history-section {
  /* Special styling for history */
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border-left: 3px solid rgba(34, 197, 94, 1);
}

.history-item.no-show {
  border-left-color: rgba(239, 68, 68, 1);
}

.history-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.history-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.history-edit-btn {
  color: rgba(0, 206, 144, 1) !important;
  transition: all 0.2s ease;
}

.history-edit-btn:hover {
  background: rgba(0, 206, 144, 0.15) !important;
  transform: scale(1.1);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.help-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.w-full {
  width: 100%;
}

/* Dialog dark mode */
:deep(.p-dialog) {
  background: rgba(30, 30, 30, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-dialog-header) {
  background: rgba(0, 206, 144, 0.05) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

:deep(.p-dialog-title) {
  color: rgba(255, 255, 255, 0.95) !important;
}

:deep(.p-dialog-content) {
  background: rgba(30, 30, 30, 0.98) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-dialog-footer) {
  background: rgba(0, 206, 144, 0.05) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Menu dark mode */
:deep(.p-menu) {
  background: rgba(30, 30, 30, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-menu-item) {
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-menu-item:not(.p-disabled):hover) {
  background: rgba(0, 206, 144, 0.2) !important;
}

:deep(.p-menu-separator) {
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Error message styling */
:deep(.p-message-error) {
  background: rgba(239, 68, 68, 0.15) !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
  color: rgba(254, 202, 202, 0.95) !important;
}

:deep(.p-message-error .p-message-icon) {
  color: #ef4444 !important;
}

:deep(.p-message-error .p-message-text) {
  color: rgba(254, 202, 202, 0.95) !important;
}

/* Badge styling improvements */
:deep(.p-badge) {
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

:deep(.p-badge-success) {
  background: rgba(34, 197, 94, 0.8) !important;
  border: 1px solid rgba(34, 197, 94, 1);
  color: rgba(255, 255, 255, 1) !important;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
}

:deep(.p-badge-warn) {
  background: rgba(245, 158, 11, 0.8) !important;
  border: 1px solid rgba(245, 158, 11, 1);
  color: rgba(255, 255, 255, 1) !important;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

:deep(.p-badge-danger) {
  background: rgba(239, 68, 68, 0.8) !important;
  border: 1px solid rgba(239, 68, 68, 1);
  color: rgba(255, 255, 255, 1) !important;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

:deep(.p-badge-info) {
  background: rgba(6, 182, 212, 0.8) !important;
  border: 1px solid rgba(6, 182, 212, 1);
  color: rgba(255, 255, 255, 1) !important;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
}

/* Button styling improvements */
:deep(.p-button) {
  font-weight: 600;
  transition: all 0.2s ease;
}

:deep(.p-button-info) {
  background: rgba(6, 182, 212, 0.15) !important;
  border: 1px solid rgba(6, 182, 212, 0.5) !important;
  color: rgba(103, 232, 249, 1) !important;
}

:deep(.p-button-info:hover) {
  background: rgba(6, 182, 212, 0.25) !important;
  border-color: rgba(6, 182, 212, 0.7) !important;
  box-shadow: 0 0 16px rgba(6, 182, 212, 0.3);
}

:deep(.p-button:focus) {
  box-shadow: 0 0 0 0.2rem rgba(0, 206, 144, 0.25);
}

/* Footer container */
.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem 1.5rem;
  position: relative;
  z-index: 1;
}

@media (max-width: 1024px) {
  .event-content {
    grid-template-columns: 1fr;
    height: auto;
  }

  .sidebar-area {
    position: static;
    max-height: none;
    order: -1;
  }

  .main-area {
    order: 1;
    min-height: auto;
  }

  .setting-up-section,
  .up-next-section {
    padding: 1.25rem;
  }

  .queue-section {
    min-height: 600px;
  }
}

@media (max-width: 768px) {
  .event-header {
    padding: 1rem;
  }

  .header-content {
    flex-wrap: wrap;
  }

  .event-title {
    font-size: 1.5rem;
  }

  .event-container {
    padding: 1.5rem 1rem;
  }

  .content-section,
  .sidebar-section {
    padding: 1rem;
  }

  .setting-up-section,
  .up-next-section {
    padding: 1rem;
  }

  .main-area {
    min-height: auto;
    gap: 1rem;
  }

  .queue-section {
    min-height: 500px;
  }

  .empty-performer {
    padding: 1.5rem 1rem;
  }

  .empty-performer i {
    font-size: 2.5rem;
  }
}
</style>