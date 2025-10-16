<template>
  <div class="queue-manager">
    <div class="manager-header">
      <div class="header-title-section">
        <h3 class="section-title">
          <i class="pi pi-list"></i>
          Up Next in Queue
        </h3>
        <p class="section-subtitle">Use ↑↓ buttons to reorder • Click "Mark as Up Next" to begin</p>
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
                <span class="meta-chip signup-time">
                  <i class="pi pi-calendar-plus"></i>
                  Signed up {{ formatTime(slot.created_at) }}
                </span>
              </div>
              <div v-if="slot.leave_by_at" class="item-urgency">
                <i class="pi pi-stopwatch"></i>
                Leave by {{ formatTime24to12(slot.leave_by_at) }}
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

// Helper function to compare two "HH:MM" time strings
function compareTimeStrings(timeA: string, timeB: string): number {
  const partsA = timeA.split(':').map(Number)
  const partsB = timeB.split(':').map(Number)

  const minutesA = (partsA[0] || 0) * 60 + (partsA[1] || 0)
  const minutesB = (partsB[0] || 0) * 60 + (partsB[1] || 0)

  return minutesA - minutesB
}

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
  const temp = slots[index]!
  slots[index] = slots[index - 1]!
  slots[index - 1] = temp

  localSlots.value = slots
  handleReorder()
}

function moveDown(index: number) {
  if (index === localSlots.value.length - 1) return

  const slots = [...localSlots.value]
  const temp = slots[index]!
  slots[index] = slots[index + 1]!
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

    // Both have leave_by_at, sort by time using proper time string comparison
    if (a.leave_by_at && b.leave_by_at) {
      return compareTimeStrings(a.leave_by_at, b.leave_by_at)
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
  background: transparent;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1rem 0 1rem;
  margin-bottom: 1.5rem;
  background: transparent;
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
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  overflow: hidden;
  flex: 1;
}

.orderlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.header-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Minimal PrimeVue styling - make framework transparent */
:deep(.p-orderlist) {
  background: transparent;
  border: none !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.p-orderlist.p-component) {
  border: none !important;
}

:deep(.p-orderlist-header) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.75rem 1rem;
}

:deep(.p-orderlist-controls) {
  display: none;
}

:deep(.p-listbox.p-component) {
  background: rgba(40, 40, 40, 1);
}

:deep(.p-orderlist-list-container) {
  flex: 1;
  overflow: auto;
  background: transparent;
  height: 100%;
}

:deep(.p-listbox-list-container) {
  flex: 1;
  overflow: auto;
  height: 100%;
  max-height: none !important;
}

:deep(.p-orderlist-list) {
  background: transparent;
  padding: 0.75rem 0;
  list-style: none;
  width: 100%;
}

:deep(.p-orderlist-item) {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  list-style: none;
  width: 100%;
  cursor: default;
  user-select: none;
  pointer-events: none; /* Disable selection entirely */
}

:deep(.p-orderlist-item[draggable]) {
  cursor: default !important;
  -webkit-user-drag: none !important;
}

/* Re-enable pointer events on interactive elements inside cards */
:deep(.p-orderlist-item) .queue-item,
:deep(.p-orderlist-item) button,
:deep(.p-orderlist-item) a,
:deep(.p-orderlist-item) input {
  pointer-events: auto;
}

:deep(.p-orderlist-item:not(:last-child)) {
  margin-bottom: 0.75rem;
}

:deep(.p-orderlist-item:hover),
:deep(.p-orderlist-item.p-highlight) {
  background: transparent !important;
}

/* Override PrimeVue listbox default white hover/select/focus effects */
:deep(.p-listbox-list .p-listbox-option:hover),
:deep(.p-listbox-list .p-listbox-option.p-highlight),
:deep(.p-listbox-list .p-listbox-option.p-focus),
:deep(.p-listbox-list .p-listbox-option:focus),
:deep(.p-listbox-list .p-listbox-option[aria-selected="true"]),
:deep(.p-orderlist-item.p-focus),
:deep(.p-orderlist-item:focus) {
  background: rgba(255, 255, 255, 0.10) !important;
  outline: none !important;
  box-shadow: none !important;
}

.queue-item {
  /* THIS is the visual card - all styling goes here */
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid rgba(0, 206, 144, 0.5);
  border-radius: 12px;
  box-shadow:
    0 4px 16px rgba(0, 206, 144, 0.25),
    0 2px 8px rgba(0, 206, 144, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  box-sizing: border-box;
}

.queue-item:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 206, 144, 0.7);
  box-shadow:
    0 8px 24px rgba(0, 206, 144, 0.35),
    0 4px 12px rgba(0, 206, 144, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.queue-item:focus,
.queue-item:focus-visible,
.queue-item:focus-within {
  outline: none !important;
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
  min-width: 46px;
  height: 46px;
  background: rgba(0, 206, 144, 0.8);
  color: rgba(255, 255, 255, 1);
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.1rem;
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

.queue-item .name-row .item-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  background: linear-gradient(135deg, #ffffff 0%, #00ce90 50%, #00ffa3 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  gap: 0.75rem;
}

.meta-chip {
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

.meta-chip.signup-time {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: rgba(103, 232, 249, 0.95);
}

.meta-chip.signup-time i {
  color: rgba(6, 182, 212, 1);
  filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.4));
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
  border-top: 2px solid rgba(0, 206, 144, 0.2);
  padding-top: 1.25rem;
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