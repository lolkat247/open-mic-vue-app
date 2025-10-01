// API service for HTTP calls to the backend

import type {
  Event,
  CreateEventRequest,
  CreateEventResponse,
  GetEventsResponse,
  CreateSlotRequest,
  CreateSlotResponse,
  UpdateSlotRequest,
  WithdrawSlotRequest,
  ReorderSlotsRequest,
  APIError
} from '../types/api'

export class APIService {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async apiCall<T>(
    endpoint: string,
    options: RequestInit & { authenticated?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    }

    // Add Authorization header if authenticated and token is available
    if (this.token && options.authenticated !== false) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      if (!response.ok) {
        const errorData: APIError = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Event Management APIs (Authenticated)

  async createEvent(data: CreateEventRequest): Promise<CreateEventResponse> {
    return this.apiCall<CreateEventResponse>('/events', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getEvents(): Promise<GetEventsResponse> {
    return this.apiCall<GetEventsResponse>('/events')
  }

  async getEvent(eventId: string): Promise<{ event: Event }> {
    return this.apiCall<{ event: Event }>(`/events/${eventId}`)
  }

  async getEventByCode(code: string): Promise<{ event: Event }> {
    return this.apiCall<{ event: Event }>(`/events/by-code/${code}`, {
      authenticated: false // Public endpoint
    })
  }

  async updateEvent(eventId: string, updates: Partial<CreateEventRequest>): Promise<{ event: Event }> {
    return this.apiCall<{ event: Event }>(`/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  async deleteEvent(eventId: string): Promise<{ message: string }> {
    return this.apiCall<{ message: string }>(`/events/${eventId}`, {
      method: 'DELETE'
    })
  }

  async pauseSignups(eventId: string): Promise<{ message: string }> {
    return this.apiCall<{ message: string }>(`/events/${eventId}/signups/pause`, {
      method: 'POST'
    })
  }

  async resumeSignups(eventId: string): Promise<{ message: string }> {
    return this.apiCall<{ message: string }>(`/events/${eventId}/signups/resume`, {
      method: 'POST'
    })
  }

  // Slot Management APIs (Public)

  async createSlot(eventId: string, data: CreateSlotRequest): Promise<CreateSlotResponse> {
    return this.apiCall<CreateSlotResponse>(`/events/${eventId}/slots`, {
      method: 'POST',
      body: JSON.stringify(data),
      authenticated: false
    })
  }

  async updateSlot(
    eventId: string,
    slotId: string,
    data: UpdateSlotRequest
  ): Promise<{ slot: any }> {
    return this.apiCall<{ slot: any }>(`/events/${eventId}/slots/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      authenticated: false
    })
  }

  async withdrawSlot(
    eventId: string,
    slotId: string,
    data: WithdrawSlotRequest
  ): Promise<{ message: string }> {
    return this.apiCall<{ message: string }>(`/events/${eventId}/slots/${slotId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify(data),
      authenticated: false
    })
  }

  // Staff Queue Management APIs (Authenticated)

  async startPerformance(eventId: string, slotId: string): Promise<{ slot: any }> {
    return this.apiCall<{ slot: any }>(`/events/${eventId}/slots/${slotId}/start`, {
      method: 'POST'
    })
  }

  async completePerformance(eventId: string, slotId: string): Promise<{ slot: any }> {
    return this.apiCall<{ slot: any }>(`/events/${eventId}/slots/${slotId}/complete`, {
      method: 'POST'
    })
  }

  async markNoShow(eventId: string, slotId: string): Promise<{ slot: any }> {
    return this.apiCall<{ slot: any }>(`/events/${eventId}/slots/${slotId}/noshow`, {
      method: 'POST'
    })
  }

  async reinstateSlot(eventId: string, slotId: string): Promise<{ slot: any }> {
    return this.apiCall<{ slot: any }>(`/events/${eventId}/slots/${slotId}/reinstate`, {
      method: 'POST'
    })
  }

  async reorderQueue(eventId: string, data: ReorderSlotsRequest): Promise<{ message: string }> {
    return this.apiCall<{ message: string }>(`/events/${eventId}/slots/reorder`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async sendBanner(
    eventId: string,
    data: { message: string; level?: 'info' | 'warning' | 'error' }
  ): Promise<{ message: string }> {
    return this.apiCall<{ message: string }>(`/events/${eventId}/banner`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}