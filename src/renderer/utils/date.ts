/**
 * Date utility functions.
 */

/** Format a Date as YYYY-MM-DD string */
export function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Get today's date as YYYY-MM-DD */
export function today(): string {
  return toDateString(new Date())
}

/** Format a Date as ISO 8601 string (for DB timestamps) */
export function toISOString(date: Date): string {
  return date.toISOString()
}

/** Get current ISO 8601 timestamp */
export function now(): string {
  return new Date().toISOString()
}

/** Format date for display: "7月25日" */
export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** Format date for month selector: "2026年7月" */
export function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month}月`
}

/** Get the first and last day of a given month */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  // Get last day by going to the 0th day of next month
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}
