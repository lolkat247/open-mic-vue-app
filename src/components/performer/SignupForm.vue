<template>
  <form @submit.prevent="handleSubmit" class="signup-form">
    <div class="form-section">
      <h3 class="section-title">Performer Information</h3>

      <!-- Stage Name -->
      <div class="form-field">
        <label for="stageName" class="required">Stage Name</label>
        <InputText
          id="stageName"
          v-model="formData.stage_name"
          placeholder="Your stage name"
          :class="{ 'p-invalid': errors.stage_name }"
          @blur="validateField('stage_name')"
          autofocus
        />
        <small v-if="errors.stage_name" class="p-error">{{ errors.stage_name }}</small>
      </div>

      <!-- Act Type -->
      <div class="form-field">
        <label for="actType" class="required">Act Type</label>
        <Select
          id="actType"
          v-model="formData.act_type"
          :options="actTypes"
          placeholder="Select your act type"
          :class="{ 'p-invalid': errors.act_type }"
          @change="validateField('act_type')"
          class="w-full"
        />
        <small v-if="errors.act_type" class="p-error">{{ errors.act_type }}</small>
      </div>

      <!-- YouTube Link (Karaoke only) -->
      <div v-if="formData.act_type === 'Karaoke'" class="form-field karaoke-field">
        <label for="youtubeLink">YouTube Link</label>
        <InputText
          id="youtubeLink"
          v-model="formData.youtube_link"
          placeholder="https://www.youtube.com/watch?v=..."
          :class="{ 'p-invalid': errors.youtube_link }"
          @blur="validateField('youtube_link')"
        />
        <small v-if="errors.youtube_link" class="p-error">{{ errors.youtube_link }}</small>
        <small v-else class="help-text">Provide the YouTube link for your karaoke track so we can pull it up for you</small>
      </div>

      <!-- Estimated Time -->
      <div class="form-field">
        <label for="estimatedTime" class="required">Estimated Performance Time (minutes)</label>
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
        <small v-else class="help-text">How long do you think you'll perform?</small>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">Security</h3>
      <p class="section-description">Create a password to manage your slot later</p>

      <!-- Password -->
      <div class="form-field">
        <label for="password" class="required">Password</label>
        <Password
          id="password"
          v-model="formData.slot_password"
          :class="{ 'p-invalid': errors.slot_password }"
          @blur="validateField('slot_password')"
          toggleMask
          :feedback="true"
          class="w-full"
        >
          <template #header>
            <h6>Pick a password</h6>
          </template>
          <template #footer>
            <p class="mt-2 text-sm">Suggestions:</p>
            <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
              <li>At least 8 characters</li>
              <li>At least one lowercase</li>
              <li>At least one uppercase</li>
              <li>At least one numeric</li>
            </ul>
          </template>
        </Password>
        <small v-if="errors.slot_password" class="p-error">{{ errors.slot_password }}</small>
      </div>

      <!-- Confirm Password -->
      <div class="form-field">
        <label for="confirmPassword" class="required">Confirm Password</label>
        <Password
          id="confirmPassword"
          v-model="formData.confirm_password"
          :class="{ 'p-invalid': errors.confirm_password }"
          @blur="validateField('confirm_password')"
          :feedback="false"
          toggleMask
          class="w-full"
        />
        <small v-if="errors.confirm_password" class="p-error">{{ errors.confirm_password }}</small>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">Optional Information</h3>

      <!-- Leave By Time -->
      <div class="form-field">
        <TimePickerInput
          v-model="formData.leave_by_at"
          label="Need to Leave By (Time)"
          :error="errors.leave_by_at"
          help-text="If you need to leave by a certain time"
          @blur="validateField('leave_by_at')"
        />
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
          <small class="help-text">Check if you need additional time to set up equipment</small>
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

    <!-- Submit Button -->
    <div class="form-actions">
      <Button
        type="submit"
        label="Sign Up to Perform"
        icon="pi pi-check"
        size="large"
        :loading="isSubmitting"
        :disabled="!isFormValid || isSubmitting"
        class="w-full"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import TimePickerInput from '../shared/TimePickerInput.vue'
import {
  validateStageName,
  validateActType,
  validateEstimatedMinutes,
  validatePassword,
  validateTimeFormat
} from '../../utils/validation'
import type { SignupFormData } from '../../types/views'

interface Props {
  defaultDuration?: number
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultDuration: 5,
  isSubmitting: false
})

const emit = defineEmits<{
  submit: [data: SignupFormData]
}>()

const actTypes = [
  'Jazz',
  'Karaoke',
  'Dance',
  'Comedy',
  'Slam Poetry',
  'Live Music',
  'Carlos',
  'Trolling'
]

const formData = reactive<SignupFormData & { youtube_link?: string }>({
  stage_name: '',
  act_type: '',
  self_est_min: props.defaultDuration,
  slot_password: '',
  confirm_password: '',
  leave_by_at: '',
  extra_setup: false,
  notes: '',
  youtube_link: ''
})

const errors = reactive<Partial<Record<keyof SignupFormData | 'youtube_link', string>>>({})

