import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import {
  openDatabase,
  closeDatabase,
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addExpense,
  getExpenses,
  deleteExpense,
  getMonthlyStats,
} from './database'

let mainWindow: BrowserWindow | null = null

/**
 * 界面等比例缩放的基准尺寸——也就是"原始大小"，
 * 和窗口初始的 420×750 保持一致（此时缩放倍数 = 1 倍）。
 */
const BASE_WIDTH = 420
const BASE_HEIGHT = 750

/** 缩放倍数的下限与上限：不缩小，最多放大到 2.5 倍（再大字就大得离谱了） */
const MIN_ZOOM = 1
const MAX_ZOOM = 2.5

/**
 * 让界面跟着窗口一起等比例放大（"放大镜"模式）。
 *
 * 就像用放大镜看一张纸：纸上的字、图、间距同时变大，排版一点不乱。
 * 做法是按"当前窗口比基准尺寸大了多少倍"算出一个倍数，
 * 再交给 Chromium 的页面缩放去统一放大整个界面。
 *
 * 取宽、高两个方向的**较小**倍数，是为了保证整个界面还能完整装进窗口——
 * 只按宽度放大的话，内容会高得离谱，一屏只能看到一个按钮。
 */
function applyProportionalZoom(win: BrowserWindow) {
  if (win.isDestroyed()) return

  const { width, height } = win.getContentBounds()
  const fitRatio = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT)
  // 保留两位小数，避免拖动窗口时倍数一直抖动导致反复重排
  const zoom = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fitRatio)) * 100) / 100

  if (Math.abs(win.webContents.getZoomFactor() - zoom) > 0.001) {
    win.webContents.setZoomFactor(zoom)
  }
}

/**
 * 创建应用主窗口。
 * 窗口尺寸设计为手机比例（420×750），方便单手操作，
 * 就像把手机记账 app 搬到了电脑桌面上。
 *
 * 🔒 安全配置说明：
 * - nodeIntegration: false → 网页部分无法直接使用 Node.js（防止恶意代码）
 * - contextIsolation: true  → 网页和系统底层完全隔离（Electron 安全最佳实践）
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 750,
    minWidth: 360,
    minHeight: 600,
    title: '小白记账',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // electron-vite: in dev mode, load from dev server; in production, load file
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 页面加载完先按当前窗口大小缩放一次（刷新/热更新后也要重新应用）
  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow) applyProportionalZoom(mainWindow)
  })

  // 拉伸、最大化、还原窗口时，界面跟着一起等比例放大或缩小
  mainWindow.on('resize', () => {
    if (mainWindow) applyProportionalZoom(mainWindow)
  })
  mainWindow.on('maximize', () => {
    if (mainWindow) applyProportionalZoom(mainWindow)
  })
  mainWindow.on('unmaximize', () => {
    if (mainWindow) applyProportionalZoom(mainWindow)
  })
}

/**
 * 注册数据库操作的通信通道（IPC Handlers）。
 * 网页部分通过 preload 脚本调用这些通道来操作数据库，
 * 每个通道对应一个数据库函数——就像电话总机，把来电转接到正确的部门。
 */
function registerIpcHandlers() {
  ipcMain.handle('db:getCategories', () => {
    return getAllCategories()
  })

  ipcMain.handle('db:addExpense', (_event, expense) => {
    return addExpense(expense)
  })

  ipcMain.handle('db:getExpenses', (_event, month?: string) => {
    return getExpenses(month)
  })

  ipcMain.handle('db:deleteExpense', (_event, id: string) => {
    return deleteExpense(id)
  })

  ipcMain.handle('db:getMonthlyStats', (_event, year: number, month: number) => {
    return getMonthlyStats(year, month)
  })

  ipcMain.handle('db:addCategory', (_event, name: string, icon: string, parentId?: string | null) => {
    return addCategory(name, icon, parentId)
  })

  ipcMain.handle('db:updateCategory', (_event, id: string, name: string, icon: string) => {
    return updateCategory(id, name, icon)
  })

  ipcMain.handle('db:deleteCategory', (_event, id: string) => {
    return deleteCategory(id)
  })
}

app.whenReady().then(async () => {
  const userDataPath = app.getPath('userData')
  await openDatabase(userDataPath)
  registerIpcHandlers()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
    mainWindow = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
