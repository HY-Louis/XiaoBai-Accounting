import { contextBridge, ipcRenderer } from 'electron'

/**
 * 🔒 安全桥梁（Preload Script）
 *
 * 这个文件的作用类似于银行的"防弹玻璃柜台"：
 * - 网页部分（渲染进程）不能直接碰操作系统或数据库，防止恶意代码搞破坏
 * - 我们只在这个小窗口里放行 8 个预设的数据库操作通道
 * - 不在白名单里的请求一律拒绝，确保安全
 *
 * 通俗理解：餐厅的服务员（网页）只能通过传菜口（本文件）向厨房（数据库）
 * 传递特定的菜单指令，不能直接冲进厨房乱翻东西。
 */

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 向主进程发送请求的唯一通道。
   * 只有白名单中的 8 个数据库操作能通过，其他请求一律拒绝。
   * 就像大楼门禁——只有持卡人（白名单通道）能刷卡进入。
   */
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
