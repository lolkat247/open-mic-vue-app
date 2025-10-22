// Composable for WebSocket connection management

import { ref, onUnmounted } from 'vue'
import { webSocketManager } from '../services/websocket-manager'
import { useEventStore } from '../stores/event'
import { useQueueStore } from '../stores/queue'
import type { ToastServiceMethods } from 'primevue/toastservice'
import type { WebSocketViewType } from '../types/api'
import { config } from '../config'

export function useWebSocket(eventId: string, viewType: WebSocketViewType, _toast: ToastServiceMethods, token: string | null = null) {
  const eventStore = useEventStore()
  const queueStore = useQueueStore()

  const isConnected = ref(false)
  const connectionError = ref<string | null>(null)

  let subscriberId: symbol | null = null

  function connect(connectionToken?: string | null) {
    // If already subscribed, unsubscribe first
    if (subscriberId) {
      disconnect()
    }

    // Use the provided token, or fall back to the initial token
    const tokenToUse = connectionToken !== undefined ? connectionToken : token

    // Subscribe to the connection manager
    subscriberId = webSocketManager.subscribe(
      config.websocketUrl,
      eventId,
      viewType,
      {
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
        } else if (message.action === 'checkin_created' && deltaData?.checkin_count !== undefined) {
          eventStore.setCheckinCount(deltaData.checkin_count)
        }
      },

      onConnected: () => {
        console.log('WebSocket connected')
        isConnected.value = true
        connectionError.value = null
        // Automatically request resync to ensure we're up to date
        requestResync()
      },

      onDisconnected: () => {
        console.log('WebSocket disconnected')
        isConnected.value = false
      },

        onError: (error) => {
          console.error('WebSocket error:', error)
          connectionError.value = 'Connection error occurred'
        }
      },
      tokenToUse
    )

    // Update connection status
    isConnected.value = webSocketManager.isConnected(eventId, viewType)
  }

  function disconnect() {
    if (subscriberId) {
      webSocketManager.unsubscribe(eventId, viewType, subscriberId)
      subscriberId = null
    }
    isConnected.value = false
  }

  function requestResync() {
    const service = webSocketManager.getService(eventId, viewType)
    if (service) {
      service.requestResync()
    }
  }

  // Auto-cleanup on unmount
  // Note: This will be called when the component using this composable unmounts
  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    requestResync,
    isConnected,
    connectionError,
    ws: {
      // Expose value getter for backward compatibility with code that checks ws.value
      get value() {
        return webSocketManager.getService(eventId, viewType)
      }
    }
  }
}