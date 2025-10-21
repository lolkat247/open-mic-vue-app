<template>
  <div v-if="slot" class="up-next-card">
    <div class="card-header">
      <div class="header-badge">
        <i class="pi pi-arrow-right"></i>
        <span>Up Next</span>
      </div>
    </div>

    <div class="card-content">
      <div class="performer-info">
        <h3 class="performer-name">{{ slot.stage_name }}</h3>
        <div class="performer-meta">
          <span class="meta-item">
            <i class="pi pi-clock"></i>
            {{ slot.self_est_min || 5 }}min
          </span>
          <span v-if="slot.act_type" class="meta-item">
            <i class="pi pi-tag"></i>
            {{ slot.act_type }}
          </span>
          <span v-if="slot.extra_setup" class="meta-item warning">
            <i class="pi pi-wrench"></i>
            Extra Setup
          </span>
        </div>
        <div v-if="slot.leave_by_at" class="urgency-notice">
          <i class="pi pi-stopwatch"></i>
          Must perform before {{ formatTime24to12(slot.leave_by_at) }}
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
    <i class="pi pi-arrow-right"></i>
    <p>No performer marked as up next</p>
    <span class="hint">Mark someone from the queue when ready</span>
  </div>
</template>

<script setup lang="ts">
import SlotControls from './SlotControls.vue'
import type { Slot } from '../../types/api'

// Helper function to format 24-hour time to 12-hour with AM/PM
function formatTime24to12(timeStr: string): string {
  const parts = timeStr.split(':')
  if (parts.length !== 2) return timeStr

  let hours = parseInt(parts[0] || '0', 10)
  const minutes = parts[1] || '00'
  const period = hours >= 12 ? 'PM' : 'AM'

  if (hours === 0) hours = 12
  else if (hours > 12) hours -= 12

  return `${hours}:${minutes} ${period}`
}

interface Props {
  slot?: Slot
  hasCurrentPerformer?: boolean
}

withDefaults(defineProps<Props>(), {
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
</script>

<style scoped>
.up-next-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid rgba(0, 206, 144, 0.5);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow:
    0 4px 16px rgba(0, 206, 144, 0.25),
    0 2px 8px rgba(0, 206, 144, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.card-header {
  margin-bottom: 1rem;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 206, 144, 0.8);
  color: rgba(255, 255, 255, 1);
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 0 12px rgba(0, 206, 144, 0.4);
  border: 1px solid rgba(0, 206, 144, 1);
}

.header-badge i {
  font-size: 1rem;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
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
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 206, 144, 0.3);
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
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 206, 144, 0.3);
  border-radius: 14px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.meta-item i {
  font-size: 0.85rem;
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 4px rgba(0, 206, 144, 0.4));
}

.meta-item.warning {
  background: rgba(251, 146, 60, 0.15);
  border: 1px solid rgba(251, 146, 60, 0.5);
  color: rgba(254, 215, 170, 1);
  font-weight: 600;
}

.meta-item.warning i {
  color: rgba(251, 146, 60, 1);
  filter: drop-shadow(0 0 6px rgba(251, 146, 60, 0.6));
}

.urgency-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.5);
  border-left: 4px solid rgba(234, 179, 8, 1);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(254, 240, 138, 1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.2);
}

.urgency-notice i {
  font-size: 1.1rem;
  color: rgba(234, 179, 8, 1);
  filter: drop-shadow(0 0 6px rgba(234, 179, 8, 0.6));
}

.notes {
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-style: italic;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.card-actions {
  border-top: 2px solid rgba(0, 206, 144, 0.2);
  padding-top: 1rem;
}

.empty-state {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 2px dashed rgba(0, 206, 144, 0.3);
  border-radius: 12px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.empty-state i {
  font-size: 3rem;
  color: rgba(0, 206, 144, 0.3);
  margin-bottom: 1rem;
  display: block;
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.2));
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.5rem 0;
}

.empty-state .hint {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 768px) {
  .up-next-card {
    padding: 1rem;
  }

  .performer-name {
    font-size: 1.25rem;
  }
}
</style>
