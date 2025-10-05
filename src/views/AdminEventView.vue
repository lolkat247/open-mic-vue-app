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
              Curfew: {{ currentEvent?.curfew }}
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
                v-for="slot in inactiveSlots.slice(0, 5)"
                :key="slot.slot_id"
                class="history-item"
                :class="{ 'no-show': slot.status === 'no_show' }"
              >
                <div class="history-info">
                  <h4 class="history-name">{{ slot.stage_name }}</h4>
                  <Badge
                    :value="slot.status === 'completed' ? 'Done' : 'No Show'"
                    :severity="slot.status === 'completed' ? 'success' : 'danger'"
                    size="small"
                  />
                </div>
              </div>
              <small v-if="inactiveSlots.length > 5" class="history-more">
                +{{ inactiveSlots.length - 5 }} more
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Send Banner Dialog -->
    <Dialog
      v-model:visible="showBannerDialog"
      modal
      header="Send Banner Message"
      :style="{ width: '90vw', maxWidth: '500px' }"
    >
      <div class="banner-form">
        <div class="form-field">
          <label for="bannerMessage">Message</label>
          <Textarea
            id="bannerMessage"
            v-model="bannerMessage"
            rows="3"
            :maxlength="200"
            placeholder="Important announcement for all viewers..."
            class="w-full"
          />
          <small class="help-text">{{ bannerMessage.length }}/200 characters</small>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="showBannerDialog = false"
        />
        <Button
          label="Send"
          icon="pi pi-send"
          @click="handleSendBanner"
          :disabled="!bannerMessage.trim()"
          :loading="isSendingBanner"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Card from 'primevue/card'
import Menu from 'primevue/menu'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import { useEventStore } from '../stores/event'
import { useQueueStore } from '../stores/queue'
import { useAuthStore } from '../stores/auth'
import { useAPI } from '../composables/useAPI'
import { useWebSocket } from '../composables/useWebSocket'
import LoadingState from '../components/shared/LoadingState.vue'
import PerformerTimer from '../components/admin/PerformerTimer.vue'
import QueueManager from '../components/admin/QueueManager.vue'
import CompactStats from '../components/admin/CompactStats.vue'
import UpNextCard from '../components/admin/UpNextCard.vue'
import SettingUpCard from '../components/admin/SettingUpCard.vue'
import { formatDate, formatTime } from '../utils/time'

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
const showBannerDialog = ref(false)
const bannerMessage = ref('')
const isSendingBanner = ref(false)
const menu = ref()

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
    label: 'Send Banner',
    icon: 'pi pi-megaphone',
    command: () => showBannerDialog.value = true
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

async function handleSendBanner() {
  if (!bannerMessage.value.trim()) return

  isSendingBanner.value = true

  try {
    await apiService.sendBanner(eventId.value, {
      message: bannerMessage.value.trim()
    })

    toast.add({
      severity: 'success',
      summary: 'Banner Sent',
      detail: 'Message has been sent to all viewers',
      life: 3000
    })

    showBannerDialog.value = false
    bannerMessage.value = ''
  } catch (err: any) {
    console.error('Failed to send banner:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to send banner',
      life: 5000
    })
  } finally {
    isSendingBanner.value = false
  }
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
  background: var(--surface-ground);
  padding-bottom: 2rem;
}

.event-header {
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
  color: var(--text-color);
  margin: 0;
}

.event-title i {
  color: var(--primary-color);
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
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.meta-item i {
  color: var(--primary-color);
}

.event-code-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-500);
  color: var(--primary-contrast-color, white);
  border-radius: 8px;
  font-weight: 600;
  margin-top: 0.75rem;
  border: 2px solid var(--primary-600);
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
  color: var(--primary-contrast-color, white);
  margin-left: 0.25rem;
}

.event-code-display .copy-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.header-actions {
  flex-shrink: 0;
}

.event-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
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
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.content-section {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 1rem 0;
}

.sidebar-title i {
  color: var(--primary-color);
  font-size: 1.1rem;
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
  color: var(--text-color-secondary);
}

.empty-performer i {
  font-size: 3rem;
  color: var(--surface-300);
  margin-bottom: 0.75rem;
}

.empty-performer p {
  margin: 0 0 0.25rem 0;
  font-weight: 500;
  color: var(--text-color);
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
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 6px;
  border-left: 3px solid var(--green-500);
}

.history-item.no-show {
  border-left-color: var(--red-500);
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
  color: var(--text-color);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-more {
  display: block;
  text-align: center;
  padding: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.banner-form {
  padding: 1rem 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: var(--text-color);
}

.help-text {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.w-full {
  width: 100%;
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

  .history-list {
    max-height: 250px;
  }

  .empty-performer {
    padding: 1.5rem 1rem;
  }

  .empty-performer i {
    font-size: 2.5rem;
  }
}
</style>