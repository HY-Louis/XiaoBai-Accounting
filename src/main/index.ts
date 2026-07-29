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
