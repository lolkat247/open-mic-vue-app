<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    :modal="true"
    :header="isEditMode ? 'Edit Event' : 'Create Event'"
    :style="{ width: '90vw', maxWidth: '700px' }"
    :closable="!isSubmitting"
  >
    <form @submit.prevent="handleSubmit" class="event-form">
      <!-- Basic Information Section -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="pi pi-info-circle"></i>
          Basic Information
        </h3>

        <div class="form-field">
          <label for="eventName" class="required">Event Name</label>
          <InputText
            id="eventName"
            v-model="formData.name"
            placeholder="e.g., Friday Night Open Mic"
            :class="{ 'p-invalid': errors.name }"
            @blur="validateField('name')"
            :maxlength="100"
            autofocus
            class="w-full"
          />
          <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          <small v-else class="help-text">{{ formData.name.length }}/100 characters</small>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="eventDate" class="required">Event Date</label>
            <DatePicker
              id="eventDate"
              v-model="dateValue"
              dateFormat="yy-mm-dd"
              placeholder="YYYY-MM-DD"
              :class="{ 'p-invalid': errors.date }"
              @blur="validateField('date')"
              :minDate="new Date()"
              showIcon
              class="w-full"
            />
            <small v-if="errors.date" class="p-error">{{ errors.date }}</small>
          </div>

          <div class="form-field">
            <label for="curfew" class="required">Curfew Time</label>
            <InputMask
              id="curfew"
              v-model="formData.curfew"
              mask="99:99"
              placeholder="HH:MM (e.g., 23:00)"
              :class="{ 'p-invalid': errors.curfew }"
              @blur="validateField('curfew')"
              class="w-full"
            />
            <small v-if="errors.curfew" class="p-error">{{ errors.curfew }}</small>
          </div>
        </div>

        <div class="form-field">
          <label for="houseRules">House Rules</label>
          <Textarea
            id="houseRules"
            v-model="formData.house_rules"
            rows="4"
            :maxlength="500"
            placeholder="Any rules or guidelines for performers..."
            class="w-full"
          />
          <small class="help-text">{{ formData.house_rules.length }}/500 characters</small>
        </div>
      </div>

      <!-- Performance Defaults Section -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="pi pi-clock"></i>
          Performance Defaults
        </h3>

        <div class="form-row">
          <div class="form-field">
            <label for="slotDuration">Default Slot Duration (minutes)</label>
            <InputNumber
              id="slotDuration"
              v-model="formData.slot_duration_minutes"
              :min="1"
              :max="60"
              :class="{ 'p-invalid': errors.slot_duration_minutes }"
              @blur="validateField('slot_duration_minutes')"
              showButtons
              class="w-full"
            />
            <small v-if="errors.slot_duration_minutes" class="p-error">{{ errors.slot_duration_minutes }}</small>
            <small v-else class="help-text">Default performance time per slot</small>
          </div>

          <div class="form-field">
            <label for="setupTime">Setup Time (minutes)</label>
            <InputNumber
              id="setupTime"
              v-model="formData.setup_time_minutes"
              :min="0"
              :max="30"
              :class="{ 'p-invalid': errors.setup_time_minutes }"
              @blur="validateField('setup_time_minutes')"
              showButtons
              class="w-full"
            />
            <small v-if="errors.setup_time_minutes" class="p-error">{{ errors.setup_time_minutes }}</small>
            <small v-else class="help-text">Time allowed for setup between acts</small>
          </div>
        </div>
      </div>

      <!-- Policies Section -->
      <div class="form-section">
        <h3 class="section-title">
          <i class="pi pi-shield"></i>
          Policies
        </h3>

        <div class="form-row">
          <div class="form-field">
            <label for="maxSlots">Max Slots Per Performer</label>
            <InputNumber
              id="maxSlots"
              v-model="formData.max_slots_per_performer"
              :min="0"
              :max="10"
              :class="{ 'p-invalid': errors.max_slots_per_performer }"
              @blur="validateField('max_slots_per_performer')"
              showButtons
              class="w-full"
            />
            <small v-if="errors.max_slots_per_performer" class="p-error">{{ errors.max_slots_per_performer }}</small>
            <small v-else class="help-text">0 = unlimited</small>
          </div>

          <div class="form-field">
            <label for="signupDeadline">Signup Deadline (hours before)</label>
            <InputNumber
              id="signupDeadline"
              v-model="formData.signup_deadline_hours"
              :min="0"
              :max="72"
              :class="{ 'p-invalid': errors.signup_deadline_hours }"
              @blur="validateField('signup_deadline_hours')"
              showButtons
              class="w-full"
            />
            <small v-if="errors.signup_deadline_hours" class="p-error">{{ errors.signup_deadline_hours }}</small>
            <small v-else class="help-text">0 = no deadline</small>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        text
        @click="handleClose"
        :disabled="isSubmitting"
      />
      <Button
        :label="isEditMode ? 'Update Event' : 'Create Event'"
        :icon="isEditMode ? 'pi pi-check' : 'pi pi-plus'"
        @click="handleSubmit"
        :loading="isSubmitting"
        :disabled="!isFormValid || isSubmitting"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import InputMask from 'primevue/inputmask'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import { validateEventName, validateEventDate, validateTimeFormat } from '../../utils/validation'
