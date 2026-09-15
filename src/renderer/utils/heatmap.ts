/**
 * 月历热力图的计算工具（纯函数，不含任何界面代码）。
 *
 * 把 getMonthlyStats() 返回的"每天花了多少"变成一张月历：
 * 每天一个格子，附带 0～4 的颜色深度等级——就像 GitHub 的提交热力图，
 * 只不过这里颜色越深代表那天花钱越多。
 */
import type { DailyStat } from '../types'
import { getMonthRange } from './date'

export type HeatLevel = 0 | 1 | 2 | 3 | 4

export interface HeatmapCell {
  /** YYYY-MM-DD */
  date: string
  /** Day of month, 1–31 */
  day: number
  /** Spending on that day, in 分 */
  amount: number
  level: HeatLevel
}

export interface HeatmapModel {
  /** Blank cells before day 1 so the grid starts on Monday */
  leadingBlanks: number
  cells: HeatmapCell[]
  /** Highest single-day spending in the month, in 分 */
  maxAmount: number
}

/**
 * 把金额换算成颜色深度（相对于当月最高的那一天）。
 *
 * 用的是"开平方"而不是简单按比例：如果某天交了 5000 元房租，
 * 按比例算其他日子全会被压成最浅色，看不出区别；
 * 开平方后，花到最高值 25% 的日子仍能落到第 2 级，层次更分明。
 */
export function intensityLevel(amount: number, max: number): HeatLevel {
  if (amount <= 0 || max <= 0) return 0
  const level = Math.ceil(Math.sqrt(amount / max) * 4)
  return Math.min(4, Math.max(1, level)) as HeatLevel
}

/** 生成某个月的全部格子。没有记录的日子金额记为 0。 */
export function buildHeatmapCells(year: number, month: number, byDay: DailyStat[]): HeatmapModel {
  const amountByDate = new Map(byDay.map(d => [d.date, d.amount]))
  const maxAmount = Math.max(0, ...byDay.map(d => d.amount))

  // getDay(): 0 = 周日 … 6 = 周六。加 6 取余，把周一变成 0。
  const leadingBlanks = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const daysInMonth = Number(getMonthRange(year, month).end.slice(8))
  const monthKey = `${year}-${String(month).padStart(2, '0')}`

  const cells: HeatmapCell[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${monthKey}-${String(day).padStart(2, '0')}`
    const amount = amountByDate.get(date) ?? 0
    cells.push({ date, day, amount, level: intensityLevel(amount, maxAmount) })
  }
  return { leadingBlanks, cells, maxAmount }
}
