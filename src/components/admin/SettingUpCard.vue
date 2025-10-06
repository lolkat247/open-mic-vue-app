<template>
  <div v-if="slot" class="setting-up-card">
    <div class="card-header">
      <div class="header-badge">
        <i class="pi pi-microphone"></i>
        <span>Setting Up on Stage</span>
      </div>
      <div v-if="slot.setup_started_at" class="setup-timer">
        <i class="pi pi-clock"></i>
        {{ elapsedTime }}
      </div>
    </div>

    <div class="card-content">
      <div class="performer-info">
        <h3 class="performer-name">{{ slot.stage_name }}</h3>
        <div class="performer-meta">
          <span class="meta-item">
            <i class="pi pi-clock"></i>
            {{ slot.self_est_min || 5 }}min set
          </span>
          <span v-if="slot.act_type" class="meta-item">
            <i class="pi pi-tag"></i>
            {{ slot.act_type }}
          </span>
          <span v-if="slot.extra_setup" class="meta-item warning">
            <i class="pi pi-wrench"></i>
            Extra Setup Required
          </span>
        </div>
        <div v-if="slot.leave_by_at" class="urgency-notice">
          <i class="pi pi-stopwatch"></i>
          Needs to leave by {{ formatTime(slot.leave_by_at) }}
        </div>
        <p v-if="slot.notes" class="notes">{{ slot.notes }}</p>
      </div>
    </div>

    <div class="card-actions">
      <SlotControls
        :slot="slot"
        :has-current-performer="hasCurrentPerformer"
        @mark-up-next="(id) => $emit('mark-up-next', id)"
        @call-to-stage="(id) => $emit('call-to-stage', id)"
        @start="(id) => $emit('start', id)"
        @complete="(id) => $emit('complete', id)"
        @no-show="(id) => $emit('no-show', id)"
        @reinstate="(id) => $emit('reinstate', id)"
      />
    </div>
  </div>
  <div v-else class="empty-state">
    <i class="pi pi-microphone"></i>
    <p>No one setting up</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SlotControls from './SlotControls.vue'
import type { Slot } from '../../types/api'
import { formatTime } from '../../utils/time'

interface Props {
  slot?: Slot
  hasCurrentPerformer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasCurrentPerformer: false
})

defineEmits<{
  'mark-up-next': [slotId: string]
  'call-to-stage': [slotId: string]
  start: [slotId: string]
  complete: [slotId: string]
  'no-show': [slotId: string]
  reinstate: [slotId: string]
}>()

const elapsedSeconds = ref(0)
let intervalId: number | null = null

const elapsedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60)
  const seconds = elapsedSeconds.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

function updateElapsedTime() {
  if (props.slot?.setup_started_at) {
    const setupTime = new Date(props.slot.setup_started_at)
    const now = new Date()
    elapsedSeconds.value = Math.floor((now.getTime() - setupTime.getTime()) / 1000)
  }
}

onMounted(() => {
  updateElapsedTime()
  intervalId = window.setInterval(updateElapsedTime, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.setting-up-card {
  background: linear-gradient(135deg, var(--orange-50) 0%, var(--orange-100) 100%);
  border: 2px solid var(--orange-400);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
  }
  50% {
    box-shadow: 0 4px 20px rgba(249, 115, 22, 0.3);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--orange-500);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.header-badge i {
  font-size: 1rem;
}

.setup-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface-0);
  color: var(--orange-700);
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
  border: 2px solid var(--orange-300);
}

.setup-timer i {
  color: var(--orange-600);
}

.card-content {
  margin-bottom: 1.5rem;
}

.performer-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.performer-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--orange-900);
  margin: 0;
}

.performer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.85rem;
  background: var(--surface-0);
  border-radius: 14px;
  font-size: 0.9rem;
  color: var(--text-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.meta-item i {
  font-size: 0.85rem;
  color: var(--orange-600);
}

.meta-item.warning {
  background: var(--red-50);
  color: var(--red-700);
  border: 1px solid var(--red-200);
  font-weight: 600;
}

.meta-item.warning i {
  color: var(--red-600);
}

.urgency-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--yellow-50);
  color: var(--yellow-800);
  border-left: 4px solid var(--yellow-500);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.urgency-notice i {
  font-size: 1.1rem;
}

.notes {
  padding: 0.75rem 1rem;
  background: var(--surface-0);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  margin: 0;
  font-style: italic;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-actions {
  border-top: 2px solid var(--orange-200);
  padding-top: 1rem;
}

.empty-state {
  background: var(--surface-ground);
  border: 2px dashed var(--surface-border);
  border-radius: 12px;
  padding: 2rem 1.5rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 2.5rem;
  color: var(--orange-300);
  margin-bottom: 0.75rem;
  display: block;
}

.empty-state p {
  font-size: 1rem;
  margin: 0;
}

@media (max-width: 768px) {
  .setting-up-card {
    padding: 1rem;
  }

  .performer-name {
    font-size: 1.25rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
