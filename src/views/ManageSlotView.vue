<template>
  <div class="manage-slot-view">
    <div class="manage-container">
      <div class="manage-header">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          @click="goBack"
          aria-label="Go back"
        />
        <h1>Manage Your Slot</h1>
      </div>

      <LoadingState v-if="isLoadingEvent" message="Loading event details..." />

      <Message v-else-if="eventError" severity="error" :closable="false">
        {{ eventError }}
      </Message>

      <template v-else-if="currentEvent">
        <EventHeader :event="currentEvent" />

        <!-- Authentication Step -->
        <div v-if="!isAuthenticated" class="auth-step">
          <SlotPasswordAuth
            :slot-id="storedSlotId"
            :is-loading="isAuthenticating"
            @submit="handleAuthenticate"
            ref="authComponent"
          />
        </div>

        <!-- Slot Management Step -->
        <div v-else class="manage-step">
          <LoadingState v-if="isLoadingSlot" message="Loading your slot..." />

          <Message v-else-if="slotError" severity="error" :closable="false">
            {{ slotError }}
          </Message>

          <template v-else-if="currentSlot">
            <!-- Queue Position Info -->
            <div class="position-card">
              <div class="position-info">
                <div class="info-item">
                  <i class="pi pi-hashtag"></i>
                  <div>
                    <span class="info-label">Your Position</span>
                    <span class="info-value">#{{ queuePosition || 'N/A' }}</span>
                  </div>
                </div>
                <div v-if="slotETA" class="info-item">
                  <ETADisplay :eta="slotETA" :show-estimated-time="true" label="Estimated wait" />
                </div>
              </div>
              <Button
                label="View Queue"
                icon="pi pi-eye"
                outlined
                @click="goToQueue"
                class="view-queue-btn"
              />
            </div>

            <!-- Manage Form -->
            <ManageSlotForm
              :slot="currentSlot"
              :is-updating="isUpdating"
              :is-withdrawing="isWithdrawing"
              @update="handleUpdate"
              @withdraw="handleWithdraw"
            />

            <Message v-if="updateSuccess" severity="success" :closable="true" @close="updateSuccess = null">
              {{ updateSuccess }}
            </Message>

            <Message v-if="updateError" severity="error" :closable="true" @close="updateError = null">
              {{ updateError }}
            </Message>
          </template>
        </div>
      </template>
    </div>

    <!-- Withdrawal Success Dialog -->
    <Dialog
      v-model:visible="showWithdrawSuccessDialog"
      modal
      header="Withdrawn from Queue"
      :closable="false"
      :style="{ width: '90vw', maxWidth: '500px' }"
    >
      <div class="success-content">
        <i class="pi pi-check-circle success-icon"></i>
        <p class="success-message">
          You've been successfully removed from the queue.
        </p>
        <p class="success-note">
          You can sign up again anytime if the event allows it.
        </p>
      </div>
      <template #footer>
        <Button
          label="Go to Queue"
          icon="pi pi-eye"
          @click="goToQueue"
          outlined
        />
        <Button
          label="Done"
          icon="pi pi-check"
          @click="showWithdrawSuccessDialog = false; goBack()"
          autofocus
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
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import { useEventStore } from '../stores/event'
import { useQueueStore } from '../stores/queue'
import { useAPI } from '../composables/useAPI'
import { useWebSocket } from '../composables/useWebSocket'
import EventHeader from '../components/shared/EventHeader.vue'
import LoadingState from '../components/shared/LoadingState.vue'
import SlotPasswordAuth from '../components/performer/SlotPasswordAuth.vue'
import ManageSlotForm from '../components/performer/ManageSlotForm.vue'
import ETADisplay from '../components/queue/ETADisplay.vue'
import type { SlotPasswordAuthData, ManageSlotFormData } from '../types/views'
import type { Slot } from '../types/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const eventStore = useEventStore()
const queueStore = useQueueStore()
const { apiService } = useAPI()

const eventId = route.params.eventId as string
const isLoadingEvent = ref(true)
const eventError = ref<string | null>(null)
const isAuthenticating = ref(false)
const isAuthenticated = ref(false)
const authComponent = ref()
const currentSlot = ref<Slot | null>(null)
const slotError = ref<string | null>(null)
const isLoadingSlot = ref(false)
const isUpdating = ref(false)
const isWithdrawing = ref(false)
const updateSuccess = ref<string | null>(null)
const updateError = ref<string | null>(null)
const showWithdrawSuccessDialog = ref(false)
const authenticatedSlotId = ref<string>('')
const authenticatedPassword = ref<string>('')

// WebSocket for real-time updates
const ws = useWebSocket(eventId, 'public', toast)

const currentEvent = computed(() => eventStore.currentEvent)
const storedSlotId = computed(() => localStorage.getItem(`slot_${eventId}`) || '')
const queuePosition = computed(() => {
  if (!currentSlot.value) return 0
  const queuedSlots = queueStore.queuedSlots
  const index = queuedSlots.findIndex((slot) => slot.slot_id === currentSlot.value?.slot_id)
  return index >= 0 ? index + 1 : 0
})
const slotETA = computed(() => {
  if (!currentSlot.value) return null
  return queueStore.getETAForSlot(currentSlot.value.slot_id)
})

