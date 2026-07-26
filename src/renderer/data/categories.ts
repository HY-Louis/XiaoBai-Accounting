import type { PrimaryCategory } from '../types'

/**
 * Default expense category system (2-level hierarchy).
 *
 * Categories are designed for Chinese daily life spending patterns.
 * Each primary category has a set of subcategories.
 */
export const defaultCategories: PrimaryCategory[] = [
  {
    id: 'food',
    name: '餐饮饮食',
    icon: '🍽️',
    sortOrder: 1,
    isDefault: true,
    subcategories: [
      { id: 'food-breakfast', name: '早餐', icon: '🥣', parentId: 'food', sortOrder: 1, isDefault: true },
      { id: 'food-lunch', name: '午餐', icon: '🍱', parentId: 'food', sortOrder: 2, isDefault: true },
      { id: 'food-dinner', name: '晚餐', icon: '🍚', parentId: 'food', sortOrder: 3, isDefault: true },
      { id: 'food-snacks', name: '零食饮料', icon: '🍿', parentId: 'food', sortOrder: 4, isDefault: true },
      { id: 'food-coffee', name: '咖啡奶茶', icon: '☕', parentId: 'food', sortOrder: 5, isDefault: true },
      { id: 'food-delivery', name: '外卖', icon: '🛵', parentId: 'food', sortOrder: 6, isDefault: true },
      { id: 'food-gathering', name: '聚餐请客', icon: '🥘', parentId: 'food', sortOrder: 7, isDefault: true },
      { id: 'food-groceries', name: '买菜食材', icon: '🥬', parentId: 'food', sortOrder: 8, isDefault: true },
    ],
  },
  {
    id: 'transport',
    name: '交通出行',
    icon: '🚗',
    sortOrder: 2,
    isDefault: true,
    subcategories: [
      { id: 'transport-metro', name: '公交地铁', icon: '🚇', parentId: 'transport', sortOrder: 1, isDefault: true },
      { id: 'transport-taxi', name: '出租车/网约车', icon: '🚕', parentId: 'transport', sortOrder: 2, isDefault: true },
      { id: 'transport-fuel', name: '加油充电', icon: '⛽', parentId: 'transport', sortOrder: 3, isDefault: true },
      { id: 'transport-parking', name: '停车费', icon: '🅿️', parentId: 'transport', sortOrder: 4, isDefault: true },
      { id: 'transport-train', name: '火车高铁', icon: '🚄', parentId: 'transport', sortOrder: 5, isDefault: true },
      { id: 'transport-flight', name: '飞机票', icon: '✈️', parentId: 'transport', sortOrder: 6, isDefault: true },
      { id: 'transport-bike', name: '共享单车', icon: '🚲', parentId: 'transport', sortOrder: 7, isDefault: true },
      { id: 'transport-bus', name: '长途汽车', icon: '🚌', parentId: 'transport', sortOrder: 8, isDefault: true },
    ],
  },
  {
    id: 'shopping',
    name: '购物消费',
    icon: '🛍️',
    sortOrder: 3,
    isDefault: true,
    subcategories: [
      { id: 'shopping-clothes', name: '衣服鞋帽', icon: '👔', parentId: 'shopping', sortOrder: 1, isDefault: true },
      { id: 'shopping-electronics', name: '数码电子', icon: '📱', parentId: 'shopping', sortOrder: 2, isDefault: true },
      { id: 'shopping-daily', name: '日用品', icon: '🧴', parentId: 'shopping', sortOrder: 3, isDefault: true },
      { id: 'shopping-beauty', name: '美妆护肤', icon: '💄', parentId: 'shopping', sortOrder: 4, isDefault: true },
      { id: 'shopping-home', name: '家居装饰', icon: '🪴', parentId: 'shopping', sortOrder: 5, isDefault: true },
      { id: 'shopping-pets', name: '宠物用品', icon: '🐱', parentId: 'shopping', sortOrder: 6, isDefault: true },
      { id: 'shopping-jewelry', name: '珠宝首饰', icon: '💍', parentId: 'shopping', sortOrder: 7, isDefault: true },
      { id: 'shopping-bags', name: '箱包配饰', icon: '👜', parentId: 'shopping', sortOrder: 8, isDefault: true },
    ],
  },
  {
    id: 'housing',
    name: '住房居家',
    icon: '🏠',
    sortOrder: 4,
    isDefault: true,
    subcategories: [
      { id: 'housing-rent', name: '房租/房贷', icon: '🏡', parentId: 'housing', sortOrder: 1, isDefault: true },
      { id: 'housing-utilities', name: '水电煤气', icon: '💡', parentId: 'housing', sortOrder: 2, isDefault: true },
      { id: 'housing-property', name: '物业费', icon: '🏢', parentId: 'housing', sortOrder: 3, isDefault: true },
      { id: 'housing-internet', name: '网络通讯', icon: '📶', parentId: 'housing', sortOrder: 4, isDefault: true },
      { id: 'housing-heating', name: '取暖费', icon: '🔥', parentId: 'housing', sortOrder: 5, isDefault: true },
      { id: 'housing-repair', name: '维修保养', icon: '🔧', parentId: 'housing', sortOrder: 6, isDefault: true },
      { id: 'housing-cleaning', name: '保洁家政', icon: '🧹', parentId: 'housing', sortOrder: 7, isDefault: true },
    ],
  },
  {
    id: 'entertainment',
    name: '娱乐休闲',
    icon: '🎮',
    sortOrder: 5,
    isDefault: true,
    subcategories: [
      { id: 'entertainment-movies', name: '电影演出', icon: '🎬', parentId: 'entertainment', sortOrder: 1, isDefault: true },
      { id: 'entertainment-fitness', name: '运动健身', icon: '🏋️', parentId: 'entertainment', sortOrder: 2, isDefault: true },
      { id: 'entertainment-games', name: '游戏充值', icon: '🎮', parentId: 'entertainment', sortOrder: 3, isDefault: true },
      { id: 'entertainment-travel', name: '旅游度假', icon: '🏖️', parentId: 'entertainment', sortOrder: 4, isDefault: true },
      { id: 'entertainment-ktv', name: 'KTV酒吧', icon: '🎤', parentId: 'entertainment', sortOrder: 5, isDefault: true },
      { id: 'entertainment-books', name: '书籍杂志', icon: '📖', parentId: 'entertainment', sortOrder: 6, isDefault: true },
      { id: 'entertainment-streaming', name: '视频会员', icon: '📺', parentId: 'entertainment', sortOrder: 7, isDefault: true },
    ],
  },
  {
    id: 'health',
    name: '医疗健康',
    icon: '💊',
    sortOrder: 6,
    isDefault: true,
    subcategories: [
      { id: 'health-doctor', name: '看病挂号', icon: '🏥', parentId: 'health', sortOrder: 1, isDefault: true },
      { id: 'health-medicine', name: '药品购买', icon: '💊', parentId: 'health', sortOrder: 2, isDefault: true },
      { id: 'health-checkup', name: '体检保健', icon: '🩺', parentId: 'health', sortOrder: 3, isDefault: true },
      { id: 'health-dental', name: '牙科眼科', icon: '🦷', parentId: 'health', sortOrder: 4, isDefault: true },
      { id: 'health-devices', name: '医疗器械', icon: '🩻', parentId: 'health', sortOrder: 5, isDefault: true },
    ],
  },
  {
    id: 'education',
    name: '教育学习',
    icon: '📚',
    sortOrder: 7,
    isDefault: true,
    subcategories: [
      { id: 'education-training', name: '培训课程', icon: '👨‍🏫', parentId: 'education', sortOrder: 1, isDefault: true },
      { id: 'education-books', name: '书籍教材', icon: '📚', parentId: 'education', sortOrder: 2, isDefault: true },
      { id: 'education-exam', name: '考试报名', icon: '📝', parentId: 'education', sortOrder: 3, isDefault: true },
      { id: 'education-stationery', name: '文具用品', icon: '✏️', parentId: 'education', sortOrder: 4, isDefault: true },
      { id: 'education-subscription', name: '在线订阅', icon: '💻', parentId: 'education', sortOrder: 5, isDefault: true },
    ],
  },
  {
    id: 'social',
    name: '人情往来',
    icon: '🎁',
    sortOrder: 8,
    isDefault: true,
    subcategories: [
      { id: 'social-redpacket', name: '红包礼金', icon: '🧧', parentId: 'social', sortOrder: 1, isDefault: true },
      { id: 'social-treating', name: '请客送礼', icon: '🎁', parentId: 'social', sortOrder: 2, isDefault: true },
      { id: 'social-donation', name: '慈善捐款', icon: '💝', parentId: 'social', sortOrder: 3, isDefault: true },
      { id: 'social-parents', name: '孝敬父母', icon: '👨‍👩‍👧', parentId: 'social', sortOrder: 4, isDefault: true },
      { id: 'social-wedding', name: '婚丧嫁娶', icon: '💒', parentId: 'social', sortOrder: 5, isDefault: true },
    ],
  },
  {
    id: 'finance',
    name: '金融保险',
    icon: '💰',
    sortOrder: 9,
    isDefault: true,
    subcategories: [
      { id: 'finance-insurance', name: '保险缴费', icon: '🛡️', parentId: 'finance', sortOrder: 1, isDefault: true },
      { id: 'finance-interest', name: '贷款利息', icon: '🏦', parentId: 'finance', sortOrder: 2, isDefault: true },
      { id: 'finance-fees', name: '手续费/服务费', icon: '🧾', parentId: 'finance', sortOrder: 3, isDefault: true },
    ],
  },
  {
    id: 'other',
    name: '其他支出',
    icon: '📦',
    sortOrder: 10,
    isDefault: true,
    subcategories: [
      { id: 'other-shipping', name: '快递邮寄', icon: '📦', parentId: 'other', sortOrder: 1, isDefault: true },
      { id: 'other-misc', name: '其他', icon: '📌', parentId: 'other', sortOrder: 2, isDefault: true },
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
export function getSubcategory(subId: string): { category: PrimaryCategory; sub: typeof category.subcategories[0] } | undefined {
  for (const cat of defaultCategories) {
    const sub = cat.subcategories.find(s => s.id === subId)
    if (sub) return { category: cat, sub }
  }
  return undefined
}
