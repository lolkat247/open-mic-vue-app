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
    <EventHeader v-if="currentEvent" :event="currentEvent" />

    <div class="queue-container">
      <!-- Connection Status -->
      <Message v-if="!isLoadingEvent && currentEvent && !isConnected" severity="warn" :closable="false">
        <div class="connection-message">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Connection lost. Trying to reconnect...</span>
        </div>
      </Message>

      <!-- Loading State -->
      <LoadingState v-if="isLoadingEvent" message="Loading event..." />

      <!-- Error State -->
      <Message v-else-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <!-- Queue Content -->
      <template v-else-if="currentEvent">
        <!-- Current Performer -->
        <CurrentPerformer :slot="currentSlot" />

        <!-- Queue List -->
        <QueueList
          :slots="queuedSlots"
          :eta-updates="etaUpdates"
          title="Up Next"
          icon="pi pi-users"
          empty-title="No one in queue yet"
          empty-message="Be the first to sign up and perform!"
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

    <!-- Floating Action Buttons -->
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

    <Button
      v-if="hasUserSlot"
      class="fab-secondary"
      icon="pi pi-cog"
      label="Manage"
      size="large"
      rounded
      severity="secondary"
      @click="goToManageSlot"
      aria-label="Manage your slot"
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
import LoadingState from '../components/shared/LoadingState.vue'
import CurrentPerformer from '../components/queue/CurrentPerformer.vue'
import QueueList from '../components/queue/QueueList.vue'
import Footer from '../components/shared/Footer.vue'

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

// Check if user has a slot (from localStorage)
const hasUserSlot = computed(() => {
  if (!eventId.value) return false
  const storedSlotId = localStorage.getItem(`slot_${eventId.value}`)
  return !!storedSlotId
})

// Actions
function goHome() {
  router.push({ name: 'home' })
}

function goToSignup() {
  router.push({ name: 'performer-signup', params: { eventId: eventId.value } })
}

function goToManageSlot() {
  router.push({ name: 'manage-slot', params: { eventId: eventId.value } })
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

    // Initialize WebSocket connection with the resolved eventId
    console.log('Initializing WebSocket for event:', eventId.value)
    wsInstance = useWebSocket(eventId.value, 'public', toast)

    // Watch for connection status changes
    watch(() => wsInstance?.isConnected.value, (connected) => {
      console.log('Connection status changed:', connected)
      isConnected.value = connected || false
    }, { immediate: true })

    // Connect to WebSocket (will populate stores)
    console.log('Connecting to WebSocket...')
    wsInstance.connect()

    // Wait for connection to actually be established
    console.log('Waiting for WebSocket connection...')
    let attempts = 0
    while (!wsInstance.isConnected.value && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    if (!wsInstance.isConnected.value) {
      console.error('WebSocket failed to connect after 5 seconds')
      error.value = 'Failed to connect to event. Please try refreshing the page.'
      return
    }

    console.log('WebSocket connected! Requesting full state...')
    wsInstance.requestResync()

    // Wait for the full_state message
    console.log('Waiting for WebSocket full_state...')
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log('Current event after WebSocket wait:', currentEvent.value)
    console.log('WebSocket connected?', wsInstance.isConnected)

    if (!currentEvent.value) {
      error.value = 'Event not found or connection failed. Please try refreshing the page.'
    }
  } catch (err: any) {
    console.error('Failed to load event:', err)
    error.value = err.message || 'Failed to load event'
  } finally {
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

.fab-secondary {
  position: fixed;
  bottom: 24px;
  right: 140px;
  z-index: 1000;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(0, 206, 144, 0.3);
  transition: all 0.3s ease;
}

.fab-secondary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.4),
    0 0 25px rgba(0, 206, 144, 0.5);
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

  .fab-secondary {
    bottom: 80px;
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