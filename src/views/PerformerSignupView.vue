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

        <Message v-if="!signupsEnabled" severity="warn" :closable="false">
          <strong>Signups are currently paused</strong>
          <p>The organizer has temporarily paused signups. Please check back later.</p>
        </Message>

        <div v-else class="signup-content">
          <div class="info-card">
            <div class="info-item">
              <i class="pi pi-clock"></i>
              <div>
                <span class="info-label">Default Slot Duration</span>
                <span class="info-value">{{ currentEvent.defaults.slot_duration_minutes || 5 }} minutes</span>
              </div>
            </div>
            <div v-if="currentEvent.policies.max_slots_per_performer" class="info-item">
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
            :default-duration="currentEvent.defaults.slot_duration_minutes || 5"
            :is-submitting="isSubmitting"
            @submit="handleSignup"
          />

          <Message v-if="submitError" severity="error" :closable="true" @close="submitError = null">
            {{ submitError }}
          </Message>
        </div>
      </template>
    </div>

    <!-- Success Dialog -->
    <Dialog
      v-model:visible="showSuccessDialog"
      modal
      header="🎉 You're Signed Up!"
      :closable="false"
      :style="{ width: '90vw', maxWidth: '500px' }"
    >
      <div class="success-content">
        <p class="success-message">
          You've been added to the queue!
        </p>
        <div v-if="createdSlot" class="slot-info">
          <div class="slot-detail">
            <strong>Your Position:</strong>
            <span>#{{ queuePosition }}</span>
          </div>
          <div class="slot-detail">
            <strong>Stage Name:</strong>
            <span>{{ createdSlot.stage_name }}</span>
          </div>
          <div v-if="estimatedWait" class="slot-detail">
            <strong>Estimated Wait:</strong>
            <span>~{{ estimatedWait }} minutes</span>
          </div>
        </div>
        <Message severity="info" :closable="false">
          <strong>Remember:</strong> You'll need your password to manage or cancel your slot.
        </Message>
      </div>
      <template #footer>
        <Button
          label="View Queue"
          icon="pi pi-eye"
          @click="goToQueue"
          outlined
        />
        <Button
          label="Done"
          icon="pi pi-check"
          @click="showSuccessDialog = false"
          autofocus
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import { useEventStore } from '../stores/event'
import { useQueueStore } from '../stores/queue'
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
const queueStore = useQueueStore()
const { apiService } = useAPI()

const eventId = ref<string>('')
const isLoadingEvent = ref(true)
const eventError = ref<string | null>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const showSuccessDialog = ref(false)
const createdSlot = ref<Slot | null>(null)

// WebSocket for real-time updates - will be initialized after we have eventId
let wsConnect: (() => void) | null = null

const currentEvent = computed(() => eventStore.currentEvent)
const signupsEnabled = computed(() => eventStore.signupsEnabled)
const queuePosition = computed(() => {
  if (!createdSlot.value) return 0
  const queuedSlots = queueStore.queuedSlots
  const index = queuedSlots.findIndex((slot) => slot.slot_id === createdSlot.value?.slot_id)
  return index >= 0 ? index + 1 : 0
})
const estimatedWait = computed(() => {
  if (!createdSlot.value) return null
  const eta = queueStore.etaUpdates.find((e) => e.slot_id === createdSlot.value?.slot_id)
  return eta?.estimated_wait_minutes
})

async function handleSignup(formData: SignupFormData) {
  isSubmitting.value = true
  submitError.value = null

  try {
    // Remove confirm_password before sending
    const { confirm_password, ...signupData } = formData

    // Clean empty optional fields
    if (!signupData.leave_by_at) delete signupData.leave_by_at
    if (!signupData.notes) delete signupData.notes

    const response = await apiService.createSlot(eventId.value, signupData)

    if (response.slot) {
      createdSlot.value = response.slot

      // Store slot ID in localStorage for quick access
      localStorage.setItem(`slot_${eventId.value}`, response.slot.slot_id)

      showSuccessDialog.value = true

      toast.add({
        severity: 'success',
        summary: 'Success!',
        detail: 'You\'ve been added to the queue',
        life: 5000
      })
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

function goToQueue() {
  router.push({ name: 'public-queue', params: { eventId: eventId.value } })
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
      try {
        const response = await apiService.getEventByCode(code)
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
      // Check if paramEventId looks like an event code
      if (isEventCode(paramEventId)) {
        // Look up event by code from route parameter
        try {
          const response = await apiService.getEventByCode(paramEventId)
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
      } else {
        // Use as event ID directly (UUID format)
        eventId.value = paramEventId
      }
    } else {
      eventError.value = 'No event ID or code provided'
      isLoadingEvent.value = false
      return
    }

    // Initialize WebSocket connection with the resolved eventId
    const ws = useWebSocket(eventId.value, 'public')
    wsConnect = ws.connect

    // Connect to WebSocket for event data
    wsConnect()

    // Wait for initial data
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (!currentEvent.value) {
      eventError.value = 'Event not found'
    }
  } catch (error: any) {
    console.error('Failed to load event:', error)
    eventError.value = error.message || 'Failed to load event'
  } finally {
    isLoadingEvent.value = false
  }
})
</script>

<style scoped>
.performer-signup-view {
  min-height: 100vh;
  background: var(--surface-ground);
  padding-bottom: 2rem;
}

.signup-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
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
  color: var(--text-color);
  margin: 0;
}

.signup-content {
  margin-top: 1.5rem;
}

.info-card {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-item i {
  font-size: 1.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.info-item > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 1.1rem;
  color: var(--text-color);
  font-weight: 600;
}

.house-rules {
  background: var(--blue-50);
  border-left: 4px solid var(--blue-500);
  border-radius: 4px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.house-rules h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--blue-900);
  margin: 0 0 0.75rem 0;
}

.house-rules h3 i {
  color: var(--blue-600);
}

.house-rules p {
  color: var(--blue-800);
  margin: 0;
  line-height: 1.6;
}

.success-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.success-message {
  font-size: 1.1rem;
  text-align: center;
  color: var(--text-color);
  margin: 0;
}

.slot-info {
  background: var(--surface-ground);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.slot-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.slot-detail:last-child {
  border-bottom: none;
}

.slot-detail strong {
  color: var(--text-color-secondary);
  font-weight: 600;
}

.slot-detail span {
  color: var(--text-color);
  font-weight: 500;
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