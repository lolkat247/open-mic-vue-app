<template>
  <div class="queue-manager">
    <div class="manager-header">
      <div class="header-title-section">
        <h3 class="section-title">
          <i class="pi pi-list"></i>
          Up Next in Queue
        </h3>
        <p class="section-subtitle">Use ↑↓ buttons to reorder • Click "Call to Stage" to begin</p>
      </div>
      <div class="header-actions">
        <Button
          label="Auto-sort by Leave-by Time"
          icon="pi pi-sort-alt"
          text
          size="small"
          @click="handleAutoSort"
          :disabled="sortableSlots.length === 0"
          v-tooltip.top="'Automatically prioritize performers who need to leave early'"
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
          <span class="header-label">In Queue</span>
          <Badge :value="localSlots.length" severity="info" />
        </div>
      </template>

      <template #item="{ item: slot, index }">
        <div class="queue-item">
          <div class="item-header">
            <div class="item-position">
              <span class="position-number">#{{ index + 1 }}</span>
            </div>
            <div class="reorder-controls">
              <Button
                icon="pi pi-chevron-up"
                text
                rounded
                size="small"
                :disabled="index === 0"
                @click="moveUp(index)"
                v-tooltip.top="'Move up in queue'"
                class="reorder-btn"
              />
              <Button
                icon="pi pi-chevron-down"
                text
                rounded
                size="small"
                :disabled="index === localSlots.length - 1"
                @click="moveDown(index)"
                v-tooltip.top="'Move down in queue'"
                class="reorder-btn"
              />
            </div>
            <div class="item-info">
              <div class="name-row">
                <h4 class="item-name">{{ slot.stage_name }}</h4>
                <span v-if="slot.status !== 'queued'" :class="['status-badge', `status-${slot.status}`]">
                  {{ getStatusLabel(slot.status) }}
                </span>
              </div>
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
              @mark-up-next="(id) => $emit('mark-up-next', id)"
              @call-to-stage="(id) => $emit('call-to-stage', id)"
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
  'mark-up-next': [slotId: string]
  'call-to-stage': [slotId: string]
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

function moveUp(index: number) {
  if (index === 0) return

  const slots = [...localSlots.value]
  const temp = slots[index]
  slots[index] = slots[index - 1]
  slots[index - 1] = temp

  localSlots.value = slots
  handleReorder()
}

function moveDown(index: number) {
  if (index === localSlots.value.length - 1) return

  const slots = [...localSlots.value]
  const temp = slots[index]
  slots[index] = slots[index + 1]
  slots[index + 1] = temp

  localSlots.value = slots
  handleReorder()
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

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'up_next': 'Up Next',
    'setting_up': 'Setting Up',
    'performing': 'Performing',
    'completed': 'Completed',
    'no_show': 'No Show',
    'withdrawn': 'Withdrawn'
  }
  return labels[status] || status
}
</script>

<style scoped>
.queue-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.header-title-section {
  flex: 1;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.25rem 0;
}

.section-title i {
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 8px rgba(0, 206, 144, 0.4));
  -webkit-text-fill-color: currentColor;
}

.section-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.queue-orderlist {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  flex: 1;
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.orderlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.5) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Force dark theme on PrimeVue components */
:deep(.p-orderlist-header) {
  background: rgba(0, 0, 0, 0.5) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 0.75rem 1rem !important;
}

:deep(.p-listbox) {
  background: transparent !important;
  border: none !important;
}

/* Additional overrides to remove white backgrounds */
:deep(.queue-orderlist .p-component) {
  background: transparent !important;
}

:deep(.p-orderlist .p-orderlist-list) {
  background: rgba(30, 30, 30, 0.95) !important;
}

/* Override PrimeVue surface colors within queue */
:deep(.queue-orderlist *) {
  --p-surface-0: rgba(0, 0, 0, 0.3) !important;
  --p-surface-50: rgba(0, 0, 0, 0.3) !important;
  --p-surface-100: rgba(0, 0, 0, 0.3) !important;
  --p-surface-card: rgba(0, 0, 0, 0.3) !important;
  --p-surface-ground: rgba(30, 30, 30, 0.95) !important;
}

/* Hide the built-in controls */
:deep(.p-orderlist-controls) {
  display: none;
}

/* Make OrderList fill available space */
:deep(.p-orderlist) {
  height: 100%;
  display: flex !important;
  flex-direction: column !important;
  background: transparent !important;
  border: none !important;
}

