import { useState, useEffect } from 'react'
import type { CategoryRow, MonthlyStats } from '../types'
import { getMonthlyStats } from '../api/db'
import { formatFen, fenToYuan } from '../utils/format'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface StatisticsProps {
  categories: CategoryRow[]
  refreshKey: number
}

// Color palette for charts
const COLORS = [
  '#4F6EF7', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
  '#5AC8FA', '#FF2D55', '#5856D6', '#007AFF', '#FFD60A',
]

export default function Statistics({ refreshKey }: StatisticsProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMonthlyStats(year, month)
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year, month, refreshKey])

  const goPrevMonth = () => {
    if (month === 1) {
      setYear(y => y - 1)
      setMonth(12)
    } else {
      setMonth(m => m - 1)
    }
  }

  const goNextMonth = () => {
    const nowDate = new Date()
    // Don't go beyond current month
    if (year === nowDate.getFullYear() && month === nowDate.getMonth() + 1) return
    if (month === 12) {
      setYear(y => y + 1)
      setMonth(1)
    } else {
      setMonth(m => m + 1)
    }
  }

  // Prepare pie chart data
  const pieData = stats?.byCategory.map(item => ({
    name: `${item.categoryIcon} ${item.categoryName}`,
    value: item.amount / 100,  // Convert to yuan for display
    amount: item.amount,
  })) || []

  // Prepare bar chart data
  const barData = stats?.byDay.map(item => ({
    day: item.date.slice(8),  // Extract day number from "YYYY-MM-DD"
    amount: item.amount / 100,
  })) || []

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div>
      {/* Month selector */}
      <div className="month-selector">
        <button onClick={goPrevMonth}>◀</button>
        <span>{year}年{month}月</span>
        <button onClick={goNextMonth} disabled={isCurrentMonth} style={{ opacity: isCurrentMonth ? 0.3 : 1 }}>
          ▶
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-text">加载中...</div>
        </div>
      ) : !stats || stats.recordCount === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-text">本月暂无支出数据</div>
        </div>
      ) : (
        <>
          {/* Total */}
          <div className="stat-total">
            <div className="total-label">总支出 · {stats.recordCount} 笔</div>
            <div className="total-amount">{formatFen(stats.totalAmount)}</div>
          </div>

          {/* Pie Chart: Category breakdown */}
          <div className="card chart-container">
            <div className="card-header">支出分类分布</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '金额']}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Category list with amounts */}
            <div style={{ marginTop: 8 }}>
              {stats.byCategory.map((item, index) => (
                <div key={item.categoryId} className="flex-between" style={{ padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: COLORS[index % COLORS.length],
                    }} />
                    <span>{item.categoryIcon} {item.categoryName}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{formatFen(item.amount)}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {item.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart: Daily trend */}
          <div className="card chart-container">
            <div className="card-header">每日支出趋势</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8ED" />
                <XAxis dataKey="day" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '金额']}
                  labelFormatter={(label: string) => `${year}年${month}月${label}日`}
                />
                <Bar dataKey="amount" fill="#4F6EF7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
