<template>
  <div class="projector-view">
    <!-- Top Bar -->
    <div class="projector-header">
      <div class="event-info">
        <div class="event-name-container">
          <h1 v-if="currentEvent" class="event-name">{{ currentEvent.name }}</h1>
          <span v-if="currentEvent" class="event-date">{{ formatDate(currentEvent.date) }}</span>
        </div>
        <div v-if="currentEvent" class="join-info">
          <div class="join-instructions">
            <div class="instruction-line">Go to <strong class="website-url">openmic.site</strong></div>
            <div class="instruction-line">{{ currentEvent.event_code ? 'Enter code:' : 'Event ID:' }}</div>
          </div>
          <div class="event-code-large">{{ currentEvent.event_code || eventId }}</div>
          <div v-if="qrCodeDataUrl" class="qr-code-small">
            <img :src="qrCodeDataUrl" alt="Queue QR Code" />
          </div>
        </div>
        <div class="time-info">
          <div class="current-time">{{ currentTime }}</div>
          <div v-if="currentEvent" class="curfew-time">Curfew: {{ formatCurfewTime(currentEvent.curfew) }}</div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="projector-content">
      <TransitionGroup name="slide-fade" mode="out-in">
        <!-- Current Performer -->
        <div v-if="currentSlot && statusBadge" key="current" class="current-section">
          <div class="now-performing-badge" :style="{ background: statusBadge.gradient }">
            <i :class="currentSlot.status === 'setting_up' ? 'pi pi-cog' : 'pi pi-play-circle'"></i>
            <span>{{ statusBadge.text }}</span>
          </div>
          <h2 class="performer-name">{{ currentSlot.stage_name }}</h2>
          <div class="performer-meta">
            <span class="act-type">
              <i class="pi pi-tag"></i>
              {{ currentSlot.act_type }}
            </span>
            <span class="performance-time">
              <i class="pi pi-clock"></i>
              {{ elapsedTime }}
            </span>
          </div>
        </div>

        <!-- Waiting Message -->
        <div v-else key="waiting" class="waiting-section">
          <i class="pi pi-clock waiting-icon"></i>
          <h2 class="waiting-message">Starting Soon...</h2>
          <p class="waiting-subtitle">The show will begin shortly</p>
        </div>
      </TransitionGroup>

      <!-- Queue Preview -->
      <div v-if="upcomingSlots.length > 0" class="queue-section">
        <h3 class="queue-title">
          <i class="pi pi-users"></i>
          UP NEXT
        </h3>
        <TransitionGroup name="list" tag="div" class="queue-preview">
          <div
            v-for="slot in upcomingSlots"
            :key="slot.slot_id"
            class="queue-preview-item up-next"
          >
            <span class="queue-name">{{ slot.stage_name }}</span>
            <span class="queue-type">{{ slot.act_type }}</span>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Connection Status (subtle) -->
    <div v-if="ws && !ws.isConnected" class="connection-indicator">
      <i class="pi pi-exclamation-circle"></i>
      <span>Reconnecting...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useEventStore } from '../stores/event'
import { useQueueStore } from '../stores/queue'
import { useWebSocket } from '../composables/useWebSocket'
import { useAPI } from '../composables/useAPI'
import { formatDate } from '../utils/time'
import QRCode from 'qrcode'

const route = useRoute()
const toast = useToast()
const eventStore = useEventStore()
const queueStore = useQueueStore()
const { apiService } = useAPI()

const eventId = ref<string>('')
const currentTime = ref('')
const elapsedSeconds = ref(0)
const qrCodeDataUrl = ref<string>('')
const queueUrl = ref<string>('')

let timeInterval: number | null = null
let elapsedInterval: number | null = null

// WebSocket connection - will be initialized after we have eventId
const ws = ref<ReturnType<typeof useWebSocket> | null>(null)

// Computed properties
const currentEvent = computed(() => eventStore.currentEvent)
// For projector, show both performing AND setting_up slots
const currentSlot = computed(() => {
  return queueStore.slots.find(slot =>
    slot.status === 'performing' || slot.status === 'setting_up'
  )
})
// Only show the slot marked as "up_next" by admin, not the whole queue
const upcomingSlots = computed(() => {
  const upNext = queueStore.upNextSlot
  return upNext ? [upNext] : []
})

