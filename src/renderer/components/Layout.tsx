import type { ReactNode } from 'react'
import type { Page } from '../types'

interface LayoutProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  children: ReactNode
}

const tabs: { key: Page; icon: string; label: string }[] = [
  { key: 'add', icon: '💰', label: '记账' },
  { key: 'list', icon: '📋', label: '账单' },
  { key: 'stats', icon: '📊', label: '统计' },
  { key: 'manage', icon: '⚙️', label: '管理' },
  { key: 'game', icon: '🎮', label: '游戏' },
]

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  return (
    <>
      <div className="app-content">
        {children}
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
