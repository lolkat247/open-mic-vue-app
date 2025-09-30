<template>
  <div class="queue-manager">
    <div class="manager-header">
      <h3 class="section-title">
        <i class="pi pi-list"></i>
        Queue Management
      </h3>
      <div class="header-actions">
        <Button
          label="Auto-sort by Leave-by"
          icon="pi pi-sort-alt"
          text
          size="small"
          @click="handleAutoSort"
          :disabled="sortableSlots.length === 0"
        />
      </div>
    </div>

    <Message v-if="sortableSlots.length === 0" severity="info" :closable="false">
      <i class="pi pi-info-circle"></i>
      No performers in queue yet
    </Message>

    <OrderList
      v-else
      v-model="localSlots"
      dataKey="slot_id"
      @reorder="handleReorder"
      class="queue-orderlist"
    >
      <template #header>
        <div class="orderlist-header">
          <span class="header-label">Drag to reorder</span>
          <Badge :value="localSlots.length" severity="info" />
        </div>
      </template>

      <template #item="{ item: slot, index }">
        <div class="queue-item">
          <div class="item-header">
            <div class="item-position">
              <span class="position-number">#{{ index + 1 }}</span>
            </div>
            <div class="item-info">
              <h4 class="item-name">{{ slot.stage_name }}</h4>
              <div class="item-meta">
                <span class="meta-chip">
                  <i class="pi pi-clock"></i>
                  {{ slot.self_est_min || 5 }}min
                </span>
                <span v-if="slot.act_type" class="meta-chip">
                  <i class="pi pi-tag"></i>
                  {{ slot.act_type }}
                </span>
                <span v-if="slot.extra_setup" class="meta-chip warning">
                  <i class="pi pi-wrench"></i>
                  Setup
                </span>
              </div>
              <div v-if="slot.leave_by_at" class="item-urgency">
                <i class="pi pi-stopwatch"></i>
                Leave by {{ formatTime(slot.leave_by_at) }}
              </div>
              <p v-if="slot.notes" class="item-notes">{{ slot.notes }}</p>
            </div>
          </div>
          <div class="item-actions">
            <SlotControls
              :slot="slot"
              :has-current-performer="hasCurrentPerformer"
              @start="(id) => $emit('start', id)"
              @complete="(id) => $emit('complete', id)"
              @no-show="(id) => $emit('no-show', id)"
              @reinstate="(id) => $emit('reinstate', id)"
            />
          </div>
        </div>
      </template>
    </OrderList>

    <Message v-if="hasReordered && !isReordering" severity="success" :closable="true">
      <i class="pi pi-check"></i>
      Queue order updated
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import OrderList from 'primevue/orderlist'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import SlotControls from './SlotControls.vue'
import type { Slot } from '../../types/api'
import { formatTime } from '../../utils/time'

interface Props {
  slots: Slot[]
  isReordering?: boolean
  hasCurrentPerformer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isReordering: false,
  hasCurrentPerformer: false
})

const emit = defineEmits<{
  reorder: [slotIds: string[]]
  start: [slotId: string]
  complete: [slotId: string]
  'no-show': [slotId: string]
  reinstate: [slotId: string]
}>()

const localSlots = ref<Slot[]>([])
const hasReordered = ref(false)

// Only include queued slots for reordering
const sortableSlots = computed(() => {
  return props.slots.filter(slot => slot.status === 'queued')
})

// Sync props to local state
watch(() => props.slots, () => {
  localSlots.value = sortableSlots.value.slice()
}, { immediate: true, deep: true })

function handleReorder() {
  // Extract slot IDs in new order
  const newOrder = localSlots.value.map(slot => slot.slot_id)
  hasReordered.value = true
  emit('reorder', newOrder)

  // Reset success message after 3 seconds
  setTimeout(() => {
    hasReordered.value = false
  }, 3000)
}

function handleAutoSort() {
  // Sort by leave_by_at (earliest first), then by original position
  const sorted = [...localSlots.value].sort((a, b) => {
    // Prioritize slots with leave_by_at
    if (a.leave_by_at && !b.leave_by_at) return -1
    if (!a.leave_by_at && b.leave_by_at) return 1

    // Both have leave_by_at, sort by time
    if (a.leave_by_at && b.leave_by_at) {
      return new Date(a.leave_by_at).getTime() - new Date(b.leave_by_at).getTime()
    }

    // Neither has leave_by_at, maintain original order
    return 0
  })

  localSlots.value = sorted
  handleReorder()
}
</script>

<style scoped>
.queue-manager {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.section-title i {
  color: var(--primary-color);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.queue-orderlist {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background: var(--surface-card);
}

.orderlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--surface-ground);
  border-bottom: 1px solid var(--surface-border);
}

.header-label {
  font-weight: 600;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

:deep(.p-orderlist-list) {
  padding: 0.5rem;
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
}

:deep(.p-orderlist-item) {
  padding: 0;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: move;
  transition: all 0.2s ease;
}

:deep(.p-orderlist-item:hover) {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.p-orderlist-item.p-highlight) {
  background: var(--primary-50);
  border-color: var(--primary-color);
}

.queue-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
}

.item-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.item-position {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1rem;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.75rem;
  background: var(--surface-ground);
  border-radius: 12px;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.meta-chip i {
  font-size: 0.75rem;
}

.meta-chip.warning {
  background: var(--orange-50);
  color: var(--orange-700);
}

.item-urgency {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--yellow-50);
  color: var(--yellow-700);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.item-urgency i {
  font-size: 1rem;
}

.item-notes {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin: 0;
  font-style: italic;
}

.item-actions {
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
}

@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    width: 100%;
  }

  .item-header {
    flex-direction: column;
  }

  :deep(.p-orderlist-list) {
    max-height: 500px;
  }
}
</style>