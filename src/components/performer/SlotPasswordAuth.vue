<template>
  <div class="slot-password-auth">
    <div class="auth-header">
      <i class="pi pi-lock header-icon"></i>
      <h3>{{ title }}</h3>
      <p class="auth-description">{{ description }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="auth-form">
      <div class="form-field">
        <label for="slotId">Slot ID</label>
        <InputText
          id="slotId"
          v-model="formData.slot_id"
          placeholder="Enter your slot ID"
          :class="{ 'p-invalid': errors.slot_id }"
          :disabled="slotIdProvided"
          class="w-full"
        />
        <small v-if="errors.slot_id" class="p-error">{{ errors.slot_id }}</small>
        <small v-else class="help-text">You received this when you signed up</small>
      </div>

      <div class="form-field">
        <label for="password">Password</label>
        <Password
          id="password"
          v-model="formData.slot_password"
          :class="{ 'p-invalid': errors.slot_password }"
          :feedback="false"
          toggleMask
          placeholder="Enter your slot password"
          class="w-full"
        />
        <small v-if="errors.slot_password" class="p-error">{{ errors.slot_password }}</small>
        <small v-else class="help-text">The password you created when signing up</small>
      </div>

      <Message v-if="error" severity="error" :closable="true" @close="error = null">
        {{ error }}
      </Message>

      <div class="form-actions">
        <Button
          type="submit"
          :label="submitLabel"
          icon="pi pi-unlock"
          :loading="isLoading"
          :disabled="!isFormValid || isLoading"
          class="w-full"
        />
      </div>

      <div class="auth-help">
        <Message severity="info" :closable="false">
          <strong>Can't access your slot?</strong>
          <p>If you've lost your password or slot ID, please contact the event organizer.</p>
        </Message>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import type { SlotPasswordAuthData } from '../../types/views'

interface Props {
  slotId?: string
  title?: string
  description?: string
  submitLabel?: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Access Your Slot',
  description: 'Enter your slot ID and password to manage your performance slot',
  submitLabel: 'Access Slot',
  isLoading: false
})

const emit = defineEmits<{
  submit: [data: SlotPasswordAuthData]
}>()

const formData = reactive<SlotPasswordAuthData>({
  slot_id: props.slotId || '',
  slot_password: ''
})

const errors = reactive<Partial<Record<keyof SlotPasswordAuthData, string>>>({})
const error = ref<string | null>(null)

const slotIdProvided = computed(() => !!props.slotId)

const isFormValid = computed(() => {
  return (
    formData.slot_id.trim().length > 0 &&
    formData.slot_password.length > 0
  )
})

// Watch for prop changes
watch(() => props.slotId, (newSlotId) => {
  if (newSlotId) {
    formData.slot_id = newSlotId
  }
})

function validateField(field: keyof SlotPasswordAuthData) {
  delete errors[field]

  switch (field) {
    case 'slot_id':
      if (!formData.slot_id.trim()) {
        errors.slot_id = 'Slot ID is required'
      }
      break
    case 'slot_password':
      if (!formData.slot_password) {
        errors.slot_password = 'Password is required'
      }
      break
  }
}

function handleSubmit() {
  error.value = null

  // Validate all fields
  validateField('slot_id')
  validateField('slot_password')

  if (Object.keys(errors).length > 0) {
    return
  }

  emit('submit', { ...formData })
}

// Expose method to set error from parent
defineExpose({
  setError: (message: string) => {
    error.value = message
  },
  reset: () => {
    formData.slot_password = ''
    error.value = null
    Object.keys(errors).forEach(key => delete errors[key as keyof typeof errors])
  }
})
</script>

<style scoped>
.slot-password-auth {
  max-width: 500px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  box-shadow:
    0 4px 16px rgba(0, 206, 144, 0.15),
    0 2px 8px rgba(0, 206, 144, 0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.header-icon {
  font-size: 3rem;
  color: #00ce90;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 12px rgba(0, 206, 144, 0.5));
}

.auth-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
}

.auth-description {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.help-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.form-actions {
  margin-top: 0.5rem;
}

.auth-help {
  margin-top: 1rem;
}

.auth-help :deep(.p-message) {
  font-size: 0.9rem;
  background: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
  color: rgba(191, 219, 254, 0.95) !important;
}

.auth-help :deep(.p-message-icon) {
  color: rgba(96, 165, 250, 1) !important;
}

.auth-help :deep(.p-message-text) {
  color: rgba(191, 219, 254, 0.95) !important;
}

.auth-help :deep(.p-message p) {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: rgba(191, 219, 254, 0.9) !important;
}

.w-full {
  width: 100%;
}

/* Validation error styling - red and prominent */
:deep(.p-error) {
  color: #ef4444 !important;
  font-weight: 700;
  font-size: 0.9rem;
  display: block;
  margin-top: 0.5rem;
}

/* Input field dark mode styling */
:deep(.p-inputtext),
:deep(.p-password input) {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

:deep(.p-inputtext:focus),
:deep(.p-password input:focus) {
  border-color: #00ce90 !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 206, 144, 0.25) !important;
}

:deep(.p-inputtext::placeholder),
:deep(.p-password input::placeholder) {
  color: rgba(255, 255, 255, 0.4) !important;
}

:deep(.p-inputtext:disabled) {
  background: rgba(0, 0, 0, 0.4) !important;
  color: rgba(255, 255, 255, 0.5) !important;
  opacity: 0.7;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input) {
  width: 100%;
}

/* Error message styling */
:deep(.p-message-error) {
  background: rgba(239, 68, 68, 0.15) !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
  color: rgba(254, 202, 202, 0.95) !important;
}

:deep(.p-message-error .p-message-icon) {
  color: #ef4444 !important;
}

:deep(.p-message-error .p-message-text) {
  color: rgba(254, 202, 202, 0.95) !important;
}

@media (max-width: 768px) {
  .slot-password-auth {
    padding: 1.5rem;
  }

  .header-icon {
    font-size: 2.5rem;
  }

  .auth-header h3 {
    font-size: 1.25rem;
  }
}
</style>