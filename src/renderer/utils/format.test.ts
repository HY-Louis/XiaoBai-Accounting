/**
 * Tests for src/renderer/utils/format.ts
 * 测试金额格式化工具函数：分↔元的转换
 */
import { describe, it, expect } from 'vitest'
import {
  formatFen,
  fenToYuan,
  parseAmountToFen,
  fenToInputValue,
} from './format'

// ============================================================
// formatFen — 分 → 显示字符串 "¥X.XX"
// ============================================================
describe('formatFen — 分转显示金额', () => {
  // ✅ 正常情况
  it('整数金额：1250分 → "¥12.50"', () => {
    expect(formatFen(1250)).toBe('¥12.50')
  })

  it('零元：0分 → "¥0.00"', () => {
    expect(formatFen(0)).toBe('¥0.00')
  })

  it('大额金额自动千分位：100000分 → "¥1,000.00"', () => {
    expect(formatFen(100000)).toBe('¥1,000.00')
  })

  // ⚠️ 边界情况
  it('最小非零金额：1分 → "¥0.01"', () => {
    expect(formatFen(1)).toBe('¥0.01')
  })

  it('99分 → "¥0.99"', () => {
    expect(formatFen(99)).toBe('¥0.99')
  })

  it('100分 → "¥1.00"', () => {
    expect(formatFen(100)).toBe('¥1.00')
  })
})

// ============================================================
// fenToYuan — 分 → 纯数字字符串 "X.XX"
// ============================================================
describe('fenToYuan — 分转数字字符串', () => {
  // ✅ 正常情况
  it('1250分 → "12.50"', () => {
    expect(fenToYuan(1250)).toBe('12.50')
  })

  it('0分 → "0.00"', () => {
    expect(fenToYuan(0)).toBe('0.00')
  })

  // ⚠️ 边界情况
  it('1分 → "0.01"', () => {
    expect(fenToYuan(1)).toBe('0.01')
  })

  it('99分 → "0.99"', () => {
    expect(fenToYuan(99)).toBe('0.99')
  })
})

// ============================================================
// parseAmountToFen — 用户输入 → 分（整数）
// ============================================================
describe('parseAmountToFen — 用户输入转分', () => {
  // ✅ 正常情况
  it('标准金额："12.50" → 1250', () => {
    expect(parseAmountToFen('12.50')).toBe(1250)
  })

  it('一位小数："12.5" → 1250', () => {
    expect(parseAmountToFen('12.5')).toBe(1250)
  })

  it('整数输入："12" → 1200', () => {
    expect(parseAmountToFen('12')).toBe(1200)
  })

  it('带"元"后缀："12.5元" → 1250', () => {
    expect(parseAmountToFen('12.5元')).toBe(1250)
  })

  it('带¥符号："¥12.5" → 1250', () => {
    expect(parseAmountToFen('¥12.5')).toBe(1250)
  })

  it('带空格：" 12.50 " → 1250', () => {
    expect(parseAmountToFen(' 12.50 ')).toBe(1250)
  })

  it('带千分位逗号："1,234.56" → 123456', () => {
    expect(parseAmountToFen('1,234.56')).toBe(123456)
  })

  // ⚠️ 边界情况
  it('零元："0" → 0', () => {
    expect(parseAmountToFen('0')).toBe(0)
  })

  it('零元带格式："0.00" → 0', () => {
    expect(parseAmountToFen('0.00')).toBe(0)
  })

  // ❌ 异常/非法输入
  it('空字符串 → null', () => {
    expect(parseAmountToFen('')).toBeNull()
  })

  it('纯空白 → null', () => {
    expect(parseAmountToFen('   ')).toBeNull()
  })

  it('非数字："abc" → null', () => {
    expect(parseAmountToFen('abc')).toBeNull()
  })

  it('负数："-100" → null', () => {
    expect(parseAmountToFen('-100')).toBeNull()
  })
})

// ============================================================
// fenToInputValue — 分 → 输入框显示值
// ============================================================
describe('fenToInputValue — 分转输入框值', () => {
  // ✅ 正常情况
  it('1250分 → "12.50"', () => {
    expect(fenToInputValue(1250)).toBe('12.50')
  })

  it('0分 → "0.00"', () => {
    expect(fenToInputValue(0)).toBe('0.00')
  })

  // ⚠️ 边界情况
  it('1分 → "0.01"', () => {
    expect(fenToInputValue(1)).toBe('0.01')
  })
})
