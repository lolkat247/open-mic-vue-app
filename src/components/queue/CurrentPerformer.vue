<template>
  <div v-if="slot" class="current-performer" :class="`status-${slot.status}`">
    <div class="status-badge">
      <i :class="statusIcon"></i>
      <span>{{ statusLabel }}</span>
    </div>

    <div class="performer-info">
      <h2 class="stage-name">{{ slot.stage_name }}</h2>
      <div class="act-type">
        <i class="pi pi-tag"></i>
        <span>{{ slot.act_type }}</span>
      </div>
    </div>

    <div class="performance-time">
      <div class="time-info">
        <i class="pi pi-clock"></i>
        <span class="label">Started:</span>
        <span class="value">{{ formatTime(slot.started_at || slot.setup_started_at || '') }}</span>
      </div>
      <div class="elapsed-time" :class="elapsedClass">
        <span class="elapsed-label">Elapsed:</span>
        <span class="elapsed-value">{{ elapsedTime }}</span>
      </div>
      <div v-if="slot.self_est_min" class="estimated-time">
        <span class="est-label">Estimated:</span>
        <span class="est-value">{{ slot.self_est_min }} min</span>
      </div>
    </div>

    <div v-if="slot.notes && showNotes" class="performer-notes">
      <i class="pi pi-info-circle"></i>
      <span>{{ slot.notes }}</span>
    </div>
  </div>

  <div v-else class="current-performer empty">
    <div class="empty-state">
      <i class="pi pi-clock empty-icon"></i>
      <h3>No one performing right now</h3>
      <p>The show will start soon!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Slot } from '../../types/api'
import { formatTime } from '../../utils/time'

interface Props {
  slot: Slot | null | undefined
  showNotes?: boolean
  variant?: 'default' | 'projector'
}

const props = withDefaults(defineProps<Props>(), {
  showNotes: false,
  variant: 'default'
})

const elapsedSeconds = ref(0)
let intervalId: number | null = null

const statusLabel = computed(() => {
  if (!props.slot) return ''
  switch (props.slot.status) {
    case 'setting_up':
      return 'Setting Up'
    case 'performing':
      return 'Now Performing'
    default:
      return props.slot.status
  }
})

const statusIcon = computed(() => {
  if (!props.slot) return ''
  switch (props.slot.status) {
    case 'setting_up':
      return 'pi pi-cog'
    case 'performing':
      return 'pi pi-play-circle'
    default:
      return 'pi pi-circle'
  }
})

const elapsedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60)
  const seconds = elapsedSeconds.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const elapsedClass = computed(() => {
  if (!props.slot?.self_est_min) return ''

  const estimatedSeconds = props.slot.self_est_min * 60
  const percentage = (elapsedSeconds.value / estimatedSeconds) * 100

  if (percentage < 80) return 'time-good'
  if (percentage < 100) return 'time-warning'
  return 'time-over'
})

function updateElapsedTime() {
  if (!props.slot) {
    elapsedSeconds.value = 0
    return
  }

  const startTime = props.slot.started_at || props.slot.setup_started_at
  if (!startTime) {
    elapsedSeconds.value = 0
    return
  }

  const start = new Date(startTime).getTime()
  const now = Date.now()
  elapsedSeconds.value = Math.floor((now - start) / 1000)
}

onMounted(() => {
  updateElapsedTime()
  intervalId = window.setInterval(updateElapsedTime, 1000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.current-performer {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.current-performer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--primary-color);
}

.current-performer.status-setting_up::before {
  background: linear-gradient(90deg, var(--orange-400), var(--orange-600));
  animation: pulse 2s ease-in-out infinite;
}

.current-performer.status-performing::before {
  background: linear-gradient(90deg, var(--green-400), var(--green-600));
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.status-badge i {
  font-size: 1rem;
}

.performer-info {
  margin-bottom: 1.5rem;
}

.stage-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.act-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 1.1rem;
}

.performance-time {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.time-info,
.elapsed-time,
.estimated-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.time-info i {
  color: var(--primary-color);
}

.label,
.elapsed-label,
.est-label {
  color: var(--text-color-secondary);
  font-weight: 500;
}

.value,
.elapsed-value,
.est-value {
  color: var(--text-color);
  font-weight: 600;
}

.elapsed-time {
  font-size: 1.1rem;
}

.elapsed-time.time-good .elapsed-value {
  color: var(--green-600);
}

.elapsed-time.time-warning .elapsed-value {
  color: var(--orange-600);
}

.elapsed-time.time-over .elapsed-value {
  color: var(--red-600);
  animation: pulse 2s ease-in-out infinite;
}

.performer-notes {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--blue-50);
  border-left: 3px solid var(--blue-500);
  border-radius: 4px;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.performer-notes i {
  color: var(--blue-500);
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.current-performer.empty {
  background: var(--surface-ground);
  border: 2px dashed var(--surface-border);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  color: var(--text-color-secondary);
}

.empty-icon {
  font-size: 3rem;
  color: var(--surface-400);
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@media (max-width: 768px) {
  .current-performer {
    padding: 1.5rem;
  }

  .stage-name {
    font-size: 1.75rem;
  }

  .performance-time {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>