import type { Event } from '../../types/api'
import type { EventFormData } from '../../types/views'

interface Props {
  visible: boolean
  event?: Event | null
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  isSubmitting: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: EventFormData]
}>()

const isEditMode = computed(() => !!props.event)

const formData = reactive<EventFormData>({
  name: '',
  date: '',
  curfew: '',
  slot_duration_minutes: 5,
  setup_time_minutes: 2,
  max_slots_per_performer: 1,
  signup_deadline_hours: 2,
  house_rules: ''
})

// Separate ref for DatePicker (expects Date object)
const dateValue = ref<Date | null>(null)

// Sync dateValue with formData.date
watch(dateValue, (newDate) => {
  if (newDate) {
    // Convert Date to YYYY-MM-DD string
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    formData.date = `${year}-${month}-${day}`
  } else {
    formData.date = ''
  }
})

const errors = reactive<Partial<Record<keyof EventFormData, string>>>({})

const isFormValid = computed(() => {
  return (
    formData.name.trim().length > 0 &&
    formData.date.length > 0 &&
    formData.curfew.length > 0 &&
    validateTimeFormat(formData.curfew) &&
    formData.slot_duration_minutes > 0 &&
    formData.setup_time_minutes >= 0 &&
    formData.max_slots_per_performer >= 0 &&
    formData.signup_deadline_hours >= 0
  )
})

// Watch for event prop changes to populate form
watch(() => props.event, (newEvent) => {
  if (newEvent) {
    formData.name = newEvent.name
    formData.date = newEvent.date
    // Convert string date to Date object for DatePicker (local timezone)
    if (newEvent.date) {
      const [year, month, day] = newEvent.date.split('-').map(Number)
      dateValue.value = new Date(year, month - 1, day)
    } else {
      dateValue.value = null
    }
    formData.curfew = newEvent.curfew
    formData.slot_duration_minutes = newEvent.defaults?.slot_duration_minutes || 5
    formData.setup_time_minutes = newEvent.defaults?.setup_time_minutes || 2
    formData.max_slots_per_performer = newEvent.policies?.max_slots_per_performer || 1
    formData.signup_deadline_hours = newEvent.policies?.signup_deadline_hours || 2
    formData.house_rules = newEvent.house_rules || ''
  }
}, { immediate: true })

// Watch for dialog close to reset form
watch(() => props.visible, (newVisible) => {
  if (!newVisible && !props.event) {
    resetForm()
  }
})

function validateField(field: keyof EventFormData) {
  delete errors[field]

  switch (field) {
    case 'name': {
      const result = validateEventName(formData.name)
      if (!result.valid) errors.name = result.message
      break
    }
    case 'date': {
      const result = validateEventDate(formData.date)
      if (!result.valid) errors.date = result.message
      break
    }
    case 'curfew': {
      if (!formData.curfew) {
        errors.curfew = 'Curfew time is required'
      } else if (!validateTimeFormat(formData.curfew)) {
        errors.curfew = 'Invalid time format (use HH:MM)'
      }
      break
    }
    case 'slot_duration_minutes': {
      if (formData.slot_duration_minutes <= 0) {
        errors.slot_duration_minutes = 'Must be greater than 0'
      } else if (formData.slot_duration_minutes > 60) {
        errors.slot_duration_minutes = 'Cannot exceed 60 minutes'
      }
      break
    }
    case 'setup_time_minutes': {
      if (formData.setup_time_minutes < 0) {
        errors.setup_time_minutes = 'Cannot be negative'
      } else if (formData.setup_time_minutes > 30) {
        errors.setup_time_minutes = 'Cannot exceed 30 minutes'
      }
      break
    }
    case 'max_slots_per_performer': {
      if (formData.max_slots_per_performer < 0) {
        errors.max_slots_per_performer = 'Cannot be negative'
      }
      break
    }
    case 'signup_deadline_hours': {
      if (formData.signup_deadline_hours < 0) {
        errors.signup_deadline_hours = 'Cannot be negative'
      }
      break
    }
  }
}

