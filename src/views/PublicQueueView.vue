<template>
  <div class="public-queue-view">
    <EventHeader v-if="currentEvent" :event="currentEvent" />

    <div class="queue-container">
      <!-- Connection Status -->
      <Message v-if="ws && !ws.isConnected && !isLoadingEvent" severity="warn" :closable="false">
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

    <!-- Manage Slot Button (if user has signed up) -->
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()
const queueStore = useQueueStore()
const { apiService } = useAPI()

const eventId = ref<string>('')
const isLoadingEvent = ref(true)
const error = ref<string | null>(null)

// WebSocket connection - will be initialized after we have eventId
const ws = ref<ReturnType<typeof useWebSocket> | null>(null)

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
      try {
        const response = await apiService.getEventByCode(code)
        if (response.event) {
          eventId.value = response.event.event_id
        } else {
          error.value = 'Invalid event code'
          isLoadingEvent.value = false
          return
        }
      } catch (err: any) {
        console.error('Failed to look up event by code:', err)
        error.value = err.message || 'Invalid event code'
        isLoadingEvent.value = false
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
            error.value = 'Invalid event code'
            isLoadingEvent.value = false
            return
          }
        } catch (err: any) {
          console.error('Failed to look up event by code:', err)
          error.value = err.message || 'Invalid event code'
          isLoadingEvent.value = false
          return
        }
      } else {
        // Use as event ID directly (UUID format)
        eventId.value = paramEventId
      }
    } else {
      error.value = 'No event ID or code provided'
      isLoadingEvent.value = false
      return
    }

    // Initialize WebSocket connection with the resolved eventId
    ws.value = useWebSocket(eventId.value, 'public')

    // Connect to WebSocket (will populate stores)
    ws.value.connect()

    // Wait a bit for the full_state message
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (!currentEvent.value) {
      error.value = 'Event not found or connection failed'
    }
  } catch (err: any) {
    console.error('Failed to load event:', err)
    error.value = err.message || 'Failed to load event'
  } finally {
    isLoadingEvent.value = false
  }
})

onUnmounted(() => {
  ws.value?.disconnect()
})
</script>

<style scoped>
.public-queue-view {
  min-height: 100vh;
  background: var(--surface-ground);
  padding-bottom: 100px; /* Space for FAB */
}

.queue-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.fab-secondary {
  position: fixed;
  bottom: 24px;
  right: 140px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.fab-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .queue-container {
    padding: 1rem;
  }

  .fab {
    bottom: 16px;
    right: 16px;
  }

  .fab-secondary {
    bottom: 88px;
    right: 16px;
  }
}

@media (max-width: 480px) {
  .fab,
  .fab-secondary {
    width: 100%;
    max-width: calc(100% - 32px);
    right: 16px;
    left: 16px;
    border-radius: 28px;
  }

  .fab-secondary {
    bottom: 80px;
  }
}

/* Pull to refresh hint (optional enhancement) */
@media (hover: none) and (pointer: coarse) {
  .queue-container {
    overscroll-behavior-y: contain;
  }
}
</style>