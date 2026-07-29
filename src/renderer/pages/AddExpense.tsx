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

/**
 * 记账页面——app 的首页，也是最核心的功能页。
 *
 * 页面从上到下分为四个区域：
 * 1. 月度摘要（收入 / 支出 / 结余）
 * 2. 类型切换（支出 or 收入）
 * 3. 记账表单（金额 → 分类 → 备注 → 日期 → 保存按钮）
 * 4. Toast 消息提示（保存成功/失败后弹出，2秒消失）
 */
export default function AddExpense({ categories, onSaved }: AddExpenseProps) {
  // 当前记账类型：支出还是收入
  const [recordType, setRecordType] = useState<RecordType>('expense')
  // 用户输入的金额文本（暂不转换，保存时再转成"分"）
  const [amountStr, setAmountStr] = useState('')
  // 选中的一级分类和二级子类 ID
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  // 可选备注
  const [note, setNote] = useState('')
  // 记账日期，默认今天
  const [expenseDate, setExpenseDate] = useState(today())
  // 是否正在保存（防止重复点击保存按钮）
  const [saving, setSaving] = useState(false)
  // Toast 消息提示状态
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  // 当月累计支出金额（单位：分），用于页面顶部月度摘要显示
  const [monthlyExpense, setMonthlyExpense] = useState(0)
  // 当月累计收入金额（单位：分）
  const [monthlyIncome, setMonthlyIncome] = useState(0)

  // 页面加载时获取当月汇总数据（收入总额 + 支出总额）
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

  /**
   * 保存记账记录。
   * 流程：校验金额 → 校验分类 → 写入数据库 → 清空表单 → 更新月度汇总 → 通知父页面刷新
   * 如果金额为空/无效或分类未选择，会弹出错误提示阻止保存。
   */
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
