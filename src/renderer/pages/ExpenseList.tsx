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
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all')

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

  // Get category info for a record (primary + subcategory)
  const getCategoryInfo = (record: Expense) => {
    const primary = categories.find(c => c.id === record.categoryId)
    const sub = record.subcategoryId
      ? categories.find(c => c.id === record.subcategoryId)
      : undefined
    return { primary, sub }
  }

  // Filter by category and type
  const filteredExpenses = expenses.filter(e => {
    if (categoryFilter !== 'all' && e.categoryId !== categoryFilter) return false
    if (typeFilter !== 'all' && e.type !== typeFilter) {
      // For old records without type, treat as expense
      if (typeFilter === 'expense' && !e.type) return true
      if (typeFilter === 'income' && e.type === 'income') return true
      if (typeFilter === 'expense' && e.type === 'expense') return true
      return false
    }
    return true
  })

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

  // Calculate monthly totals
  const summary = filteredExpenses.reduce(
    (acc, e) => {
      if (e.type === 'income') acc.income += e.amount
      else acc.expense += e.amount
      return acc
    },
    { expense: 0, income: 0 }
  )

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

      {/* Type filter */}
      <div style={{ padding: '0 0 12px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {(['all', 'expense', 'income'] as const).map(t => (
          <button
            key={t}
            className="btn"
            style={{
              padding: '6px 14px', fontSize: 13, marginRight: 8,
              background: typeFilter === t ? 'var(--color-primary)' : 'var(--color-card)',
              color: typeFilter === t ? 'white' : 'var(--color-text)',
              border: typeFilter === t ? undefined : '1px solid var(--color-border)',
              borderRadius: 20,
            }}
            onClick={() => setTypeFilter(t)}
          >
            {t === 'all' ? '全部' : t === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      {/* Monthly summary */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>支出</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-danger)' }}>
              {formatFen(summary.expense)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>收入</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-success)' }}>
              {formatFen(summary.income)}
            </div>
          </div>
        </div>
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
          {filteredExpenses.map(record => {
            const { primary: cat, sub } = getCategoryInfo(record)
            const isIncome = record.type === 'income'
            return (
              <div key={record.id} className="expense-item">
                <div className="expense-info">
                  <div className="expense-icon">
                    {sub?.icon || cat?.icon || '📌'}
                  </div>
                  <div className="expense-detail">
                    <span className="expense-category">
                      {cat?.name || '未知'}
                      {sub ? ` › ${sub.name}` : ''}
                    </span>
                    <span className="expense-date">
                      {formatDisplayDate(record.expenseDate)}
                      {record.note && ` · ${record.note}`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="expense-amount" style={{ color: isIncome ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {isIncome ? '+' : '-'}{formatFen(record.amount)}
                  </span>
                  <button className="btn btn-danger" onClick={() => handleDelete(record.id)}>
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
