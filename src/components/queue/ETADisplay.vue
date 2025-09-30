<template>
  <div class="eta-display" :class="urgencyClass">
    <div class="eta-main">
      <i :class="urgencyIcon" class="eta-icon"></i>
      <div class="eta-content">
        <span class="eta-label">{{ label }}</span>
        <span class="eta-value">{{ displayTime }}</span>
      </div>
    </div>
    <div v-if="showEstimatedTime && estimatedStartTime" class="eta-time">
      <i class="pi pi-calendar-clock"></i>
      <span>{{ estimatedStartTime }}</span>
    </div>
    <div v-if="leaveByWarning" class="leave-by-warning">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ leaveByWarning }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatTime, formatDuration } from '../../utils/time'
import type { ETAUpdate } from '../../types/api'

interface Props {
  eta?: ETAUpdate | null
  waitMinutes?: number
  leaveBy?: string
  showEstimatedTime?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  showEstimatedTime: true,
  label: 'Estimated wait'
})

const displayTime = computed(() => {
  // If ETA update is provided
  if (props.eta) {
    return formatDuration(props.eta.estimated_wait_minutes)
  }

  // If wait minutes is provided
  if (props.waitMinutes !== undefined) {
    return formatDuration(props.waitMinutes)
  }

  return 'Calculating...'
})

const estimatedStartTime = computed(() => {
  if (!props.eta?.estimated_start_time) return null
  return formatTime(props.eta.estimated_start_time)
})

const urgencyClass = computed(() => {
  const minutes = props.eta?.estimated_wait_minutes ?? props.waitMinutes ?? 0

  if (minutes <= 10) return 'urgency-high'
  if (minutes <= 30) return 'urgency-medium'
  return 'urgency-low'
})

const urgencyIcon = computed(() => {
  const urgency = urgencyClass.value

  if (urgency === 'urgency-high') return 'pi pi-clock'
  if (urgency === 'urgency-medium') return 'pi pi-clock'
  return 'pi pi-clock'
})

const leaveByWarning = computed(() => {
  if (!props.leaveBy || !props.eta?.estimated_start_time) return null

  const estimatedStart = new Date(props.eta.estimated_start_time)
  const leaveByTime = new Date(props.eta.estimated_start_time)

  // Parse leave_by time (HH:MM)
  const parts = props.leaveBy.split(':').map(Number)
  const hours = parts[0] || 0
  const minutes = parts[1] || 0
  leaveByTime.setHours(hours, minutes, 0, 0)

  // If estimated start is after leave-by time, show warning
  if (estimatedStart > leaveByTime) {
    const diffMinutes = Math.floor((estimatedStart.getTime() - leaveByTime.getTime()) / 1000 / 60)
    return `You may perform ${diffMinutes} min after your leave-by time`
  }

  // If estimated start is close to leave-by time (within 15 minutes), show heads up
  const diffMinutes = Math.floor((leaveByTime.getTime() - estimatedStart.getTime()) / 1000 / 60)
  if (diffMinutes <= 15 && diffMinutes > 0) {
    return `Close to your leave-by time (${props.leaveBy})`
  }

  return null
})
</script>

<style scoped>
.eta-display {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.eta-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.eta-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.eta-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.eta-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.eta-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.eta-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.eta-time i {
  font-size: 0.9rem;
}

.leave-by-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--orange-50);
  border-left: 3px solid var(--orange-500);
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--orange-800);
}

.leave-by-warning i {
  font-size: 1rem;
  color: var(--orange-600);
  flex-shrink: 0;
}

/* Urgency styles */
.urgency-high {
  color: var(--red-700);
}

.urgency-high .eta-icon {
  color: var(--red-600);
  animation: pulse 2s ease-in-out infinite;
}

.urgency-high .eta-value {
  color: var(--red-700);
}

.urgency-medium {
  color: var(--orange-700);
}

.urgency-medium .eta-icon {
  color: var(--orange-600);
}

.urgency-medium .eta-value {
  color: var(--orange-700);
}

.urgency-low {
  color: var(--green-700);
}

.urgency-low .eta-icon {
  color: var(--green-600);
}

.urgency-low .eta-value {
  color: var(--green-700);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

@media (max-width: 768px) {
  .eta-main {
    gap: 0.5rem;
  }

  .eta-icon {
    font-size: 1.25rem;
  }

  .eta-value {
    font-size: 1rem;
  }
}
</style>