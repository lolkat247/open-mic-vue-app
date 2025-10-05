<template>
  <div class="queue-list">
    <div v-if="title" class="queue-header">
      <h2 class="queue-title">
        <i v-if="icon" :class="icon"></i>
        {{ title }}
      </h2>
      <span v-if="slots.length > 0" class="queue-count">{{ slots.length }}</span>
    </div>

    <div v-if="slots.length === 0" class="empty-queue">
      <div class="empty-content">
        <i :class="emptyIcon" class="empty-icon"></i>
        <h3>{{ emptyTitle }}</h3>
        <p>{{ emptyMessage }}</p>
        <slot name="empty-action"></slot>
      </div>
    </div>

    <div v-else class="queue-items">
      <TransitionGroup name="queue-item" tag="div" class="queue-items-container">
        <QueueItem
          v-for="(slot, index) in slots"
          :key="slot.slot_id"
          :slot="slot"
          :position="showPosition ? index + 1 : undefined"
          :eta="getETAForSlot(slot.slot_id)"
          :show-eta="showETA"
          :show-notes="showNotes"
          :show-actions="showActions"
        >
          <template v-if="showActions" #actions="{ slot: slotData }">
            <slot name="item-actions" :slot="slotData"></slot>
          </template>
        </QueueItem>
      </TransitionGroup>
    </div>

    <div v-if="isLoading" class="queue-loading">
      <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
      <span>{{ loadingMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import QueueItem from './QueueItem.vue'
import type { Slot, ETAUpdate } from '../../types/api'

interface Props {
  slots: Slot[]
  etaUpdates?: ETAUpdate[]
  title?: string
  icon?: string
  showPosition?: boolean
  showETA?: boolean
  showNotes?: boolean
  showActions?: boolean
  isLoading?: boolean
  loadingMessage?: string
  emptyTitle?: string
  emptyMessage?: string
  emptyIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  etaUpdates: () => [],
  showPosition: true,
  showETA: true,
  showNotes: false,
  showActions: false,
  isLoading: false,
  loadingMessage: 'Loading queue...',
  emptyTitle: 'No one in queue',
  emptyMessage: 'Be the first to sign up!',
  emptyIcon: 'pi pi-users'
})

// Create a reactive map of slot IDs to ETAs for better reactivity
const etaMap = computed(() => {
  const map = new Map<string, ETAUpdate>()
  props.etaUpdates.forEach(eta => {
    map.set(eta.slot_id, eta)
  })
  return map
})

function getETAForSlot(slotId: string): ETAUpdate | undefined {
  return etaMap.value.get(slotId)
}
</script>

<style scoped>
.queue-list {
  width: 100%;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.queue-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(0, 206, 144, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.queue-title i {
  color: var(--primary-color);
  font-size: 1.75rem;
}

.queue-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 0.75rem;
  background: var(--primary-color);
  color: white;
  border-radius: 16px;
  font-weight: 700;
  font-size: 0.95rem;
}

.empty-queue {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
  background: var(--surface-ground);
  border: 2px dashed var(--surface-border);
  border-radius: 12px;
}

.empty-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 4rem;
  color: var(--surface-400);
  margin-bottom: 1rem;
}

.empty-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.empty-content p {
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin: 0 0 1.5rem 0;
}

.queue-items {
  width: 100%;
}

.queue-items-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.queue-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-color-secondary);
}

/* Transition animations */
.queue-item-enter-active,
.queue-item-leave-active {
  transition: all 0.3s ease;
}

.queue-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.queue-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.queue-item-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .queue-header {
    margin-bottom: 1rem;
  }

  .queue-title {
    font-size: 1.25rem;
  }

  .queue-title i {
    font-size: 1.5rem;
  }

  .empty-queue {
    min-height: 250px;
    padding: 1.5rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-content h3 {
    font-size: 1.25rem;
  }

  .empty-content p {
    font-size: 0.95rem;
  }
}
</style>