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

    <button v-if="slot.status === 'queued'" class="manage-button" @click="$emit('manage', slot.slot_id)">
      <i class="pi pi-cog"></i>
      <span>Manage</span>
    </button>
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
  isUserSlot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showETA: true,
  showNotes: false,
  showActions: false,
  isUserSlot: false
})

defineEmits<{
  manage: [slotId: string]
}>()

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
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.queue-item:hover {
  border-color: rgba(0, 206, 144, 0.3);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.1),
    0 0 20px rgba(0, 206, 144, 0.15);
  transform: translateY(-2px);
}

.queue-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 12px 0 0 12px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.queue-item.status-up_next::before {
  background: linear-gradient(180deg, var(--orange-400), var(--orange-600));
  box-shadow: 0 0 8px rgba(255, 165, 0, 0.3);
}

.queue-item.status-setting_up::before {
  background: linear-gradient(180deg, var(--blue-400), var(--blue-600));
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.3);
}

.queue-item.status-performing::before {
  background: linear-gradient(180deg, rgba(0, 206, 144, 1), rgba(0, 255, 163, 1));
  box-shadow: 0 0 8px rgba(0, 206, 144, 0.5);
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
  background: linear-gradient(135deg, rgba(0, 206, 144, 0.2), rgba(0, 255, 163, 0.2));
  color: rgba(0, 206, 144, 1);
  border: 2px solid rgba(0, 206, 144, 0.3);
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 0 12px rgba(0, 206, 144, 0.2);
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
  color: rgba(255, 255, 255, 0.95);
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
  color: rgba(255, 255, 255, 0.75);
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
  color: rgba(255, 255, 255, 0.75);
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

.manage-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  min-width: 80px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 2px solid rgba(0, 206, 144, 0.5);
  border-radius: 0 12px 12px 0;
  color: rgba(0, 206, 144, 1);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: stretch;
  flex-shrink: 0;
  margin: -1rem -1rem -1rem 0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.manage-button:hover {
  background: rgba(0, 206, 144, 0.15);
  border-color: rgba(0, 206, 144, 0.7);
  box-shadow: -2px 0 12px rgba(0, 206, 144, 0.2);
}

.manage-button i {
  font-size: 1.5rem;
  color: rgba(0, 206, 144, 1);
}

.manage-button span {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
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

  .manage-button {
    margin: -0.875rem -0.875rem -0.875rem 0;
    min-width: 70px;
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

  .manage-button {
    margin: 0.5rem -0.875rem -0.875rem -0.875rem;
    border-radius: 0 0 12px 12px;
    min-height: 60px;
    flex-direction: row;
    width: calc(100% + 1.75rem);
  }
}
</style>