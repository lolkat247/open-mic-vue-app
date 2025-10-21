// WebSocket service for real-time updates

import type {
  WebSocketMessage,
  WebSocketOutboundMessage,
  WebSocketViewType,
  FullStateMessage,
  DeltaMessage
} from '../types/api'

export type WebSocketEventHandlers = {
  onFullState?: (data: FullStateMessage['data']) => void
  onDelta?: (message: DeltaMessage) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Event) => void
}

export class WebSocketService {
  private ws: WebSocket | null = null
  private wsUrl: string
  private eventId: string
  private viewType: WebSocketViewType
  private token: string | null
  private handlers: WebSocketEventHandlers = {}
  private pingInterval: number | null = null
  private reconnectTimeout: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second

  constructor(
    wsUrl: string,
    eventId: string,
    viewType: WebSocketViewType,
    token: string | null = null
  ) {
    this.wsUrl = wsUrl
    this.eventId = eventId
    this.viewType = viewType
    this.token = token
  }

  setHandlers(handlers: WebSocketEventHandlers) {
    console.log('Setting WebSocket handlers:', Object.keys(handlers))
    this.handlers = handlers
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected')
      return
    }

    const params = new URLSearchParams({
      event_id: this.eventId,
      view: this.viewType
    })

    if (this.token) {
      params.append('token', this.token)
    }

    const url = `${this.wsUrl}?${params.toString()}`
    console.log('Connecting to WebSocket URL:', url)

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.reconnectDelay = 1000
        this.startPing()
        this.handlers.onConnected?.()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('WebSocket message received:', message.type, message)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.stopPing()
        this.handlers.onDisconnected?.()
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.handlers.onError?.(error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.attemptReconnect()
    }
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('Handling message type:', message.type)
    switch (message.type) {
      case 'full_state':
        console.log('Calling onFullState handler with data:', message.data)
        this.handlers.onFullState?.(message.data)
        break
      case 'delta':
        this.handlers.onDelta?.(message)
        break
      case 'pong':
        // Pong received, connection is alive
        break
      default:
        console.warn('Unknown message type:', message)
    }
  }

  private startPing() {
    this.stopPing() // Clear any existing interval
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000) // Ping every 30 seconds
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect()
    }, delay)
  }

  send(message: WebSocketOutboundMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message)
      console.log('Sending WebSocket message:', message.type, messageStr)
      this.ws.send(messageStr)
    } else {
      console.warn('WebSocket not connected, cannot send message. ReadyState:', this.ws?.readyState)
    }
  }

  requestResync() {
    console.log('Requesting resync...')
    this.send({ type: 'request_resync' })
  }

  disconnect() {
    this.stopPing()
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}