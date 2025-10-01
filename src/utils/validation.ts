// Form validation utilities

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, one uppercase, one lowercase, one number
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true }
}

/**
 * Validate time format (HH:MM)
 */
export function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * Validate stage name (not empty, max length)
 */
export function validateStageName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Stage name is required' }
  }
  if (name.length > 50) {
    return { valid: false, message: 'Stage name must be 50 characters or less' }
  }
  return { valid: true }
}

/**
 * Validate act type (not empty)
 */
export function validateActType(actType: string): { valid: boolean; message?: string } {
  if (!actType || actType.trim().length === 0) {
    return { valid: false, message: 'Act type is required' }
  }
  return { valid: true }
}

/**
 * Validate estimated minutes (positive number, reasonable range)
 */
export function validateEstimatedMinutes(minutes: number): { valid: boolean; message?: string } {
  if (minutes <= 0) {
    return { valid: false, message: 'Estimated time must be greater than 0' }
  }
  if (minutes > 60) {
    return { valid: false, message: 'Estimated time cannot exceed 60 minutes' }
  }
  return { valid: true }
}

/**
 * Validate event name
 */
export function validateEventName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Event name is required' }
  }
  if (name.length > 100) {
    return { valid: false, message: 'Event name must be 100 characters or less' }
  }
  return { valid: true }
}

/**
 * Validate date format (YYYY-MM-DD) and not in the past
 */
export function validateEventDate(dateString: string): { valid: boolean; message?: string } {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return { valid: false, message: 'Invalid date format (use YYYY-MM-DD)' }
  }

  // Compare date strings directly to avoid timezone issues
  const todayString = new Date().toISOString().split('T')[0]

  if (dateString < todayString) {
    return { valid: false, message: 'Event date cannot be in the past' }
  }

  return { valid: true }
}