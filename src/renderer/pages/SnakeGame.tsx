import { useEffect, useRef, useState } from 'react'

// ============================================================
// Snake Game — constants, types, and helpers
// ============================================================

const GRID_SIZE = 20
const CELL_SIZE = 18
const INITIAL_SPEED = 150   // ms per tick (lower = faster)

type Position = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

const KEY_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  w: 'UP', W: 'UP', s: 'DOWN', S: 'DOWN', a: 'LEFT', A: 'LEFT', d: 'RIGHT', D: 'RIGHT',
}

const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
}

const DELTA: Record<Direction, Position> = {
  UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 },
}

/** Eye offset lookup per direction: [eye1x, eye1y, eye2x, eye2y] */
const EYE_OFFSETS: Record<Direction, [number, number, number, number]> = {
  RIGHT: [3, -3, 3, 3],
  LEFT:  [-3, -3, -3, 3],
  UP:    [-3, -3, 3, -3],
  DOWN:  [-3, 3, 3, 3],
}

function randomFood(snake: Position[]): Position {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`))
  // Bail out after 1000 attempts to prevent infinite loop when grid is full
  for (let attempt = 0; attempt < 1000; attempt++) {
    const pos: Position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
    if (!occupied.has(`${pos.x},${pos.y}`)) return pos
  }
  // Fallback: scan for any free cell
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) return { x, y }
    }
  }
  return { x: 0, y: 0 } // Grid full (snake wins!)
}

// ============================================================
// Canvas drawing (pure function, no React dependency)
// ============================================================

function drawGame(
  ctx: CanvasRenderingContext2D,
  snake: Position[],
  food: Position,
  direction: Direction,
  dpr: number,
): void {
  const w = GRID_SIZE * CELL_SIZE
  const h = GRID_SIZE * CELL_SIZE

  // HiDPI scaling
  ctx.save()
  ctx.scale(dpr, dpr)

  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, w, h)

  // Grid lines (batch horizontal + vertical into 2 paths)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 0.5

  ctx.beginPath()
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.moveTo(i * CELL_SIZE, 0)
    ctx.lineTo(i * CELL_SIZE, h)
  }
  ctx.stroke()

  ctx.beginPath()
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.moveTo(0, i * CELL_SIZE)
    ctx.lineTo(w, i * CELL_SIZE)
  }
  ctx.stroke()

  // Food (pulsing glow)
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 200)
  ctx.fillStyle = '#FF4757'
  ctx.shadowColor = '#FF4757'
  ctx.shadowBlur = 8 * pulse
  ctx.beginPath()
  ctx.arc(
    food.x * CELL_SIZE + CELL_SIZE / 2,
    food.y * CELL_SIZE + CELL_SIZE / 2,
    (CELL_SIZE / 2) * 0.75, 0, Math.PI * 2,
  )
  ctx.fill()
  ctx.shadowBlur = 0

  // Snake body
  snake.forEach((seg, i) => {
    const isHead = i === 0
    const t = 1 - i / Math.max(snake.length, 1)
    const r = Math.floor(30 + t * 40)
    const g = Math.floor(140 + t * 80)
    const b = Math.floor(60 + t * 40)
    ctx.fillStyle = `rgb(${r},${g},${b})`

    const pad = 1
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
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2
      const [e1x, e1y, e2x, e2y] = EYE_OFFSETS[direction]

      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(cx + e1x, cy + e1y, 2.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + e2x, cy + e2y, 2.5, 0, Math.PI * 2); ctx.fill()

      ctx.fillStyle = '#1a1a2e'
      ctx.beginPath(); ctx.arc(cx + e1x, cy + e1y, 1.2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + e2x, cy + e2y, 1.2, 0, Math.PI * 2); ctx.fill()
    }
  })

  ctx.restore()
}

// ============================================================
// GameOverlay — shared component for idle and game-over screens
// ============================================================

interface OverlayProps {
  icon: string
  title: string
  titleColor?: string
  subtitle?: string
  highlight?: string
  buttonLabel: string
  buttonColor: string
  onButtonClick: () => void
}

function GameOverlay({
  icon, title, titleColor, subtitle, highlight,
  buttonLabel, buttonColor, onButtonClick,
}: OverlayProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(26,26,46,0.85)', borderRadius: 10,
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{
        fontSize: 20, color: titleColor || '#fff',
        fontWeight: 700, marginBottom: 4,
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 16, color: '#fff', marginBottom: 4 }}>{subtitle}</div>
      )}
      {highlight && (
        <div style={{ fontSize: 13, color: '#FFD60A', marginBottom: 12 }}>{highlight}</div>
      )}
      <button
        onClick={onButtonClick}
        style={{
          padding: '12px 36px', borderRadius: 10, border: 'none',
          background: buttonColor, color: '#fff',
          fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8,
        }}
      >
        {buttonLabel}
      </button>
    </div>
  )
}

// ============================================================
// SnakeGame — main component
// ============================================================

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Mutable game state (refs — no re-render on change)
  const snakeRef = useRef<Position[]>([])
  const foodRef = useRef<Position>({ x: 0, y: 0 })
  const directionRef = useRef<Direction>('RIGHT')
  const nextDirectionRef = useRef<Direction>('RIGHT')
  const scoreRef = useRef(0)
  const dprRef = useRef(1) // device pixel ratio for HiDPI

  // Track gameState in a ref so keyboard handler can check without re-registering
  const gameStateRef = useRef<'idle' | 'playing' | 'over'>('idle')

  // UI state (triggers re-render)
  const [scoreDisplay, setScoreDisplay] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    try {
      const saved = localStorage.getItem('snake-best-score')
      return saved ? parseInt(saved, 10) : 0
    } catch {
      return 0
    }
  })
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle')
  const [speed, setSpeed] = useState(INITIAL_SPEED)

  // Keep gameStateRef in sync
  gameStateRef.current = gameState

  // ── HiDPI canvas setup (once on mount) ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr
    const logicalW = GRID_SIZE * CELL_SIZE
    const logicalH = GRID_SIZE * CELL_SIZE
    canvas.width = logicalW * dpr
    canvas.height = logicalH * dpr
    canvas.style.width = `${logicalW}px`
    canvas.style.height = `${logicalH}px`
  }, [])

  // ── Keyboard controls (only block keys when playing) ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const newDir = KEY_DIRECTION[e.key]
      if (!newDir) return

      // Only prevent default scrolling when game is active
      if (gameStateRef.current === 'playing') {
        e.preventDefault()
        if (newDir !== OPPOSITE[directionRef.current]) {
          nextDirectionRef.current = newDir
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // ── Game tick (updates state on interval) ──
  useEffect(() => {
    if (gameState !== 'playing') return

    const id = setInterval(() => {
      directionRef.current = nextDirectionRef.current

      const snake = snakeRef.current
      // Guard: snake must be initialized
      if (snake.length === 0) return

      const head = snake[0]
      const delta = DELTA[directionRef.current]
      const newHead: Position = { x: head.x + delta.x, y: head.y + delta.y }

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        endGame()
        return
      }

      // Self collision — exclude tail since it will be removed (unless eating food)
      const eating = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y
      const bodyToCheck = eating ? snake : snake.slice(0, -1)
      if (bodyToCheck.some(s => s.x === newHead.x && s.y === newHead.y)) {
        endGame()
        return
      }

      const newSnake = [newHead, ...snake]

      // Food check
      if (eating) {
        foodRef.current = randomFood(newSnake)
        scoreRef.current += 10
        setScoreDisplay(scoreRef.current)
        // Speed up every 50 points
        if (scoreRef.current % 50 === 0) {
          setSpeed(s => Math.max(60, s - 15))
        }
      } else {
        newSnake.pop()
      }

      snakeRef.current = newSnake
    }, speed)

    return () => clearInterval(id)
  }, [gameState, speed])

  // ── Render loop (draws at screen refresh rate) ──
  useEffect(() => {
    if (gameState !== 'playing') return

    let animId: number
    const loop = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawGame(ctx, snakeRef.current, foodRef.current, directionRef.current, dprRef.current)
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [gameState])

  // ── Start / End helpers ──
  function startGame() {
    const mid = Math.floor(GRID_SIZE / 2)
    snakeRef.current = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ]
    foodRef.current = randomFood(snakeRef.current)
    directionRef.current = 'RIGHT'
    nextDirectionRef.current = 'RIGHT'
    scoreRef.current = 0
    setScoreDisplay(0)
    setSpeed(INITIAL_SPEED)
    setGameState('playing')
  }

  function endGame() {
    setGameState('over')
    const finalScore = scoreRef.current
    if (finalScore > bestScore) {
      setBestScore(finalScore)
      try {
        localStorage.setItem('snake-best-score', String(finalScore))
      } catch { /* storage full or unavailable — silently ignore */ }
    }
  }

  // ── Initial draw for idle state ──
  useEffect(() => {
    if (gameState !== 'idle') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const initSnake = [
      { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
      { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
      { x: Math.floor(GRID_SIZE / 2) - 2, y: Math.floor(GRID_SIZE / 2) },
    ]
    drawGame(ctx, initSnake, randomFood(initSnake), 'RIGHT', dprRef.current)
  }, [gameState])

  const logicalW = GRID_SIZE * CELL_SIZE
  const logicalH = GRID_SIZE * CELL_SIZE
  const isNewRecord = gameState === 'over' && scoreDisplay >= bestScore && scoreDisplay > 0

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
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{scoreDisplay}</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>最高：</span>
          <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{bestScore}</span>
        </div>
      </div>

      {/* Game canvas */}
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '2px solid var(--color-border)',
        position: 'relative',
      }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: logicalW, height: logicalH }} />

        {gameState === 'idle' && (
          <GameOverlay
            icon="🐍"
            title="贪吃蛇"
            subtitle="方向键 / WASD 控制"
            buttonLabel="开始游戏"
            buttonColor="var(--color-success)"
            onButtonClick={startGame}
          />
        )}

        {gameState === 'over' && (
          <GameOverlay
            icon="💀"
            title="游戏结束"
            titleColor="#FF4757"
            subtitle={`得分：${scoreDisplay}`}
            highlight={isNewRecord ? '🏆 新纪录！' : undefined}
            buttonLabel="再来一局"
            buttonColor="var(--color-primary)"
            onButtonClick={startGame}
          />
        )}
      </div>

      {/* Tip */}
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        提示：吃到一个食物 +10 分，分数越高速度越快<br />
        撞到墙壁或自己的身体则游戏结束
      </div>
    </div>
  )
}
