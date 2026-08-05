/**
 * Tests for src/renderer/api/db.ts
 * 测试渲染进程数据库 API 层：非 Electron 环境（如纯浏览器调试）下的降级行为。
 *
 * 说明：db.ts 通过 Electron IPC 与主进程通信。当不在 Electron 环境中运行时
 * （Node 测试环境没有 window.electronAPI），所有调用会返回"安全的空数据"，
 * 避免程序崩溃——这正是开发调试时打开浏览器也不会报错的原因。
 */
import { describe, it, expect } from 'vitest'
import {
  getCategories,
  addExpense,
  getExpenses,
  deleteExpense,
  getMonthlyStats,
  addCategory,
  updateCategory,
  deleteCategory,
} from './db'

// ============================================================
// 非 Electron 环境降级行为
// ============================================================
describe('非 Electron 环境下的 API 降级行为', () => {
  // ✅ 正常情况（降级设计本身就是要稳定返回空数据）
  it('getCategories 返回空数组', async () => {
    const result = await getCategories()
    expect(result).toEqual([])
  })

  it('getExpenses 不带月份参数返回空数组', async () => {
    expect(await getExpenses()).toEqual([])
  })

  it('getExpenses 带月份参数也返回空数组', async () => {
    expect(await getExpenses('2026-07')).toEqual([])
  })

  it('getMonthlyStats 返回零值统计对象', async () => {
    const result = await getMonthlyStats(2026, 7)
    expect(result.totalAmount).toBe(0)
    expect(result.recordCount).toBe(0)
    expect(result.byCategory).toEqual([])
    expect(result.byDay).toEqual([])
  })

  it('addExpense 返回 null（表示未保存）', async () => {
    const result = await addExpense({
      amount: 1250,
      categoryId: 'food',
      subcategoryId: 'food-meal',
      type: 'expense',
      note: '午餐',
      expenseDate: '2026-07-01',
    })
    expect(result).toBeNull()
  })

  it('deleteExpense 返回 false（表示未删除）', async () => {
    expect(await deleteExpense('any-id')).toBe(false)
  })

  // ⚠️ 边界情况：分类管理相关调用走 invoke 的默认分支，返回 null
  it('addCategory 返回 null', async () => {
    expect(await addCategory('测试', '🧪')).toBeNull()
  })

  it('updateCategory 返回 null', async () => {
    expect(await updateCategory('x', 'y', 'z')).toBeNull()
  })

  it('deleteCategory 返回 null', async () => {
    expect(await deleteCategory('x')).toBeNull()
  })
})
