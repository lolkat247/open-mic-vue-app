// Time and ETA calculation utilities

/**
 * Format ISO timestamp to local time string (HH:MM)
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format ISO timestamp to local date string
 */
export function formatDate(isoString: string): string {
  // Parse date in local timezone to avoid UTC/local timezone issues
  // For date-only strings (YYYY-MM-DD), parse as local instead of UTC
  let date: Date
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    const parts = isoString.split('-').map(Number)
    const year = parts[0] ?? 0
    const month = parts[1] ?? 1
    const day = parts[2] ?? 1
    date = new Date(year, month - 1, day)
  } else {
    date = new Date(isoString)
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format minutes to human-readable duration (e.g., "5 min", "1 hr 30 min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`
}

/**
 * Calculate minutes between two ISO timestamps
 */
export function minutesBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60)
}

/**
 * Get relative time description (e.g., "in 5 minutes", "2 hours ago")
 */
export function getRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / 1000 / 60)

  if (diffMins < 0) {
    const absMins = Math.abs(diffMins)
    if (absMins < 60) {
      return `${absMins} min ago`
    }
    const hours = Math.floor(absMins / 60)
    return `${hours} hr ago`
  } else {
    if (diffMins < 60) {
      return `in ${diffMins} min`
    }
    const hours = Math.floor(diffMins / 60)
    return `in ${hours} hr`
  }
}

/**
 * Check if a time string (HH:MM) has passed for today
 */
export function hasTimePassed(timeString: string): boolean {
  const parts = timeString.split(':').map(Number)
  const hours = parts[0] || 0
  const minutes = parts[1] || 0
  const now = new Date()
  const targetTime = new Date()
  targetTime.setHours(hours, minutes, 0, 0)
  return now > targetTime
}

/**
 * Get current time as HH:MM string
 */
export function getCurrentTimeString(): string {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Parse time string (HH:MM) and date to ISO timestamp
 */
export function timeStringToISO(timeString: string, dateString?: string): string {
  const parts = timeString.split(':').map(Number)
  const hours = parts[0] || 0
  const minutes = parts[1] || 0
  const date = dateString ? new Date(dateString) : new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

/**
 * Format 24-hour time (HH:MM) to 12-hour format with AM/PM
 */
export function format12Hour(time24: string): string {
  const parts = time24.split(':').map(Number)
  const hours = parts[0] ?? 0
  const minutes = parts[1] ?? 0
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12 // Convert 0 to 12 for midnight
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}