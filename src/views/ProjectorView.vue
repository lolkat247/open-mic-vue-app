<template>
  <div class="projector-view" :class="{ 'fullscreen-active': isFullscreen }">
    <!-- Top Bar -->
    <div class="projector-header">
      <div class="event-info">
        <h1 v-if="currentEvent" class="event-name">{{ currentEvent.name }}</h1>
        <div class="event-details">
          <span v-if="currentEvent" class="event-date">{{ formatDate(currentEvent.date) }}</span>
          <span v-if="currentEvent?.event_code" class="event-code">Code: {{ currentEvent.event_code }}</span>
        </div>
      </div>
      <div class="header-actions">
        <div class="current-time">{{ currentTime }}</div>
        <Button
          :icon="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
          text
          rounded
          size="large"
          @click="toggleFullscreen"
          aria-label="Toggle fullscreen"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="projector-content">
      <TransitionGroup name="slide-fade" mode="out-in">
        <!-- Current Performer -->
        <div v-if="currentSlot" key="current" class="current-section">
          <div class="now-performing-badge">
            <i class="pi pi-play-circle"></i>
            <span>NOW PERFORMING</span>
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
            v-for="(slot, index) in upcomingSlots"
            :key="slot.slot_id"
            class="queue-preview-item"
            :class="{ 'up-next': index === 0 }"
          >
            <span class="queue-number">{{ index + 1 }}</span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import { useEventStore } from '../stores/event'
import { useQueueStore } from '../stores/queue'
import { useWebSocket } from '../composables/useWebSocket'
import { useAPI } from '../composables/useAPI'
import { formatDate } from '../utils/time'

const route = useRoute()
const eventStore = useEventStore()
const queueStore = useQueueStore()
const { apiService } = useAPI()

const eventId = ref<string>('')
const isFullscreen = ref(false)
const currentTime = ref('')
const elapsedSeconds = ref(0)

let timeInterval: number | null = null
let elapsedInterval: number | null = null

// WebSocket connection - will be initialized after we have eventId
const ws = ref<ReturnType<typeof useWebSocket> | null>(null)

// Computed properties
const currentEvent = computed(() => eventStore.currentEvent)
const currentSlot = computed(() => queueStore.currentSlot)
const upcomingSlots = computed(() => queueStore.queuedSlots.slice(0, 5))

const elapsedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60)
  const seconds = elapsedSeconds.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
    }
  } else {
    try {
      await document.exitFullscreen()
      isFullscreen.value = false
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
    }
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

    // Initialize WebSocket connection with the resolved eventId
    ws.value = useWebSocket(eventId.value, 'projector')

    // Connect to WebSocket
    ws.value.connect()

    // Update current time
    updateCurrentTime()
    timeInterval = window.setInterval(updateCurrentTime, 1000)

    // Update elapsed time
    updateElapsedTime()
    elapsedInterval = window.setInterval(updateElapsedTime, 1000)

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      isFullscreen.value = !!document.fullscreenElement
    })

    // Request wake lock to prevent screen sleep
    if ('wakeLock' in navigator) {
      try {
        await (navigator as any).wakeLock.request('screen')
      } catch (error) {
        console.error('Wake lock failed:', error)
      }
    }

    // Auto-enter fullscreen after 3 seconds
    setTimeout(() => {
      if (!isFullscreen.value) {
        toggleFullscreen()
      }
    }, 3000)
  } catch (error) {
    console.error('Failed to initialize projector view:', error)
  }
})

onUnmounted(() => {
  ws.value?.disconnect()
  if (timeInterval) clearInterval(timeInterval)
  if (elapsedInterval) clearInterval(elapsedInterval)
})
</script>

<style scoped>
.projector-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.projector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 3rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
}

.event-details {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.event-date {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.event-code {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-family: 'Courier New', monospace;
  background: rgba(58, 123, 213, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(58, 123, 213, 0.5);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.current-time {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
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
  background: linear-gradient(90deg, #00d2ff, #3a7bd5);
  border-radius: 50px;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 2rem;
  animation: pulse 2s ease-in-out infinite;
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
  color: #3a7bd5;
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
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 2rem;
  animation: pulse 3s ease-in-out infinite;
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
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  padding: 2rem 3rem;
  backdrop-filter: blur(10px);
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
  color: #3a7bd5;
}

.queue-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.queue-preview-item {
  display: grid;
  grid-template-columns: 60px 1fr auto;
  align-items: center;
  gap: 2rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
}

.queue-preview-item.up-next {
  background: rgba(58, 123, 213, 0.2);
  border-left-color: #3a7bd5;
}

.queue-number {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
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

/* Fullscreen optimizations */
.fullscreen-active {
  cursor: none;
}

.fullscreen-active .projector-header {
  padding: 1.5rem 2.5rem;
}

.fullscreen-active .performer-name {
  font-size: 8rem;
}

@media (max-width: 1200px) {
  .performer-name {
    font-size: 4rem;
  }

  .queue-preview-item {
    grid-template-columns: 50px 1fr auto;
    gap: 1.5rem;
  }
}
</style>