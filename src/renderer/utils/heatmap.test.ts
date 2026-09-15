/**
 * Tests for src/renderer/utils/heatmap.ts
 * 测试月历热力图的计算：格子数量、周一对齐、金额落格、颜色深度
 */
import { describe, it, expect } from 'vitest'
import { intensityLevel, buildHeatmapCells } from './heatmap'
import type { DailyStat } from '../types'

// ============================================================
// intensityLevel — 金额 → 0～4 颜色深度
// ============================================================
describe('intensityLevel — 颜色深度等级', () => {
  // ✅ 正常情况
  it('当月最高的那天 → 最深的第 4 级', () => {
    expect(intensityLevel(1000, 1000)).toBe(4)
  })

  it('最高值的一半 → 第 3 级（开平方：√0.5×4 ≈ 2.83，向上取整）', () => {
    expect(intensityLevel(500, 1000)).toBe(3)
  })

  it('最高值的 25% → 第 2 级（按比例算只有第 1 级，开平方后层次更分明）', () => {
    expect(intensityLevel(250, 1000)).toBe(2)
  })

  it('哪怕只花了一点点，也至少是第 1 级（有花钱就要看得见）', () => {
    expect(intensityLevel(10, 1000)).toBe(1)
  })

  // ⚠️ 边界情况
  it('没花钱 → 0 级', () => {
    expect(intensityLevel(0, 1000)).toBe(0)
  })

  it('整月都没记录（最高值为 0）→ 0 级，不会除以零', () => {
    expect(intensityLevel(500, 0)).toBe(0)
  })

  it('金额越大等级不会变小（单调不减）', () => {
    const amounts = [1, 50, 100, 250, 400, 600, 800, 1000]
    const levels = amounts.map(a => intensityLevel(a, 1000))
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1])
    }
  })
})

// ============================================================
// buildHeatmapCells — 生成整月格子
// ============================================================
describe('buildHeatmapCells — 月历格子', () => {
  // ✅ 正常情况
  it('2026年9月：30 个格子，日期从 09-01 到 09-30 连续', () => {
    const { cells } = buildHeatmapCells(2026, 9, [])
    expect(cells).toHaveLength(30)
    expect(cells[0].date).toBe('2026-09-01')
    expect(cells[29].date).toBe('2026-09-30')
    cells.forEach((cell, i) => expect(cell.day).toBe(i + 1))
  })

  it('2026年9月1日是周二 → 周一开头需要 1 个空格', () => {
    expect(buildHeatmapCells(2026, 9, []).leadingBlanks).toBe(1)
  })

  it('金额按日期落到对应格子，其他日子为 0', () => {
    const byDay: DailyStat[] = [
      { date: '2026-09-03', amount: 1250 },
      { date: '2026-09-10', amount: 5000 },
    ]
    const { cells, maxAmount } = buildHeatmapCells(2026, 9, byDay)
    expect(maxAmount).toBe(5000)
    expect(cells[2]).toMatchObject({ date: '2026-09-03', amount: 1250, level: 2 })
    expect(cells[9]).toMatchObject({ date: '2026-09-10', amount: 5000, level: 4 })
    expect(cells[0]).toMatchObject({ date: '2026-09-01', amount: 0, level: 0 })
  })

  // ⚠️ 边界情况
  it('2026年6月1日是周一 → 0 个空格', () => {
    expect(buildHeatmapCells(2026, 6, []).leadingBlanks).toBe(0)
  })

  it('2026年11月1日是周日 → 6 个空格（周日排在最后一列）', () => {
    expect(buildHeatmapCells(2026, 11, []).leadingBlanks).toBe(6)
  })

  it('闰年 2028年2月 → 29 个格子；平年 2026年2月 → 28 个', () => {
    expect(buildHeatmapCells(2028, 2, []).cells).toHaveLength(29)
    expect(buildHeatmapCells(2026, 2, []).cells).toHaveLength(28)
  })

  it('整月没有记录 → maxAmount 为 0，所有格子都是 0 级', () => {
    const { cells, maxAmount } = buildHeatmapCells(2026, 9, [])
    expect(maxAmount).toBe(0)
    expect(cells.every(c => c.amount === 0 && c.level === 0)).toBe(true)
  })
})

