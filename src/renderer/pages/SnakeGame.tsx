import { useEffect, useRef, useState, useCallback } from 'react'

// ============================================================
// 贪吃蛇小游戏 — Snake Game
// ============================================================

const GRID_SIZE = 20        // 20x20 的格子
const CELL_SIZE = 18        // 每个格子的像素大小
const INITIAL_SPEED = 150   // 初始速度（毫秒/步），数字越小越快

type Position = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

const DIRECTION_MAP: Record<string, Direction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP', W: 'UP',
  s: 'DOWN', S: 'DOWN',
  a: 'LEFT', A: 'LEFT',
  d: 'RIGHT', D: 'RIGHT',
}

const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
}

const MOVE_DELTA: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

/** Generate a random food position that doesn't overlap the snake */
function randomFood(snake: Position[]): Position {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`))
  let pos: Position
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
  } while (occupied.has(`${pos.x},${pos.y}`))
  return pos
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('snake-best-score')
    return saved ? parseInt(saved, 10) : 0
  })
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle')

  const snakeRef = useRef<Position[]>([])
  const foodRef = useRef<Position>(randomFood([]))
  const directionRef = useRef<Direction>('RIGHT')
  const nextDirectionRef = useRef<Direction>('RIGHT')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speedRef = useRef(INITIAL_SPEED)

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = GRID_SIZE * CELL_SIZE
    const h = GRID_SIZE * CELL_SIZE

    // Background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, w, h)

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(w, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw food (pulsing glow)
    const food = foodRef.current
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 200)
    ctx.fillStyle = '#FF4757'
    ctx.shadowColor = '#FF4757'
    ctx.shadowBlur = 8 * pulse
    ctx.beginPath()
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2
    const fr = (CELL_SIZE / 2) * 0.75
    ctx.arc(fx, fy, fr, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Draw snake
    const snake = snakeRef.current
    snake.forEach((seg, i) => {
      const isHead = i === 0
      const t = 1 - i / Math.max(snake.length, 1)

      // Body color gradient: head bright green → tail dark green
      const r = Math.floor(30 + t * 40)
      const g = Math.floor(140 + t * 80)
      const b = Math.floor(60 + t * 40)
      ctx.fillStyle = `rgb(${r},${g},${b})`

      // Rounded rectangle for each segment
      const pad = 1  // small gap between segments
      const rx = seg.x * CELL_SIZE + pad
      const ry = seg.y * CELL_SIZE + pad
      const rw = CELL_SIZE - pad * 2
      const rh = CELL_SIZE - pad * 2
      const radius = isHead ? 6 : 4

      ctx.beginPath()
      ctx.moveTo(rx + radius, ry)
      ctx.lineTo(rx + rw - radius, ry)
      ctx.arcTo(rx + rw, ry, rx + rw, ry + radius, radius)
      ctx.lineTo(rx + rw, ry + rh - radius)
      ctx.arcTo(rx + rw, ry + rh, rx + rw - radius, ry + rh, radius)
      ctx.lineTo(rx + radius, ry + rh)
      ctx.arcTo(rx, ry + rh, rx, ry + rh - radius, radius)
      ctx.lineTo(rx, ry + radius)
      ctx.arcTo(rx, ry, rx + radius, ry, radius)
      ctx.fill()

      // Eyes on head
      if (isHead) {
        const dir = directionRef.current
        const cx = seg.x * CELL_SIZE + CELL_SIZE / 2
        const cy = seg.y * CELL_SIZE + CELL_SIZE / 2
        const eyeR = 2.5
        let e1x = cx, e1y = cy, e2x = cx, e2y = cy

        if (dir === 'RIGHT') { e1x = cx + 3; e1y = cy - 3; e2x = cx + 3; e2y = cy + 3 }
        if (dir === 'LEFT')  { e1x = cx - 3; e1y = cy - 3; e2x = cx - 3; e2y = cy + 3 }
        if (dir === 'UP')    { e1x = cx - 3; e1y = cy - 3; e2x = cx + 3; e2y = cy - 3 }
        if (dir === 'DOWN')  { e1x = cx - 3; e1y = cy + 3; e2x = cx + 3; e2y = cy + 3 }

        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill()

        // Pupils
        ctx.fillStyle = '#1a1a2e'
        ctx.beginPath(); ctx.arc(e1x, e1y, 1.2, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(e2x, e2y, 1.2, 0, Math.PI * 2); ctx.fill()
      }
    })
  }, [])

  // Game tick
  const tick = useCallback(() => {
    const snake = snakeRef.current
    const dir = nextDirectionRef.current
    directionRef.current = dir

    const head = snake[0]
    const delta = MOVE_DELTA[dir]
    const newHead: Position = {
      x: head.x + delta.x,
      y: head.y + delta.y,
    }

    // Wall collision → game over
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame()
      return
    }

    // Self collision → game over
    if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      endGame()
      return
    }

    // Move snake
    const newSnake = [newHead, ...snake]

    // Check if food eaten
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      // Grow: don't remove tail
      foodRef.current = randomFood(newSnake)
      const newScore = score + 10
      setScore(newScore)
      // Speed up every 50 points
      if (newScore % 50 === 0 && speedRef.current > 60) {
        speedRef.current = Math.max(60, speedRef.current - 15)
        restartInterval()
      }
    } else {
      newSnake.pop() // Remove tail
    }

    snakeRef.current = newSnake
    draw()
  }, [score, draw])

  const restartInterval = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(tick, speedRef.current)
  }

  const endGame = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setGameState('over')
    if (score > bestScore) {
      setBestScore(score)
      localStorage.setItem('snake-best-score', String(score))
    }
  }

  const startGame = () => {
    // Initialize snake: 3 segments in the middle, moving right
    const mid = Math.floor(GRID_SIZE / 2)
    snakeRef.current = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ]
    foodRef.current = randomFood(snakeRef.current)
    directionRef.current = 'RIGHT'
    nextDirectionRef.current = 'RIGHT'
    speedRef.current = INITIAL_SPEED
    setScore(0)
    setGameState('playing')
    draw()
    timerRef.current = setInterval(tick, INITIAL_SPEED)
  }

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const newDir = DIRECTION_MAP[e.key]
      if (!newDir) return

      e.preventDefault()

      // Can't reverse direction
      if (newDir === OPPOSITE[directionRef.current]) return

      nextDirectionRef.current = newDir
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Animation loop for food pulse effect
  useEffect(() => {
    if (gameState !== 'playing') return
    const animId = setInterval(() => draw(), 100)
    return () => clearInterval(animId)
  }, [gameState, draw])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const canvasWidth = GRID_SIZE * CELL_SIZE
  const canvasHeight = GRID_SIZE * CELL_SIZE

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🐍 贪吃蛇</h2>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          键盘方向键 或 WASD 控制方向
        </div>
      </div>

      {/* Score board */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 15 }}>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>得分：</span>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{score}</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>最高：</span>
          <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{bestScore}</span>
        </div>
      </div>

      {/* Game canvas */}
      <div style={{
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '2px solid var(--color-border)',
        position: 'relative',
      }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ display: 'block' }}
        />

        {/* Idle overlay */}
        {gameState === 'idle' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(26,26,46,0.85)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐍</div>
            <div style={{ fontSize: 18, color: '#fff', fontWeight: 600, marginBottom: 8 }}>
              贪吃蛇
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
              方向键 / WASD 控制
            </div>
            <button
              onClick={startGame}
              style={{
                padding: '12px 36px',
                borderRadius: 10,
                border: 'none',
                background: '#34C759',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              开始游戏
            </button>
          </div>
        )}

        {/* Game over overlay */}
        {gameState === 'over' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(26,26,46,0.85)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💀</div>
            <div style={{ fontSize: 20, color: '#FF4757', fontWeight: 700, marginBottom: 4 }}>
              游戏结束
            </div>
            <div style={{ fontSize: 16, color: '#fff', marginBottom: 4 }}>
              得分：{score}
            </div>
            {score >= bestScore && score > 0 && (
              <div style={{ fontSize: 13, color: '#FFD60A', marginBottom: 12 }}>
                🏆 新纪录！
              </div>
            )}
            <button
              onClick={startGame}
              style={{
                padding: '12px 36px',
                borderRadius: 10,
                border: 'none',
                background: '#4F6EF7',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      {/* Mobile controls hint */}
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        提示：吃到一个食物 +10 分，分数越高速度越快<br />
        撞到墙壁或自己的身体则游戏结束
      </div>
    </div>
  )
}
