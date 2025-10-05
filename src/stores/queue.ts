// Pinia store for queue state management

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Slot, ETAUpdate } from '../types/api'

export const useQueueStore = defineStore('queue', () => {
  // State
  const slots = ref<Slot[]>([])
  const etaUpdates = ref<ETAUpdate[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const queuedSlots = computed(() =>
    slots.value.filter((slot) => slot.status === 'queued').sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  )

  const currentSlot = computed(() =>
    slots.value.find((slot) => slot.status === 'performing')
  )

  const upNextSlot = computed(() => slots.value.find((slot) => slot.status === 'up_next'))

  const completedSlots = computed(() =>
    slots.value.filter((slot) => slot.status === 'completed').sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
  )

  const withdrawnSlots = computed(() => slots.value.filter((slot) => slot.status === 'withdrawn'))

  const noShowSlots = computed(() => slots.value.filter((slot) => slot.status === 'no_show'))

  const queueLength = computed(() => queuedSlots.value.length)

  // Actions
  function setSlots(newSlots: Slot[]) {
    slots.value = newSlots
    error.value = null
  }

  function addSlot(slot: Slot) {
    const existingIndex = slots.value.findIndex((s) => s.slot_id === slot.slot_id)
    if (existingIndex >= 0) {
      console.log('[Queue Store] Updating existing slot:', slot.slot_id, 'status:', slot.status)
      // Create new array to trigger reactivity
      slots.value = [
        ...slots.value.slice(0, existingIndex),
        slot,
        ...slots.value.slice(existingIndex + 1)
      ]
    } else {
      console.log('[Queue Store] Adding new slot:', slot.slot_id, 'status:', slot.status)
      slots.value = [...slots.value, slot]
    }
  }

  function updateSlot(slotId: string, updates: Partial<Slot>) {
    const index = slots.value.findIndex((s) => s.slot_id === slotId)
    if (index >= 0) {
      // Create new array to trigger reactivity
      const updatedSlot = {
        ...slots.value[index],
        ...updates
      } as Slot
      slots.value = [
        ...slots.value.slice(0, index),
        updatedSlot,
        ...slots.value.slice(index + 1)
      ]
    }
  }

  function removeSlot(slotId: string) {
    slots.value = slots.value.filter((s) => s.slot_id !== slotId)
  }

  function setETAUpdates(updates: ETAUpdate[]) {
    etaUpdates.value = updates
  }

  function getETAForSlot(slotId: string): ETAUpdate | undefined {
    return etaUpdates.value.find((eta) => eta.slot_id === slotId)
  }

  function clearQueue() {
    slots.value = []
    etaUpdates.value = []
    error.value = null
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  // Handle WebSocket delta updates
  function handleDelta(action: string, data: any) {
    switch (action) {
      case 'slot_created':
        addSlot(data)
        break
      case 'slot_updated':
        updateSlot(data.slot_id, data)
        break
      case 'slot_status_changed':
        updateSlot(data.slot_id, { status: data.status })
        break
      case 'slot_deleted':
        removeSlot(data.slot_id)
        break
      case 'slot_reordered':
        // Handle bulk slot reordering - data is an array of updated slots
        if (Array.isArray(data)) {
          // Create a map of reordered slot IDs for quick lookup
          const reorderedIds = new Set(data.map(s => s.slot_id))

          // Keep non-queued slots, replace queued slots with reordered ones
          // This creates a new array reference, triggering Vue's reactivity
          slots.value = [
            ...slots.value.filter(s => !reorderedIds.has(s.slot_id)),
            ...data
          ]
        }
        break
      case 'eta_updated':
        // Handle ETA updates - data is an array of ETAUpdate objects
        if (Array.isArray(data)) {
          setETAUpdates(data)
        }
        break
      // Handle all state transition actions
      case 'slot_up_next':
      case 'slot_called_to_stage':
      case 'slot_started':
      case 'slot_completed':
      case 'slot_no_show':
      case 'slot_reinstated':
        // These actions contain the full updated slot, so we can just update it
        addSlot(data)
        break
      default:
        console.warn('Unknown delta action:', action)
    }
  }

  return {
    // State
    slots,
    etaUpdates,
    isLoading,
    error,
    // Getters
    queuedSlots,
    currentSlot,
    upNextSlot,
    completedSlots,
    withdrawnSlots,
    noShowSlots,
    queueLength,
    // Actions
    setSlots,
    addSlot,
    updateSlot,
    removeSlot,
    setETAUpdates,
    getETAForSlot,
    clearQueue,
    setLoading,
    setError,
    handleDelta
  }
})