// ============================================================
// intensityLevel — 异常输入与上限保护（补充）
// ============================================================
describe('intensityLevel — 异常输入与上限保护', () => {
  // ❌ 异常情况
  it('负数金额（非法输入）→ 0 级，不会算出负等级', () => {
    expect(intensityLevel(-100, 1000)).toBe(0)
  })

  it('最高值为负数（非法输入）→ 0 级，不会开平方出 NaN', () => {
    expect(intensityLevel(500, -1000)).toBe(0)
  })

  it('金额超过最高值（理论上不该出现）→ 封顶在第 4 级，不会出现第 5 级', () => {
    expect(intensityLevel(2000, 1000)).toBe(4)
    expect(intensityLevel(Number.MAX_SAFE_INTEGER, 1)).toBe(4)
  })

  // ⚠️ 边界情况
  it('刚好踩在等级分界线上：最高值的 1/16 → 第 1 级，再多 1 分 → 第 2 级', () => {
    // √(1/16) × 4 = 1，正好落在第 1 级；再多一点点就向上取整到第 2 级
    expect(intensityLevel(100, 1600)).toBe(1)
    expect(intensityLevel(101, 1600)).toBe(2)
  })

  it('最高值的 9/16 → 第 3 级，再多 1 分 → 第 4 级', () => {
    // √(9/16) × 4 = 3
    expect(intensityLevel(900, 1600)).toBe(3)
    expect(intensityLevel(901, 1600)).toBe(4)
  })

  it('返回值一定是 0～4 之间的整数（随机抽样 200 组金额验证）', () => {
    for (let i = 0; i < 200; i++) {
      const max = Math.floor(Math.random() * 1_000_000) + 1
      const amount = Math.floor(Math.random() * max)
      const level = intensityLevel(amount, max)
      expect(Number.isInteger(level)).toBe(true)
      expect(level).toBeGreaterThanOrEqual(0)
      expect(level).toBeLessThanOrEqual(4)
    }
  })
})

// ============================================================
// buildHeatmapCells — 月份边界与结构不变量（补充）
// ============================================================
describe('buildHeatmapCells — 月份边界与结构检查', () => {
  // ⚠️ 边界情况
  it('12 月（年末）→ 31 个格子，最后一格是 12-31', () => {
    const { cells, leadingBlanks } = buildHeatmapCells(2026, 12, [])
    expect(cells).toHaveLength(31)
    expect(cells[30].date).toBe('2026-12-31')
    // 2026年12月1日是周二 → 1 个空格
    expect(leadingBlanks).toBe(1)
  })

  it('1 月（年初）→ 31 个格子，日期前缀正确带上新年份', () => {
    const { cells, leadingBlanks } = buildHeatmapCells(2027, 1, [])
    expect(cells).toHaveLength(31)
    expect(cells[0].date).toBe('2027-01-01')
    // 2027年1月1日是周五 → 4 个空格
    expect(leadingBlanks).toBe(4)
  })

  it('一年 12 个月：空格数都在 0～6 之间，且"空格 + 格子"不超过 6 行（42 格）', () => {
    for (let month = 1; month <= 12; month++) {
      const { cells, leadingBlanks } = buildHeatmapCells(2026, month, [])
      expect(leadingBlanks).toBeGreaterThanOrEqual(0)
      expect(leadingBlanks).toBeLessThanOrEqual(6)
      expect(leadingBlanks + cells.length).toBeLessThanOrEqual(42)
    }
  })

  it('每个格子的 day 和 date 末两位一致（不会出现日期与号数错位）', () => {
    const { cells } = buildHeatmapCells(2026, 9, [])
    cells.forEach(cell => {
      expect(Number(cell.date.slice(8))).toBe(cell.day)
      expect(cell.date.startsWith('2026-09-')).toBe(true)
    })
  })

  it('只有一天花了钱 → 那天是第 4 级（它就是当月最高），其余全是 0 级', () => {
    const { cells, maxAmount } = buildHeatmapCells(2026, 9, [{ date: '2026-09-15', amount: 1 }])
    expect(maxAmount).toBe(1)
    expect(cells[14]).toMatchObject({ date: '2026-09-15', amount: 1, level: 4 })
    expect(cells.filter(c => c.level > 0)).toHaveLength(1)
  })

  it('每天花的一样多 → 全部都是第 4 级（颜色深浅是相对当月最高值的）', () => {
    const byDay: DailyStat[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      amount: 3000,
    }))
    const { cells } = buildHeatmapCells(2026, 9, byDay)
    expect(cells.every(c => c.level === 4 && c.amount === 3000)).toBe(true)
  })

  it('金额差距悬殊（房租 50 万分 vs 早餐 500 分）→ 早餐那天仍显示为第 1 级，不会被"压没"', () => {
    const byDay: DailyStat[] = [
      { date: '2026-09-01', amount: 500_000 },
      { date: '2026-09-02', amount: 500 },
    ]
    const { cells } = buildHeatmapCells(2026, 9, byDay)
    expect(cells[0].level).toBe(4)
    expect(cells[1].level).toBe(1)
  })

  // ❌ 异常情况
  it('传入不属于当月的日期 → 不会多出格子，也不会错落到当月某天', () => {
    const byDay: DailyStat[] = [
      { date: '2026-08-31', amount: 9999 },
      { date: '2026-10-01', amount: 8888 },
    ]
    const { cells } = buildHeatmapCells(2026, 9, byDay)
    expect(cells).toHaveLength(30)
    expect(cells.every(c => c.amount === 0)).toBe(true)
  })

  it('传入的记录金额全是 0 → maxAmount 为 0，所有格子 0 级', () => {
    const byDay: DailyStat[] = [
      { date: '2026-09-01', amount: 0 },
      { date: '2026-09-02', amount: 0 },
    ]
    const { cells, maxAmount } = buildHeatmapCells(2026, 9, byDay)
    expect(maxAmount).toBe(0)
    expect(cells.every(c => c.level === 0)).toBe(true)
  })
})
