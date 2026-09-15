import type { ReactNode } from 'react'
import type { Page } from '../types'

interface LayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  children: ReactNode
  /** Optional widget for the right column on wide windows (hidden when narrow) */
  aside?: ReactNode
}

const tabs: { key: Page; icon: string; label: string }[] = [
  { key: 'add', icon: '💰', label: '记账' },
  { key: 'list', icon: '📋', label: '账单' },
  { key: 'stats', icon: '📊', label: '统计' },
  { key: 'manage', icon: '⚙️', label: '管理' },
  { key: 'game', icon: '🎮', label: '游戏' },
]

/**
 * 应用外壳布局——底部 5 个标签页的导航框架。
 * 就像手机 app 的底部导航栏，点不同的图标切换到不同功能页面。
 * 5 个标签页：记账 💰 | 账单 📋 | 统计 📊 | 管理 ⚙️ | 游戏 🎮
 *
 * 窄窗口时只有中间一列（和手机一样）；窗口够宽时自动变成"左 | 中 | 右"三栏，
 * 右栏放 aside 传进来的小组件（比如本月支出日历），左栏留空只显示氛围背景。
 * 切换完全由 CSS 的 .side-column 媒体查询控制，这里不需要写判断逻辑。
 */
export default function Layout({ currentPage, onNavigate, children, aside }: LayoutProps) {
  return (
    <>
      <div className="app-shell">
        <aside className="side-column side-left" aria-hidden="true" />
        <main className="app-main">
          <div className="app-content">
            {children}
          </div>
        </main>
        <aside className="side-column side-right">
          {aside}
        </aside>
      </div>
      <nav className="bottom-nav">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`nav-item${currentPage === tab.key ? ' active' : ''}`}
            onClick={() => onNavigate(tab.key)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
