import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import type { Expense, CategoryRow, MonthlyStats, CategoryStat, DailyStat } from '../renderer/types'
import { defaultCategories, defaultIncomeCategories } from '../renderer/data/categories'
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
      type TEXT DEFAULT 'expense',
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
      type TEXT DEFAULT 'expense',
      note TEXT DEFAULT '',
      expense_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `)

  // Migration: add type column if not exists (for existing databases)
  try { db.run('ALTER TABLE categories ADD COLUMN type TEXT DEFAULT \'expense\'') } catch (_) { /* column already exists */ }
  try { db.run('ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT \'expense\'') } catch (_) { /* column already exists */ }
  db.run('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)')
  db.run('CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON expenses(deleted_at)')

  saveToDisk()

  // Always re-seed default categories (preserves user-created ones)
  seedDefaultCategories()
  return db
}

function seedDefaultCategories(): void {
  if (!db) return

  // Delete old defaults — use exec() for reliable execution
  db.exec('DELETE FROM categories WHERE is_default = 1')

  const ts = now()

  // Helper to insert a category tree with a given type
  function insertTree(categories: typeof defaultCategories, type: string) {
    for (const cat of categories) {
      const stmt = db!.prepare(
        'INSERT INTO categories (id, name, icon, parent_id, sort_order, is_default, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)'
      )
      stmt.bind([cat.id, cat.name, cat.icon, null, cat.sortOrder, type, ts, ts])
      stmt.step()
      stmt.free()

      for (const sub of cat.subcategories) {
        const s2 = db!.prepare(
          'INSERT INTO categories (id, name, icon, parent_id, sort_order, is_default, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)'
        )
        s2.bind([sub.id, sub.name, sub.icon, sub.parentId, sub.sortOrder, type, ts, ts])
        s2.step()
        s2.free()
      }
    }
  }

  insertTree(defaultCategories, 'expense')
  insertTree(defaultIncomeCategories, 'income')
  saveToDisk()

  // Verify
  const count = queryAll<{ cnt: number }>('SELECT COUNT(*) as cnt FROM categories WHERE parent_id IS NULL AND deleted_at IS NULL')
  console.log('[seedDefaultCategories] Primary categories:', count[0]?.cnt)
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
  return queryAll<CategoryRow>(
    `SELECT id, name, icon, type,
            parent_id AS parentId,
            sort_order AS sortOrder,
            is_default AS isDefault,
            created_at AS createdAt,
            updated_at AS updatedAt,
            deleted_at AS deletedAt
     FROM categories WHERE deleted_at IS NULL ORDER BY sort_order`
  )
}

export function addCategory(name: string, icon: string, parentId?: string | null): CategoryRow {
  if (!db) throw new Error('DB not opened')
  const id = uuidv4()
  const ts = now()

  // Get the next sort_order for this level
  const r = queryAll<{ maxSort: number }>(
    parentId
      ? 'SELECT COALESCE(MAX(sort_order), 0) as maxSort FROM categories WHERE parent_id = ? AND deleted_at IS NULL'
      : 'SELECT COALESCE(MAX(sort_order), 0) as maxSort FROM categories WHERE parent_id IS NULL AND deleted_at IS NULL',
    parentId ? [parentId] : []
  )
  const sortOrder = (r[0]?.maxSort || 0) + 1

  const stmt = db.prepare(
    'INSERT INTO categories (id, name, icon, parent_id, sort_order, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  stmt.bind([id, name, icon, parentId || null, sortOrder, 0, ts, ts])
  stmt.step()
  stmt.free()
  saveToDisk()

  return { id, name, icon, parentId: parentId || null, sortOrder, isDefault: 0, createdAt: ts, updatedAt: ts, deletedAt: null }
}

export function updateCategory(id: string, name: string, icon: string): boolean {
  if (!db) throw new Error('DB not opened')

  // Check if category exists
  const checkStmt = db.prepare('SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL')
  checkStmt.bind([id])
  const exists = checkStmt.step()
  checkStmt.free()

  if (!exists) return false

  const ts = now()
  const updStmt = db.prepare('UPDATE categories SET name = ?, icon = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
  updStmt.bind([name, icon, ts, id])
  updStmt.step()
  const rowsAffected = db.getRowsModified()
  updStmt.free()
  saveToDisk()

  return rowsAffected > 0
}

export function deleteCategory(id: string): boolean {
  if (!db) throw new Error('DB not opened')

  // Check if category exists
  const checkStmt = db.prepare('SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL')
  checkStmt.bind([id])
  const exists = checkStmt.step()
  checkStmt.free()

  if (!exists) return false

  // Soft delete
  const ts = now()
  const delStmt = db.prepare('UPDATE categories SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
  delStmt.bind([ts, ts, id])
  delStmt.step()
  const rowsAffected = db.getRowsModified()
  delStmt.free()
  saveToDisk()

  return rowsAffected > 0
}

export function addExpense(e: { amount: number; categoryId: string; subcategoryId: string; type: string; note: string; expenseDate: string }): Expense {
  const id = uuidv4()
  const ts = now()
  exec(
    'INSERT INTO expenses (id, amount, category_id, subcategory_id, type, note, expense_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, e.amount, e.categoryId, e.subcategoryId, e.type, e.note, e.expenseDate, ts, ts]
  )
  return { id, ...e, createdAt: ts, updatedAt: ts, deletedAt: null } as Expense
}

export function getExpenses(month?: string): Expense[] {
  const sql = `SELECT id, amount, type,
                      category_id AS categoryId,
                      subcategory_id AS subcategoryId,
                      note,
                      expense_date AS expenseDate,
                      created_at AS createdAt,
                      updated_at AS updatedAt,
                      deleted_at AS deletedAt
               FROM expenses WHERE deleted_at IS NULL`
  if (month) {
    return queryAll<Expense>(
      `${sql} AND strftime('%Y-%m', expense_date) = ? ORDER BY expense_date DESC, created_at DESC`,
      [month]
    )
  }
  return queryAll<Expense>(`${sql} ORDER BY expense_date DESC, created_at DESC`)
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

  const t = queryAll<{ total: number; count: number; totalExpense: number; totalIncome: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total,
            COALESCE(SUM(CASE WHEN type = 'expense' OR type IS NULL THEN amount ELSE 0 END), 0) as totalExpense,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
            COUNT(*) as count
     FROM expenses WHERE deleted_at IS NULL AND strftime('%Y-%m', expense_date) = ?`, [m]
  )
  const totalAmount = t[0]?.totalExpense || 0
  const totalIncome = t[0]?.totalIncome || 0

  const byCategory = queryAll<CategoryStat>(
    `SELECT e.category_id as categoryId, c.name as categoryName, c.icon as categoryIcon, COALESCE(SUM(e.amount), 0) as amount
     FROM expenses e JOIN categories c ON e.category_id = c.id
     WHERE e.deleted_at IS NULL AND (e.type = 'expense' OR e.type IS NULL)
       AND strftime('%Y-%m', e.expense_date) = ?
     GROUP BY e.category_id ORDER BY amount DESC`, [m]
  )
  for (const item of byCategory) {
    item.percentage = totalAmount > 0 ? Math.round((item.amount / totalAmount) * 10000) / 100 : 0
  }

  const byDay = queryAll<DailyStat>(
    `SELECT expense_date as date, COALESCE(SUM(amount), 0) as amount FROM expenses
     WHERE deleted_at IS NULL AND (type = 'expense' OR type IS NULL)
       AND strftime('%Y-%m', expense_date) = ?
     GROUP BY expense_date ORDER BY expense_date ASC`, [m]
  )

  return { totalAmount, totalExpense: totalAmount, totalIncome, recordCount: t[0]?.count || 0, byCategory, byDay }
}