// Badge configuration based on status
const statusBadge = computed(() => {
  if (!currentSlot.value) return null

  if (currentSlot.value.status === 'setting_up') {
    return {
      text: 'SETTING UP',
      gradient: 'linear-gradient(90deg, #ffd700, #00ce90)'
    }
  }

  return {
    text: 'NOW PERFORMING',
    gradient: 'linear-gradient(90deg, #00ffa3, #00ce90)'
  }
})

const elapsedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60)
  const seconds = elapsedSeconds.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Debug: Watch for currentSlot changes
watch(currentSlot, (newSlot, oldSlot) => {
  console.log('[Projector] Current slot changed:', {
    old: oldSlot ? { id: oldSlot.slot_id, status: oldSlot.status, name: oldSlot.stage_name } : null,
    new: newSlot ? { id: newSlot.slot_id, status: newSlot.status, name: newSlot.stage_name } : null
  })
})

// Functions
function updateCurrentTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

function formatCurfewTime(curfewTime: string): string {
  // Curfew time is in format "HH:mm" (24-hour)
  const parts = curfewTime.split(':').map(Number)
  const hours = parts[0] ?? 0
  const minutes = parts[1] ?? 0
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12 // Convert 0 to 12 for midnight
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

function updateElapsedTime() {
  if (!currentSlot.value) {
    elapsedSeconds.value = 0
    return
  }

  const startTime = currentSlot.value.started_at || currentSlot.value.setup_started_at
  if (!startTime) {
    elapsedSeconds.value = 0
    return
  }

  const start = new Date(startTime).getTime()
  const now = Date.now()
  elapsedSeconds.value = Math.floor((now - start) / 1000)
}

async function generateQRCode(eventCode: string) {
  try {
    const url = `https://openmic.site/event/${eventCode}/queue`
    queueUrl.value = url
    qrCodeDataUrl.value = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Check if accessing by event code or event ID
    const code = route.query.code as string | undefined
    const paramEventId = route.params.eventId as string | undefined

    // Helper function to check if string looks like an event code (6 alphanumeric chars)
    const isEventCode = (str: string) => /^[A-Z0-9]{6}$/.test(str)

    if (code) {
      // Look up event by code from query parameter
      try {
        const response = await apiService.getEventByCode(code)
        if (response.event) {
          eventId.value = response.event.event_id
          // Store event data immediately - no need to fetch again
          eventStore.setEvent(response.event)
        } else {
          console.error('Invalid event code')
          return
        }
      } catch (error: any) {
        console.error('Failed to look up event by code:', error)
        return
      }
    } else if (paramEventId) {
      // Check if paramEventId looks like an event code
      if (isEventCode(paramEventId)) {
        // Look up event by code from route parameter
        try {
          const response = await apiService.getEventByCode(paramEventId)
          if (response.event) {
            eventId.value = response.event.event_id
            // Store event data immediately - no need to fetch again
            eventStore.setEvent(response.event)
          } else {
            console.error('Invalid event code')
            return
          }
        } catch (error: any) {
          console.error('Failed to look up event by code:', error)
          return
        }
      } else {
        // Use as event ID directly (UUID format)
        eventId.value = paramEventId
      }
    } else {
      console.error('No event ID or code provided')
      return
    }

    // Only fetch full event details if we haven't already loaded it via getEventByCode
    // (getEventByCode is public and works without auth, getEvent requires authentication)
    if (!currentEvent.value) {
      console.log('[Projector] Fetching event details for:', eventId.value)
      try {
        const response = await apiService.getEvent(eventId.value)
        if (response.event) {
          console.log('[Projector] Event details received:', response.event)
          eventStore.setEvent(response.event)
        }
      } catch (error) {
        console.error('[Projector] Failed to fetch event details:', error)
      }
    }

    // Initialize WebSocket connection with the resolved eventId
    ws.value = useWebSocket(eventId.value, 'projector', toast)

    // Connect to WebSocket and request initial state
    ws.value?.connect()

    // Wait a moment for connection to establish, then request full state
    setTimeout(() => {
      const wsInstance = ws.value
      if (wsInstance) {
        wsInstance.requestResync()
      }
    }, 500)

    // Update current time
    updateCurrentTime()
    timeInterval = window.setInterval(updateCurrentTime, 1000)

    // Update elapsed time
    updateElapsedTime()
    elapsedInterval = window.setInterval(updateElapsedTime, 1000)

    // Request wake lock to prevent screen sleep
    if ('wakeLock' in navigator) {
      try {
        await (navigator as any).wakeLock.request('screen')
      } catch (error) {
        console.error('Wake lock failed:', error)
      }
    }
  } catch (error) {
    console.error('Failed to initialize projector view:', error)
  }
})

