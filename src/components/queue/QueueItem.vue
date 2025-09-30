<template>
  <div class="queue-item" :class="`status-${slot.status}`">
    <div class="queue-position">
      <span class="position-number">{{ position }}</span>
    </div>

    <div class="queue-content">
      <div class="performer-header">
        <h3 class="performer-name">{{ slot.stage_name }}</h3>
        <Badge :value="statusLabel" :severity="statusSeverity" />
      </div>

      <div class="performer-details">
        <div class="detail-item">
          <i class="pi pi-tag"></i>
          <span>{{ slot.act_type }}</span>
        </div>

        <div class="detail-item">
          <i class="pi pi-clock"></i>
          <span>~{{ slot.self_est_min }} min</span>
        </div>

        <div v-if="slot.extra_setup" class="detail-item extra-setup">
          <i class="pi pi-cog"></i>
          <span>Extra setup needed</span>
        </div>

        <div v-if="slot.leave_by_at" class="detail-item leave-by">
          <i class="pi pi-sign-out"></i>
          <span>Leave by {{ slot.leave_by_at }}</span>
        </div>
      </div>

      <div v-if="showETA && eta" class="queue-eta">
        <ETADisplay :eta="eta" :leave-by="slot.leave_by_at" :show-estimated-time="false" />
      </div>

      <div v-if="showNotes && slot.notes" class="performer-notes">
        <i class="pi pi-comment"></i>
        <span>{{ slot.notes }}</span>
      </div>
    </div>

    <div v-if="showActions" class="queue-actions">
      <slot name="actions" :slot="slot"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Badge from 'primevue/badge'
import ETADisplay from './ETADisplay.vue'
import type { Slot, ETAUpdate } from '../../types/api'

interface Props {
  slot: Slot
  position?: number
  eta?: ETAUpdate | null
  showETA?: boolean
  showNotes?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showETA: true,
  showNotes: false,
  showActions: false
})

const statusLabel = computed(() => {
  switch (props.slot.status) {
    case 'queued':
      return 'Queued'
    case 'up_next':
      return 'Up Next'
    case 'setting_up':
      return 'Setting Up'
    case 'performing':
      return 'Performing'
    case 'completed':
      return 'Completed'
    case 'no_show':
      return 'No Show'
    case 'withdrawn':
      return 'Withdrawn'
    default:
      return props.slot.status
  }
})

const statusSeverity = computed(() => {
  switch (props.slot.status) {
    case 'queued':
      return 'info'
    case 'up_next':
      return 'warn'
    case 'setting_up':
    case 'performing':
      return 'success'
    case 'completed':
      return 'secondary'
    case 'no_show':
    case 'withdrawn':
      return 'danger'
    default:
      return 'info'
  }
})
</script>

<style scoped>
.queue-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
  position: relative;
}

.queue-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.queue-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 8px 0 0 8px;
  background: var(--surface-border);
  transition: background 0.2s ease;
}

.queue-item.status-up_next::before {
  background: var(--orange-500);
}

.queue-item.status-setting_up::before {
  background: var(--blue-500);
}

.queue-item.status-performing::before {
  background: var(--green-500);
}

.queue-position {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.position-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.1rem;
}

.queue-content {
  flex: 1;
  min-width: 0;
}

.performer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.performer-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.performer-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.detail-item i {
  font-size: 0.85rem;
  color: var(--primary-color);
}

.detail-item.extra-setup {
  color: var(--orange-600);
}

.detail-item.extra-setup i {
  color: var(--orange-600);
}

.detail-item.leave-by {
  color: var(--blue-600);
}

.detail-item.leave-by i {
  color: var(--blue-600);
}

.queue-eta {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
}

.performer-notes {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 4px;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.performer-notes i {
  color: var(--primary-color);
  flex-shrink: 0;
  margin-top: 0.1rem;
  font-size: 0.9rem;
}

.queue-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .queue-item {
    padding: 0.875rem;
  }

  .position-number {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .performer-name {
    font-size: 1rem;
  }

  .performer-details {
    gap: 0.75rem;
  }

  .detail-item {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .queue-item {
    flex-direction: column;
  }

  .queue-position {
    justify-content: flex-start;
  }

  .performer-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>