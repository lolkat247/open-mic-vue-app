// Composable for WebSocket connection management

import { ref, onUnmounted } from 'vue'
import { WebSocketService } from '../services/websocket'
import { useEventStore } from '../stores/event'
import { useQueueStore } from '../stores/queue'
import { useToast } from 'primevue/usetoast'
import type { WebSocketViewType } from '../types/api'
import { config } from '../config'

export function useWebSocket(eventId: string, viewType: WebSocketViewType, token: string | null = null) {
  const eventStore = useEventStore()
  const queueStore = useQueueStore()
  const toast = useToast()

  const ws = ref<WebSocketService | null>(null)
  const isConnected = ref(false)
  const connectionError = ref<string | null>(null)

  function connect() {
    if (ws.value) {
      ws.value.disconnect()
    }

    ws.value = new WebSocketService(config.websocketUrl, eventId, viewType, token)

    ws.value.setHandlers({
      onFullState: (data) => {
        console.log('Received full state:', data)
        if (data.event) {
          eventStore.setEvent(data.event)
        }
        if (data.slots) {
          queueStore.setSlots(data.slots)
        }
        if (data.eta_updates) {
          queueStore.setETAUpdates(data.eta_updates)
        }
      },

      onDelta: (message) => {
        console.log('Received delta:', message)

        // Get the appropriate data based on view type
        const deltaData = message.data[viewType]

        if (deltaData) {
          queueStore.handleDelta(message.action, deltaData)
        }

        // Handle event-level changes
        if (message.action === 'event_updated' && deltaData) {
          eventStore.updateEvent(deltaData)
        } else if (message.action === 'signups_paused') {
          eventStore.pauseSignups()
        } else if (message.action === 'signups_resumed') {
          eventStore.resumeSignups()
        }
      },

      onBanner: (message) => {
        console.log('Received banner:', message)

        const severity = message.level === 'error' ? 'error'
          : message.level === 'warning' ? 'warn'
          : 'info'

        toast.add({
          severity,
          summary: message.level.charAt(0).toUpperCase() + message.level.slice(1),
          detail: message.message,
          life: message.auto_dismiss || 5000
        })
      },

      onConnected: () => {
        console.log('WebSocket connected')
        isConnected.value = true
        connectionError.value = null
      },

      onDisconnected: () => {
        console.log('WebSocket disconnected')
        isConnected.value = false
      },

      onError: (error) => {
        console.error('WebSocket error:', error)
        connectionError.value = 'Connection error occurred'
      }
    })

    ws.value.connect()
  }

  function disconnect() {
    if (ws.value) {
      ws.value.disconnect()
      ws.value = null
    }
    isConnected.value = false
  }

  function requestResync() {
    if (ws.value) {
      ws.value.requestResync()
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    requestResync,
    isConnected,
    connectionError
  }
}