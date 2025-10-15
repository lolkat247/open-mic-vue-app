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
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid rgba(0, 206, 144, 0.3);
  border-radius: 16px;
  padding: 2rem;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(0, 206, 144, 0.15);
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
  background: linear-gradient(90deg, rgba(0, 206, 144, 1), rgba(0, 255, 163, 1));
  box-shadow: 0 0 12px rgba(0, 206, 144, 0.6);
}

.current-performer.status-setting_up::before {
  background: linear-gradient(90deg, rgba(251, 146, 60, 1), rgba(234, 88, 12, 1));
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(251, 146, 60, 0.6);
}

.current-performer.status-performing::before {
  background: linear-gradient(90deg, rgba(34, 197, 94, 1), rgba(22, 163, 74, 1));
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 206, 144, 0.8);
  color: rgba(255, 255, 255, 1);
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  box-shadow: 0 0 12px rgba(0, 206, 144, 0.4);
  border: 1px solid rgba(0, 206, 144, 1);
}

.status-badge i {
  font-size: 1rem;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
}

.performer-info {
  margin-bottom: 1.5rem;
}

.stage-name {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0, 206, 144, 0.3);
}

.act-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.1rem;
}

.act-type i {
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 4px rgba(0, 206, 144, 0.4));
}

.performance-time {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1.25rem 0;
  margin-bottom: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
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
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 4px rgba(0, 206, 144, 0.4));
}

.label,
.elapsed-label,
.est-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.value,
.elapsed-value,
.est-value {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
}

.elapsed-time {
  font-size: 1.1rem;
}

.elapsed-time.time-good .elapsed-value {
  color: rgba(34, 197, 94, 1);
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.elapsed-time.time-warning .elapsed-value {
  color: rgba(251, 146, 60, 1);
  text-shadow: 0 0 8px rgba(251, 146, 60, 0.5);
}

.elapsed-time.time-over .elapsed-value {
  color: rgba(239, 68, 68, 1);
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
  animation: pulse 2s ease-in-out infinite;
}

.performer-notes {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-left: 3px solid rgba(59, 130, 246, 1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.performer-notes i {
  color: rgba(96, 165, 250, 1);
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.4));
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.current-performer.empty {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 2px dashed rgba(0, 206, 144, 0.3);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.empty-icon {
  font-size: 3rem;
  color: rgba(0, 206, 144, 0.3);
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.2));
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: rgba(255, 255, 255, 0.9);
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    padding: 1rem 0;
  }

  .time-info {
    grid-column: 1 / -1;
  }

  .elapsed-time,
  .estimated-time {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .elapsed-time {
    font-size: 1rem;
  }
}
</style>