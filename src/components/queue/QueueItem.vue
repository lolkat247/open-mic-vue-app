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
  gap: 0.75rem;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.queue-item:hover {
  border-color: rgba(0, 206, 144, 0.5);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.2),
    0 0 24px rgba(0, 206, 144, 0.2);
  transform: translateY(-2px);
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
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, rgba(0, 206, 144, 0.2), rgba(0, 255, 163, 0.2));
  color: rgba(0, 206, 144, 1);
  border: 2px solid rgba(0, 206, 144, 0.5);
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 0 16px rgba(0, 206, 144, 0.3);
  text-shadow: 0 0 8px rgba(0, 206, 144, 0.5);
}

.queue-content {
  flex: 1;
  min-width: 0;
}

.performer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
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
  gap: 0.75rem;
  margin-bottom: 0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.9rem;
}

.detail-item i {
  font-size: 0.9rem;
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 4px rgba(0, 206, 144, 0.4));
}

.detail-item.extra-setup {
  color: rgba(254, 215, 170, 1);
}

.detail-item.extra-setup i {
  color: rgba(251, 146, 60, 1);
  filter: drop-shadow(0 0 4px rgba(251, 146, 60, 0.5));
}

.detail-item.leave-by {
  color: rgba(191, 219, 254, 1);
}

.detail-item.leave-by i {
  color: rgba(96, 165, 250, 1);
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
}

.queue-eta {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.performer-notes {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.performer-notes i {
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 4px rgba(0, 206, 144, 0.4));
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
  padding: 0.875rem 0.75rem;
  min-width: 70px;
  background: transparent;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  color: rgba(0, 206, 144, 1);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: stretch;
  flex-shrink: 0;
  margin: -0.875rem -0.875rem -0.875rem 0.5rem;
}

.manage-button:hover {
  background: rgba(0, 206, 144, 0.1);
  border-left-color: rgba(0, 206, 144, 0.5);
}

.manage-button i {
  font-size: 1.5rem;
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 6px rgba(0, 206, 144, 0.5));
}

.manage-button span {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 768px) {
  .queue-item {
    padding: 0.875rem;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.75rem;
  }

  .queue-position {
    grid-row: 1 / 3;
    align-self: start;
  }

  .position-number {
    width: 44px;
    height: 44px;
    font-size: 1.1rem;
  }

  .queue-content {
    grid-column: 2;
  }

  .performer-name {
    font-size: 1rem;
  }

  .performer-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .detail-item {
    font-size: 0.875rem;
  }

  .manage-button {
    grid-column: 3;
    grid-row: 1 / 3;
    margin: -0.875rem -0.875rem -0.875rem 0;
    min-width: 68px;
    padding: 0.75rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .queue-item {
    grid-template-columns: auto 1fr;
    padding: 0.875rem;
  }

  .queue-position {
    grid-row: 1;
  }

  .queue-content {
    grid-column: 2;
  }

  .performer-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .manage-button {
    grid-column: 1 / -1;
    grid-row: 3;
    margin: 0.5rem -0.875rem -0.875rem -0.875rem;
    border-radius: 0;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    min-height: 56px;
    flex-direction: row;
    width: calc(100% + 1.75rem);
    padding: 0.875rem;
  }
}
</style>