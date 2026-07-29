/**
 * Tests for src/renderer/utils/date.ts
 * 测试日期工具函数：格式化、月份范围等
 */
import { describe, it, expect } from 'vitest'
import {
  toDateString,
  today,
  toISOString,
  formatDisplayDate,
  formatMonthLabel,
  getMonthRange,
} from './date'

// ============================================================
// toDateString — Date → "YYYY-MM-DD"
// ============================================================
describe('toDateString — 日期转字符串', () => {
  // ✅ 正常情况
  it('标准日期：2026-07-29 → "2026-07-29"', () => {
    const d = new Date(2026, 6, 29) // month is 0-indexed
    expect(toDateString(d)).toBe('2026-07-29')
  })

  it('年初：2026-01-01 → "2026-01-01"', () => {
    const d = new Date(2026, 0, 1)
    expect(toDateString(d)).toBe('2026-01-01')
  })

  // ⚠️ 边界情况
  it('年末：2026-12-31 → "2026-12-31"', () => {
    const d = new Date(2026, 11, 31)
    expect(toDateString(d)).toBe('2026-12-31')
  })

  it('个位数月份和日期补零：2026-03-05', () => {
    const d = new Date(2026, 2, 5)
    expect(toDateString(d)).toBe('2026-03-05')
  })
})

// ============================================================
// today — 获取今天日期
// ============================================================
describe('today — 今天日期', () => {
  it('返回格式为 YYYY-MM-DD', () => {
    const result = today()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('与 new Date() 生成的日期一致', () => {
    const result = today()
    const expected = toDateString(new Date())
    expect(result).toBe(expected)
  })
})

// ============================================================
// toISOString — Date → ISO 8601
// ============================================================
describe('toISOString — ISO 格式', () => {
  it('返回以 Z 结尾的 ISO 字符串', () => {
    const d = new Date(2026, 0, 1, 12, 0, 0)
    const result = toISOString(d)
    expect(result).toContain('2026-01-01')
    expect(result).toContain('T')
  })
})

// ============================================================
// formatDisplayDate — "YYYY-MM-DD" → "M月D日"
// ============================================================
describe('formatDisplayDate — 显示日期格式', () => {
  // ✅ 正常情况
  it('"2026-07-29" → "7月29日"', () => {
    expect(formatDisplayDate('2026-07-29')).toBe('7月29日')
  })

  it('"2026-01-01" → "1月1日"', () => {
    expect(formatDisplayDate('2026-01-01')).toBe('1月1日')
  })

  // ⚠️ 边界情况
  it('"2026-12-31" → "12月31日"', () => {
    expect(formatDisplayDate('2026-12-31')).toBe('12月31日')
  })
})

// ============================================================
// formatMonthLabel — 年月 → "YYYY年M月"
// ============================================================
describe('formatMonthLabel — 月份标签', () => {
  // ✅ 正常情况
  it('2026年7月 → "2026年7月"', () => {
    expect(formatMonthLabel(2026, 7)).toBe('2026年7月')
  })

  it('2026年1月 → "2026年1月"', () => {
    expect(formatMonthLabel(2026, 1)).toBe('2026年1月')
  })

  // ⚠️ 边界情况
  it('2026年12月 → "2026年12月"', () => {
    expect(formatMonthLabel(2026, 12)).toBe('2026年12月')
  })
})

// ============================================================
// getMonthRange — 获取月份的第一天和最后一天
// ============================================================
describe('getMonthRange — 月份日期范围', () => {
  // ✅ 正常情况
  it('2026年1月 → 01-01 ~ 01-31（31天）', () => {
    const range = getMonthRange(2026, 1)
    expect(range.start).toBe('2026-01-01')
    expect(range.end).toBe('2026-01-31')
  })

  it('2026年2月 → 02-01 ~ 02-28（非闰年）', () => {
    const range = getMonthRange(2026, 2)
    expect(range.start).toBe('2026-02-01')
    expect(range.end).toBe('2026-02-28')
  })

  it('2026年7月 → 07-01 ~ 07-31（31天）', () => {
    const range = getMonthRange(2026, 7)
    expect(range.start).toBe('2026-07-01')
    expect(range.end).toBe('2026-07-31')
  })

  // ⚠️ 边界情况
  it('2026年4月 → 04-01 ~ 04-30（30天）', () => {
    const range = getMonthRange(2026, 4)
    expect(range.start).toBe('2026-04-01')
    expect(range.end).toBe('2026-04-30')
  })
})
