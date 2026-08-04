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

/**
 * 打开（或创建）本地 SQLite 数据库文件。
 * 这是 App 启动时最先调用的函数——如果数据库文件还不存在，会自动创建一个新的；
 * 如果已经存在，则打开已有文件。打开后会自动建表、执行升级迁移、同步预设分类。
 *
 * @param appDataPath 数据存放目录（通常是系统 AppData 目录下的项目文件夹）
 * @returns 数据库连接对象
 */
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

  // 数据库升级迁移：为旧版本数据库添加 type 列（区分"支出"和"收入"）
  // 为什么用 try/catch 而不是 IF NOT EXISTS？
  // 因为 SQLite 的 ALTER TABLE 不支持 "ADD COLUMN IF NOT EXISTS" 语法，
  // 所以只能先尝试添加，如果列已经存在则会报错，我们忽略这个错误。
  // 这是一次性迁移，后续启动不会再执行（列已经存在就不会进 catch）。
  try { db.run('ALTER TABLE categories ADD COLUMN type TEXT DEFAULT \'expense\'') } catch (_) { /* 列已存在，无需操作 */ }
  try { db.run('ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT \'expense\'') } catch (_) { /* 列已存在，无需操作 */ }
  db.run('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)')
  db.run('CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON expenses(deleted_at)')

  saveToDisk()

  // 每次启动时同步预设分类数据（保证预设分类是最新的）：
  // 1. 删除所有标记为"预设"（is_default=1）的分类
  // 2. 重新插入代码中定义的最新预设分类
  // 注意：用户自己创建的分类（is_default=0）不受影响，不会被删除
  seedDefaultCategories()
  return db
}

/**
 * 同步预设分类数据：先清空旧预设分类，再插入最新的预设分类定义。
 * 用户自己创建的分类（is_default=0）不会被删除。
 */
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

/**
 * 关闭数据库连接。关闭前会自动把内存中的数据保存到磁盘文件。
 */
export function closeDatabase(): void {
  if (db) { saveToDisk(); db.close(); db = null }
}

/**
 * 执行 SQL 查询并返回所有匹配的行。
 * `<T>` 是 TypeScript 的类型占位符——就像填空题的空格，调用时指定"返回什么形状的数据"，
 * 这样后续写代码时就有自动补全和拼写错误检查。
 * 例如：queryAll<{ name: string }>('SELECT name FROM ...') → 结果里每行都有 name 属性。
 */
function queryAll<T>(sql: string, params: (string | number | null)[] = []): T[] {
  if (!db) throw new Error('DB not opened')
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results: T[] = []
  while (stmt.step()) results.push(stmt.getAsObject() as unknown as T)
  stmt.free()
  return results
}

/**
 * 执行不返回结果的 SQL 语句（如 INSERT、UPDATE、DELETE），执行后自动保存到磁盘。
 * 所有修改数据的操作都应该走这个函数或 db.run()，以保证数据持久化。
 */
function exec(sql: string, params: (string | number | null)[] = []): void {
  if (!db) throw new Error('DB not opened')
  db.run(sql, params)
  saveToDisk()
}

/**
 * 查询所有分类（包括支出分类和收入分类），按排序顺序返回。
 * 已删除的分类（deleted_at 不为空）会自动过滤掉。
 */
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

/**
 * 新增一个自定义分类（一级大类或二级子类）。
 * @param name 分类名称
 * @param icon 分类图标（emoji）
 * @param parentId 如果是子类，传入父类 ID；如果是大类，传 null
 * @returns 新创建的分类记录
 */
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

  // type 字段与数据库 DEFAULT 'expense' 一致（新建分类默认是支出类）
  return { id, name, icon, parentId: parentId || null, sortOrder, isDefault: 0, type: 'expense', createdAt: ts, updatedAt: ts, deletedAt: null }
}

/**
 * 修改分类的名称和图标。先检查分类是否存在，不存在则返回 false。
 * @returns 是否修改成功（true=成功，false=分类不存在或已被删除）
 */
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