function validateField(field: keyof SignupFormData | 'youtube_link') {
  delete errors[field]

  switch (field) {
    case 'stage_name': {
      const result = validateStageName(formData.stage_name)
      if (!result.valid) errors.stage_name = result.message
      break
    }
    case 'act_type': {
      const result = validateActType(formData.act_type)
      if (!result.valid) errors.act_type = result.message
      break
    }
    case 'self_est_min': {
      const result = validateEstimatedMinutes(formData.self_est_min)
      if (!result.valid) errors.self_est_min = result.message
      break
    }
    case 'slot_password': {
      const result = validatePassword(formData.slot_password)
      if (!result.valid) errors.slot_password = result.message
      break
    }
    case 'confirm_password': {
      if (formData.confirm_password !== formData.slot_password) {
        errors.confirm_password = 'Passwords do not match'
      }
      break
    }
    case 'leave_by_at': {
      if (formData.leave_by_at && !validateTimeFormat(formData.leave_by_at)) {
        errors.leave_by_at = 'Invalid time format (use HH:MM)'
      }
      break
    }
    case 'youtube_link': {
      if (formData.youtube_link && formData.youtube_link.trim()) {
        try {
          const url = new URL(formData.youtube_link.trim())
          if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
            errors.youtube_link = 'Please provide a valid YouTube URL'
          }
        } catch {
          errors.youtube_link = 'Please provide a valid URL'
        }
      }
      break
    }
  }
}

function validateAll(): boolean {
  const requiredFields: Array<keyof SignupFormData> = [
    'stage_name',
    'act_type',
    'self_est_min',
    'slot_password',
    'confirm_password'
  ]

  requiredFields.forEach(validateField)

  return Object.keys(errors).length === 0
}

const isFormValid = computed(() => {
  return (
    formData.stage_name.trim().length > 0 &&
    formData.act_type.trim().length > 0 &&
    formData.self_est_min > 0 &&
    formData.slot_password.length >= 8 &&
    formData.confirm_password === formData.slot_password
  )
})

function handleSubmit() {
  console.log('SignupForm handleSubmit called')
  console.log('Form data:', formData)
  console.log('Validating...')

  // Validate youtube_link if provided
  if (formData.youtube_link && formData.youtube_link.trim()) {
    validateField('youtube_link')
  }

  if (!validateAll()) {
    console.error('Validation failed! Errors:', errors)
    return
  }

  console.log('Validation passed, emitting submit event')

  // Prepare submission data
  const submitData = { ...formData }

  // If Karaoke and YouTube link provided, append it to notes
  if (formData.act_type === 'Karaoke' && formData.youtube_link && formData.youtube_link.trim()) {
    const youtubeNote = `YouTube: ${formData.youtube_link.trim()}`
    submitData.notes = submitData.notes
      ? `${youtubeNote}\n\n${submitData.notes}`
      : youtubeNote
  }

  // Remove youtube_link from submission data (frontend-only field)
  delete submitData.youtube_link

  emit('submit', submitData)
}
</script>

<style scoped>
.signup-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow:
    0 4px 16px rgba(0, 206, 144, 0.15),
    0 2px 8px rgba(0, 206, 144, 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
}

.section-description {
  color: rgba(255, 255, 255, 0.7);
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
  color: rgba(255, 255, 255, 0.9);
}

.form-field label.required::after {
  content: ' *';
  color: #ef4444;
}

.help-text {
  display: block;
  margin-top: 0.25rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.checkbox-field {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  cursor: pointer;
}

.checkbox-label .help-text {
  font-weight: 400;
}

.form-actions {
  margin-top: 2rem;
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
:deep(.p-inputnumber-input),
:deep(.p-password input),
:deep(.p-select),
:deep(.p-textarea) {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

:deep(.p-inputtext:focus),
:deep(.p-inputnumber-input:focus),
:deep(.p-password input:focus),
:deep(.p-select:focus),
:deep(.p-textarea:focus) {
  border-color: #00ce90 !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 206, 144, 0.25) !important;
}

:deep(.p-inputtext::placeholder),
:deep(.p-inputnumber-input::placeholder),
:deep(.p-password input::placeholder),
:deep(.p-textarea::placeholder) {
  color: rgba(255, 255, 255, 0.4) !important;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input) {
  width: 100%;
}

/* Select dropdown dark mode */
:deep(.p-select-overlay) {
  background: rgba(30, 30, 30, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-select-option) {
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.p-select-option:hover) {
  background: rgba(0, 206, 144, 0.2) !important;
}

/* Password strength meter */
:deep(.p-password-meter) {
  background: rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-password-strength-weak) {
  background: #ef4444 !important;
}

:deep(.p-password-strength-medium) {
  background: #f59e0b !important;
}

:deep(.p-password-strength-strong) {
  background: #00ce90 !important;
}

/* Password panel dark mode */
:deep(.p-password-overlay) {
  background: rgba(30, 30, 30, 0.98) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Karaoke YouTube link field highlight */
.karaoke-field {
  background: rgba(255, 140, 0, 0.08);
  border-left: 3px solid rgba(255, 140, 0, 0.7);
  padding: 1rem;
  border-radius: 8px;
  margin-left: -0.5rem;
  padding-left: 1.5rem;
}

.karaoke-field .help-text {
  color: rgba(255, 165, 80, 0.95);
  font-weight: 500;
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