<template>
  <div class="performer-signup-view">
    <div class="signup-container">
      <div class="signup-header">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          @click="goBack"
          aria-label="Go back"
        />
        <h1>Sign Up to Perform</h1>
      </div>

      <LoadingState v-if="isLoadingEvent" message="Loading event details..." />

      <Message v-else-if="eventError" severity="error" :closable="false">
        {{ eventError }}
      </Message>

      <template v-else-if="currentEvent">
        <EventHeader :event="currentEvent" />

        <Message v-if="signupsEnabled === false" severity="warn" :closable="false">
          <strong>Signups are currently paused</strong>
          <p>The organizer has temporarily paused signups. Please check back later.</p>
        </Message>

        <div v-else class="signup-content">
          <div class="info-card">
            <div class="info-item">
              <i class="pi pi-clock"></i>
              <div>
                <span class="info-label">Default Slot Duration</span>
                <span class="info-value">{{ currentEvent.defaults?.slot_duration_minutes || 5 }} minutes</span>
              </div>
            </div>
            <div v-if="currentEvent.policies?.max_slots_per_performer" class="info-item">
              <i class="pi pi-users"></i>
              <div>
                <span class="info-label">Max Slots Per Performer</span>
                <span class="info-value">{{ currentEvent.policies.max_slots_per_performer }}</span>
              </div>
            </div>
          </div>

          <div v-if="currentEvent.house_rules" class="house-rules">
            <h3><i class="pi pi-info-circle"></i> House Rules</h3>
            <p>{{ currentEvent.house_rules }}</p>
          </div>

          <SignupForm
            :default-duration="currentEvent.defaults?.slot_duration_minutes || 5"
            :is-submitting="isSubmitting"
            @submit="handleSignup"
          />

          <Message v-if="submitError" severity="error" :closable="true" @close="submitError = null">
            {{ submitError }}
          </Message>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useEventStore } from '../stores/event'
import { useAPI } from '../composables/useAPI'
import { useWebSocket } from '../composables/useWebSocket'
import EventHeader from '../components/shared/EventHeader.vue'
import LoadingState from '../components/shared/LoadingState.vue'
import SignupForm from '../components/performer/SignupForm.vue'
import type { SignupFormData } from '../types/views'
import type { Slot } from '../types/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const eventStore = useEventStore()
const { apiService } = useAPI()

const eventId = ref<string>('')
const isLoadingEvent = ref(true)
const eventError = ref<string | null>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const createdSlot = ref<Slot | null>(null)

// WebSocket for real-time updates - will be initialized after we have eventId
let wsConnect: (() => void) | null = null
let wsDisconnect: (() => void) | null = null

const currentEvent = computed(() => eventStore.currentEvent)
const signupsEnabled = computed(() => eventStore.signupsEnabled)

