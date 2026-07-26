import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import {
  openDatabase,
  closeDatabase,
  getAllCategories,
  addExpense,
  getExpenses,
  deleteExpense,
  getMonthlyStats,
} from './database'

let mainWindow: BrowserWindow | null = null

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
