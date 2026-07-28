import { useState, useEffect } from 'react'
import type { CategoryRow } from '../types'
import { addCategory, updateCategory, deleteCategory } from '../api/db'

const EMOJI_OPTIONS = [
  '🍽️', '🚗', '🛍️', '🏠', '🎮', '💊', '📚', '🎁', '💰', '📦',
  '☕', '🍕', '🎬', '🏋️', '✈️', '🚇', '💻', '📱', '🐱', '💄',
  '🔧', '🏥', '🎵', '🎓', '💼', '🌟', '❤️', '🔥', '⚽', '🎯',
  '👶', '🌿', '🎂', '📷', '⏰', '🧸', '🛒', '🏖️', '🍺', '🚴',
]

interface CategoryManagerProps {
  categories: CategoryRow[]
  onChanged: () => void
}

export default function CategoryManager({ categories, onChanged }: CategoryManagerProps) {
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [addParentId, setAddParentId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('📌')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const primaryCategories = categories.filter(c => !c.parentId)

  // DEBUG: log category breakdown
  useEffect(() => {
    const withParent = categories.filter(c => c.parentId)
    const withoutParent = categories.filter(c => !c.parentId)
    console.log('[CategoryManager] Total categories:', categories.length,
      '| With parentId:', withParent.length,
      '| Without parentId (primary):', withoutParent.length)
    if (withoutParent.length > 20) {
      console.log('[CategoryManager] WARNING: Too many primary categories! Sample:', withoutParent.slice(0, 5).map(c => c.id))
    }
  }, [categories])

  // Default-expand all categories on first load
  useEffect(() => {
    if (primaryCategories.length > 0) {
      const allExpanded: Record<string, boolean> = {}
      primaryCategories.forEach(c => { allExpanded[c.id] = true })
      setExpanded(prev => {
        // Only update if no keys are set yet (first load)
        if (Object.keys(prev).length === 0) return allExpanded
        return prev
      })
    }
  }, [categories])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2000)
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const openAddPrimary = () => {
    setFormName('')
    setFormIcon('📌')
    setAddParentId(null)
    setIsAdding(true)
    setEditingCategory(null)
  }

  const openAddSub = (parentId: string) => {
    setFormName('')
    setFormIcon('📌')
    setAddParentId(parentId)
    setIsAdding(true)
    setEditingCategory(null)
    // Auto-expand parent
    setExpanded(prev => ({ ...prev, [parentId]: true }))
  }

  const openEditModal = (cat: CategoryRow) => {
    setFormName(cat.name)
    setFormIcon(cat.icon)
    setEditingCategory(cat)
    setIsAdding(false)
    setAddParentId(null)
  }

  const closeModal = () => {
    setIsAdding(false)
    setEditingCategory(null)
    setAddParentId(null)
  }

  const handleSave = async () => {
    const name = formName.trim()
    if (!name) { showToast('请输入分类名称', 'error'); return }
    if (name.length > 10) { showToast('分类名称不能超过10个字', 'error'); return }

    setSaving(true)
    try {
      if (isAdding) {
        await addCategory(name, formIcon, addParentId)
        showToast('添加成功！', 'success')
      } else if (editingCategory) {
        const ok = await updateCategory(editingCategory.id, name, formIcon)
        if (!ok) { showToast('修改失败：分类不存在', 'error'); setSaving(false); return }
        showToast('修改成功！', 'success')
      }
      closeModal()
      onChanged()
    } catch (e: any) {
      showToast(e?.message || '操作失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: CategoryRow) => {
    const isPrimary = !cat.parentId
    const subCount = categories.filter(c => c.parentId === cat.id).length
    const warnMsg = isPrimary && subCount > 0
      ? `确定要删除「${cat.name}」及其下的 ${subCount} 个子分类吗？\n\n该分类下的记账记录不会被删除。`
      : `确定要删除「${cat.name}」分类吗？\n\n该分类下的记账记录不会被删除。`

    if (!confirm(warnMsg)) return
    try {
      // If deleting a primary category, also delete its subcategories
      if (isPrimary) {
        for (const sub of categories.filter(c => c.parentId === cat.id)) {
          await deleteCategory(sub.id)
        }
      }
      const ok = await deleteCategory(cat.id)
      if (!ok) { showToast('删除失败：分类不存在', 'error'); return }
      showToast('删除成功！', 'success')
      onChanged()
    } catch (e: any) {
      showToast(e?.message || '删除失败，请重试', 'error')
    }
  }

  const isModalOpen = isAdding || editingCategory !== null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>分类管理</h2>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 18px', fontSize: 14 }} onClick={openAddPrimary}>
          + 新增大类
        </button>
      </div>

      <div className="card">
        <div className="form-label" style={{ marginBottom: 8 }}>
          全部分类
          <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: 8, fontSize: 12 }}>
            {primaryCategories.length} 个大类
          </span>
        </div>

        {primaryCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-secondary)', fontSize: 14 }}>
            还没有分类，点击右上角"+ 新增大类"来添加
          </div>
        ) : (
          primaryCategories.map(cat => {
            const subs = categories.filter(c => c.parentId === cat.id)
            const isOpen = expanded[cat.id] ?? false

            return (
              <div key={cat.id}>
                {/* Primary category row */}
                <div className="cat-mgr-row">
                  <button
                    className="btn-expand"
                    onClick={() => toggleExpand(cat.id)}
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  >
                    ›
                  </button>
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-name">{cat.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginRight: 8 }}>
                    {subs.length} 个子类
                  </span>
                  <div className="cat-mgr-actions">
                    <button className="btn-cat-action btn-cat-edit" onClick={() => openAddSub(cat.id)} title="新增子分类">
                      ➕
                    </button>
                    <button className="btn-cat-action btn-cat-edit" onClick={() => openEditModal(cat)}>
                      ✏️
                    </button>
                    <button className="btn-cat-action btn-cat-delete" onClick={() => handleDelete(cat)}>
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Subcategory rows (collapsible) */}
                {isOpen && (
                  <div className="subcategory-list">
                    {subs.length === 0 ? (
                      <div className="sub-empty">暂无子分类，点击 ➕ 添加</div>
                    ) : (
                      subs.map(sub => (
                        <div key={sub.id} className="cat-mgr-row sub-row">
                          <span className="sub-indent" />
                          <span className="cat-icon">{sub.icon}</span>
                          <span className="cat-name">{sub.name}</span>
                          <div className="cat-mgr-actions">
                            <button className="btn-cat-action btn-cat-edit" onClick={() => openEditModal(sub)}>
                              ✏️
                            </button>
                            <button className="btn-cat-action btn-cat-delete" onClick={() => handleDelete(sub)}>
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">
              {isAdding
                ? (addParentId ? '新增子分类' : '新增大类')
                : '编辑分类'}
            </div>

            <div style={{ padding: '0 16px' }}>
              <div className="form-group">
                <div className="form-label">图标</div>
                <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 10, padding: 10, background: 'var(--color-bg)', borderRadius: 10 }}>
                  {formIcon}
                </div>
                <div className="emoji-grid">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      className={`emoji-option${formIcon === emoji ? ' selected' : ''}`}
                      onClick={() => setFormIcon(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <div className="form-label">分类名称</div>
                <input
                  className="input"
                  type="text"
                  placeholder="例如：三餐、打车、咖啡"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  maxLength={10}
                  autoFocus
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ marginBottom: 16 }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
