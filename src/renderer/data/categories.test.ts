/**
 * Tests for src/renderer/data/categories.ts
 * 测试预设分类数据：两级分类结构完整性 + 查询函数
 */
import { describe, it, expect } from 'vitest'
import {
  defaultCategories,
  defaultIncomeCategories,
  getPrimaryCategoryIds,
  getPrimaryCategory,
  getSubcategory,
} from './categories'

// ============================================================
// 数据完整性 — 两级分类结构检查
// ============================================================
describe('预设分类数据结构', () => {
  it('支出分类至少有 8 个一级大类', () => {
    expect(defaultCategories.length).toBeGreaterThanOrEqual(8)
  })

  it('所有一级大类的 id 不重复', () => {
    const ids = defaultCategories.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('每个一级大类至少包含 1 个子类', () => {
    for (const cat of defaultCategories) {
      expect(cat.subcategories.length, `大类 ${cat.id} 没有子类`).toBeGreaterThan(0)
    }
  })

  it('每个子类的 parentId 都指向自己的父大类', () => {
    for (const cat of defaultCategories) {
      for (const sub of cat.subcategories) {
        expect(sub.parentId).toBe(cat.id)
      }
    }
  })

  it('子类的 sortOrder 从 1 开始连续递增，且不重复', () => {
    for (const cat of defaultCategories) {
      const orders = cat.subcategories.map(s => s.sortOrder)
      expect(new Set(orders).size).toBe(orders.length)
      orders.forEach((o, i) => {
        expect(o, `大类 ${cat.id} 第 ${i + 1} 个子类排序号异常`).toBe(i + 1)
      })
    }
  })

  it('所有子类 id 全局唯一（跨大类不重复）', () => {
    const allSubIds = defaultCategories.flatMap(c => c.subcategories.map(s => s.id))
    expect(new Set(allSubIds).size).toBe(allSubIds.length)
  })

  it('收入分类也有完整结构（id 唯一、parentId 匹配）', () => {
    const ids = defaultIncomeCategories.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const cat of defaultIncomeCategories) {
      for (const sub of cat.subcategories) {
        expect(sub.parentId).toBe(cat.id)
      }
    }
  })
})

// ============================================================
// getPrimaryCategoryIds — 所有一级大类 ID
// ============================================================
describe('getPrimaryCategoryIds — 获取全部大类 ID', () => {
  // ✅ 正常情况
  it('返回的大类 ID 数量与 defaultCategories 一致', () => {
    expect(getPrimaryCategoryIds().length).toBe(defaultCategories.length)
  })

  it('包含常见大类（food、transport、shopping）', () => {
    const ids = getPrimaryCategoryIds()
    expect(ids).toContain('food')
    expect(ids).toContain('transport')
    expect(ids).toContain('shopping')
  })

  it('返回顺序与默认数据一致（按 sortOrder 排序）', () => {
    expect(getPrimaryCategoryIds()).toEqual(defaultCategories.map(c => c.id))
  })
})

// ============================================================
// getPrimaryCategory — 按 ID 查大类
// ============================================================
describe('getPrimaryCategory — 按 ID 查询大类', () => {
  // ✅ 正常情况
  it('查询存在的 id "food" 返回餐饮大类', () => {
    const cat = getPrimaryCategory('food')
    expect(cat).toBeDefined()
    expect(cat?.name).toBe('餐饮')
  })

  it('返回的对象包含子类列表', () => {
    const cat = getPrimaryCategory('transport')
    expect(cat?.subcategories.length).toBeGreaterThan(0)
  })

  // ❌ 异常情况
  it('查询不存在的 id 返回 undefined', () => {
    expect(getPrimaryCategory('nonexistent')).toBeUndefined()
  })

  // ⚠️ 边界情况
  it('查询空字符串返回 undefined', () => {
    expect(getPrimaryCategory('')).toBeUndefined()
  })
})

// ============================================================
// getSubcategory — 按子类 ID 查询（返回所属大类 + 子类）
// ============================================================
describe('getSubcategory — 按 ID 查询子类', () => {
  // ✅ 正常情况
  it('查询存在的子类 "food-meal" 返回三餐子类和所属大类', () => {
    const result = getSubcategory('food-meal')
    expect(result).toBeDefined()
    expect(result?.sub.name).toBe('三餐')
    expect(result?.category.name).toBe('餐饮')
  })

  it('子类与大类的关联正确（parentId 匹配）', () => {
    const result = getSubcategory('shopping-digital')
    expect(result?.sub.parentId).toBe(result?.category.id)
  })

  // ❌ 异常情况
  it('查询不存在的子类返回 undefined', () => {
    expect(getSubcategory('nonexistent-sub')).toBeUndefined()
  })

  // ⚠️ 边界情况
  it('收入分类的子类不在支出分类的查询范围内（返回 undefined）', () => {
    // income-salary-monthly 是收入分类的子类，getSubcategory 只查支出分类
    expect(getSubcategory('income-salary-monthly')).toBeUndefined()
  })
})
