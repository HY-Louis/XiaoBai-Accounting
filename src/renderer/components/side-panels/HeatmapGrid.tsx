import type { HeatmapCell } from '../../utils/heatmap'
import { formatFen } from '../../utils/format'

interface HeatmapGridProps {
  month: number
  cells: HeatmapCell[]
  leadingBlanks: number
  /** Today's date as YYYY-MM-DD — used to ring today and dim future days */
  todayStr: string
}

// Monday-first, matching the common Chinese calendar convention
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

/**
 * 热力图格子——一张月历，每天一个小方块，花钱越多颜色越深。
 * 纯展示组件：数据由 buildHeatmapCells 算好传进来，这里只负责画。
 * 鼠标悬停在格子上会显示"9月3日 · ¥123.45"（用浏览器原生提示，零依赖）。
 */
export default function HeatmapGrid({ month, cells, leadingBlanks, todayStr }: HeatmapGridProps) {
  return (
    <div className="heatmap-grid">
      {WEEKDAYS.map(w => (
        <div key={w} className="heatmap-weekday">{w}</div>
      ))}
      {Array.from({ length: leadingBlanks }, (_, i) => (
        <div key={`blank-${i}`} />
      ))}
      {cells.map(cell => {
        const isToday = cell.date === todayStr
        // ISO dates compare correctly as plain strings, no Date parsing needed
        const isFuture = cell.date > todayStr
        const tip = cell.amount > 0
          ? `${month}月${cell.day}日 · ${formatFen(cell.amount)}`
          : `${month}月${cell.day}日 · 无支出`
        return (
          <div
            key={cell.date}
            className={`heatmap-cell heat-${cell.level}${isToday ? ' is-today' : ''}${isFuture ? ' is-future' : ''}`}
            title={tip}
          >
            {cell.day}
          </div>
        )
      })}
    </div>
  )
}
