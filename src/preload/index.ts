import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations will be exposed here
  invoke: (channel: string, ...args: unknown[]) => {
    const validChannels = [
      'db:getExpenses',
      'db:addExpense',
      'db:deleteExpense',
      'db:getCategories',
      'db:addCategory',
      'db:updateCategory',
      'db:deleteCategory',
      'db:getMonthlyStats',
    ]
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    return Promise.reject(new Error(`Invalid channel: ${channel}`))
  },
})