:deep(.p-orderlist-list-container),
:deep(.p-listbox-list-container) {
  flex: 1 !important;
  overflow: auto !important;
  min-height: 700px !important; /* Tall enough for 3.5 cards (~200px each) */
  max-height: none !important; /* Remove any max-height restrictions */
  height: 100% !important;
  background: rgba(30, 30, 30, 0.95) !important;
  border: none !important;
}

:deep(.p-orderlist-list),
:deep(.p-listbox-list) {
  padding: 0.5rem !important;
  min-height: 700px !important;
  max-height: none !important;
  background: rgba(30, 30, 30, 0.95) !important;
}

:deep(.p-orderlist-item) {
  padding: 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  margin-bottom: 0.5rem !important;
  cursor: move !important;
  transition: all 0.2s ease !important;
  background: rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}

:deep(.p-orderlist-item > *) {
  background: transparent !important;
}

:deep(.p-orderlist-item-content) {
  background: transparent !important;
}

:deep(.p-listbox-item) {
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  margin-bottom: 0.5rem !important;
}

:deep(.p-listbox-item:hover) {
  background: rgba(0, 0, 0, 0.4) !important;
}

/* Nuclear option - catch all white/light backgrounds */
:deep(.p-orderlist-item div[style*="background"]) {
  background: transparent !important;
}

:deep(.p-orderlist-item [style*="background: white"]),
:deep(.p-orderlist-item [style*="background: #fff"]),
:deep(.p-orderlist-item [style*="background: rgb(255"]),
:deep(.p-orderlist-item [style*="background-color: white"]),
:deep(.p-orderlist-item [style*="background-color: #fff"]),
:deep(.p-orderlist-item [style*="background-color: rgb(255"]) {
  background: rgba(0, 0, 0, 0.3) !important;
  background-color: rgba(0, 0, 0, 0.3) !important;
}

:deep(.p-orderlist-item:hover) {
  border-color: rgba(0, 206, 144, 0.6) !important;
  box-shadow: 0 2px 12px rgba(0, 206, 144, 0.2) !important;
  background: rgba(0, 0, 0, 0.4) !important;
}

:deep(.p-orderlist-item.p-highlight) {
  background: rgba(0, 206, 144, 0.15) !important;
  border-color: rgba(0, 206, 144, 0.6) !important;
  box-shadow: 0 0 16px rgba(0, 206, 144, 0.3) !important;
}

:deep(.p-orderlist-item:focus) {
  outline: none !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 206, 144, 0.3) !important;
}

.queue-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  background: transparent !important;
}

/* Force all children to be transparent, except styled components */
.queue-item * {
  background: transparent !important;
}

/* Restore intentional backgrounds for specific components */
.queue-item .item-position {
  background: rgba(0, 206, 144, 0.8) !important;
}

.queue-item .meta-chip {
  background: rgba(0, 0, 0, 0.4) !important;
}

.queue-item .meta-chip.warning {
  background: rgba(251, 146, 60, 0.15) !important;
}

.queue-item .item-urgency {
  background: rgba(234, 179, 8, 0.15) !important;
}

.queue-item .item-notes {
  background: rgba(0, 0, 0, 0.3) !important;
}

.queue-item .status-badge {
  /* Status badges keep their specific backgrounds defined below */
}

.queue-item .status-up_next {
  background: rgba(6, 182, 212, 0.2) !important;
}

.queue-item .status-setting_up {
  background: rgba(251, 146, 60, 0.2) !important;
}

.queue-item .status-performing {
  background: rgba(34, 197, 94, 0.2) !important;
}

.queue-item .status-completed {
  background: rgba(156, 163, 175, 0.2) !important;
}

.queue-item .status-no_show {
  background: rgba(239, 68, 68, 0.2) !important;
}

.queue-item .status-withdrawn {
  background: rgba(168, 85, 247, 0.2) !important;
}

