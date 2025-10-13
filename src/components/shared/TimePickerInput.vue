<template>
  <div class="time-picker-input">
    <label v-if="label" :for="inputId" :class="{ 'required': required }">
      {{ label }}
    </label>

    <div class="time-input-container" :class="{ 'p-invalid': error }">
      <div class="time-inputs">
        <input
          :id="inputId"
          type="number"
          v-model.number="hour"
          @input="handleHourInput"
          @blur="handleBlur"
          min="1"
          max="12"
          placeholder="12"
          class="hour-input"
          aria-label="Hour"
        />
        <span class="time-separator">:</span>
        <input
          type="number"
          v-model.number="minute"
          @input="handleMinuteInput"
          @blur="handleBlur"
          min="0"
          max="59"
          placeholder="00"
          class="minute-input"
          aria-label="Minute"
        />
      </div>

      <div class="period-toggle">
        <button
          type="button"
          :class="['period-btn', { active: period === 'AM' }]"
          @click="setPeriod('AM')"
          aria-label="AM"
        >
          AM
        </button>
        <button
          type="button"
          :class="['period-btn', { active: period === 'PM' }]"
          @click="setPeriod('PM')"
          aria-label="PM"
        >
          PM
        </button>
      </div>

      <button
        v-if="hour !== null"
        type="button"
        class="clear-btn"
        @click="clearTime"
        aria-label="Clear time"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>

    <small v-if="error" class="p-error">{{ error }}</small>
    <small v-else-if="helpText" class="help-text">{{ helpText }}</small>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
  modelValue?: string // HH:MM format (24-hour)
  label?: string
  error?: string
  helpText?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const inputId = `time-picker-${Math.random().toString(36).substring(7)}`

// Internal state: 12-hour format
const hour = ref<number | null>(null)
const minute = ref<number | null>(null)
const period = ref<'AM' | 'PM'>('PM') // Default to PM

// Parse incoming 24-hour time to 12-hour format
function parseTime(timeStr: string) {
  if (!timeStr) {
    hour.value = null
    minute.value = null
    period.value = 'PM'
    return
  }

  const parts = timeStr.split(':')
  if (parts.length !== 2) return

  const hours24 = parseInt(parts[0], 10)
  const mins = parseInt(parts[1], 10)

  if (isNaN(hours24) || isNaN(mins)) return

  // Convert 24-hour to 12-hour
  if (hours24 === 0) {
    hour.value = 12
    period.value = 'AM'
  } else if (hours24 < 12) {
    hour.value = hours24
    period.value = 'AM'
  } else if (hours24 === 12) {
    hour.value = 12
    period.value = 'PM'
  } else {
    hour.value = hours24 - 12
    period.value = 'PM'
  }

  minute.value = mins
}

// Convert 12-hour format to 24-hour HH:MM
function emitTime() {
  if (hour.value === null || minute.value === null) {
    emit('update:modelValue', '')
    return
  }

  let hours24 = hour.value

  // Convert 12-hour to 24-hour
  if (period.value === 'AM') {
    if (hours24 === 12) hours24 = 0
  } else {
    if (hours24 !== 12) hours24 += 12
  }

  const hourStr = hours24.toString().padStart(2, '0')
  const minStr = minute.value.toString().padStart(2, '0')

  emit('update:modelValue', `${hourStr}:${minStr}`)
}

// Handle hour input validation
function handleHourInput() {
  if (hour.value === null) return

  if (hour.value < 1) hour.value = 1
  if (hour.value > 12) hour.value = 12

  emitTime()
}

// Handle minute input validation
function handleMinuteInput() {
  if (minute.value === null) {
    minute.value = 0
    return
  }

  if (minute.value < 0) minute.value = 0
  if (minute.value > 59) minute.value = 59

  emitTime()
}

function setPeriod(newPeriod: 'AM' | 'PM') {
  period.value = newPeriod
  emitTime()
}

function clearTime() {
  hour.value = null
  minute.value = null
  period.value = 'PM'
  emit('update:modelValue', '')
}

function handleBlur() {
  // Pad minute with leading zero if needed
  if (minute.value !== null && minute.value < 10) {
    minute.value = parseInt(minute.value.toString().padStart(2, '0'), 10)
  }
  emit('blur')
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  parseTime(newValue)
}, { immediate: true })
</script>

<style scoped>
.time-picker-input {
  width: 100%;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

label.required::after {
  content: ' *';
  color: #ef4444;
}

.time-input-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.time-input-container:focus-within {
  border-color: #00ce90;
  box-shadow: 0 0 0 0.2rem rgba(0, 206, 144, 0.25);
}

.time-input-container.p-invalid {
  border-color: #ef4444;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.hour-input,
.minute-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.5rem;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  width: 60px;
  transition: all 0.2s ease;
}

.hour-input:focus,
.minute-input:focus {
  outline: none;
  border-color: #00ce90;
  background: rgba(0, 206, 144, 0.1);
}

.hour-input::placeholder,
.minute-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* Remove number input arrows */
.hour-input::-webkit-inner-spin-button,
.hour-input::-webkit-outer-spin-button,
.minute-input::-webkit-inner-spin-button,
.minute-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.hour-input[type=number],
.minute-input[type=number] {
  -moz-appearance: textfield;
}

.time-separator {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
}

.period-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.period-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.period-btn:first-child {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.period-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.period-btn.active {
  background: rgba(0, 206, 144, 0.3);
  color: rgba(0, 206, 144, 1);
  font-weight: 700;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 50%;
  color: rgba(239, 68, 68, 1);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
  transform: scale(1.05);
}

.clear-btn i {
  font-size: 0.9rem;
}

.help-text {
  display: block;
  margin-top: 0.25rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.p-error {
  color: #ef4444;
  font-weight: 700;
  font-size: 0.9rem;
  display: block;
  margin-top: 0.5rem;
}

@media (max-width: 480px) {
  .time-input-container {
    padding: 0.65rem 0.85rem;
  }

  .hour-input,
  .minute-input {
    width: 50px;
    font-size: 1.1rem;
    padding: 0.4rem;
  }

  .period-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
