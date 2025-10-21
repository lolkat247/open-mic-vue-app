// View-specific types and interfaces

export interface SignupFormData {
  stage_name: string
  act_type: string
  self_est_min: number
  slot_password: string
  confirm_password: string
  leave_by_at?: string
  extra_setup: boolean
  notes?: string
}

export interface ManageSlotFormData {
  self_est_min?: number
  notes?: string
  leave_by_at?: string
  extra_setup?: boolean
  slot_password: string
}

export interface SlotPasswordAuthData {
  slot_id: string
  slot_password: string
}

export interface EventFormData {
  name: string
  date: string
  curfew: string
  slot_duration_minutes: number
  setup_time_minutes: number
  max_slots_per_performer: number
  house_rules: string
}

export interface AppConfig {
  apiBaseUrl: string
  websocketUrl: string
  userPoolId: string
  userPoolClientId: string
  region: string
}

export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ToastMessage {
  severity: 'success' | 'info' | 'warn' | 'error'
  summary: string
  detail: string
  life?: number
}