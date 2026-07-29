// ============================================================
// Shared TypeScript Type Definitions for 小白记账
// ============================================================

/** A primary (level-1) expense category */
export interface PrimaryCategory {
  id: string
  name: string
  icon: string
  subcategories: Subcategory[]
  sortOrder: number
  isDefault: boolean
}

/** A subcategory (level-2) under a primary category */
export interface Subcategory {
  id: string
  name: string
  icon: string
  parentId: string
  sortOrder: number
  isDefault: boolean
}

/** A single expense/income record */
export interface Expense {
  id: string
  /** Amount in 分 (cents). e.g., ¥12.50 = 1250 */
  amount: number
  categoryId: string
  subcategoryId: string
  /** 'expense' or 'income' */
  type: string
  /** Optional note / memo */
  note: string
  /** Expense date in YYYY-MM-DD format */
  expenseDate: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/** A category row as stored in the database */
export interface CategoryRow {
  id: string
  name: string
  icon: string
  parentId: string | null
  sortOrder: number
  isDefault: number  // SQLite uses 0/1 for boolean
  type: string        // 'expense' | 'income'
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/** Monthly statistics summary */
export interface MonthlyStats {
  totalAmount: number    // in 分 (expense only, for backwards compat)
  totalExpense: number   // in 分
  totalIncome: number    // in 分
  recordCount: number
  byCategory: CategoryStat[]
  byDay: DailyStat[]
}

export interface CategoryStat {
  categoryId: string
  categoryName: string
  categoryIcon: string
  amount: number  // in 分
  percentage: number  // 0-100
}

export interface DailyStat {
  date: string  // YYYY-MM-DD
  amount: number  // in 分
}

/** Form data for adding/editing an expense */
export interface ExpenseFormData {
  amount: string  // User-typed string, parsed on submit
  categoryId: string
  subcategoryId: string
  note: string
  expenseDate: string
}

/** Available app pages (used by bottom nav and page routing) */
export type Page = 'add' | 'list' | 'stats' | 'manage' | 'game'

/** IPC channel names for type safety */
export const IPC_CHANNELS = {
  GET_EXPENSES: 'db:getExpenses',
  ADD_EXPENSE: 'db:addExpense',
  DELETE_EXPENSE: 'db:deleteExpense',
  GET_CATEGORIES: 'db:getCategories',
  ADD_CATEGORY: 'db:addCategory',
  UPDATE_CATEGORY: 'db:updateCategory',
  DELETE_CATEGORY: 'db:deleteCategory',
  GET_MONTHLY_STATS: 'db:getMonthlyStats',
} as const
