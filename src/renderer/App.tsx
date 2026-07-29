import { useState, useEffect } from 'react'
import type { CategoryRow, Page } from './types'
import { getCategories } from './api/db'
import Layout from './components/Layout'
import AddExpense from './pages/AddExpense'
import ExpenseList from './pages/ExpenseList'
import Statistics from './pages/Statistics'
import CategoryManager from './pages/CategoryManager'
import SnakeGame from './pages/SnakeGame'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('add')
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Trigger a refresh of expense data across pages
  const triggerRefresh = () => setRefreshKey(k => k + 1)

  // Load categories on mount
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  const reloadCategories = () => {
    getCategories().then(setCategories).catch(console.error)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'add':
        return (
          <AddExpense
            categories={categories}
            onSaved={triggerRefresh}
          />
        )
      case 'list':
        return (
          <ExpenseList
            categories={categories}
            refreshKey={refreshKey}
          />
        )
      case 'stats':
        return (
          <Statistics
            categories={categories}
            refreshKey={refreshKey}
          />
        )
      case 'manage':
        return (
          <CategoryManager
            categories={categories}
            onChanged={reloadCategories}
          />
        )
      case 'game':
        return <SnakeGame />
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}
