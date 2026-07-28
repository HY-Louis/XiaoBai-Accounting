import type { PrimaryCategory } from '../types'

/**
 * Default expense categories (2-level hierarchy).
 * Simplified to 8 primary categories, each with practical subcategories.
 */
export const defaultCategories: PrimaryCategory[] = [
  {
    id: 'food',
    name: '餐饮',
    icon: '🍽️',
    sortOrder: 1,
    isDefault: true,
    subcategories: [
      { id: 'food-meal', name: '三餐', icon: '🍚', parentId: 'food', sortOrder: 1, isDefault: true },
      { id: 'food-snack', name: '夜宵', icon: '🌙', parentId: 'food', sortOrder: 2, isDefault: true },
      { id: 'food-fruit', name: '水果', icon: '🍎', parentId: 'food', sortOrder: 3, isDefault: true },
      { id: 'food-drink', name: '饮料', icon: '🧃', parentId: 'food', sortOrder: 4, isDefault: true },
      { id: 'food-delivery', name: '外卖', icon: '🛵', parentId: 'food', sortOrder: 5, isDefault: true },
      { id: 'food-gathering', name: '聚餐', icon: '🥘', parentId: 'food', sortOrder: 6, isDefault: true },
    ],
  },
  {
    id: 'transport',
    name: '交通',
    icon: '🚗',
    sortOrder: 2,
    isDefault: true,
    subcategories: [
      { id: 'transport-metro', name: '公交地铁', icon: '🚇', parentId: 'transport', sortOrder: 1, isDefault: true },
      { id: 'transport-taxi', name: '打车', icon: '🚕', parentId: 'transport', sortOrder: 2, isDefault: true },
      { id: 'transport-fuel', name: '加油充电', icon: '⛽', parentId: 'transport', sortOrder: 3, isDefault: true },
      { id: 'transport-parking', name: '停车', icon: '🅿️', parentId: 'transport', sortOrder: 4, isDefault: true },
      { id: 'transport-travel', name: '火车飞机', icon: '✈️', parentId: 'transport', sortOrder: 5, isDefault: true },
    ],
  },
  {
    id: 'shopping',
    name: '购物',
    icon: '🛍️',
    sortOrder: 3,
    isDefault: true,
    subcategories: [
      { id: 'shopping-clothes', name: '衣物鞋帽', icon: '👔', parentId: 'shopping', sortOrder: 1, isDefault: true },
      { id: 'shopping-digital', name: '数码电子', icon: '📱', parentId: 'shopping', sortOrder: 2, isDefault: true },
      { id: 'shopping-daily', name: '日用品', icon: '🧴', parentId: 'shopping', sortOrder: 3, isDefault: true },
      { id: 'shopping-beauty', name: '美妆护肤', icon: '💄', parentId: 'shopping', sortOrder: 4, isDefault: true },
      { id: 'shopping-home', name: '家居装饰', icon: '🪴', parentId: 'shopping', sortOrder: 5, isDefault: true },
    ],
  },
  {
    id: 'housing',
    name: '居家',
    icon: '🏠',
    sortOrder: 4,
    isDefault: true,
    subcategories: [
      { id: 'housing-rent', name: '房租/房贷', icon: '🏡', parentId: 'housing', sortOrder: 1, isDefault: true },
      { id: 'housing-utils', name: '水电煤气', icon: '💡', parentId: 'housing', sortOrder: 2, isDefault: true },
      { id: 'housing-property', name: '物业费', icon: '🏢', parentId: 'housing', sortOrder: 3, isDefault: true },
      { id: 'housing-internet', name: '网络通讯', icon: '📶', parentId: 'housing', sortOrder: 4, isDefault: true },
      { id: 'housing-repair', name: '维修保洁', icon: '🔧', parentId: 'housing', sortOrder: 5, isDefault: true },
    ],
  },
  {
    id: 'entertainment',
    name: '娱乐',
    icon: '🎮',
    sortOrder: 5,
    isDefault: true,
    subcategories: [
      { id: 'entertainment-movie', name: '电影演出', icon: '🎬', parentId: 'entertainment', sortOrder: 1, isDefault: true },
      { id: 'entertainment-sport', name: '运动健身', icon: '🏋️', parentId: 'entertainment', sortOrder: 2, isDefault: true },
      { id: 'entertainment-game', name: '游戏充值', icon: '🎮', parentId: 'entertainment', sortOrder: 3, isDefault: true },
      { id: 'entertainment-travel', name: '旅游度假', icon: '🏖️', parentId: 'entertainment', sortOrder: 4, isDefault: true },
      { id: 'entertainment-stream', name: '视频会员', icon: '📺', parentId: 'entertainment', sortOrder: 5, isDefault: true },
    ],
  },
  {
    id: 'health',
    name: '医疗',
    icon: '💊',
    sortOrder: 6,
    isDefault: true,
    subcategories: [
      { id: 'health-doctor', name: '看病挂号', icon: '🏥', parentId: 'health', sortOrder: 1, isDefault: true },
      { id: 'health-medicine', name: '药品购买', icon: '💊', parentId: 'health', sortOrder: 2, isDefault: true },
      { id: 'health-checkup', name: '体检保健', icon: '🩺', parentId: 'health', sortOrder: 3, isDefault: true },
    ],
  },
  {
    id: 'social',
    name: '人情',
    icon: '🎁',
    sortOrder: 7,
    isDefault: true,
    subcategories: [
      { id: 'social-gift', name: '红包礼金', icon: '🧧', parentId: 'social', sortOrder: 1, isDefault: true },
      { id: 'social-treat', name: '请客送礼', icon: '🎁', parentId: 'social', sortOrder: 2, isDefault: true },
      { id: 'social-parents', name: '孝敬父母', icon: '👨‍👩‍👧', parentId: 'social', sortOrder: 3, isDefault: true },
      { id: 'social-study', name: '学习培训', icon: '📚', parentId: 'social', sortOrder: 4, isDefault: true },
    ],
  },
  {
    id: 'other',
    name: '其他',
    icon: '📦',
    sortOrder: 8,
    isDefault: true,
    subcategories: [
      { id: 'other-insurance', name: '金融保险', icon: '💰', parentId: 'other', sortOrder: 1, isDefault: true },
      { id: 'other-shipping', name: '快递邮寄', icon: '📦', parentId: 'other', sortOrder: 2, isDefault: true },
      { id: 'other-misc', name: '其他', icon: '📌', parentId: 'other', sortOrder: 3, isDefault: true },
    ],
  },
]

