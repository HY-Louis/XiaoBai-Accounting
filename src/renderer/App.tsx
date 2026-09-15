import { useState, useEffect } from 'react'
import type { CategoryRow, Page } from './types'
import { getCategories } from './api/db'
import Layout from './components/Layout'
import AddExpense from './pages/AddExpense'
import ExpenseList from './pages/ExpenseList'
import Statistics from './pages/Statistics'
import CategoryManager from './pages/CategoryManager'
import SnakeGame from './pages/SnakeGame'
import MonthHeatmapCard from './components/side-panels/MonthHeatmapCard'

/**
 * App 根组件——整个应用的大脑。
 * 负责三件事：
 * 1. 管理当前显示哪个页面（记账/账单/统计/分类管理/小游戏）
 * 2. 加载分类数据并分发给各个子页面
 * 3. 提供一个"刷新信号"，让不同页面之间能互相通知数据更新了
 */
export default function App() {
  // 当前显示哪个页面（底部导航切换）
  const [currentPage, setCurrentPage] = useState<Page>('add')
  // 所有分类数据（一级大类 + 二级子类），从数据库加载
  const [categories, setCategories] = useState<CategoryRow[]>([])
  // 刷新计数器——加 1 时触发子页面重新加载数据
  // 原理：子页面用 refreshKey 作为依赖项，key 变了就会重新请求数据
  const [refreshKey, setRefreshKey] = useState(0)

  // 通知所有子页面"有新数据了需要刷新"
  const triggerRefresh = () => setRefreshKey(prevKey => prevKey + 1)

  // app 启动时加载分类列表
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  // 重新加载分类列表（分类管理页修改分类后调用）
  const reloadCategories = () => {
    getCategories().then(setCategories).catch(console.error)
  }

  // 根据 currentPage 的值显示对应的页面，就像翻书一样切换
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
            onDeleted={triggerRefresh}
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
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      aside={<MonthHeatmapCard refreshKey={refreshKey} />}
    >
      {renderPage()}
    </Layout>
  )
}
