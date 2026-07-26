import { useState, useEffect } from 'react'
import type { Expense, CategoryRow } from '../types'
import { getExpenses, deleteExpense } from '../api/db'
import { formatFen } from '../utils/format'
import { formatDisplayDate } from '../utils/date'

interface ExpenseListProps {
  categories: CategoryRow[]
  refreshKey: number
}

export default function ExpenseList({ categories, refreshKey }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // Month filter: "YYYY-MM" format
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getExpenses(selectedMonth)
      .then(data => setExpenses(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedMonth, refreshKey])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return
    try {
      await deleteExpense(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch {
      alert('删除失败，请重试')
    }
  }

  // Get category info for an expense
  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)
  }

  // Filter by category
  const filteredExpenses = categoryFilter === 'all'
    ? expenses
    : expenses.filter(e => e.categoryId === categoryFilter)

  // Get primary categories for filter
  const primaryCategories = categories.filter(c => !c.parentId)

  // Generate month options (current month + previous 11 months)
  const monthOptions: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthOptions.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
    })
  }

  // Calculate monthly total
  const monthlyTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      {/* Month selector */}
      <div className="month-selector">
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {monthOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Category filter */}
      <div style={{ padding: '0 0 12px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button
          className={`btn ${categoryFilter === 'all' ? 'btn-primary' : ''}`}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            marginRight: 8,
            background: categoryFilter === 'all' ? undefined : 'var(--color-card)',
            color: categoryFilter === 'all' ? undefined : 'var(--color-text)',
            border: categoryFilter === 'all' ? undefined : '1px solid var(--color-border)',
            borderRadius: 20,
          }}
          onClick={() => setCategoryFilter('all')}
        >
          全部
        </button>
        {primaryCategories.map(cat => (
          <button
            key={cat.id}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: 13,
              marginRight: 8,
              background: categoryFilter === cat.id ? 'var(--color-primary)' : 'var(--color-card)',
              color: categoryFilter === cat.id ? 'white' : 'var(--color-text)',
              border: categoryFilter === cat.id ? undefined : '1px solid var(--color-border)',
              borderRadius: 20,
            }}
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Monthly total */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>本月合计</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{formatFen(monthlyTotal)}</div>
      </div>

      {/* Expense list */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-text">加载中...</div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <div className="empty-text">还没有记账记录，去记一笔吧～</div>
        </div>
      ) : (
        <div>
          {filteredExpenses.map(expense => {
            const cat = getCategoryInfo(expense.categoryId)
            return (
              <div key={expense.id} className="expense-item">
                <div className="expense-info">
                  <div className="expense-icon">
                    {cat?.icon || '📌'}
                  </div>
                  <div className="expense-detail">
                    <span className="expense-category">
                      {cat?.name || '未知'}
                    </span>
                    <span className="expense-date">
                      {formatDisplayDate(expense.expenseDate)}
                      {expense.note && ` · ${expense.note}`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="expense-amount">{formatFen(expense.amount)}</span>
                  <button className="btn btn-danger" onClick={() => handleDelete(expense.id)}>
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
