// WebSocket Connection Manager
// Singleton service to pool and reuse WebSocket connections

import { WebSocketService, type WebSocketEventHandlers } from './websocket'
import type { WebSocketViewType } from '../types/api'

interface ConnectionEntry {
  service: WebSocketService
  refCount: number
  handlers: Map<symbol, WebSocketEventHandlers>
}

class WebSocketManager {
  private connections: Map<string, ConnectionEntry> = new Map()

  /**
   * Get or create a WebSocket connection for the given event and view type
   * Returns a unique symbol that must be used to unsubscribe
   */
  subscribe(
    wsUrl: string,
    eventId: string,
    viewType: WebSocketViewType,
    handlers: WebSocketEventHandlers,
    token: string | null = null
  ): symbol {
    const key = this.getKey(eventId, viewType)
    const subscriberId = Symbol('websocket-subscription')

    let entry = this.connections.get(key)

    if (!entry) {
      // Create new connection
      const service = new WebSocketService(wsUrl, eventId, viewType, token)

      entry = {
        service,
        refCount: 0,
        handlers: new Map()
      }

      // Set up aggregated handlers that call all subscribed handlers
      service.setHandlers({
        onFullState: (data) => {
          entry!.handlers.forEach(h => h.onFullState?.(data))
        },
        onDelta: (message) => {
          entry!.handlers.forEach(h => h.onDelta?.(message))
        },
        onConnected: () => {
          entry!.handlers.forEach(h => h.onConnected?.())
        },
        onDisconnected: () => {
          entry!.handlers.forEach(h => h.onDisconnected?.())
        },
        onError: (error) => {
          entry!.handlers.forEach(h => h.onError?.(error))
        }
      })

      this.connections.set(key, entry)

      // Connect the WebSocket
      service.connect()

      console.log(`[WebSocketManager] Created new connection for ${key}`)
    } else {
      console.log(`[WebSocketManager] Reusing existing connection for ${key}`)
    }

    // Add this subscriber's handlers
    entry.handlers.set(subscriberId, handlers)
    entry.refCount++

    console.log(`[WebSocketManager] Connection ${key} now has ${entry.refCount} subscriber(s)`)

    return subscriberId
  }

  /**
   * Unsubscribe from a WebSocket connection
   * If this was the last subscriber, the connection is closed and cleaned up
   */
  unsubscribe(
    eventId: string,
    viewType: WebSocketViewType,
    subscriberId: symbol
  ): void {
    const key = this.getKey(eventId, viewType)
    const entry = this.connections.get(key)

    if (!entry) {
      console.warn(`[WebSocketManager] Attempted to unsubscribe from non-existent connection ${key}`)
      return
    }

    // Remove this subscriber's handlers
    entry.handlers.delete(subscriberId)
    entry.refCount--

    console.log(`[WebSocketManager] Connection ${key} now has ${entry.refCount} subscriber(s)`)

    // If no more subscribers, disconnect and cleanup
    if (entry.refCount <= 0) {
      entry.service.disconnect()
      this.connections.delete(key)
      console.log(`[WebSocketManager] Closed and removed connection ${key}`)
    }
  }

  /**
   * Get the service instance for a connection (useful for calling methods like requestResync)
   */
  getService(eventId: string, viewType: WebSocketViewType): WebSocketService | null {
    const key = this.getKey(eventId, viewType)
    return this.connections.get(key)?.service || null
  }

  /**
   * Check if connected
   */
  isConnected(eventId: string, viewType: WebSocketViewType): boolean {
    const service = this.getService(eventId, viewType)
    return service?.isConnected() || false
  }

  /**
   * Get the reference count for a connection (for debugging)
   */
  getRefCount(eventId: string, viewType: WebSocketViewType): number {
    const key = this.getKey(eventId, viewType)
    return this.connections.get(key)?.refCount || 0
  }

  /**
   * Get total number of active connections (for debugging)
   */
  getTotalConnections(): number {
    return this.connections.size
  }

  private getKey(eventId: string, viewType: WebSocketViewType): string {
    return `${eventId}_${viewType}`
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager()
