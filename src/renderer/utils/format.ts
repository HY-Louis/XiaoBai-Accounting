/**
 * Currency formatting utilities.
 * All amounts are stored as INTEGER in 分 (fen/cents).
 * Display conversion (÷ 100) happens ONLY here, at the last moment.
 */

/**
 * Convert 分 (cents) to a display string.
 * e.g., 1250 → "¥12.50"
 *        100  → "¥1.00"
 *        99   → "¥0.99"
 */
export function formatFen(amountInFen: number): string {
  const yuan = amountInFen / 100
  return `¥${yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Convert 分 (cents) to a plain number string (no ¥ sign).
 * e.g., 1250 → "12.50"
 */
export function fenToYuan(amountInFen: number): string {
  return (amountInFen / 100).toFixed(2)
}

/**
 * Parse a user-input amount string into 分 (cents).
 * Accepts various formats: "12.5", "12.50", "12.5元", "¥12.5"
 * Returns null if the input cannot be parsed.
 */
export function parseAmountToFen(input: string): number | null {
  // Remove common non-numeric characters except decimal point
  const cleaned = input.replace(/[¥元\s,]/g, '').trim()
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 0) return null
  // Round to nearest 分 and convert
  return Math.round(num * 100)
}

/**
 * Format amount for display in input field.
 * e.g., 1250 → "12.50"
 */
export function fenToInputValue(amountInFen: number): string {
  return (amountInFen / 100).toFixed(2)
}
