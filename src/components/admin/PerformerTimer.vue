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
      <div class="custom-progress-bar" :class="progressClass">
        <div class="custom-progress-value" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <div class="progress-labels">
        <span class="progress-label">{{ formatDuration(0) }}</span>
        <span class="progress-label">{{ progressPercentage.toFixed(1) }}%</span>
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
        label="Finish Performance"
        icon="pi pi-check"
        severity="info"
        @click="$emit('complete', slot.slot_id)"
        v-tooltip.top="'Mark performer as done and move to next'"
        size="small"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import type { Slot } from '../../types/api'
import { formatDuration } from '../../utils/time'

interface Props {
  slot: Slot
}

const props = defineProps<Props>()

const emit = defineEmits<{
  complete: [slotId: string]
}>()

const elapsedSeconds = ref(0)
let intervalId: number | null = null

const statusLabel = computed(() => {
  switch (props.slot.status) {
    case 'setting_up':
      return 'Setting Up'
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
    case 'setting_up':
      return 'warning'
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
  const capped = Math.min(percentage, 100)
  console.log('[PerformerTimer] Progress:', capped.toFixed(1) + '%', 'Elapsed:', elapsedSeconds.value, 'Expected:', expectedDuration.value * 60)
  return capped
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
  const timestamp = props.slot.started_at || props.slot.setup_started_at

  if (!timestamp) {
    elapsedSeconds.value = 0
    return
  }

  const startTime = new Date(timestamp).getTime()
  const now = Date.now()
  const elapsed = Math.floor((now - startTime) / 1000)
  elapsedSeconds.value = Math.max(0, elapsed)

  console.log('[PerformerTimer] Elapsed:', elapsed, 'seconds, Timestamp:', timestamp)
}

// Watch for slot changes to recalculate
watch(() => props.slot, () => {
  calculateElapsed()
}, { deep: true })

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

.custom-progress-bar {
  height: 1.5rem;
  background: var(--surface-100);
  border-radius: 10px;
  border: 1px solid var(--surface-300);
  overflow: hidden;
  position: relative;
  width: 100%;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.custom-progress-value {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
}

.custom-progress-value::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0) 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
  border-radius: 8px;
}

.progress-normal .custom-progress-value {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
}

.progress-warning .custom-progress-value {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
}

.progress-danger .custom-progress-value {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.9);
  }
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