# 小白记账 (XiaoBai Accounting) — Project Context for Claude Code

## Project Overview

小白记账 is a personal expense tracking desktop application for Windows and Mac.
The target user is a non-technical beginner who wants a simple, intuitive tool to
track daily spending in RMB (人民币).

### Core Features
- Add, edit, delete expense records
- 2-level expense categorization (primary category → subcategory)
- View expense history (by date, by category)
- Monthly spending summary with charts (pie chart, bar chart)
- Local data storage (no internet required, data stays on user's computer)

---

## ⚠️ CRITICAL RULE: All Technical Decisions Require User Approval

**The user is a complete beginner (小白). They cannot provide specific technical
requirements.** For every non-trivial technical decision, you MUST:

1. Present 2-3 clear options to the user
2. Explain each option in **simple, plain language** — avoid jargon, use everyday
   analogies (e.g., "like building with LEGO blocks" or "like a filing cabinet")
3. List **pros and cons** for each option in terms the user can understand
   (speed, app size, ease of use, future flexibility)
4. Provide a **recommendation** with clear reasoning
5. **Wait for the user to choose** before writing any code

This rule applies to (but is not limited to):
- Choosing libraries (UI component library, chart library, CSS framework, etc.)
- Architecture decisions (state management, file organization, routing)
- Design decisions (color schemes, layout patterns, interaction patterns)
- Feature trade-offs ("we can do X or Y, but not both in the first version")

Examples of decisions that do NOT require user approval:
- Bug fixes
- Typo corrections
- Following an already-agreed convention or pattern

---

## ⚠️ CRITICAL RULE: Git Commit Must Go Through Security Gate

**Never directly execute `git commit` or `/git-save` when the user asks to commit code.**

When the user says anything like "提交代码", "帮我提交", "commit", "存档" etc., you **MUST** invoke `/gitcommit-agent` instead. This is a non-negotiable security requirement — just like you wouldn't skip airport security before boarding a plane.

The `/gitcommit-agent` flow:
1. Run unit tests (tester agent) — all tests must pass
2. Run quality audit (quality-engineer agent) — overall score ≥ 60 and 0 critical issues
3. Verify anti-tampering check_id
4. If both pass → git add → commit → push → cleanup checkpoint files
5. If either fails → BLOCK the commit, report why

**Exception:** Only if the user explicitly says `--force` (e.g., "/gitcommit-agent --force"), skip checks and proceed directly.

**Rationale:** This ensures every commit has been tested and audited. Without this rule, the user might forget to invoke the safety check manually.

---

## Confirmed Tech Stack

| Technology | Role (Plain Explanation) |
|---|---|
| **Electron 22** | The "shell" — wraps a web app into a desktop app for Windows & Mac. |
| **electron-vite** | The "build tool" — compiles and packages the Electron app efficiently. |
| **React 18** | The "UI builder" — builds interactive user interfaces with reusable components. |
| **TypeScript** | "JavaScript with a spell-checker" — catches mistakes before the app runs. |
| **sql.js** | Pure JavaScript SQLite — stores expense data locally, no native compilation needed. |
| **Recharts** | Chart library — renders pie charts and bar charts for spending statistics. |

---

## ⚠️ Known Issue: ELECTRON_RUN_AS_NODE

If the `ELECTRON_RUN_AS_NODE=1` environment variable is set on the system,
Electron will run as plain Node.js instead of as an Electron app. This causes
`require('electron')` to return a path string instead of the Electron API,
resulting in `TypeError: Cannot read properties of undefined (reading 'whenReady')`.

**Symptoms:**
- `require('electron')` returns a file path string instead of an API object
- `Cannot read properties of undefined (reading 'whenReady')`

**Fix:** Remove `ELECTRON_RUN_AS_NODE` from your system environment variables.
In Windows: System Properties → Environment Variables → delete it from both
User and System variables, then restart your terminal.

The npm scripts in `package.json` include `set ELECTRON_RUN_AS_NODE=` to clear
this variable before running, but the permanent fix is to remove it from the
system entirely.

---

## Expense Category System (2-Level Hierarchy)

### Primary Categories & Subcategories

| 一级大类 | Icon | 二级子类 |
|---------|------|---------|
| 餐饮饮食 | 🍽️ | 早餐、午餐、晚餐、零食饮料、咖啡奶茶、外卖、聚餐请客、买菜食材 |
| 交通出行 | 🚗 | 公交地铁、出租车/网约车、加油充电、停车费、火车高铁、飞机票、共享单车、长途汽车 |
| 购物消费 | 🛍️ | 衣服鞋帽、数码电子、日用品、美妆护肤、家居装饰、宠物用品、珠宝首饰、箱包配饰 |
| 住房居家 | 🏠 | 房租/房贷、水电煤气、物业费、网络通讯、取暖费、维修保养、保洁家政 |
| 娱乐休闲 | 🎮 | 电影演出、运动健身、游戏充值、旅游度假、KTV酒吧、书籍杂志、视频会员 |
| 医疗健康 | 💊 | 看病挂号、药品购买、体检保健、牙科眼科、医疗器械 |
| 教育学习 | 📚 | 培训课程、书籍教材、考试报名、文具用品、在线订阅 |
| 人情往来 | 🎁 | 红包礼金、请客送礼、慈善捐款、孝敬父母、婚丧嫁娶 |
| 金融保险 | 💰 | 保险缴费、贷款利息、手续费/服务费 |
| 其他支出 | 📦 | 快递邮寄、其他 |

---

## Design Principles

1. **Simplicity over features** — When in doubt, make it simpler. A confusing feature
   is worse than a missing feature.
2. **Forgiving input** — Accept various amount formats ("12.5", "12.50", "12.5元")
   and normalize internally.
3. **Clear feedback** — Every save, delete, or edit must show visible confirmation.
4. **RMB-first** — Display currency as ¥. Format numbers with commas: ¥1,234.56.
5. **Local-first** — All data stays on the user's computer. No cloud, no accounts.

---

## Coding Conventions

### Language
- **Code comments & variable names**: English
- **User-facing text (UI labels, errors)**: Simplified Chinese (简体中文)
- **Git commit messages**: English

### File Naming
- React components: `PascalCase` → `ExpenseForm.tsx`
- Utility functions: `camelCase` → `formatCurrency.ts`
- Directories: `kebab-case` → `components/`, `category-editor/`

### TypeScript
- Use strict mode. Avoid `any` — define proper types instead.
- All amounts stored as **INTEGER in 分 (fen/cents)** to avoid floating-point errors.
  - Example: ¥12.50 is stored as `1250` (cents).
  - Convert to yuan only at the very last moment in the UI layer.

### React
- Functional components only (no class components).
- Named exports preferred over default exports.
- Keep components small: aim for ≤ 50 lines per component.

---

## Database Design

### Core Principle: Amount in 分 (cents)
```
Storage: 1250 (integer, means 1250分)
Display: ¥12.50 (divide by 100 at the last moment in UI)
Reason: Floating-point math (0.1 + 0.2 ≠ 0.3 exactly) causes rounding errors in money.
```

### Tables

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,       -- e.g., "food", "food-breakfast"
  name TEXT NOT NULL,         -- e.g., "餐饮饮食", "早餐"
  icon TEXT,                  -- emoji, e.g., "🍽️", "🥣"
  parent_id TEXT,             -- NULL = primary category, category.id = subcategory
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT             -- soft delete
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  amount INTEGER NOT NULL,    -- in 分 (cents), e.g., ¥12.50 = 1250
  category_id TEXT NOT NULL,
  subcategory_id TEXT,
  note TEXT,                  -- optional note/memo
  expense_date TEXT NOT NULL, -- ISO 8601: "2026-07-25"
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT             -- soft delete (enables undo)
);
```

---

## Common Commands

| Command | What It Does |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start Electron app in development mode (with hot reload) |
| `npm run build` | Build for production |
| `npm run preview` | Preview the built app |
| `npm run package` | Build and create installer (Windows: .exe, Mac: .dmg) |
| `npm run typecheck` | Run TypeScript type checking |

---

## Project File Structure

```
小白记账app/
├── CLAUDE.md                       # Project context for Claude Code
├── docs/
│   └── product-spec.md             # Product requirements document
├── package.json                    # Dependencies and scripts
├── electron.vite.config.ts         # electron-vite build configuration
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.node.json              # TypeScript config for build tools
├── resources/                      # App icons (icon.png)
├── src/
│   ├── main/                       # Electron main process
│   │   ├── index.ts                # Main process entry (window, menus, IPC)
│   │   └── database.ts             # SQLite operations (sql.js)
│   ├── preload/
│   │   └── index.ts                # Preload script (secure bridge)
│   └── renderer/                   # React app (renderer process)
│       ├── index.html              # HTML entry point
│       ├── main.tsx                # React entry point
│       ├── App.tsx                 # Root component (tab navigation)
│       ├── api/
│       │   └── db.ts               # Renderer-side database API (IPC calls)
│       ├── components/             # Reusable UI pieces
│       │   ├── Layout.tsx          # App shell (bottom tab navigation)
│       │   └── CategoryPicker.tsx  # 2-level category selector modal
│       ├── pages/                  # Full screen views
│       │   ├── AddExpense.tsx      # Home — add expense form
│       │   ├── ExpenseList.tsx     # Browse/search expense history
│       │   └── Statistics.tsx      # Charts and spending reports
│       ├── data/
│       │   └── categories.ts       # Default category definitions
│       ├── utils/
│       │   ├── format.ts           # Currency formatting (分 → ¥)
│       │   └── date.ts             # Date helpers
│       ├── types/
│       │   ├── index.ts            # Shared TypeScript types
│       │   └── electron.d.ts       # Electron preload API types
│       └── styles/
│           └── global.css          # Global styles
└── resources/                      # App icons and assets
```

---

## UI Page Plan (v1.0 — 3 Screens)

1. **记账页 (AddExpense)** — Home screen. Large amount input at top → tap
   category → optional note → big "保存" button. The most-used screen.
2. **账单列表 (ExpenseList)** — Scrollable list of all expenses, newest first.
   Filter by month and category. Swipe/click to delete.
3. **统计页 (Statistics)** — Pie chart (spending by category) + bar chart
   (daily spending trend). Month selector at top.