async function handleAuthenticate(data: SlotPasswordAuthData) {
  isAuthenticating.value = true

  try {
    // Try to update the slot with just the password to verify access
    // We use a minimal update that doesn't change anything
    await apiService.updateSlot(eventId, data.slot_id, {
      slot_password: data.slot_password,
      // Don't include other fields - backend will ignore empty update
    })

    // Authentication successful, now fetch the slot details
    authenticatedSlotId.value = data.slot_id
    authenticatedPassword.value = data.slot_password
    await fetchSlotDetails(data.slot_id)

    isAuthenticated.value = true

    // Store slot ID for future access
    localStorage.setItem(`slot_${eventId}`, data.slot_id)

    toast.add({
      severity: 'success',
      summary: 'Access Granted',
      detail: 'You can now manage your slot',
      life: 3000
    })
  } catch (error: any) {
    console.error('Authentication failed:', error)
    authComponent.value?.setError(error.message || 'Invalid slot ID or password')
  } finally {
    isAuthenticating.value = false
  }
}

async function fetchSlotDetails(slotId: string) {
  isLoadingSlot.value = true
  slotError.value = null

  try {
    // Get slot from queue store (populated by WebSocket)
    const slot = queueStore.slots.find((s) => s.slot_id === slotId)

    if (slot) {
      currentSlot.value = slot
    } else {
      slotError.value = 'Slot not found in queue'
    }
  } catch (error: any) {
    console.error('Failed to fetch slot:', error)
    slotError.value = error.message || 'Failed to load slot details'
  } finally {
    isLoadingSlot.value = false
  }
}

async function handleUpdate(data: ManageSlotFormData) {
  if (!currentSlot.value) return

  isUpdating.value = true
  updateSuccess.value = null
  updateError.value = null

  try {
    const updateData = {
      self_est_min: data.self_est_min,
      notes: data.notes || undefined,
      leave_by_at: data.leave_by_at || undefined,
      extra_setup: data.extra_setup,
      slot_password: data.slot_password
    }

    const response = await apiService.updateSlot(eventId, currentSlot.value.slot_id, updateData)

    if (response.slot) {
      currentSlot.value = response.slot
      queueStore.updateSlot(response.slot.slot_id, response.slot)

      updateSuccess.value = 'Your slot has been updated successfully'

      toast.add({
        severity: 'success',
        summary: 'Updated',
        detail: 'Your slot has been updated',
        life: 5000
      })
    }
  } catch (error: any) {
    console.error('Update failed:', error)
    updateError.value = error.message || 'Failed to update slot'
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: error.message || 'Please try again',
      life: 5000
    })
  } finally {
    isUpdating.value = false
  }
}

async function handleWithdraw(password: string) {
  if (!currentSlot.value) return

  isWithdrawing.value = true
  updateError.value = null

  try {
    await apiService.withdrawSlot(eventId, currentSlot.value.slot_id, {
      slot_password: password
    })

    // Remove from localStorage
    localStorage.removeItem(`slot_${eventId}`)

    showWithdrawSuccessDialog.value = true

    toast.add({
      severity: 'success',
      summary: 'Withdrawn',
      detail: 'You\'ve been removed from the queue',
      life: 5000
    })
  } catch (error: any) {
    console.error('Withdrawal failed:', error)
    updateError.value = error.message || 'Failed to withdraw from queue'
    toast.add({
      severity: 'error',
      summary: 'Withdrawal Failed',
      detail: error.message || 'Please try again',
      life: 5000
    })
  } finally {
    isWithdrawing.value = false
  }
}

function goBack() {
  router.back()
}

function goToQueue() {
  router.push({ name: 'public-queue', params: { eventId } })
}

onMounted(async () => {
  isLoadingEvent.value = true
  eventError.value = null

  try {
    // Connect to WebSocket for event data
    ws.connect()

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

onUnmounted(() => {
  ws.disconnect()
})
</script>

<style scoped>
.manage-slot-view {
  min-height: 100vh;
  background-color: var(--surface-ground);
  background-image: repeating-radial-gradient(circle at 0 0, transparent 0, var(--surface-ground) 40px), repeating-linear-gradient(rgba(0, 206, 144, 0.33), rgb(0, 206, 144));
  padding-bottom: 2rem;
  position: relative;
}

.manage-slot-view::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  pointer-events: none;
  z-index: 0;
}

.manage-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
}

.manage-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.manage-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.auth-step,
.manage-step {
  margin-top: 1.5rem;
}

.position-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.position-info {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 200px;
}

.info-item > i {
  font-size: 1.5rem;
  color: var(--primary-color);
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
  font-size: 1.5rem;
  color: var(--text-color);
  font-weight: 700;
}

.view-queue-btn {
  align-self: flex-start;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 1rem;
  text-align: center;
}

.success-icon {
  font-size: 4rem;
  color: var(--green-500);
}

.success-message {
  font-size: 1.1rem;
  color: var(--text-color);
  margin: 0;
}

.success-note {
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .manage-container {
    padding: 1rem;
  }

  .manage-header h1 {
    font-size: 1.5rem;
  }

  .position-card {
    padding: 1.25rem;
  }

  .position-info {
    flex-direction: column;
    gap: 1rem;
  }

  .info-item {
    min-width: unset;
  }
}
</style>