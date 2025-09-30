<template>
  <div class="performer-timer">
    <div class="timer-header">
      <div class="performer-info">
        <h3 class="stage-name">{{ slot.stage_name }}</h3>
        <Badge :value="statusLabel" :severity="statusSeverity" />
      </div>
      <div class="timer-display" :class="timerClass">
        <i class="pi pi-clock timer-icon"></i>
        <span class="timer-text">{{ elapsedDisplay }}</span>
      </div>
    </div>

    <div class="timer-progress">
      <ProgressBar
        :value="progressPercentage"
        :showValue="false"
        :class="progressClass"
      />
      <div class="progress-labels">
        <span class="progress-label">{{ formatDuration(0) }}</span>
        <span class="progress-label">{{ formatDuration(expectedDuration) }}</span>
      </div>
    </div>

    <div class="timer-details">
      <div class="detail-item">
        <span class="detail-label">Expected:</span>
        <span class="detail-value">{{ formatDuration(expectedDuration) }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Actual:</span>
        <span class="detail-value">{{ elapsedDisplay }}</span>
      </div>
      <div v-if="slot.extra_setup" class="detail-item">
        <i class="pi pi-wrench"></i>
        <span class="detail-value">Extra setup time</span>
      </div>
    </div>

    <div class="timer-actions">
      <Button
        v-if="!isPaused"
        label="Pause"
        icon="pi pi-pause"
        severity="warning"
        outlined
        @click="handlePause"
        size="small"
      />
      <Button
        v-else
        label="Resume"
        icon="pi pi-play"
        severity="success"
        @click="handleResume"
        size="small"
      />
      <Button
        label="Complete"
        icon="pi pi-check"
        severity="info"
        @click="$emit('complete', slot.slot_id)"
        size="small"
      />
    </div>

    <Message v-if="isPaused" severity="warn" :closable="false" class="pause-message">
      <i class="pi pi-pause-circle"></i>
      Timer paused
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Badge from 'primevue/badge'
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'
import Message from 'primevue/message'
import type { Slot } from '../../types/api'
import { formatDuration } from '../../utils/time'

interface Props {
  slot: Slot
}

const props = defineProps<Props>()

const emit = defineEmits<{
  complete: [slotId: string]
}>()

const isPaused = ref(false)
const elapsedSeconds = ref(0)
const pausedAt = ref<Date | null>(null)
let intervalId: number | null = null

const statusLabel = computed(() => {
  switch (props.slot.status) {
    case 'performing':
      return 'Performing'
    case 'completed':
      return 'Completed'
    default:
      return props.slot.status
  }
})

const statusSeverity = computed(() => {
  switch (props.slot.status) {
    case 'performing':
      return 'info'
    case 'completed':
      return 'success'
    default:
      return 'secondary'
  }
})

const expectedDuration = computed(() => {
  return props.slot.self_est_min || 5
})

const elapsedDisplay = computed(() => {
  return formatDuration(Math.floor(elapsedSeconds.value / 60))
})

const progressPercentage = computed(() => {
  const percentage = (elapsedSeconds.value / (expectedDuration.value * 60)) * 100
  return Math.min(percentage, 100)
})

const timerClass = computed(() => {
  const percentage = progressPercentage.value
  if (percentage < 80) return 'timer-normal'
  if (percentage < 100) return 'timer-warning'
  return 'timer-danger'
})

const progressClass = computed(() => {
  const percentage = progressPercentage.value
  if (percentage < 80) return 'progress-normal'
  if (percentage < 100) return 'progress-warning'
  return 'progress-danger'
})

function calculateElapsed() {
  if (isPaused.value || !props.slot.started_at) {
    return
  }

  const startTime = new Date(props.slot.started_at).getTime()
  const now = Date.now()
  const elapsed = Math.floor((now - startTime) / 1000)
  elapsedSeconds.value = Math.max(0, elapsed)
}

function handlePause() {
  isPaused.value = true
  pausedAt.value = new Date()
}

function handleResume() {
  isPaused.value = false
  pausedAt.value = null
}

onMounted(() => {
  // Calculate initial elapsed time
  calculateElapsed()

  // Update every second
  intervalId = window.setInterval(() => {
    calculateElapsed()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.performer-timer {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.performer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stage-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.timer-display.timer-normal {
  background: var(--green-50);
  color: var(--green-700);
}

.timer-display.timer-warning {
  background: var(--yellow-50);
  color: var(--yellow-700);
}

.timer-display.timer-danger {
  background: var(--red-50);
  color: var(--red-700);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.timer-icon {
  font-size: 1.5rem;
}

.timer-text {
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.timer-progress {
  margin-bottom: 1.5rem;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.progress-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  font-variant-numeric: tabular-nums;
}

:deep(.progress-normal .p-progressbar-value) {
  background: var(--green-500);
}

:deep(.progress-warning .p-progressbar-value) {
  background: var(--yellow-500);
}

:deep(.progress-danger .p-progressbar-value) {
  background: var(--red-500);
}

.timer-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.detail-value {
  font-size: 0.9rem;
  color: var(--text-color);
  font-weight: 600;
}

.detail-item i {
  color: var(--primary-color);
}

.timer-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.timer-actions button {
  flex: 1;
  min-width: 120px;
}

.pause-message {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .performer-timer {
    padding: 1.25rem;
  }

  .timer-header {
    flex-direction: column;
  }

  .stage-name {
    font-size: 1.25rem;
  }

  .timer-display {
    width: 100%;
    justify-content: center;
  }

  .timer-text {
    font-size: 1.75rem;
  }

  .timer-actions button {
    min-width: unset;
  }
}
</style>