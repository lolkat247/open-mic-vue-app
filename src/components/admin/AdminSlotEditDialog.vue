<template>
  <Dialog
    :visible="visible"
    modal
    header="Edit Slot Details"
    :style="{ width: '90vw', maxWidth: '700px' }"
    @update:visible="$emit('close')"
  >
    <div class="edit-dialog-content">
      <!-- Read-only Info -->
      <div class="info-section">
        <div class="info-grid">
          <div class="info-item">
            <label>Signed Up</label>
            <div class="info-value">{{ formatTime(slot.created_at) }}</div>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Editable Fields -->
      <form @submit.prevent="handleSubmit" class="edit-form">
        <div class="form-field">
          <label for="stageName">Stage Name *</label>
          <InputText
            id="stageName"
            v-model="formData.stage_name"
            :class="{ 'p-invalid': errors.stage_name }"
            @blur="validateField('stage_name')"
            :maxlength="100"
            class="w-full"
          />
          <small v-if="errors.stage_name" class="p-error">{{ errors.stage_name }}</small>
        </div>

        <div class="form-field">
          <label for="actType">Act Type *</label>
          <Select
            id="actType"
            v-model="formData.act_type"
            :options="actTypes"
            placeholder="Select act type"
            :class="{ 'p-invalid': errors.act_type }"
            @change="validateField('act_type')"
            class="w-full"
          />
          <small v-if="errors.act_type" class="p-error">{{ errors.act_type }}</small>
        </div>

        <div class="form-field">
          <label for="status">Status *</label>
          <Select
            id="status"
            v-model="formData.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select status"
            :class="{ 'p-invalid': errors.status }"
            @change="validateField('status')"
            class="w-full"
          />
          <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
        </div>
        <div class="form-field">
          <label for="estimatedTime">Estimated Performance Time (minutes) *</label>
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

        <div class="form-field">
          <TimePickerInput
            v-model="formData.leave_by_at"
            label="Need to Leave By (Time)"
            :error="errors.leave_by_at"
            help-text="Leave blank if not applicable"
            @blur="validateField('leave_by_at')"
          />
        </div>

        <div class="form-field checkbox-field">
          <Checkbox
            id="extraSetup"
            v-model="formData.extra_setup"
            :binary="true"
          />
          <label for="extraSetup" class="checkbox-label">
            Needs extra setup time
          </label>
        </div>

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
      </form>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        text
        @click="$emit('close')"
      />
      <Button
        label="Save Changes"
        icon="pi pi-check"
        :loading="isUpdating"
        :disabled="!isFormValid || isUpdating"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Divider from 'primevue/divider'
import TimePickerInput from '../shared/TimePickerInput.vue'
import { validateEstimatedMinutes, validateTimeFormat } from '../../utils/validation'
import { formatTime } from '../../utils/time'
import { ACT_TYPES } from '../../utils/constants'
import type { Slot } from '../../types/api'

interface Props {
  slot: Slot
  visible: boolean
  isUpdating?: boolean
}

interface AdminUpdateSlotData {
  stage_name?: string
  act_type?: string
  status?: 'queued' | 'up_next' | 'setting_up' | 'performing' | 'completed' | 'no_show' | 'withdrawn'
  self_est_min?: number
  leave_by_at?: string
  extra_setup?: boolean
  notes?: string
}

const props = withDefaults(defineProps<Props>(), {
  isUpdating: false
})

const emit = defineEmits<{
  update: [data: AdminUpdateSlotData]
  close: []
}>()

const formData = reactive<AdminUpdateSlotData>({
  stage_name: props.slot.stage_name,
  act_type: props.slot.act_type,
  status: props.slot.status,
  self_est_min: props.slot.self_est_min,
  leave_by_at: props.slot.leave_by_at || '',
  extra_setup: props.slot.extra_setup,
  notes: props.slot.notes || ''
})

const errors = reactive<Partial<Record<keyof AdminUpdateSlotData, string>>>({})

