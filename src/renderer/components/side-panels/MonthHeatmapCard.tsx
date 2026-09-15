import { useState, useEffect } from 'react'
import type { DailyStat } from '../../types'
import { getMonthlyStats } from '../../api/db'
import { buildHeatmapCells } from '../../utils/heatmap'
import { today, formatMonthLabel } from '../../utils/date'
import HeatmapGrid from './HeatmapGrid'

interface MonthHeatmapCardProps {
  /** Bumped by App whenever records change, so the card refetches */
  refreshKey: number
}

/**
 * 侧栏卡片："本月支出日历"热力图。
 * 只在窗口够宽时显示（由 CSS 的 .side-column 媒体查询控制），窄窗口自动隐藏。
 * 每次有记录新增/删除（refreshKey 变化）就重新拉一次本月统计。
 */
export default function MonthHeatmapCard({ refreshKey }: MonthHeatmapCardProps) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const [byDay, setByDay] = useState<DailyStat[]>([])

  useEffect(() => {
    getMonthlyStats(year, month)
      .then(stats => setByDay(stats.byDay))
      .catch(console.error)
  }, [year, month, refreshKey])

  const { cells, leadingBlanks } = buildHeatmapCells(year, month, byDay)
  const daysRecorded = cells.filter(c => c.amount > 0).length

  return (
    <div className="card heatmap-card">
      <div className="card-header flex-between">
        <span>📅 本月支出日历</span>
        <span className="heatmap-month">{formatMonthLabel(year, month)}</span>
      </div>
      <HeatmapGrid month={month} cells={cells} leadingBlanks={leadingBlanks} todayStr={today()} />
      <div className="flex-between heatmap-footer">
        <span>{daysRecorded > 0 ? `已记 ${daysRecorded} 天` : '本月还没有记录'}</span>
        <span className="heatmap-legend">
          少
          {[0, 1, 2, 3, 4].map(level => (
            <span key={level} className={`heatmap-swatch heat-${level}`} />
          ))}
          多
        </span>
      </div>
    </div>
  )
}
