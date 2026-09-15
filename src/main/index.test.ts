/**
 * Tests for src/main/index.ts — 窗口等比例缩放 applyProportionalZoom
 *
 * 说明：这个文件是 Electron 主进程的入口，一加载就会创建窗口、连数据库，
 * 而且 applyProportionalZoom 是文件内部的私有函数（没有 export）。
 * 所以这里用 vi.mock 把 electron 和数据库都换成"假的"（就像用模型机做风洞实验），
 * 然后通过触发窗口的 resize / maximize 事件，间接检验缩放倍数算得对不对。
 *
 * 基准尺寸 420×750 = 1 倍；倍数范围 1～2.5；取宽、高两个方向中较小的倍数；保留两位小数。
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// vi.hoisted：保证这些"假对象"在 vi.mock 的工厂函数执行前就已经存在
const fake = vi.hoisted(() => {
  const winHandlers: Record<string, () => void> = {}
  const wcHandlers: Record<string, () => void> = {}
  const state = { width: 420, height: 750, destroyed: false, currentZoom: 1 }

  const webContents = {
    on: (event: string, fn: () => void) => { wcHandlers[event] = fn },
    getZoomFactor: () => state.currentZoom,
    setZoomFactor: vi.fn((z: number) => { state.currentZoom = z }),
  }

  const win = {
    on: (event: string, fn: () => void) => { winHandlers[event] = fn },
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    isDestroyed: () => state.destroyed,
    getContentBounds: vi.fn(() => ({ x: 0, y: 0, width: state.width, height: state.height })),
    webContents,
  }

  const ipcHandle = vi.fn()

  return { winHandlers, wcHandlers, state, webContents, win, ipcHandle }
})

vi.mock('electron', () => {
  // 用普通 class 模拟 BrowserWindow：new 出来的就是上面那个假窗口
  class BrowserWindow {
    constructor() { return fake.win }
    static getAllWindows() { return [fake.win] }
  }
  return {
    app: {
      whenReady: () => Promise.resolve(),
      getPath: () => 'fake-user-data',
      on: vi.fn(),
      quit: vi.fn(),
    },
    BrowserWindow,
    ipcMain: { handle: fake.ipcHandle },
  }
})

// 数据库也换成假的，避免测试时真的去创建 SQLite 文件
vi.mock('./database', () => ({
  openDatabase: vi.fn(async () => undefined),
  closeDatabase: vi.fn(),
  getAllCategories: vi.fn(),
  addCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  addExpense: vi.fn(),
  getExpenses: vi.fn(),
  deleteExpense: vi.fn(),
  getMonthlyStats: vi.fn(),
}))

/** 模拟"窗口被拖到某个尺寸"：改尺寸并触发 resize 事件 */
function resizeTo(width: number, height: number) {
  fake.state.width = width
  fake.state.height = height
  fake.winHandlers.resize()
}

beforeAll(async () => {
  await import('./index')
  // 等 app.whenReady().then(...) 里的异步流程跑完（openDatabase → registerIpcHandlers → createWindow）
  await vi.waitFor(() => {
    expect(fake.winHandlers.resize).toBeTypeOf('function')
  })
})

beforeEach(() => {
  fake.state.width = 420
  fake.state.height = 750
  fake.state.destroyed = false
  fake.state.currentZoom = 1
  fake.webContents.setZoomFactor.mockClear()
  fake.win.getContentBounds.mockClear()
})

// ============================================================
// 窗口创建时的事件绑定 & IPC 通道注册
// ============================================================
describe('窗口创建时的事件绑定', () => {
  it('resize / maximize / unmaximize / did-finish-load 四个事件都挂上了缩放处理', () => {
    expect(fake.winHandlers.resize).toBeTypeOf('function')
    expect(fake.winHandlers.maximize).toBeTypeOf('function')
    expect(fake.winHandlers.unmaximize).toBeTypeOf('function')
    expect(fake.wcHandlers['did-finish-load']).toBeTypeOf('function')
  })

  it('注册了全部 8 个数据库通信通道（IPC）', () => {
    const channels = fake.ipcHandle.mock.calls.map(call => call[0] as string).sort()
    expect(channels).toEqual([
      'db:addCategory',
      'db:addExpense',
      'db:deleteCategory',
      'db:deleteExpense',
      'db:getCategories',
      'db:getExpenses',
      'db:getMonthlyStats',
      'db:updateCategory',
    ])
  })
})