/**
 * 软删除分类（标记为已删除，而不是真的从数据库里抹掉）。
 * 这样做的好处：万一误删了还能恢复，而且关联的账单记录不会断掉。
 * @returns 是否删除成功（true=成功，false=分类不存在或已被删除）
 */
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

/**
 * 新增一条记账记录（支出或收入）。
 * @param e.amount 金额（单位：分），比如 12.50 元传 1250
 * @param e.type 'expense'（支出）或 'income'（收入）
 * @returns 创建好的记账记录，包含自动生成的 ID 和时间戳
 */
export function addExpense(e: { amount: number; categoryId: string; subcategoryId: string; type: string; note: string; expenseDate: string }): Expense {
  const id = uuidv4()
  const ts = now()
  exec(
    'INSERT INTO expenses (id, amount, category_id, subcategory_id, type, note, expense_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, e.amount, e.categoryId, e.subcategoryId, e.type, e.note, e.expenseDate, ts, ts]
  )
  return { id, ...e, createdAt: ts, updatedAt: ts, deletedAt: null } as Expense
}

/**
 * 查询记账记录列表。如果指定了月份（格式 "YYYY-MM"），只返回该月的数据。
 * 结果按日期倒序排列（最新的在最上面），已删除的记录自动过滤。
 */
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

/**
 * 软删除一条记账记录（标记为已删除，不是真的抹掉数据）。
 * 这样做的好处：万一误删了还能恢复。
 * @returns 是否删除成功
 */
export function deleteExpense(id: string): boolean {
  if (!db) throw new Error('DB not opened')
  const ts = now()
  db.run('UPDATE expenses SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL', [ts, ts, id])
  saveToDisk()
  return db.getRowsModified() > 0
}

/**
 * 获取某个月的统计数据，用于统计页面的图表展示。
 * 返回内容包括：
 *  - 当月总支出 / 总收入
 *  - 按大类分组的支出金额和占比（饼图用）
 *  - 每天支出趋势（柱状图用）
 */
export function getMonthlyStats(year: number, month: number): MonthlyStats {
  // 构造月份字符串用于 SQLite 的 strftime 匹配，格式必须是 "YYYY-MM"
  // 例如：year=2026, month=7 → "2026-07"
  const monthKey = `${year}-${String(month).padStart(2, '0')}`

  const t = queryAll<{ total: number; count: number; totalExpense: number; totalIncome: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total,
            COALESCE(SUM(CASE WHEN type = 'expense' OR type IS NULL THEN amount ELSE 0 END), 0) as totalExpense,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
            COUNT(*) as count
     FROM expenses WHERE deleted_at IS NULL AND strftime('%Y-%m', expense_date) = ?`, [monthKey]
  )
  const totalAmount = t[0]?.totalExpense || 0
  const totalIncome = t[0]?.totalIncome || 0

  const byCategory = queryAll<CategoryStat>(
    `SELECT e.category_id as categoryId, c.name as categoryName, c.icon as categoryIcon, COALESCE(SUM(e.amount), 0) as amount
     FROM expenses e JOIN categories c ON e.category_id = c.id
     WHERE e.deleted_at IS NULL AND (e.type = 'expense' OR e.type IS NULL)
       AND strftime('%Y-%m', e.expense_date) = ?
     GROUP BY e.category_id ORDER BY amount DESC`, [monthKey]
  )
  for (const item of byCategory) {
    item.percentage = totalAmount > 0 ? Math.round((item.amount / totalAmount) * 10000) / 100 : 0
  }

  const byDay = queryAll<DailyStat>(
    `SELECT expense_date as date, COALESCE(SUM(amount), 0) as amount FROM expenses
     WHERE deleted_at IS NULL AND (type = 'expense' OR type IS NULL)
       AND strftime('%Y-%m', expense_date) = ?
     GROUP BY expense_date ORDER BY expense_date ASC`, [monthKey]
  )

  return { totalAmount, totalExpense: totalAmount, totalIncome, recordCount: t[0]?.count || 0, byCategory, byDay }
}
