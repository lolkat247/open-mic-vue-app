<template>
  <div class="public-queue-view">
    <Button
      icon="pi pi-arrow-left"
      text
      rounded
      @click="goHome"
      aria-label="Back to home"
      class="back-button"
    />
    <!-- Event Header or Skeleton -->
    <EventHeaderSkeleton v-if="isLoadingEvent" />
    <EventHeader v-else-if="currentEvent" :event="currentEvent" />

    <div class="queue-container">
      <!-- Connection Status -->
      <Message v-if="!isLoadingEvent && currentEvent && !isConnected" severity="warn" :closable="false">
        <div class="connection-message">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Connection lost. Trying to reconnect...</span>
        </div>
      </Message>

      <!-- Loading State with Skeletons -->
      <template v-if="isLoadingEvent">
        <SlotCardSkeleton v-for="i in 5" :key="i" />
      </template>

      <!-- Error State -->
      <Message v-else-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <!-- Queue Content -->
      <template v-else-if="currentEvent">
        <!-- House Rules -->
        <div v-if="currentEvent.house_rules" class="house-rules">
          <h3><i class="pi pi-info-circle"></i> House Rules</h3>
          <p>{{ currentEvent.house_rules }}</p>
        </div>

        <!-- Check-In Card -->
        <CheckInCard :event-id="eventId" />

        <!-- Current Performer -->
        <CurrentPerformer :slot="currentSlot" />

        <!-- Queue List -->
        <QueueList
          :slots="queuedSlots"
          :eta-updates="etaUpdates"
          :user-slot-id="userSlotId"
          title="Up Next"
          icon="pi pi-users"
          empty-title="No one in queue yet"
          empty-message="Be the first to sign up and perform!"
          @manage="goToManageSlot"
        >
          <template #empty-action>
            <Button
              v-if="signupsEnabled"
              label="Sign Up to Perform"
              icon="pi pi-user-plus"
              size="large"
              @click="goToSignup"
            />
          </template>
        </QueueList>
      </template>
    </div>

    <Footer />

    <!-- Floating Action Button -->
    <Button
      v-if="signupsEnabled && !isLoadingEvent && currentEvent"
      class="fab"
      icon="pi pi-plus"
      label="Sign Up"
      size="large"
      rounded
      @click="goToSignup"
      aria-label="Sign up to perform"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useEventStore } from '../stores/event'
import { useQueueStore } from '../stores/queue'
import { useWebSocket } from '../composables/useWebSocket'
import { useAPI } from '../composables/useAPI'
import EventHeader from '../components/shared/EventHeader.vue'
import EventHeaderSkeleton from '../components/shared/EventHeaderSkeleton.vue'
import CurrentPerformer from '../components/queue/CurrentPerformer.vue'
import QueueList from '../components/queue/QueueList.vue'
import SlotCardSkeleton from '../components/queue/SlotCardSkeleton.vue'
import Footer from '../components/shared/Footer.vue'
import CheckInCard from '../components/queue/CheckInCard.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const eventStore = useEventStore()
const queueStore = useQueueStore()
const { apiService } = useAPI()

const eventId = ref<string>('')
const isLoadingEvent = ref(true)
const error = ref<string | null>(null)
const isConnected = ref(false)

// WebSocket connection - initialized here in setup context
let wsInstance: ReturnType<typeof useWebSocket> | null = null

// Computed properties
const currentEvent = computed(() => eventStore.currentEvent)
const currentSlot = computed(() => queueStore.currentSlot)
const queuedSlots = computed(() => queueStore.queuedSlots)
const etaUpdates = computed(() => queueStore.etaUpdates)
const signupsEnabled = computed(() => eventStore.signupsEnabled)

// Get user's slot ID (from localStorage)
const userSlotId = computed(() => {
  if (!eventId.value) return null
  return localStorage.getItem(`slot_${eventId.value}`)
})

// Actions
function goHome() {
  router.push({ name: 'home' })
}

function goToSignup() {
  router.push({ name: 'performer-signup', params: { eventId: eventId.value } })
}

function goToManageSlot(slotId: string) {
  router.push({
    name: 'manage-slot',
    params: { eventId: eventId.value },
    query: { slotId }
  })
}

