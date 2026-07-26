/**
 * Renderer-side database API.
 * All calls go through Electron IPC to the main process,
 * which runs the actual SQLite operations.
 */
import type { Expense, CategoryRow, MonthlyStats } from '../types'

/** Check if running inside Electron (vs plain browser for dev) */
function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI
}

/** Call an IPC channel with arguments */
async function invoke(channel: string, ...args: unknown[]): Promise<unknown> {
  if (!isElectron()) {
    console.warn(`IPC call "${channel}" not available — not running in Electron`)
    return channel === 'db:getCategories' ? [] :
           channel === 'db:getExpenses' ? [] :
           channel === 'db:getMonthlyStats' ? { totalAmount: 0, recordCount: 0, byCategory: [], byDay: [] } :
           channel === 'db:addExpense' ? null :
           channel === 'db:deleteExpense' ? false :
           null
  }
  return window.electronAPI.invoke(channel, ...args)
}

/** Get all categories */
export async function getCategories(): Promise<CategoryRow[]> {
  return (await invoke('db:getCategories')) as CategoryRow[]
}

/** Add a new expense */
export async function addExpense(expense: {
  amount: number
  categoryId: string
  subcategoryId: string
  note: string
  expenseDate: string
}): Promise<Expense | null> {
  return (await invoke('db:addExpense', expense)) as Expense | null
}

/** Get expenses, optionally filtered by month ("YYYY-MM") */
export async function getExpenses(month?: string): Promise<Expense[]> {
  return (await invoke('db:getExpenses', month)) as Expense[]
}

/** Soft-delete an expense by ID */
export async function deleteExpense(id: string): Promise<boolean> {
  return (await invoke('db:deleteExpense', id)) as boolean
}

/** Get monthly statistics */
export async function getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
  return (await invoke('db:getMonthlyStats', year, month)) as MonthlyStats
}
