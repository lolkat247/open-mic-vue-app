<template>
  <div class="checkin-card">
    <h3><i class="pi pi-check-circle"></i> Check In</h3>
    <p class="card-description">Let us know you're here! This helps us track who's attending the event.</p>

    <div v-if="!isSubmitted" class="checkin-form">
      <div class="form-field">
        <InputText
          v-model="email"
          type="email"
          placeholder="Enter your email"
          :class="{ 'p-invalid': emailError }"
          :disabled="isSubmitting"
          @keypress.enter="handleSubmit"
        />
        <small v-if="emailError" class="error-message">{{ emailError }}</small>
      </div>

      <div class="form-field checkbox-field">
        <Checkbox
          v-model="wantsContact"
          :binary="true"
          input-id="contact-preference"
          :disabled="isSubmitting"
        />
        <label for="contact-preference">
          Tell the event organizer to email me about future events (dw we wont spam u)
        </label>
      </div>

      <Button
        label="Check In"
        icon="pi pi-check"
        :loading="isSubmitting"
        @click="handleSubmit"
        :disabled="!email.trim()"
        class="submit-button"
      />
    </div>

    <div v-else class="success-message">
      <i class="pi pi-check-circle"></i>
      <p>You've checked in successfully!</p>
    </div>

    <Message v-if="error" severity="error" :closable="true" @close="error = null">
      {{ error }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAPI } from '../../composables/useAPI'

interface Props {
  eventId: string
}

const props = defineProps<Props>()
const { apiService } = useAPI()

const email = ref('')
const wantsContact = ref(false)
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const error = ref<string | null>(null)
const emailError = ref<string | null>(null)

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function handleSubmit() {
  error.value = null
  emailError.value = null

  // Validate email
  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    emailError.value = 'Email is required'
    return
  }

  if (!validateEmail(trimmedEmail)) {
    emailError.value = 'Please enter a valid email address'
    return
  }

  isSubmitting.value = true

  try {
    await apiService.createCheckin(props.eventId, {
      email: trimmedEmail.toLowerCase(),
      wants_contact: wantsContact.value,
    })

    isSubmitted.value = true
  } catch (err: any) {
    console.error('Check-in failed:', err)
    if (err.message && err.message.includes('already checked in')) {
      error.value = "You've already checked in!"
    } else {
      error.value = err.message || 'Failed to check in. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.checkin-card {
  background: rgba(64, 224, 208, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-left: 4px solid rgba(64, 224, 208, 1);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.checkin-card h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(230, 240, 255, 1);
  margin: 0 0 0.75rem 0;
}

.checkin-card h3 i {
  font-size: 1.25rem;
  color: rgba(72, 209, 204, 1);
}

.card-description {
  color: rgba(230, 240, 255, 0.85);
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.checkin-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-field label {
  color: rgba(230, 240, 255, 0.95);
  font-size: 0.9rem;
  cursor: pointer;
  user-select: none;
}

.error-message {
  color: rgba(248, 113, 113, 1);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.submit-button {
  align-self: flex-start;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.5);
  border-radius: 6px;
  color: rgba(134, 239, 172, 1);
}

.success-message i {
  font-size: 1.5rem;
  color: rgba(34, 197, 94, 1);
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.4));
}

.success-message p {
  margin: 0;
  font-weight: 500;
  font-size: 1rem;
}

/* Override PrimeVue input styles */
:deep(.p-inputtext) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(72, 209, 204, 0.3);
  color: rgba(255, 255, 255, 0.95);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

:deep(.p-inputtext:enabled:hover) {
  border-color: rgba(72, 209, 204, 0.5);
}

:deep(.p-inputtext:enabled:focus) {
  outline: none;
  border-color: rgba(64, 224, 208, 1);
  box-shadow: 0 0 0 2px rgba(64, 224, 208, 0.2);
}

:deep(.p-inputtext.p-invalid) {
  border-color: rgba(248, 113, 113, 1);
}

:deep(.p-checkbox) {
  width: 1.25rem;
  height: 1.25rem;
}

:deep(.p-checkbox .p-checkbox-box) {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(72, 209, 204, 0.5);
  border-radius: 4px;
  width: 1.25rem;
  height: 1.25rem;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: rgba(64, 224, 208, 0.8);
  border-color: rgba(64, 224, 208, 1);
}

:deep(.p-checkbox .p-checkbox-box .p-checkbox-icon) {
  color: white;
}

@media (max-width: 768px) {
  .checkin-card {
    padding: 1rem;
  }

  .submit-button {
    align-self: stretch;
  }
}
</style>
