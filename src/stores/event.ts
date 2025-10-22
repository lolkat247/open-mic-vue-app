// Pinia store for current event state

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Event } from '../types/api'

export const useEventStore = defineStore('event', () => {
  // State
  const currentEvent = ref<Event | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const checkinCount = ref(0)

  // Getters
  const eventId = computed(() => currentEvent.value?.event_id ?? null)
  const eventName = computed(() => currentEvent.value?.name ?? '')
  const signupsEnabled = computed(() => currentEvent.value?.signups_enabled ?? true)
  const isPaused = computed(() => !signupsEnabled.value)

  // Actions
  function setEvent(event: Event | null) {
    currentEvent.value = event
    error.value = null
  }

  function updateEvent(updates: Partial<Event>) {
    if (currentEvent.value) {
      currentEvent.value = {
        ...currentEvent.value,
        ...updates
      }
    }
  }

  function clearEvent() {
    currentEvent.value = null
    error.value = null
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function pauseSignups() {
    if (currentEvent.value) {
      currentEvent.value.signups_enabled = false
      currentEvent.value.signups_paused_at = new Date().toISOString()
    }
  }

  function resumeSignups() {
    if (currentEvent.value) {
      currentEvent.value.signups_enabled = true
      currentEvent.value.signups_resumed_at = new Date().toISOString()
    }
  }

  function setCheckinCount(count: number) {
    checkinCount.value = count
  }

  return {
    // State
    currentEvent,
    isLoading,
    error,
    checkinCount,
    // Getters
    eventId,
    eventName,
    signupsEnabled,
    isPaused,
    // Actions
    setEvent,
    updateEvent,
    clearEvent,
    setLoading,
    setError,
    pauseSignups,
    resumeSignups,
    setCheckinCount
  }
})