/** Default income categories */
export const defaultIncomeCategories: PrimaryCategory[] = [
  {
    id: 'income-salary',
    name: '工资',
    icon: '💼',
    sortOrder: 1,
    isDefault: true,
    subcategories: [
      { id: 'income-salary-monthly', name: '月薪', icon: '💵', parentId: 'income-salary', sortOrder: 1, isDefault: true },
      { id: 'income-salary-bonus', name: '年终奖', icon: '🧧', parentId: 'income-salary', sortOrder: 2, isDefault: true },
      { id: 'income-salary-overtime', name: '加班费', icon: '⏰', parentId: 'income-salary', sortOrder: 3, isDefault: true },
    ],
  },
  {
    id: 'income-invest',
    name: '投资理财',
    icon: '💰',
    sortOrder: 2,
    isDefault: true,
    subcategories: [
      { id: 'income-invest-stock', name: '股票基金', icon: '📈', parentId: 'income-invest', sortOrder: 1, isDefault: true },
      { id: 'income-invest-interest', name: '利息分红', icon: '💎', parentId: 'income-invest', sortOrder: 2, isDefault: true },
    ],
  },
  {
    id: 'income-side',
    name: '兼职副业',
    icon: '💻',
    sortOrder: 3,
    isDefault: true,
    subcategories: [
      { id: 'income-side-parttime', name: '兼职', icon: '👨‍💻', parentId: 'income-side', sortOrder: 1, isDefault: true },
      { id: 'income-side-freelance', name: '自由职业', icon: '✍️', parentId: 'income-side', sortOrder: 2, isDefault: true },
    ],
  },
  {
    id: 'income-gift',
    name: '红包礼金',
    icon: '🎁',
    sortOrder: 4,
    isDefault: true,
    subcategories: [
      { id: 'income-gift-redpacket', name: '微信红包', icon: '🧧', parentId: 'income-gift', sortOrder: 1, isDefault: true },
      { id: 'income-gift-cash', name: '现金礼金', icon: '💝', parentId: 'income-gift', sortOrder: 2, isDefault: true },
    ],
  },
  {
    id: 'income-other',
    name: '其他收入',
    icon: '📦',
    sortOrder: 5,
    isDefault: true,
    subcategories: [
      { id: 'income-other-refund', name: '退款', icon: '↩️', parentId: 'income-other', sortOrder: 1, isDefault: true },
      { id: 'income-other-misc', name: '其他', icon: '📌', parentId: 'income-other', sortOrder: 2, isDefault: true },
    ],
  },
]

/** Get all primary category IDs */
export function getPrimaryCategoryIds(): string[] {
  return defaultCategories.map(c => c.id)
}

/** Get a primary category by ID */
export function getPrimaryCategory(id: string): PrimaryCategory | undefined {
  return defaultCategories.find(c => c.id === id)
}

/** Get a subcategory by ID */
export function getSubcategory(subId: string): { category: PrimaryCategory; sub: (typeof defaultCategories[0]['subcategories'])[0] } | undefined {
  for (const cat of defaultCategories) {
    const sub = cat.subcategories.find(s => s.id === subId)
    if (sub) return { category: cat, sub }
  }
  return undefined
}
