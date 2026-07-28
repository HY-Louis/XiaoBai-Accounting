import { useState } from 'react'
import type { CategoryRow } from '../types'

interface CategoryPickerProps {
  categories: CategoryRow[]
  /** Currently selected primary category ID */
  selectedCategoryId: string
  /** Currently selected subcategory ID */
  selectedSubcategoryId: string
  /** Called when user picks a subcategory in step 2 */
  onSelect: (categoryId: string, subcategoryId: string) => void
}

export default function CategoryPicker({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelect,
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [pickedPrimary, setPickedPrimary] = useState('')

  const primaryCategories = categories.filter(c => !c.parentId)

  const selectedPrimary = categories.find(c => c.id === selectedCategoryId)
  const selectedSub = categories.find(c => c.id === selectedSubcategoryId)

  const openStep1 = () => {
    setStep(1)
    setPickedPrimary('')
    setIsOpen(true)
  }

  const goToStep2 = (primaryId: string) => {
    setPickedPrimary(primaryId)
    setStep(2)
  }

  const goBackToStep1 = () => {
    setPickedPrimary('')
    setStep(1)
  }

  const handleSubSelect = (subId: string) => {
    onSelect(pickedPrimary, subId)
    setIsOpen(false)
  }

  const primaryForStep2 = primaryCategories.find(c => c.id === pickedPrimary)
  const subcategories = categories.filter(c => c.parentId === pickedPrimary)

  return (
    <>
      {/* Trigger */}
      <div className="select-row" onClick={openStep1}>
        <span>
          {selectedPrimary && selectedSub ? (
            <>
              {selectedPrimary.icon} {selectedPrimary.name}
              <span style={{ color: 'var(--color-text-secondary)', margin: '0 4px' }}>›</span>
              {selectedSub.icon} {selectedSub.name}
            </>
          ) : (
            <span className="text-secondary">请选择分类</span>
          )}
        </span>
        <span className="arrow">›</span>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {step === 2 && (
                <button className="btn-back" onClick={goBackToStep1}>
                  ‹
                </button>
              )}
              {step === 1 ? '选择大类' : primaryForStep2?.name || '选择子类'}
            </div>

            <div className="category-list">
              {step === 1 ? (
                /* Step 1: pick primary category */
                primaryCategories.map(cat => (
                  <button
                    key={cat.id}
                    className="category-option"
                    onClick={() => goToStep2(cat.id)}
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{cat.name}</span>
                    <span className="arrow">›</span>
                  </button>
                ))
              ) : (
                /* Step 2: pick subcategory */
                subcategories.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-secondary)' }}>
                    该大类下暂无子分类，请先在管理页面添加
                  </div>
                ) : (
                  subcategories.map(sub => (
                    <button
                      key={sub.id}
                      className={`category-option${sub.id === selectedSubcategoryId ? ' selected' : ''}`}
                      onClick={() => handleSubSelect(sub.id)}
                    >
                      <span className="cat-icon">{sub.icon}</span>
                      <span>{sub.name}</span>
                    </button>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
