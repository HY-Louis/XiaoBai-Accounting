import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // 测试文件所在目录（涵盖主进程和渲染进程的代码）
    include: ['src/**/*.test.ts'],
    // 测试环境：jsdom 模拟浏览器（用于渲染进程），node 用于主进程
    // 这里默认用 node，渲染进程的测试可以单独配置
    environment: 'node',
    // 路径别名（和 tsconfig 保持一致）
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
