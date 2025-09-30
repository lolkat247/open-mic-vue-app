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
  background: var(--surface-card);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.header-icon {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.auth-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.auth-description {
  color: var(--text-color-secondary);
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
  color: var(--text-color);
}

.help-text {
  color: var(--text-color-secondary);
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
}

.auth-help :deep(.p-message p) {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
}

.w-full {
  width: 100%;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input) {
  width: 100%;
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