.item-header {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.item-position {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  background: rgba(0, 206, 144, 0.8);
  color: rgba(255, 255, 255, 1);
  border-radius: 50%;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
  border: 2px solid rgba(0, 206, 144, 1);
  box-shadow: 0 0 12px rgba(0, 206, 144, 0.4);
}

.reorder-controls {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}

.reorder-btn {
  width: 32px;
  height: 32px;
  padding: 0;
}

.reorder-btn:disabled {
  opacity: 0.3;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.item-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.status-up_next {
  background: rgba(6, 182, 212, 0.2);
  color: rgba(103, 232, 249, 1);
  border: 1px solid rgba(6, 182, 212, 0.5);
}

.status-setting_up {
  background: rgba(251, 146, 60, 0.2);
  color: rgba(254, 215, 170, 1);
  border: 1px solid rgba(251, 146, 60, 0.5);
}

.status-performing {
  background: rgba(34, 197, 94, 0.2);
  color: rgba(134, 239, 172, 1);
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.status-completed {
  background: rgba(156, 163, 175, 0.2);
  color: rgba(229, 231, 235, 1);
  border: 1px solid rgba(156, 163, 175, 0.5);
}

.status-no_show {
  background: rgba(239, 68, 68, 0.2);
  color: rgba(254, 202, 202, 1);
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.status-withdrawn {
  background: rgba(168, 85, 247, 0.2);
  color: rgba(216, 180, 254, 1);
  border: 1px solid rgba(168, 85, 247, 0.5);
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
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 206, 144, 0.3);
  border-radius: 12px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.meta-chip i {
  font-size: 0.75rem;
  color: rgba(0, 206, 144, 1);
  filter: drop-shadow(0 0 4px rgba(0, 206, 144, 0.4));
}

.meta-chip.warning {
  background: rgba(251, 146, 60, 0.15);
  border: 1px solid rgba(251, 146, 60, 0.5);
  color: rgba(254, 215, 170, 1);
  font-weight: 600;
}

.meta-chip.warning i {
  color: rgba(251, 146, 60, 1);
  filter: drop-shadow(0 0 6px rgba(251, 146, 60, 0.6));
}

.item-urgency {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.5);
  border-left: 4px solid rgba(234, 179, 8, 1);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(254, 240, 138, 1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.2);
}

.item-urgency i {
  font-size: 1rem;
  color: rgba(234, 179, 8, 1);
  filter: drop-shadow(0 0 6px rgba(234, 179, 8, 0.6));
}

.item-notes {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-style: italic;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border-left: 3px solid rgba(0, 206, 144, 0.4);
}

.item-actions {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
}

/* Message styling */
:deep(.p-message) {
  background: rgba(0, 0, 0, 0.4) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  margin: 1rem 0;
}

:deep(.p-message-info) {
  background: rgba(6, 182, 212, 0.15) !important;
  border: 1px solid rgba(6, 182, 212, 0.5) !important;
  color: rgba(103, 232, 249, 1) !important;
}

:deep(.p-message-info .p-message-icon) {
  color: rgba(6, 182, 212, 1) !important;
  filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.5));
}

:deep(.p-message-success) {
  background: rgba(34, 197, 94, 0.15) !important;
  border: 1px solid rgba(34, 197, 94, 0.5) !important;
  color: rgba(134, 239, 172, 1) !important;
}

:deep(.p-message-success .p-message-icon) {
  color: rgba(34, 197, 94, 1) !important;
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.5));
}

/* Badge styling - make circular and cyan/teal themed */
:deep(.p-badge) {
  background: rgba(6, 182, 212, 0.8) !important;
  border: 1px solid rgba(6, 182, 212, 1) !important;
  color: rgba(255, 255, 255, 1) !important;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.3) !important;
  font-weight: 600 !important;
  min-width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  aspect-ratio: 1/1 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
}

:deep(.p-badge-info) {
  background: rgba(6, 182, 212, 0.8) !important;
  border: 1px solid rgba(6, 182, 212, 1) !important;
  color: rgba(255, 255, 255, 1) !important;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.3) !important;
  font-weight: 600 !important;
}

/* Drag preview styling */
:deep(.p-orderlist-item.p-dragging) {
  background: rgba(0, 0, 0, 0.5) !important;
  border-color: rgba(0, 206, 144, 0.8) !important;
  box-shadow: 0 4px 20px rgba(0, 206, 144, 0.4) !important;
}

@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-title-section {
    width: 100%;
  }

  .section-subtitle {
    font-size: 0.8rem;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    width: 100%;
  }

  .item-header {
    flex-wrap: wrap;
  }

  .reorder-controls {
    flex-direction: row;
    order: 3;
    width: 100%;
    justify-content: center;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .reorder-btn {
    width: 40px;
    height: 40px;
  }
}
</style>