// Lifecycle
onMounted(async () => {
  isLoadingEvent.value = true
  error.value = null

  try {
    // Check if accessing by event code or event ID
    const code = route.query.code as string | undefined
    const paramEventId = route.params.eventId as string | undefined

    // Helper function to check if string looks like an event code (6 alphanumeric chars)
    const isEventCode = (str: string) => /^[A-Z0-9]{6}$/.test(str)

    if (code) {
      // Look up event by code from query parameter
      const normalizedCode = code.trim().toUpperCase()
      console.log('Looking up event by code (query):', normalizedCode)
      try {
        const response = await apiService.getEventByCode(normalizedCode)
        console.log('Event lookup response:', response)
        if (response.event) {
          eventId.value = response.event.event_id
          console.log('Resolved event ID:', eventId.value)
        } else {
          error.value = 'Invalid event code'
          isLoadingEvent.value = false
          return
        }
      } catch (err: any) {
        console.error('Failed to look up event by code:', err)
        error.value = `Failed to find event: ${err.message || 'Invalid event code'}`
        isLoadingEvent.value = false
        return
      }
    } else if (paramEventId) {
      // Normalize the input (trim and uppercase)
      const normalizedParam = paramEventId.trim().toUpperCase()

      // Check if paramEventId looks like an event code
      if (isEventCode(normalizedParam)) {
        // Look up event by code from route parameter
        console.log('Looking up event by code (param):', normalizedParam)
        try {
          const response = await apiService.getEventByCode(normalizedParam)
          console.log('Event lookup response:', response)
          if (response.event) {
            eventId.value = response.event.event_id
            console.log('Resolved event ID:', eventId.value)
          } else {
            error.value = `Event not found with code: ${normalizedParam}`
            isLoadingEvent.value = false
            return
          }
        } catch (err: any) {
          console.error('Failed to look up event by code:', err)
          error.value = `Failed to find event with code ${normalizedParam}: ${err.message || 'Unknown error'}`
          isLoadingEvent.value = false
          return
        }
      } else {
        // Use as event ID directly (UUID format)
        console.log('Using event ID directly:', paramEventId)
        eventId.value = paramEventId.trim()
      }
    } else {
      error.value = 'No event ID or code provided'
      isLoadingEvent.value = false
      return
    }

    // Fetch event data via REST API first for fast initial render
    console.log('Fetching event data via REST API...')
    const { event } = await apiService.getPublicEvent(eventId.value)
    eventStore.setEvent(event)

    // Initial event data loaded - page can render now!
    // Slots will be loaded via WebSocket (faster and real-time)
    isLoadingEvent.value = false
    console.log('Initial event data loaded, page ready to render')

    // Initialize WebSocket connection for real-time updates (non-blocking)
    console.log('Initializing WebSocket for real-time updates...')
    wsInstance = useWebSocket(eventId.value, 'public', toast)

    // Watch for connection status changes
    watch(() => wsInstance?.isConnected.value, (connected) => {
      console.log('Connection status changed:', connected)
      isConnected.value = connected || false
    }, { immediate: true })

    // Connect to WebSocket asynchronously (doesn't block page render)
    console.log('Connecting to WebSocket in background...')
    wsInstance.connect()

    // Request full state once connected (via the onConnected callback)
    // The WebSocket manager will handle this automatically

  } catch (err: any) {
    console.error('Failed to load event:', err)
    error.value = err.message || 'Failed to load event'
    isLoadingEvent.value = false
  }
})

onUnmounted(() => {
  wsInstance?.disconnect()
})
</script>

<style scoped>
.public-queue-view {
  min-height: 100vh;
  padding-bottom: 2rem;
  position: relative;
  background-color: #1e1e1e;
  background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #1e1e1e 40px), repeating-linear-gradient(rgba(0, 206, 144, 0.33), rgb(0, 206, 144));
  display: flex;
  flex-direction: column;
}

.public-queue-view::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  pointer-events: none;
  z-index: 0;
}

.back-button {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
}

.queue-container {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
  padding-bottom: 8rem;
  position: relative;
  z-index: 1;
  flex: 1;
}

.connection-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.connection-message i {
  font-size: 1.25rem;
}

.house-rules {
  background: rgba(59, 130, 246, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-left: 4px solid rgba(59, 130, 246, 1);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.house-rules h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(230, 240, 255, 1);
  margin: 0 0 0.75rem 0;
}

.house-rules h3 i {
  color: rgba(96, 165, 250, 1);
}

.house-rules p {
  color: rgba(230, 240, 255, 0.95);
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(0, 206, 144, 0.4);
  transition: all 0.3s ease;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(0, 206, 144, 0.6);
}

@media (max-width: 768px) {
  .queue-container {
    padding: 1rem;
    padding-bottom: 6rem;
  }

  .fab {
    bottom: 16px;
    right: 16px;
  }
}

/* Pull to refresh hint (optional enhancement) */
@media (hover: none) and (pointer: coarse) {
  .queue-container {
    overscroll-behavior-y: contain;
  }
}
</style>