const actTypes = ACT_TYPES

const statusOptions = [
  { label: 'Queued', value: 'queued' },
  { label: 'Up Next', value: 'up_next' },
  { label: 'Setting Up', value: 'setting_up' },
  { label: 'Performing', value: 'performing' },
  { label: 'Completed', value: 'completed' },
  { label: 'No Show', value: 'no_show' },
  { label: 'Withdrawn', value: 'withdrawn' }
]

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

const isFormValid = computed(() => {
  return (
    formData.stage_name !== undefined &&
    formData.stage_name.trim().length > 0 &&
    formData.act_type !== undefined &&
    formData.act_type.length > 0 &&
    formData.status !== undefined &&
    formData.self_est_min !== undefined &&
    formData.self_est_min > 0 &&
    Object.keys(errors).length === 0
  )
})

function validateField(field: keyof AdminUpdateSlotData) {
  delete errors[field]

  switch (field) {
    case 'stage_name': {
      if (!formData.stage_name || formData.stage_name.trim().length === 0) {
        errors.stage_name = 'Stage name is required'
      } else if (formData.stage_name.length > 100) {
        errors.stage_name = 'Stage name cannot exceed 100 characters'
      }
      break
    }
    case 'act_type': {
      if (!formData.act_type || formData.act_type.length === 0) {
        errors.act_type = 'Act type is required'
      }
      break
    }
    case 'status': {
      if (!formData.status) {
        errors.status = 'Status is required'
      }
      break
    }
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
  }
}

function validateAll(): boolean {
  const fields: Array<keyof AdminUpdateSlotData> = ['stage_name', 'act_type', 'status', 'self_est_min', 'leave_by_at']
  fields.forEach(validateField)
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validateAll()) {
    return
  }

  emit('update', { ...formData })
}
</script>

<style scoped>
.edit-dialog-content {
  padding: 0.5rem 0;
  background: transparent !important;
}

.info-section {
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: transparent;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.help-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.w-full {
  width: 100%;
}

/* Validation error styling */
:deep(.p-error) {
  color: #ef4444 !important;
  font-weight: 700;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

/* Input field dark mode styling */
:deep(.p-inputtext),
:deep(.p-inputnumber-input),
:deep(.p-textarea),
:deep(.p-select),
:deep(.p-select-label) {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

:deep(.p-inputtext:focus),
:deep(.p-inputnumber-input:focus),
:deep(.p-textarea:focus),
:deep(.p-select:focus) {
  border-color: #00ce90 !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 206, 144, 0.25) !important;
}

:deep(.p-inputtext::placeholder),
:deep(.p-inputnumber-input::placeholder),
:deep(.p-textarea::placeholder) {
  color: rgba(255, 255, 255, 0.4) !important;
}

/* InputNumber buttons dark mode */
:deep(.p-inputnumber-button) {
  background: rgba(0, 0, 0, 0.6) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-inputnumber-button:hover) {
  background: rgba(0, 206, 144, 0.2) !important;
  border-color: rgba(0, 206, 144, 0.5) !important;
  color: rgba(255, 255, 255, 1) !important;
}

/* Checkbox dark mode */
:deep(.p-checkbox) {
  background: rgba(0, 0, 0, 0.6) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-checkbox:hover) {
  border-color: rgba(0, 206, 144, 0.5) !important;
}

:deep(.p-checkbox.p-checkbox-checked) {
  background: rgba(0, 206, 144, 0.8) !important;
  border-color: rgba(0, 206, 144, 1) !important;
}

:deep(.p-checkbox .p-checkbox-box) {
  background: rgba(0, 0, 0, 0.6) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-checkbox .p-checkbox-box:hover) {
  border-color: rgba(0, 206, 144, 0.5) !important;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background: rgba(0, 206, 144, 0.8) !important;
  border-color: rgba(0, 206, 144, 1) !important;
}

/* Divider dark mode */
:deep(.p-divider) {
  border-color: rgba(255, 255, 255, 0.1) !important;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