function validateAll(): boolean {
  const fields: Array<keyof EventFormData> = [
    'name',
    'date',
    'curfew',
    'slot_duration_minutes',
    'setup_time_minutes',
    'max_slots_per_performer',
    'signup_deadline_hours'
  ]
  fields.forEach(validateField)
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validateAll()) {
    return
  }

  emit('submit', { ...formData })
}

function handleClose() {
  if (!props.isSubmitting) {
    emit('update:visible', false)
  }
}

function resetForm() {
  formData.name = ''
  formData.date = ''
  dateValue.value = null
  formData.curfew = ''
  formData.slot_duration_minutes = 5
  formData.setup_time_minutes = 2
  formData.max_slots_per_performer = 1
  formData.signup_deadline_hours = 2
  formData.house_rules = ''
  Object.keys(errors).forEach(key => delete errors[key as keyof typeof errors])
}
</script>

<style scoped>
.event-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem 0;
}

.form-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow:
    0 4px 16px rgba(0, 206, 144, 0.15),
    0 2px 8px rgba(0, 206, 144, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1rem 0;
}

.section-title i {
  color: #00ce90;
  font-size: 1.25rem;
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.4));
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
  color: rgba(255, 255, 255, 0.9);
}

.form-field label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.help-text {
  display: block;
  margin-top: 0.25rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

/* Validation error styling - red and prominent */
.p-error {
  color: #ef4444 !important;
  font-weight: 700;
  font-size: 0.9rem;
  display: block;
  margin-top: 0.5rem;
}

.w-full {
  width: 100%;
}

/* Input field dark mode styling */
:deep(.p-inputtext),
:deep(.p-inputnumber-input),
:deep(.p-textarea),
:deep(.p-datepicker-input) {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

:deep(.p-inputtext:focus),
:deep(.p-inputnumber-input:focus),
:deep(.p-textarea:focus),
:deep(.p-datepicker-input:focus) {
  border-color: #00ce90 !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 206, 144, 0.25) !important;
}

:deep(.p-inputtext::placeholder),
:deep(.p-inputnumber-input::placeholder),
:deep(.p-textarea::placeholder) {
  color: rgba(255, 255, 255, 0.4) !important;
}

:deep(.p-datepicker) {
  width: 100%;
}

:deep(.p-inputnumber) {
  width: 100%;
}

:deep(.p-inputnumber input) {
  width: 100%;
}

/* DatePicker panel dark mode */
:deep(.p-datepicker-panel) {
  background: rgba(30, 30, 30, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-datepicker-header) {
  background: rgba(0, 206, 144, 0.1) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-datepicker-title) {
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-datepicker-day) {
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-datepicker-day:hover) {
  background: rgba(0, 206, 144, 0.2) !important;
}

:deep(.p-datepicker-day.p-datepicker-day-selected) {
  background: #00ce90 !important;
  color: #1e1e1e !important;
}

:deep(.p-datepicker-weekday) {
  color: rgba(255, 255, 255, 0.7) !important;
}

:deep(.p-datepicker-prev-button),
:deep(.p-datepicker-next-button) {
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-datepicker-prev-button:hover),
:deep(.p-datepicker-next-button:hover) {
  background: rgba(0, 206, 144, 0.2) !important;
}

/* Dialog dark mode */
:deep(.p-dialog) {
  background: rgba(30, 30, 30, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-dialog-header) {
  background: rgba(0, 206, 144, 0.05) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

:deep(.p-dialog-title) {
  color: rgba(255, 255, 255, 0.95) !important;
}

:deep(.p-dialog-content) {
  background: rgba(30, 30, 30, 0.98) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-dialog-footer) {
  background: rgba(0, 206, 144, 0.05) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}

@media (max-width: 768px) {
  .form-section {
    padding: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 1rem;
  }
}
</style>