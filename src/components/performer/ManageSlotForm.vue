<template>
  <form @submit.prevent="handleSubmit" class="manage-slot-form">
    <div class="form-section">
      <h3 class="section-title">Your Slot Details</h3>

      <!-- Stage Name (Read-only) -->
      <div class="form-field">
        <label>Stage Name</label>
        <InputText
          :modelValue="slot.stage_name"
          disabled
          class="w-full"
        />
        <small class="help-text">Stage name cannot be changed</small>
      </div>

      <!-- Act Type (Read-only) -->
      <div class="form-field">
        <label>Act Type</label>
        <InputText
          :modelValue="slot.act_type"
          disabled
          class="w-full"
        />
      </div>

      <!-- Current Status -->
      <div class="form-field">
        <label>Status</label>
        <div class="status-display">
          <Badge :value="statusLabel" :severity="statusSeverity" />
          <span class="status-text">{{ statusDescription }}</span>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">Editable Information</h3>

      <!-- Estimated Time -->
      <div class="form-field">
        <label for="estimatedTime">Estimated Performance Time (minutes)</label>
        <InputNumber
          id="estimatedTime"
          v-model="formData.self_est_min"
          :min="1"
          :max="60"
          :class="{ 'p-invalid': errors.self_est_min }"
          @blur="validateField('self_est_min')"
          showButtons
          class="w-full"
        />
        <small v-if="errors.self_est_min" class="p-error">{{ errors.self_est_min }}</small>
      </div>

      <!-- Leave By Time -->
      <div class="form-field">
        <label for="leaveBy">Need to Leave By (Time)</label>
        <InputMask
          id="leaveBy"
          v-model="formData.leave_by_at"
          mask="99:99"
          placeholder="HH:MM (e.g., 22:30)"
          :class="{ 'p-invalid': errors.leave_by_at }"
          @blur="validateField('leave_by_at')"
          class="w-full"
        />
        <small v-if="errors.leave_by_at" class="p-error">{{ errors.leave_by_at }}</small>
        <small v-else class="help-text">Leave blank if not applicable</small>
      </div>

      <!-- Extra Setup -->
      <div class="form-field checkbox-field">
        <Checkbox
          id="extraSetup"
          v-model="formData.extra_setup"
          :binary="true"
        />
        <label for="extraSetup" class="checkbox-label">
          I need extra setup time
        </label>
      </div>

      <!-- Notes -->
      <div class="form-field">
        <label for="notes">Notes for Organizer</label>
        <Textarea
          id="notes"
          v-model="formData.notes"
          rows="3"
          :maxlength="200"
          placeholder="Any special requests or information..."
          class="w-full"
        />
        <small class="help-text">{{ formData.notes?.length || 0 }}/200 characters</small>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">Confirm Changes</h3>
      <p class="section-description">Enter your password to update your slot</p>

      <div class="form-field">
        <label for="password" class="required">Password</label>
        <Password
          id="password"
          v-model="formData.slot_password"
          :class="{ 'p-invalid': errors.slot_password }"
          @blur="validateField('slot_password')"
          :feedback="false"
          toggleMask
          placeholder="Your slot password"
          class="w-full"
        />
        <small v-if="errors.slot_password" class="p-error">{{ errors.slot_password }}</small>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="form-actions">
      <Button
        type="submit"
        label="Update Slot"
        icon="pi pi-check"
        :loading="isUpdating"
        :disabled="!isFormValid || isUpdating"
        class="update-button"
      />
      <Button
        type="button"
        label="Withdraw from Queue"
        icon="pi pi-times"
        severity="danger"
        outlined
        :loading="isWithdrawing"
        :disabled="isUpdating || isWithdrawing || !canWithdraw"
        @click="confirmWithdraw"
        class="withdraw-button"
      />
    </div>

    <Message v-if="!canWithdraw" severity="warn" :closable="false">
      You cannot withdraw from this slot anymore. Please contact the organizer.
    </Message>
  </form>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'
import InputMask from 'primevue/inputmask'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import { validateEstimatedMinutes, validateTimeFormat } from '../../utils/validation'
import type { Slot } from '../../types/api'
import type { ManageSlotFormData } from '../../types/views'

