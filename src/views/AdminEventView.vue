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
        <!-- Current Performer Section -->
        <div class="content-section">
          <h2 class="section-title">
            <i class="pi pi-play-circle"></i>
            Current Performer
          </h2>

          <div v-if="currentPerformer" class="current-performer-container">
            <PerformerTimer
              :slot="currentPerformer"
              @complete="handleComplete"
            />
          </div>
          <Message v-else severity="info" :closable="false">
            <i class="pi pi-info-circle"></i>
            No performer currently on stage
          </Message>
        </div>

        <!-- Queue Management Section -->
        <div class="content-section">
          <QueueManager
            :slots="queueSlots"
            :is-reordering="isReordering"
            :has-current-performer="!!currentPerformer"
            @reorder="handleReorder"
            @start="handleStart"
            @complete="handleComplete"
            @no-show="handleNoShow"
            @reinstate="handleReinstate"
          />
        </div>

        <!-- Completed/No-Show Section -->
        <div v-if="inactiveSlots.length > 0" class="content-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="pi pi-history"></i>
              History
            </h2>
            <Button
              :label="showHistory ? 'Hide' : 'Show'"
              :icon="showHistory ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              text
              size="small"
              @click="showHistory = !showHistory"
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
                <div class="history-meta">
                  <Badge
                    :value="slot.status === 'completed' ? 'Completed' : 'No Show'"
                    :severity="slot.status === 'completed' ? 'success' : 'danger'"
                  />
                  <span v-if="slot.act_type" class="meta-text">{{ slot.act_type }}</span>
                  <span v-if="slot.completed_at" class="meta-text">
                    {{ formatTime(slot.completed_at) }}
                  </span>
                </div>
              </div>
              <div class="history-actions">
                <SlotControls
                  :slot="slot"
                  @reinstate="handleReinstate"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <Card class="stat-card">
            <template #content>
              <div class="stat-content">
                <i class="pi pi-users stat-icon primary"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ queuedCount }}</span>
                  <span class="stat-label">In Queue</span>
                </div>
              </div>
            </template>
          </Card>
          <Card class="stat-card">
            <template #content>
              <div class="stat-content">
                <i class="pi pi-check-circle stat-icon success"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ completedCount }}</span>
                  <span class="stat-label">Completed</span>
                </div>
              </div>
            </template>
          </Card>
          <Card class="stat-card">
            <template #content>
              <div class="stat-content">
                <i class="pi pi-times-circle stat-icon danger"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ noShowCount }}</span>
                  <span class="stat-label">No Shows</span>
                </div>
              </div>
            </template>
          </Card>
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
import SlotControls from '../components/admin/SlotControls.vue'
import { formatDate, formatTime } from '../utils/time'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const eventStore = useEventStore()
const queueStore = useQueueStore()
const authStore = useAuthStore()
const { apiService } = useAPI()

const eventId = route.params.eventId as string
const isLoading = ref(true)
const error = ref<string | null>(null)
const isReordering = ref(false)
const showHistory = ref(false)
const showBannerDialog = ref(false)
const bannerMessage = ref('')
const isSendingBanner = ref(false)
const menu = ref()

// WebSocket for real-time updates
const { connect, disconnect } = useWebSocket(eventId, 'staff', toast)

const currentEvent = computed(() => eventStore.currentEvent)
const queueSlots = computed(() => queueStore.slots.filter(s => s.status === 'queued'))
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
        params: { eventId }
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
        params: { eventId }
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
    // Convert slot IDs array to the format expected by API
    const slot_orders = slotIds.map((slot_id, index) => ({
      slot_id,
      order_index: index
    }))
    await apiService.reorderQueue(eventId, { slot_orders })
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

async function handleStart(slotId: string) {
  try {
    await apiService.startPerformance(eventId, slotId)
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
    await apiService.completePerformance(eventId, slotId)
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
    await apiService.markNoShow(eventId, slotId)
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
    await apiService.reinstateSlot(eventId, slotId)
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
    await apiService.sendBanner(eventId, {
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
    // Fetch event details via REST API
    const { event } = await apiService.getEvent(eventId)
    eventStore.setEvent(event)

    // Connect to WebSocket for real-time updates with current token
    connect(authStore.token)
  } catch (err: any) {
    console.error('Failed to load event:', err)
    error.value = err.message || 'Event not found'
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  disconnect()
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
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  margin-top: 0.75rem;
}

.code-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

.code-value {
  font-size: 1.1rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
}

.event-code-display .copy-button {
  color: white;
  margin-left: 0.25rem;
}

.event-code-display .copy-button:hover {
  background: rgba(255, 255, 255, 0.1);
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
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.content-section {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 1.5rem 0;
}

.section-title i {
  color: var(--primary-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.current-performer-container {
  margin: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  border-left: 4px solid var(--green-500);
}

.history-item.no-show {
  border-left-color: var(--red-500);
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.meta-text {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.history-actions {
  flex-shrink: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-icon.primary {
  background: var(--primary-50);
  color: var(--primary-500);
}

.stat-icon.success {
  background: var(--green-50);
  color: var(--green-500);
}

.stat-icon.danger {
  background: var(--red-50);
  color: var(--red-500);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

  .content-section {
    padding: 1.25rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-actions {
    width: 100%;
  }
}
</style>