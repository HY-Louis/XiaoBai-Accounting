/**
 * Tests for src/main/database.ts
 * 测试数据库核心操作：分类管理、记账记录增删查、月度统计。
 *
 * 说明：sql.js 是"纯 JavaScript 版 SQLite"（不需要安装数据库软件），
 * 所以能在 Node 测试环境中直接运行，测试数据存放在系统临时目录，不会污染真实数据。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  openDatabase,
  closeDatabase,
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addExpense,
  getExpenses,
  deleteExpense,
  getMonthlyStats,
} from './database'

let tempDir: string

beforeAll(async () => {
  // 在系统临时目录下建一个专用文件夹，测试完自动删除，不影响真实数据
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaobai-accounting-test-'))
  await openDatabase(tempDir)
})

afterAll(() => {
  closeDatabase()
  fs.rmSync(tempDir, { recursive: true, force: true })
})

// ============================================================
// openDatabase / getAllCategories — 打开数据库并同步预设分类
// ============================================================
describe('数据库初始化与预设分类', () => {
  it('打开数据库后能查询到预设分类（种子数据已写入）', () => {
    const cats = getAllCategories()
    expect(cats.length).toBeGreaterThan(0)
  })

  it('预设分类包含支出大类"餐饮"（id=food）', () => {
    const food = getAllCategories().find(c => c.id === 'food')
    expect(food).toBeDefined()
    expect(food?.name).toBe('餐饮')
    expect(food?.isDefault).toBe(1)
  })

  it('预设分类同时包含收入大类"工资"（id=income-salary）', () => {
    const salary = getAllCategories().find(c => c.id === 'income-salary')
    expect(salary).toBeDefined()
    expect(salary?.type).toBe('income')
  })
})

// ============================================================
// addCategory / updateCategory / deleteCategory — 自定义分类管理
// ============================================================
describe('分类增删改查', () => {
  it('新增一级大类：返回新记录，sortOrder 为现有大类最大排序号 + 1', () => {
    // 说明：收入大类从 1 重新编号（如 income-salary 的 sortOrder 是 1），
    // 所以新支出大类的排序号 = MAX(全部一级大类 sortOrder) + 1
    const maxSort = Math.max(...getAllCategories().filter(c => c.parentId === null).map(c => c.sortOrder))
    const newCat = addCategory('测试大类', '🧪')
    expect(newCat.id).toBeTruthy()
    expect(newCat.parentId).toBeNull()
    expect(newCat.sortOrder).toBe(maxSort + 1)
    expect(newCat.isDefault).toBe(0)

    const found = getAllCategories().find(c => c.id === newCat.id)
    expect(found).toBeDefined()
    expect(found?.name).toBe('测试大类')
  })

  it('新增二级子类：parentId 指向父大类', () => {
    const newSub = addCategory('测试子类', '🔬', 'food')
    expect(newSub.parentId).toBe('food')
    const found = getAllCategories().find(c => c.id === newSub.id)
    expect(found?.parentId).toBe('food')
  })

  it('修改分类：返回 true，名称和图标已更新', () => {
    const cat = addCategory('待改名', '✏️')
    const result = updateCategory(cat.id, '已改名', '🆕')
    expect(result).toBe(true)
    const found = getAllCategories().find(c => c.id === cat.id)
    expect(found?.name).toBe('已改名')
    expect(found?.icon).toBe('🆕')
  })

  it('修改不存在的分类：返回 false', () => {
    expect(updateCategory('no-such-id', 'x', 'x')).toBe(false)
  })

  it('删除分类（软删除）：返回 true，且查询列表不再出现', () => {
    const cat = addCategory('待删除', '🗑️')
    const result = deleteCategory(cat.id)
    expect(result).toBe(true)
    expect(getAllCategories().find(c => c.id === cat.id)).toBeUndefined()
  })

  it('删除不存在的分类：返回 false', () => {
    expect(deleteCategory('no-such-id')).toBe(false)
  })
})

// ============================================================
// addExpense / getExpenses / deleteExpense — 记账记录
// ============================================================
describe('记账记录的增删查', () => {
  it('新增支出记录后能查询到，字段完整', () => {
    const expense = addExpense({
      amount: 1250,
      categoryId: 'food',
      subcategoryId: 'food-meal',
      type: 'expense',
      note: '午餐',
      expenseDate: '2026-07-01',
    })
    expect(expense.id).toBeTruthy()
    const list = getExpenses()
    const found = list.find(e => e.id === expense.id)
    expect(found?.amount).toBe(1250)
    expect(found?.categoryId).toBe('food')
    expect(found?.subcategoryId).toBe('food-meal')
    expect(found?.note).toBe('午餐')
    expect(found?.expenseDate).toBe('2026-07-01')
    expect(found?.deletedAt).toBeNull()
  })

  it('新增收入记录：type 为 income', () => {
    const income = addExpense({
      amount: 100000,
      categoryId: 'income-salary',
      subcategoryId: 'income-salary-monthly',
      type: 'income',
      note: '7月工资',
      expenseDate: '2026-07-10',
    })
    const found = getExpenses().find(e => e.id === income.id)
    expect(found?.type).toBe('income')
    expect(found?.amount).toBe(100000)
  })

  it('按月份过滤：只返回该月的记录', () => {
    addExpense({
      amount: 500,
      categoryId: 'transport',
      subcategoryId: 'transport-metro',
      type: 'expense',
      note: '8月地铁',
      expenseDate: '2026-08-03',
    })
    const july = getExpenses('2026-07')
    const aug = getExpenses('2026-08')
    // 7月的记录 expenseDate 全是 07-xx，8月的全是 08-xx
    expect(july.every(e => e.expenseDate.startsWith('2026-07'))).toBe(true)
    expect(aug.every(e => e.expenseDate.startsWith('2026-08'))).toBe(true)
    // 无数据月份返回空数组
    expect(getExpenses('2020-01')).toEqual([])
  })

  it('按日期倒序排列：最近的日期排在最前面', () => {
    const list = getExpenses()
    for (let i = 0; i < list.length - 1; i++) {
      expect(list[i].expenseDate >= list[i + 1].expenseDate).toBe(true)
    }
  })

  it('删除记录（软删除）：返回 true，列表不再出现', () => {
    const expense = addExpense({
      amount: 100,
      categoryId: 'other',
      subcategoryId: 'other-misc',
      type: 'expense',
      note: '待删除',
      expenseDate: '2026-07-15',
    })
    const result = deleteExpense(expense.id)
    expect(result).toBe(true)
    expect(getExpenses().find(e => e.id === expense.id)).toBeUndefined()
  })

  it('删除不存在的记录：返回 false', () => {
    expect(deleteExpense('no-such-expense')).toBe(false)
  })
})

// ============================================================
// getMonthlyStats — 月度统计（图表数据源）
// ============================================================
describe('月度统计 getMonthlyStats', () => {
  it('统计有数据的月份：总额、分类占比、每日趋势都正确', () => {
    // 前面已插入：午餐 1250 分、7月工资 100000 分、待删除 100 分（已删，不应计入）
    const stats = getMonthlyStats(2026, 7)

    // 支出 = 1250（收入不计入支出）
    expect(stats.totalExpense).toBe(1250)
    // 收入 = 100000
    expect(stats.totalIncome).toBe(100000)
    // 记录数：只统计未删除的（1250 支出 + 100000 收入 = 2 条）
    expect(stats.recordCount).toBe(2)

    // 分类统计（饼图）：支出按大类分组，food 应占 100%
    const foodStat = stats.byCategory.find(c => c.categoryId === 'food')
    expect(foodStat?.amount).toBe(1250)
    expect(foodStat?.percentage).toBe(100)

    // 每日趋势（柱状图）：07-01 支出 1250
    const dayStat = stats.byDay.find(d => d.date === '2026-07-01')
    expect(dayStat?.amount).toBe(1250)
  })

  it('统计无数据的月份：各项金额为 0', () => {
    const stats = getMonthlyStats(2020, 1)
    expect(stats.totalExpense).toBe(0)
    expect(stats.totalIncome).toBe(0)
    expect(stats.recordCount).toBe(0)
    expect(stats.byCategory).toEqual([])
    expect(stats.byDay).toEqual([])
  })
})
