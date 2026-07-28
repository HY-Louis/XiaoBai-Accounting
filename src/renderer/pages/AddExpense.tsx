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

type RecordType = 'expense' | 'income'

export default function AddExpense({ categories, onSaved }: AddExpenseProps) {
  const [recordType, setRecordType] = useState<RecordType>('expense')
  const [amountStr, setAmountStr] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [note, setNote] = useState('')
  const [expenseDate, setExpenseDate] = useState(today())
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [monthlyExpense, setMonthlyExpense] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)

  // Load this month's totals
  useEffect(() => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    getExpenses(monthStr).then(records => {
      const exp = records.filter(r => r.type !== 'income').reduce((sum, r) => sum + r.amount, 0)
      const inc = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
      setMonthlyExpense(exp)
      setMonthlyIncome(inc)
    }).catch(() => {})
  }, [])

  // Filter categories by current type
  const visibleCategories = categories.filter(c => {
    // For old expense categories without type, treat as expense
    const catType = c.type || 'expense'
    return catType === recordType
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }

  const handleCategorySelect = (catId: string, subId: string) => {
    setCategoryId(catId)
    setSubcategoryId(subId)
  }

  const handleSave = async () => {
    const amountInFen = parseAmountToFen(amountStr)
    if (amountInFen === null || amountInFen <= 0) {
      showToast('请输入有效的金额', 'error')
      return
    }
    if (!categoryId || !subcategoryId) {
      showToast('请选择分类', 'error')
      return
    }

    setSaving(true)
    try {
      await addExpenseToDb({
        amount: amountInFen,
        categoryId,
        subcategoryId,
        type: recordType,
        note: note.trim(),
        expenseDate,
      })
      // Reset form
      setAmountStr('')
      setCategoryId('')
      setSubcategoryId('')
      setNote('')
      setExpenseDate(today())
      if (recordType === 'income') {
        setMonthlyIncome(t => t + amountInFen)
      } else {
        setMonthlyExpense(t => t + amountInFen)
      }
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
  const balance = monthlyIncome - monthlyExpense

  return (
    <div>
      {/* Monthly summary header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
          {monthLabel}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>收入</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-success)' }}>
              {formatFen(monthlyIncome)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>支出</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-danger)' }}>
              {formatFen(monthlyExpense)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>结余</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {balance >= 0 ? '+' : ''}{formatFen(Math.abs(balance))}
            </div>
          </div>
        </div>
      </div>

      {/* Type toggle */}
      <div className="type-toggle" style={{ marginBottom: 12 }}>
        <button
          className={`type-toggle-btn${recordType === 'expense' ? ' active' : ''}`}
          onClick={() => { setRecordType('expense'); setCategoryId(''); setSubcategoryId('') }}
        >
          支出
        </button>
        <button
          className={`type-toggle-btn${recordType === 'income' ? ' active income-active' : ''}`}
          onClick={() => { setRecordType('income'); setCategoryId(''); setSubcategoryId('') }}
        >
          收入
        </button>
      </div>

      {/* Amount input */}
      <div className="card" style={{ padding: 20 }}>
        <div className="form-group">
          <div className="form-label">金额 (¥)</div>
          <input
            className={`input input-large${recordType === 'income' ? ' input-income' : ''}`}
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
            categories={visibleCategories}
            selectedCategoryId={categoryId}
            selectedSubcategoryId={subcategoryId}
            onSelect={handleCategorySelect}
          />
        </div>

        <div className="form-group">
          <div className="form-label">备注（可选）</div>
          <input
            className="input"
            type="text"
            placeholder={recordType === 'expense' ? '例如：食堂午饭' : '例如：1月工资'}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <div className="form-group">
          <div className="form-label">日期</div>
          <input
            className="input"
            type="date"
            value={expenseDate}
            onChange={e => setExpenseDate(e.target.value)}
            max={today()}
          />
        </div>

        <button
          className={`btn btn-primary${recordType === 'income' ? ' btn-income' : ''}`}
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
