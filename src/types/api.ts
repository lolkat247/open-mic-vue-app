// Core API types based on the backend API documentation

export type SlotStatus =
  | 'queued'
  | 'up_next'
  | 'setting_up'
  | 'performing'
  | 'completed'
  | 'no_show'
  | 'withdrawn'

export interface Event {
  event_id: string
  name: string
  date: string // ISO date string (YYYY-MM-DD)
  curfew: string // Time string (HH:MM)
  defaults: {
    slot_duration_minutes?: number
    setup_time_minutes?: number
    [key: string]: any
  }
  policies: {
    max_slots_per_performer?: number
    signup_deadline_hours?: number
    [key: string]: any
  }
  house_rules: string
  owner_user_id: string
  stats: {
    [key: string]: any
  }
  created_at: string // ISO timestamp
  signups_enabled?: boolean
  signups_paused_at?: string
  signups_paused_by?: string
  signups_resumed_at?: string
  signups_resumed_by?: string
}

export interface Slot {
  slot_id: string
  event_id: string
  stage_name: string
  act_type: string
  self_est_min: number
  leave_by_at?: string // Time string (HH:MM)
  extra_setup: boolean
  notes?: string
  created_at: string // ISO timestamp
  status: SlotStatus
  order_index?: number
  started_at?: string // ISO timestamp
  completed_at?: string // ISO timestamp
  setup_started_at?: string // ISO timestamp
  no_show_at?: string // ISO timestamp
  reinstated?: boolean
  reinstated_at?: string // ISO timestamp
}

export interface ETAUpdate {
  slot_id: string
  estimated_start_time: string // ISO timestamp
  estimated_wait_minutes: number
}

// API Request/Response types

export interface CreateEventRequest {
  name: string
  date: string
  curfew: string
  defaults?: {
    slot_duration_minutes?: number
    setup_time_minutes?: number
    [key: string]: any
  }
  policies?: {
    max_slots_per_performer?: number
    signup_deadline_hours?: number
    [key: string]: any
  }
  house_rules?: string
}

export interface CreateEventResponse {
  message: string
  event: Event
}

export interface GetEventsResponse {
  events: Event[]
}

export interface CreateSlotRequest {
  stage_name: string
  act_type: string
  self_est_min: number
  slot_password: string
  leave_by_at?: string
  extra_setup?: boolean
  notes?: string
  captcha_token?: string // For CAPTCHA verification
}

export interface CreateSlotResponse {
  message: string
  slot: Slot
}

export interface UpdateSlotRequest {
  self_est_min?: number
  notes?: string
  leave_by_at?: string
  extra_setup?: boolean
  slot_password: string // Required for authentication
}

export interface WithdrawSlotRequest {
  slot_password: string
}

export interface ReorderSlotsRequest {
  slot_orders: Array<{
    slot_id: string
    order_index: number
  }>
}

export interface APIError {
  error: string
}

// WebSocket message types

export type WebSocketViewType = 'staff' | 'projector' | 'public'

export type WebSocketMessageType = 'full_state' | 'delta' | 'banner' | 'ping' | 'pong' | 'request_resync'

export type BannerLevel = 'info' | 'warning' | 'error'

export type DeltaAction =
  | 'slot_created'
  | 'slot_updated'
  | 'slot_status_changed'
  | 'slot_deleted'
  | 'event_updated'
  | 'signups_paused'
  | 'signups_resumed'

export interface FullStateMessage {
  type: 'full_state'
  event_id: string
  view: WebSocketViewType
  data: {
    event: Event
    slots: Slot[]
    current_slot?: Slot
    eta_updates: ETAUpdate[]
  }
}

export interface DeltaMessage {
  type: 'delta'
  event_id: string
  action: DeltaAction
  data: {
    staff?: any
    projector?: any
    public?: any
  }
  timestamp: string
}

export interface BannerMessage {
  type: 'banner'
  event_id: string
  level: BannerLevel
  message: string
  auto_dismiss?: number // milliseconds
}

export interface PingMessage {
  type: 'ping'
}

export interface PongMessage {
  type: 'pong'
  timestamp: string
}

export interface RequestResyncMessage {
  type: 'request_resync'
}

export type WebSocketMessage =
  | FullStateMessage
  | DeltaMessage
  | BannerMessage
  | PongMessage

export type WebSocketOutboundMessage = PingMessage | RequestResyncMessage