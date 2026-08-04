# 💰 小白记账 (XiaoBai Accounting)

一个简洁、好用的个人记账桌面应用，专为普通用户设计。**无需联网，数据完全保存在本地电脑上**，隐私安全。

![Windows](https://img.shields.io/badge/Windows-%E2%9C%93-0078D6)
![Mac](https://img.shields.io/badge/Mac-%E2%9C%93-000000)
![版本](https://img.shields.io/github/v/release/LIUHONGYANG123/XiaoBai-Accounting)
![下载量](https://img.shields.io/github/downloads/LIUHONGYANG123/XiaoBai-Accounting/total)

---

## 📥 下载安装

**点击右侧 Releases（或 [点这里](https://github.com/LIUHONGYANG123/XiaoBai-Accounting/releases)），选择最新版本下载即可：**

| 你的系统 | 下载文件 | 安装方式 |
|---------|---------|---------|
| 🪟 Windows | `xiaobai-accounting-setup-x.x.x.exe` | 双击 → 选择安装目录 → 完成 |
| 🍎 Mac | `小白记账-x.x.x.dmg` | 打开 → 拖入"应用程序"文件夹 |

> ⚠️ **Windows 用户注意**：首次运行时可能弹出蓝色"未知发布者"警告——这是因为个人开发者没有购买代码签名证书（每年约 2000 元）。点击 **"更多信息" → "仍要运行"** 即可正常安装，软件是安全的。

---

## 📸 功能概览

应用包含 5 个主要页面，通过底部导航栏切换：

| 页面 | 功能 |
|------|------|
| 💰 **记账** | 记录支出/收入，选择两级分类，填写备注，支持修改日期（补记昨天的账） |
| 📋 **账单** | 查看历史记录，按月筛选，按分类筛选，按支出/收入/全部筛选 |
| 📊 **统计** | 月度收支汇总，饼图看支出分布，柱状图看每日趋势 |
| ⚙️ **管理** | 自定义分类——可以增加、修改、删除大类和小类 |
| 🎮 **游戏** | 内置贪吃蛇小游戏，方向键/WASD 控制，分数越高速度越快 |

### ✨ 核心亮点

- 🎯 **两级分类系统**：大类（餐饮/交通/购物…）→ 子类（三餐/公交地铁/衣物…），选分类时分两步操作，清晰直观
- 💵 **收入 + 支出双模式**：同一页面切换，收入显示绿色，支出显示红色，一眼分清
- 📅 **日期可修改**：昨天的账忘了记？日期可以往前改，补录方便
- 💾 **数据完全本地**：使用 SQLite 数据库存储，不联网、不上传，隐私安全
- ✏️ **分类可自定义**：不满意默认分类？可以随时增删改，完全按自己的习惯来
- 🐍 **内置贪吃蛇**：工作学习之余放松一下，最高分本地保存

---

## 🏗️ 技术架构

### 一句话解释

> 这个应用是用 **网页技术（HTML/CSS/JS）** 写的界面，外面套了一个 **Electron 壳**（就像微信电脑版那样），数据存在本地的 **SQLite 数据库** 里（就像 Excel 表格存在你电脑上一样）。

### 技术选型

| 技术 | 通俗解释 | 为什么选它 |
|------|---------|-----------|
| **Electron 22** | "外壳" — 把网页技术打包成桌面软件 | 能同时支持 Windows 和 Mac，生态成熟 |
| **React 18** | "界面积木" — 用组件搭出用户看到的页面 | 社区庞大，组件化开发效率高 |
| **TypeScript** | "写代码时的错别字检查" — 提前发现错误 | 减少低级 bug，写代码时有智能提示 |
| **sql.js** | "内置数据库" — 一个不用安装的 SQLite | 纯 JavaScript 实现，不需要额外安装数据库软件 |
| **Recharts** | "画图工具" — 生成饼图和柱状图 | React 生态最流行的图表库，配置简单 |
| **electron-vite** | "打包工具" — 把代码编译压缩成可运行的程序 | 专门为 Electron 优化，开发/打包都快 |

### 为什么选择 Electron 而不是其他方案？

| 方案 | 优点 | 缺点 |
|------|------|------|
| **Electron（✅ 已选）** | 跨平台，生态成熟，遇到问题容易搜到答案 | 安装包较大（~80MB），内存占用相对高 |
| Flutter | 安装包小，性能好 | 学习曲线陡，生态不如 Electron 成熟 |
| WPF (.NET) | Windows 原生，安装包极小 | 不能跨平台到 Mac，开发效率低 |

对于个人记账工具来说，安装包大一点不是问题（用一次就不会删），但"开发快、好维护"更重要，所以选 Electron。

---

## 📁 项目结构

```
小白记账app/
├── README.md                          # 本文件 — 项目说明
├── CLAUDE.md                          # Claude Code 开发协作规则
├── package.json                       # 项目依赖和脚本配置
├── electron.vite.config.ts            # 构建配置
├── tsconfig.json                      # TypeScript 配置
├── resources/                         # 应用图标
├── scripts/
│   └── dev.cjs                        # 开发启动脚本（解决 ELECTRON_RUN_AS_NODE 问题）
├── src/
│   ├── main/                          # Electron 主进程（Node.js 端）
│   │   ├── index.ts                   # 主进程入口 — 创建窗口、注册 IPC 通信
│   │   └── database.ts                # SQLite 数据库操作（增删改查）
│   ├── preload/
│   │   └── index.ts                   # 预加载脚本 — 安全的通信桥梁
│   └── renderer/                      # React 前端应用（界面层）
│       ├── index.html                 # HTML 入口
│       ├── main.tsx                   # React 入口
│       ├── App.tsx                    # 根组件 — 页面路由（5 个 tab）
│       ├── api/
│       │   └── db.ts                  # 前端调用数据库的 API 层
│       ├── components/                # 可复用的 UI 组件
│       │   ├── Layout.tsx             # 底部导航栏布局
│       │   └── CategoryPicker.tsx     # 两级分类选择器（弹出式）
│       ├── pages/                     # 5 个主页面
│       │   ├── AddExpense.tsx         # 💰 记账页面
│       │   ├── ExpenseList.tsx        # 📋 账单列表页面
│       │   ├── Statistics.tsx         # 📊 统计报表页面
│       │   ├── CategoryManager.tsx    # ⚙️ 分类管理页面
│       │   └── SnakeGame.tsx          # 🎮 贪吃蛇游戏
│       ├── data/
│       │   └── categories.ts          # 默认分类数据（8 个支出大类 + 5 个收入大类）
│       ├── utils/
│       │   ├── format.ts              # 金额格式化（分→元显示）
│       │   └── date.ts                # 日期工具函数
│       ├── types/
│       │   ├── index.ts               # TypeScript 类型定义
│       │   └── electron.d.ts          # Electron 通信接口类型
│       └── styles/
│           └── global.css             # 全局样式
```

---

## 🗄️ 数据库设计

### 核心原则：金额用"分"存储

```
存储：1250（整数，表示 1250 分 = 12.50 元）
显示：¥12.50（只在显示给用户看的时候才除以 100）
```

**为什么？** 计算机做浮点数运算时会出舍入误差（比如 `0.1 + 0.2 ≠ 0.3`），用整数存"分"就能完全避免这个问题。所有涉及钱的系统（银行、支付宝）都是这么做的。

### 数据表结构

**`categories` — 分类表**

| 列名 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 唯一标识，如 "food", "food-meal" |
| name | TEXT | 分类名称，如 "餐饮", "三餐" |
| icon | TEXT | Emoji 图标 |
| parent_id | TEXT | 父分类 ID（NULL = 大类，有值 = 子类） |
| sort_order | INTEGER | 排序序号 |
| is_default | INTEGER | 是否系统默认分类（0=用户自建, 1=系统预置） |
| type | TEXT | 类型：'expense'（支出）或 'income'（收入） |
| created_at / updated_at | TEXT | 时间戳 |
| deleted_at | TEXT | 软删除标记（NULL = 未删除） |

**`expenses` — 记录表**

| 列名 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 唯一标识（UUID） |
| amount | INTEGER | 金额，单位：**分** |
| category_id | TEXT | 大类 ID |
| subcategory_id | TEXT | 子类 ID |
| type | TEXT | 类型：'expense' 或 'income' |
| note | TEXT | 备注（可选） |
| expense_date | TEXT | 记账日期，格式 YYYY-MM-DD |
| deleted_at | TEXT | 软删除标记 |

### 软删除设计

删除操作**不会真正删掉数据**，只是把 `deleted_at` 字段设为当前时间。好处是：
- 误删可以恢复（undo）
- 数据不会因为操作失误而永久丢失
- 统计和查询时用 `WHERE deleted_at IS NULL` 过滤即可

---

## 📝 开发思路与设计决策

### 1. 架构设计：Electron 的三层结构

Electron 应用有三层（就像餐厅有前厅、传菜口、后厨）：

```
┌──────────────────────────────────────┐
│  Renderer（前厅 — React 前端）         │
│  用户看到的界面，运行在浏览器沙箱里     │
│  不能直接访问文件系统或数据库          │
├──────────────────────────────────────┤
│  Preload（传菜口 — 安全桥梁）          │
│  传递前后端之间的消息                  │
│  只暴露有限的安全接口给前端            │
├──────────────────────────────────────┤
│  Main（后厨 — Node.js 后端）           │
│  操作数据库、读写文件                  │
│  拥有完整的系统权限                    │
└──────────────────────────────────────┘
```

**为什么这样设计？** 安全。前端代码在浏览器沙箱里运行，即使前端代码有漏洞，攻击者也访问不到你的文件系统。所有危险操作都在 Main 进程里，前端只能通过有限的 IPC 通道调用。

### 2. 分类系统的设计

**两级分类（大类 → 子类）** 是权衡的结果：

- 一级分类太粗（"餐饮"一笔带过，看不出早餐还是晚餐）
- 三级分类太细（选个分类要点三次，太繁琐）
- 两级刚好——第一步选大类，第二步选子类，操作简单又有足够细的粒度

**分类表用 `parent_id` 自引用**：大类和子类存在同一张表里，`parent_id` 为 NULL 的是大类，不为 NULL 的是子类。好处是结构统一，增删改查逻辑简单。

### 3. 数据存储：为什么用 SQLite 而不是 JSON 文件？

| 方案 | 优点 | 缺点 |
|------|------|------|
| **SQLite（✅ 已选）** | 支持复杂查询（按月统计、按分类汇总），数据安全 | 需要学习 SQL |
| JSON 文件 | 简单，直接读写文件 | 数据多了查询慢，文件损坏风险高 |
| IndexedDB（浏览器自带） | 不需要额外库 | 只能在浏览器里用，Electron 主进程用不了 |

对于记账应用，"按月统计"、"按分类汇总"是核心功能，这些用 SQL 查询比手写 JS 循环快得多。所以选 SQLite。

### 4. IPC 通信设计（前后端交互）

前端 React 组件不能直接操作数据库，需要通过 IPC（进程间通信）发消息给后端：

```
React 组件 → 调用 api/db.ts 里的函数
  → 通过 window.electronAPI.invoke() 发消息
    → Preload 脚本转发
      → Main 进程处理 → 操作 SQLite → 返回结果
```

所有数据库操作都封装在 `api/db.ts` 里，前端组件只需要 `import { getExpenses } from '../api/db'` 就能获取数据，不用关心中间怎么传的。

### 5. 金额处理：分 ↔ 元转换

这是个容易被忽略的坑。JS 里 `0.1 + 0.2 = 0.30000000000000004`，如果用小数存金额，日积月累会有误差。

解决方案：
- **存储层**：所有金额以整数"分"为单位存储（`¥12.50 → 1250`）
- **UI 层**：只在显示给用户前一刻才除以 100（`1250 → "¥12.50"`）
- 相关代码见 `src/renderer/utils/format.ts`

### 6. 软删除 vs 硬删除

选择软删除的原因是：
- 用户误删可以恢复
- 保留数据用于统计
- 实现简单：加一个 `deleted_at` 字段，删的时候填时间戳

代价是数据库文件会越来越大，但对于个人记账应用来说，一个人一辈子的账目也不会超过几十 MB，完全不是问题。

---

## 🛠️ 开发者命令（可选）

> 💡 普通用户不需要看这部分——直接下载安装包使用即可。以下内容仅供想参与开发的人参考。

**环境要求**：Node.js 18+（[下载地址](https://nodejs.org)）

```bash
# 1. 克隆项目
git clone https://github.com/LIUHONGYANG123/XiaoBai-Accounting.git
cd XiaoBai-Accounting

# 2. 安装依赖（第一次需要，之后不用）
npm install

# 3. 启动开发模式（代码修改后自动刷新）
npm run dev
```

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发模式（热更新） |
| `npm run build` | 构建生产版本 |
| `npm run package` | 本地打包成安装包（Windows: .exe, Mac: .dmg） |
| `npm run typecheck` | 检查 TypeScript 类型错误 |
| `npm run test` | 运行单元测试 |

---

## 🔧 已知问题

### ELECTRON_RUN_AS_NODE 环境变量

如果系统环境变量中设置了 `ELECTRON_RUN_AS_NODE=1`，Electron 会当成普通 Node.js 运行而不是桌面应用，导致启动失败。

**解决方法：**
1. 打开 Windows 系统属性 → 环境变量
2. 在"用户变量"和"系统变量"中删除 `ELECTRON_RUN_AS_NODE`
3. 重启终端

或者直接用 `npm run dev`，项目已经内置了自动清除这个变量的脚本。

---

## 📄 开源协议

本项目仅供个人学习和使用。

---

## 🎯 版本记录

| 标签 | 内容 |
|------|------|
| `v1.1.0` | **支持 Mac 发布** — 双平台安装包（Windows .exe + Mac .dmg），GitHub Actions 自动打包 |
| `v1.0.0` | **首个正式发布** — Windows 安装包，GitHub Releases 一键下载安装 |
| 早期版本 | 开发历程：`v1-初始化项目` → `v2-分类系统升级和收入功能` → `v3-添加README文档` → `v4-贪吃蛇小游戏` |

---

*由 [Claude Code](https://claude.com/claude-code) 辅助开发。*