onUnmounted(() => {
  ws.value?.disconnect()
  if (timeInterval) clearInterval(timeInterval)
  if (elapsedInterval) clearInterval(elapsedInterval)
})

// Watch for event code and generate QR code
watch(() => currentEvent.value?.event_code, (eventCode) => {
  console.log('[Projector] Event code changed:', eventCode)
  console.log('[Projector] Current event:', currentEvent.value)
  if (eventCode) {
    generateQRCode(eventCode)
  } else {
    console.warn('[Projector] No event code available - QR code will not be displayed')
  }
}, { immediate: true })
</script>

<style scoped>
.projector-view {
  min-height: 100vh;
  background: linear-gradient(180deg, #1e1e1e 0%, #252525 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.projector-header {
  padding: 0.75rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 2px 8px rgba(0, 206, 144, 0.15),
    0 4px 16px rgba(0, 206, 144, 0.1);
}

.event-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.event-name-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}

.event-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  white-space: nowrap;
}

.event-date {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  white-space: nowrap;
}

.join-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: rgba(0, 206, 144, 0.1);
  border-radius: 12px;
  border: 2px solid rgba(0, 206, 144, 0.5);
  box-shadow:
    0 4px 20px rgba(0, 206, 144, 0.3),
    0 0 40px rgba(0, 206, 144, 0.15);
  flex-shrink: 0;
}

.join-instructions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
}

.instruction-line {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
}

.website-url {
  color: rgba(0, 206, 144, 1);
  font-size: 1rem;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(0, 206, 144, 0.5);
}

.event-code-large {
  font-size: 2rem;
  font-weight: 900;
  font-family: 'Courier New', monospace;
  color: #ffffff;
  letter-spacing: 0.4rem;
  background: rgba(0, 206, 144, 0.8);
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  border: 2px solid rgba(0, 206, 144, 1);
  box-shadow: 0 0 30px rgba(0, 206, 144, 0.4);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.qr-code-small img {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 2px solid rgba(0, 206, 144, 0.3);
}

.time-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
}

.current-time {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.curfew-time {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.projector-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 3rem;
  gap: 3rem;
}

.current-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.now-performing-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 2rem;
  animation: pulse 2s ease-in-out infinite;
  /* background is set dynamically via :style binding */
}

.now-performing-badge i {
  font-size: 1.75rem;
}

.performer-name {
  font-size: 6rem;
  font-weight: 900;
  margin: 0 0 1.5rem 0;
  line-height: 1.1;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 0.6s ease-out;
}

.performer-meta {
  display: flex;
  gap: 3rem;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.8);
}

.performer-meta span {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.performer-meta i {
  font-size: 2.25rem;
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 10px rgba(0, 206, 144, 0.5));
}

.waiting-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.waiting-icon {
  font-size: 8rem;
  color: rgba(0, 206, 144, 0.3);
  margin-bottom: 2rem;
  animation: pulse 3s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(0, 206, 144, 0.2));
}

.waiting-message {
  font-size: 5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.9);
}

.waiting-subtitle {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.queue-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem 3rem;
  box-shadow:
    0 4px 16px rgba(0, 206, 144, 0.15),
    0 2px 8px rgba(0, 206, 144, 0.1);
}

.queue-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1px;
}

.queue-title i {
  font-size: 2.25rem;
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 10px rgba(0, 206, 144, 0.5));
}

.queue-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.queue-preview-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 2rem;
  padding: 1.25rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.queue-preview-item.up-next {
  background: rgba(0, 206, 144, 0.15);
  border-left-color: rgba(0, 206, 144, 1);
  box-shadow: 0 0 20px rgba(0, 206, 144, 0.2);
}

.queue-name {
  font-size: 1.75rem;
  font-weight: 600;
  color: #ffffff;
}

.queue-type {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.connection-indicator {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 165, 0, 0.9);
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  animation: pulse 2s ease-in-out infinite;
}

.connection-indicator i {
  font-size: 1.25rem;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.4s ease;
}

@media (max-width: 1200px) {
  .performer-name {
    font-size: 4rem;
  }

  .queue-preview-item {
    gap: 1.5rem;
  }
}
</style>