import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import type { Expense, CategoryRow, MonthlyStats, CategoryStat, DailyStat } from '../renderer/types'
import { defaultCategories } from '../renderer/data/categories'
import { now } from '../renderer/utils/date'

let db: SqlJsDatabase | null = null
let dbPath: string

function saveToDisk(): void {
  if (!db) return
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

export async function openDatabase(appDataPath: string): Promise<SqlJsDatabase> {
  if (db) return db

  dbPath = path.join(appDataPath, 'xiaobai-accounting.db')
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true })
  }

  const SQL = await initSqlJs()

  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath))
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📌',
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      category_id TEXT NOT NULL,
      subcategory_id TEXT,
      note TEXT DEFAULT '',
      expense_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `)
  db.run('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)')
  db.run('CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON expenses(deleted_at)')

  saveToDisk()

  const r = db.exec('SELECT COUNT(*) as count FROM categories')
  if (!r[0]?.values[0]?.[0]) {
    seedDefaultCategories()
  }
  return db
}

function seedDefaultCategories(): void {
  if (!db) return
  const ts = now()
  for (const cat of defaultCategories) {
    db.run(
      'INSERT INTO categories (id, name, icon, parent_id, sort_order, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      [cat.id, cat.name, cat.icon, null, cat.sortOrder, ts, ts]
    )
    for (const sub of cat.subcategories) {
      db.run(
        'INSERT INTO categories (id, name, icon, parent_id, sort_order, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
        [sub.id, sub.name, sub.icon, sub.parentId, sub.sortOrder, ts, ts]
      )
    }
  }
  saveToDisk()
}

export function closeDatabase(): void {
  if (db) { saveToDisk(); db.close(); db = null }
}

function queryAll<T>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('DB not opened')
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results: T[] = []
  while (stmt.step()) results.push(stmt.getAsObject() as unknown as T)
  stmt.free()
  return results
}

function exec(sql: string, params: any[] = []): void {
  if (!db) throw new Error('DB not opened')
  db.run(sql, params)
  saveToDisk()
}

export function getAllCategories(): CategoryRow[] {
  return queryAll<CategoryRow>('SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY sort_order')
}

export function addExpense(e: { amount: number; categoryId: string; subcategoryId: string; note: string; expenseDate: string }): Expense {
  const id = uuidv4()
  const ts = now()
  exec(
    'INSERT INTO expenses (id, amount, category_id, subcategory_id, note, expense_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, e.amount, e.categoryId, e.subcategoryId, e.note, e.expenseDate, ts, ts]
  )
  return { id, ...e, createdAt: ts, updatedAt: ts, deletedAt: null } as Expense
}

export function getExpenses(month?: string): Expense[] {
  if (month) {
    return queryAll<Expense>(
      `SELECT * FROM expenses WHERE deleted_at IS NULL AND strftime('%Y-%m', expense_date) = ? ORDER BY expense_date DESC, created_at DESC`,
      [month]
    )
  }
  return queryAll<Expense>('SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY expense_date DESC, created_at DESC')
}

export function deleteExpense(id: string): boolean {
  if (!db) throw new Error('DB not opened')
  const ts = now()
  db.run('UPDATE expenses SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL', [ts, ts, id])
  saveToDisk()
  return db.getRowsModified() > 0
}

export function getMonthlyStats(year: number, month: number): MonthlyStats {
  const m = `${year}-${String(month).padStart(2, '0')}`

  const t = queryAll<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM expenses WHERE deleted_at IS NULL AND strftime('%Y-%m', expense_date) = ?`, [m]
  )
  const totalAmount = t[0]?.total || 0

  const byCategory = queryAll<CategoryStat>(
    `SELECT e.category_id as categoryId, c.name as categoryName, c.icon as categoryIcon, COALESCE(SUM(e.amount), 0) as amount
     FROM expenses e JOIN categories c ON e.category_id = c.id
     WHERE e.deleted_at IS NULL AND strftime('%Y-%m', e.expense_date) = ?
     GROUP BY e.category_id ORDER BY amount DESC`, [m]
  )
  for (const item of byCategory) {
    item.percentage = totalAmount > 0 ? Math.round((item.amount / totalAmount) * 10000) / 100 : 0
  }

  const byDay = queryAll<DailyStat>(
    `SELECT expense_date as date, COALESCE(SUM(amount), 0) as amount FROM expenses
     WHERE deleted_at IS NULL AND strftime('%Y-%m', expense_date) = ? GROUP BY expense_date ORDER BY expense_date ASC`, [m]
  )

  return { totalAmount, recordCount: t[0]?.count || 0, byCategory, byDay }
}
