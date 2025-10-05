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
    <i class="pi pi-arrow-right"></i>
    <p>No performer marked as up next</p>
    <span class="hint">Mark someone from the queue when ready</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<style scoped>
.up-next-card {
  background: linear-gradient(135deg, var(--blue-50) 0%, var(--blue-100) 100%);
  border: 2px solid var(--blue-400);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.card-header {
  margin-bottom: 1rem;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--blue-500);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.header-badge i {
  font-size: 1rem;
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
  color: var(--blue-900);
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
  color: var(--blue-600);
}

.meta-item.warning {
  background: var(--orange-50);
  color: var(--orange-700);
  border: 1px solid var(--orange-200);
}

.meta-item.warning i {
  color: var(--orange-600);
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
  border-top: 2px solid var(--blue-200);
  padding-top: 1rem;
}

.empty-state {
  background: var(--surface-ground);
  border: 2px dashed var(--surface-border);
  border-radius: 12px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 3rem;
  color: var(--blue-300);
  margin-bottom: 1rem;
  display: block;
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.empty-state .hint {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
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
