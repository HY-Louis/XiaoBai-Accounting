import { useState } from 'react'
import type { CategoryRow } from '../types'

interface CategoryPickerProps {
  categories: CategoryRow[]
  /** Currently selected category ID */
  selectedId: string
  onSelect: (categoryId: string) => void
}

export default function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Get primary categories (those without parent_id)
  const primaryCategories = categories.filter(c => !c.parentId)

  // Find the currently selected category for display
  const selectedCategory = categories.find(c => c.id === selectedId)

  const handleSelect = (id: string) => {
    onSelect(id)
    setIsOpen(false)
  }

  return (
    <>
      {/* Trigger */}
      <div className="select-row" onClick={() => setIsOpen(true)}>
        <span>
          {selectedCategory ? (
            <>
              {selectedCategory.icon} {selectedCategory.name}
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
            <div className="modal-title">选择分类</div>
            <div className="category-list">
              {primaryCategories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-option${cat.id === selectedId ? ' selected' : ''}`}
                  onClick={() => handleSelect(cat.id)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