// ============================================================
// applyProportionalZoom — 缩放倍数计算
// ============================================================
describe('applyProportionalZoom — 等比例缩放倍数', () => {
  // ✅ 正常情况
  it('窗口放大到基准的 2 倍（840×1500）→ 缩放倍数 2', () => {
    resizeTo(840, 1500)
    expect(fake.webContents.setZoomFactor).toHaveBeenCalledWith(2)
  })

  it('窗口放大到 1.5 倍（630×1125）→ 缩放倍数 1.5', () => {
    resizeTo(630, 1125)
    expect(fake.webContents.setZoomFactor).toHaveBeenCalledWith(1.5)
  })

  it('宽高倍数不一致时取较小的那个（宽 2 倍、高 1.2 倍 → 1.2），保证界面完整装进窗口', () => {
    resizeTo(840, 900)
    expect(fake.webContents.setZoomFactor).toHaveBeenCalledWith(1.2)
  })

  it('倍数四舍五入保留两位小数（500×900：宽比 1.1905 → 1.19）', () => {
    resizeTo(500, 900)
    expect(fake.webContents.setZoomFactor).toHaveBeenCalledWith(1.19)
  })

  it('页面加载完成（did-finish-load）时也会按当前窗口大小缩放一次', () => {
    fake.state.width = 840
    fake.state.height = 1500
    fake.wcHandlers['did-finish-load']()
    expect(fake.webContents.setZoomFactor).toHaveBeenCalledWith(2)
  })

  it('最大化再还原：maximize 与 unmaximize 事件同样会重新计算倍数', () => {
    fake.state.width = 1260
    fake.state.height = 2250
    fake.winHandlers.maximize()
    // 1260/420 = 3 倍，超过上限 → 2.5
    expect(fake.webContents.setZoomFactor).toHaveBeenLastCalledWith(2.5)

    fake.state.width = 420
    fake.state.height = 750
    fake.winHandlers.unmaximize()
    expect(fake.webContents.setZoomFactor).toHaveBeenLastCalledWith(1)
  })

  // ⚠️ 边界情况
  it('窗口比基准还小（最小尺寸 360×600）→ 不缩小，倍数保持下限 1', () => {
    fake.state.currentZoom = 1.5 // 先假装当前是放大状态，才能看到它被"拉回" 1
    resizeTo(360, 600)
    expect(fake.webContents.setZoomFactor).toHaveBeenCalledWith(1)
  })

  it('窗口超大（4200×7500，是基准的 10 倍）→ 倍数封顶 2.5', () => {
    resizeTo(4200, 7500)
    expect(fake.webContents.setZoomFactor).toHaveBeenCalledWith(2.5)
  })

  it('只拉宽不拉高（840×750）→ 高度倍数是 1，整体倍数保持 1', () => {
    fake.state.currentZoom = 1.5
    resizeTo(840, 750)
    expect(fake.webContents.setZoomFactor).toHaveBeenCalledWith(1)
  })

  it('刚好基准尺寸（420×750）且当前已是 1 倍 → 倍数没变，不重复设置（避免无谓重排）', () => {
    resizeTo(420, 750)
    expect(fake.webContents.setZoomFactor).not.toHaveBeenCalled()
  })

  it('算出的倍数与当前一致（当前 2 倍，窗口 840×1500）→ 不重复设置', () => {
    fake.state.currentZoom = 2
    resizeTo(840, 1500)
    expect(fake.webContents.setZoomFactor).not.toHaveBeenCalled()
  })

  // ❌ 异常情况
  it('窗口已销毁 → 直接返回，不读取尺寸也不设置缩放（避免报错）', () => {
    fake.state.destroyed = true
    resizeTo(840, 1500)
    expect(fake.win.getContentBounds).not.toHaveBeenCalled()
    expect(fake.webContents.setZoomFactor).not.toHaveBeenCalled()
  })
})