interface Props {
  slot: Slot
  isUpdating?: boolean
  isWithdrawing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isUpdating: false,
  isWithdrawing: false
})

const emit = defineEmits<{
  update: [data: ManageSlotFormData]
  withdraw: [password: string]
}>()

const confirm = useConfirm()

const formData = reactive<ManageSlotFormData>({
  self_est_min: props.slot.self_est_min,
  leave_by_at: props.slot.leave_by_at || '',
  extra_setup: props.slot.extra_setup,
  notes: props.slot.notes || '',
  slot_password: ''
})

const errors = reactive<Partial<Record<keyof ManageSlotFormData, string>>>({})

const statusLabel = computed(() => {
  switch (props.slot.status) {
    case 'queued': return 'Queued'
    case 'up_next': return 'Up Next'
    case 'setting_up': return 'Setting Up'
    case 'performing': return 'Performing'
    case 'completed': return 'Completed'
    case 'no_show': return 'No Show'
    case 'withdrawn': return 'Withdrawn'
    default: return props.slot.status
  }
})

const statusSeverity = computed(() => {
  switch (props.slot.status) {
    case 'queued': return 'info'
    case 'up_next': return 'warn'
    case 'setting_up':
    case 'performing': return 'success'
    case 'completed': return 'secondary'
    case 'no_show':
    case 'withdrawn': return 'danger'
    default: return 'info'
  }
})

const statusDescription = computed(() => {
  switch (props.slot.status) {
    case 'queued': return 'Waiting in queue'
    case 'up_next': return 'You\'re up next!'
    case 'setting_up': return 'Currently setting up'
    case 'performing': return 'Currently performing'
    case 'completed': return 'Performance completed'
    case 'no_show': return 'Marked as no-show'
    case 'withdrawn': return 'Withdrawn from queue'
    default: return ''
  }
})

const canWithdraw = computed(() => {
  return ['queued', 'up_next'].includes(props.slot.status)
})

const isFormValid = computed(() => {
  return (
    formData.self_est_min &&
    formData.self_est_min > 0 &&
    formData.slot_password.length > 0
  )
})

function validateField(field: keyof ManageSlotFormData) {
  delete errors[field]

  switch (field) {
    case 'self_est_min': {
      if (formData.self_est_min !== undefined) {
        const result = validateEstimatedMinutes(formData.self_est_min)
        if (!result.valid) errors.self_est_min = result.message
      }
      break
    }
    case 'leave_by_at': {
      if (formData.leave_by_at && !validateTimeFormat(formData.leave_by_at)) {
        errors.leave_by_at = 'Invalid time format (use HH:MM)'
      }
      break
    }
    case 'slot_password': {
      if (!formData.slot_password) {
        errors.slot_password = 'Password is required to update'
      }
      break
    }
  }
}

function validateAll(): boolean {
  const fields: Array<keyof ManageSlotFormData> = [
    'self_est_min',
    'leave_by_at',
    'slot_password'
  ]
  fields.forEach(validateField)
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validateAll()) {
    return
  }

  emit('update', { ...formData })
}

function confirmWithdraw() {
  confirm.require({
    message: 'Are you sure you want to withdraw from the queue? This action cannot be undone.',
    header: 'Confirm Withdrawal',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Yes, Withdraw',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: () => {
      if (formData.slot_password) {
        emit('withdraw', formData.slot_password)
      } else {
        errors.slot_password = 'Password required to withdraw'
      }
    }
  })
}
</script>

<style scoped>
.manage-slot-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-section {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.section-description {
  color: var(--text-color-secondary);
  font-size: 0.95rem;
  margin: 0 0 1rem 0;
}

.form-field {
  margin-bottom: 1.25rem;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-field label.required::after {
  content: ' *';
  color: var(--red-500);
}

.help-text {
  display: block;
  margin-top: 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.status-text {
  color: var(--text-color-secondary);
  font-size: 0.95rem;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.update-button,
.withdraw-button {
  width: 100%;
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
  .form-section {
    padding: 1.25rem;
  }

  .section-title {
    font-size: 1.1rem;
  }
}
</style>