async function handleSignup(formData: SignupFormData) {
  console.log('handleSignup called with:', formData)
  isSubmitting.value = true
  submitError.value = null

  try {
    // Remove confirm_password before sending
    const { confirm_password, ...signupData } = formData

    // Clean empty optional fields
    if (!signupData.leave_by_at) delete signupData.leave_by_at
    if (!signupData.notes) delete signupData.notes

    console.log('Sending signup data:', signupData)
    const response = await apiService.createSlot(eventId.value, signupData)

    if (response.slot) {
      createdSlot.value = response.slot

      toast.add({
        severity: 'success',
        summary: 'Success!',
        detail: 'You\'ve been added to the queue',
        life: 5000
      })

      // Redirect to queue
      router.push({ name: 'public-queue', params: { eventId: eventId.value } })
    }
  } catch (error: any) {
    console.error('Signup failed:', error)
    submitError.value = error.message || 'Failed to sign up. Please try again.'
    toast.add({
      severity: 'error',
      summary: 'Signup Failed',
      detail: error.message || 'Please try again',
      life: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(async () => {
  isLoadingEvent.value = true
  eventError.value = null

  try {
    // Check if accessing by event code or event ID
    const code = route.query.code as string | undefined
    const paramEventId = route.params.eventId as string | undefined

    // Helper function to check if string looks like an event code (6 alphanumeric chars)
    const isEventCode = (str: string) => /^[A-Z0-9]{6}$/.test(str)

    if (code) {
      // Look up event by code from query parameter
      const normalizedCode = code.trim().toUpperCase()
      try {
        const response = await apiService.getEventByCode(normalizedCode)
        if (response.event) {
          eventId.value = response.event.event_id
        } else {
          eventError.value = 'Invalid event code'
          isLoadingEvent.value = false
          return
        }
      } catch (error: any) {
        console.error('Failed to look up event by code:', error)
        eventError.value = error.message || 'Invalid event code'
        isLoadingEvent.value = false
        return
      }
    } else if (paramEventId) {
      // Normalize the input (trim and uppercase)
      const normalizedParam = paramEventId.trim().toUpperCase()
      console.log('Normalized param:', normalizedParam)

      // Check if paramEventId looks like an event code
      if (isEventCode(normalizedParam)) {
        // Look up event by code from route parameter
        console.log('Detected as event code, looking up...')
        try {
          const response = await apiService.getEventByCode(normalizedParam)
          console.log('Event lookup response:', response)
          if (response.event) {
            eventId.value = response.event.event_id
            console.log('Resolved event_id:', eventId.value)
          } else {
            console.error('Event lookup returned no event')
            eventError.value = `Event not found with code: ${normalizedParam}`
            isLoadingEvent.value = false
            return
          }
        } catch (error: any) {
          console.error('Failed to look up event by code:', error)
          eventError.value = error.message || `Unable to find event with code: ${normalizedParam}`
          isLoadingEvent.value = false
          return
        }
      } else {
        // Use as event ID directly (UUID format)
        console.log('Detected as UUID, using directly')
        eventId.value = paramEventId.trim()
      }
    } else {
      eventError.value = 'No event ID or code provided'
      isLoadingEvent.value = false
      return
    }

    // Initialize WebSocket connection with the resolved eventId
    console.log('Initializing WebSocket for event_id:', eventId.value)
    const ws = useWebSocket(eventId.value, 'public', toast)
    wsConnect = ws.connect
    wsDisconnect = ws.disconnect

    // Connect to WebSocket for event data
    console.log('Connecting to WebSocket...')
    wsConnect()

    // Wait for WebSocket connection to establish
    let attempts = 0
    while (!ws.isConnected.value && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    if (!ws.isConnected.value) {
      console.error('WebSocket failed to connect after 5 seconds')
      eventError.value = 'Failed to connect to event. Please try refreshing the page.'
      isLoadingEvent.value = false
      return
    }

    console.log('WebSocket connected! Requesting initial data...')

    // Request full state from server (can't be sent during $connect)
    ws.requestResync()

    // Wait for event data to load
    attempts = 0
    while (!currentEvent.value && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
      if (attempts % 10 === 0) {
        console.log(`Still waiting for event data... (${attempts * 100}ms elapsed)`)
      }
    }

    console.log('After waiting, currentEvent:', currentEvent.value)

    if (!currentEvent.value) {
      console.error('Event data never arrived from WebSocket')
      eventError.value = 'Event not found. Please check the event code and try again.'
    } else {
      console.log('Event loaded successfully:', currentEvent.value.name)
    }
  } catch (error: any) {
    console.error('Failed to load event:', error)
    eventError.value = error.message || 'Failed to load event'
  } finally {
    isLoadingEvent.value = false
  }
})

onUnmounted(() => {
  if (wsDisconnect) {
    wsDisconnect()
  }
})
</script>

<style scoped>
.performer-signup-view {
  min-height: 100vh;
  background-color: #1e1e1e;
  background-image: repeating-radial-gradient(circle at 0 0, transparent 0, #1e1e1e 40px), repeating-linear-gradient(rgba(0, 206, 144, 0.33), rgb(0, 206, 144));
  padding-bottom: 2rem;
  position: relative;
}

.performer-signup-view::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  pointer-events: none;
  z-index: 0;
}

.signup-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
}

.signup-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.signup-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.signup-content {
  margin-top: 1.5rem;
}

.info-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow:
    0 4px 16px rgba(0, 206, 144, 0.15),
    0 2px 8px rgba(0, 206, 144, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-item i {
  font-size: 1.5rem;
  color: rgba(0, 206, 144, 1);
  flex-shrink: 0;
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.4));
}

.info-item > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.info-value {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
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

@media (max-width: 768px) {
  .signup-container {
    padding: 1rem;
  }

  .signup-header h1 {
    font-size: 1.5rem;
  }

  .info-card {
    padding: 1.25rem;
  }

  .house-rules {
    padding: 1rem;
  }
}
</style>