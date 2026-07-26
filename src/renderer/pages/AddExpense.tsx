import { useState, useEffect } from 'react'
import type { CategoryRow } from '../types'
import CategoryPicker from '../components/CategoryPicker'
import { addExpense as addExpenseToDb, getExpenses } from '../api/db'
import { parseAmountToFen, formatFen } from '../utils/format'
import { today, formatMonthLabel } from '../utils/date'

interface AddExpenseProps {
  categories: CategoryRow[]
  onSaved: () => void
}

export default function AddExpense({ categories, onSaved }: AddExpenseProps) {
  const [amountStr, setAmountStr] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [expenseDate] = useState(today())
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [monthlyTotal, setMonthlyTotal] = useState(0)

  // Load this month's total
  useEffect(() => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    getExpenses(monthStr).then(expenses => {
      const total = expenses.reduce((sum, e) => sum + e.amount, 0)
      setMonthlyTotal(total)
    }).catch(() => {})
  }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }

  const handleCategorySelect = (catId: string) => {
    setCategoryId(catId)
  }

  const handleSave = async () => {
    // Validate
    const amountInFen = parseAmountToFen(amountStr)
    if (amountInFen === null || amountInFen <= 0) {
      showToast('请输入有效的金额', 'error')
      return
    }
    if (!categoryId) {
      showToast('请选择分类', 'error')
      return
    }

    setSaving(true)
    try {
      await addExpenseToDb({
        amount: amountInFen,
        categoryId,
        subcategoryId: '',
        note: note.trim(),
        expenseDate,
      })
      // Reset form
      setAmountStr('')
      setCategoryId('')
      setNote('')
      setMonthlyTotal(t => t + amountInFen)
      onSaved()
      showToast('保存成功！', 'success')
    } catch {
      showToast('保存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  const now = new Date()
  const monthLabel = formatMonthLabel(now.getFullYear(), now.getMonth() + 1)

  return (
    <div>
      {/* Monthly total header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {monthLabel} 总支出
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)', marginTop: 4 }}>
          {formatFen(monthlyTotal)}
        </div>
      </div>

      {/* Amount input */}
      <div className="card" style={{ padding: 20 }}>
        <div className="form-group">
          <div className="form-label">金额 (¥)</div>
          <input
            className="input input-large"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amountStr}
            onChange={e => setAmountStr(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <div className="form-label">分类</div>
          <CategoryPicker
            categories={categories}
            selectedId={categoryId}
            onSelect={handleCategorySelect}
          />
        </div>

        <div className="form-group">
          <div className="form-label">备注（可选）</div>
          <input
            className="input"
            type="text"
            placeholder="例如：食堂午饭"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <div className="form-group">
          <div className="form-label">日期</div>
          <input
            className="input"
            type="text"
            value={expenseDate}
            disabled
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg)' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保 存'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
