# zzhstart-page

> 一个功能完善的浏览器起始页，支持书签管理、自定义主题、终端风格搜索和 **基于 Supabase 的跨设备同步**。

Forked 自 [ahmetdem/start-page](https://github.com/ahmetdem/start-page) —— 感谢原作者的精美起点。

**在线预览**：[https://start-page-tau-flax.vercel.app/](https://start-page-tau-flax.vercel.app/)

---

## 📸 预览

### 默认主题（浅色）

<table>
  <tr>
    <td align="center"><b>主页</b></td>
    <td align="center"><b>设置面板</b></td>
  </tr>
  <tr>
    <td><img src="./screenshots/homepage-default.png" alt="默认主题主页" width="100%"/></td>
    <td><img src="./screenshots/settings-default.png" alt="默认主题设置面板" width="100%"/></td>
  </tr>
</table>

### 像素主题（深色 / 8-bit 风格）

<table>
  <tr>
    <td align="center"><b>主页</b></td>
    <td align="center"><b>设置面板</b></td>
  </tr>
  <tr>
    <td><img src="./screenshots/homepage-pixel.png" alt="像素主题主页" width="100%"/></td>
    <td><img src="./screenshots/settings-pixel.png" alt="像素主题设置面板" width="100%"/></td>
  </tr>
</table>

---

## 🆕 基于上游的新增功能

### 🎨 主题系统
- **默认主题** — 简洁现代，搭配 squircle 圆角设计
- **像素主题** — 8-bit 黑白色调，绿色高亮，Z 工坊像素黑体 12px + 硬阴影
- **浅色 / 深色模式** 切换（像素主题为单色模式）
- **设置面板** 中可即时预览主题卡片

### 🔖 书签管理
- **完整 CRUD** — 在设置面板中增、删、改书签
- **批量导入** — 批量粘贴网址，支持带标题和分类
- **分组管理** — 创建、重命名、排序、删除分组（删除分组后原书签保留在「全部」）
- **书签排序** — 按首字母或添加时间排序
- **批量操作** — 勾选多个书签，弹出移动分组 / 删除面板
- **未分类书签** — 删除分组后归属书签统一标记为 `未分类`
- **分页翻页** — 每页 20 个书签，横向滑动 + 圆点指示器
- **防重复添加** — 同一 URL 已存在时给出 Toast 提示

### 🔍 搜索与命令
- **终端风格输入框** 带打字动画（`Google :` / `wf+...` / `按 / 聚焦...` 等 8 条循环占位文案）
- **多搜索引擎**：Google、Bing、DuckDuckGo、Brave、自定义
- **工作流** — 在设置面板中保存一组 URL 集合，主页输入 `wf+名称` 或 `workflow+名称` 批量打开
- **快速添加** — 终端栏输入 `add <url> <标题> <分组>` 一行添加（分组不存在自动新建）

### ⚙️ 设置面板
完整的设置界面，共 7 个子标签页：

| 标签页 | 功能 |
|--------|------|
| 主题 | 主题卡片（默认 / 像素），浅色/深色模式切换 |
| 书签 | 增删改、批量导入、排序、勾选移动/删除 |
| 分组 | 创建、重命名、排序、删除分组 |
| 工作流 | 创建命名的 URL 集合，分类筛选选择书签 |
| 搜索引擎 | 选择默认引擎，配置自定义引擎（`{q}` 占位） |
| 快捷键 | 查看所有键盘快捷键 |
| 同步 | 邮箱登录/注册/绑定、手动同步、4 种账号状态横幅、状态指示器 |

### 🔄 跨设备同步（Supabase）
- **匿名登录** — 首次访问自动静默登录（无需注册，仅当前设备）
- **邮箱注册/登录** — 绑定账号以跨设备同步数据
- **匿名升级** — 匿名用户可一键绑定邮箱升级为永久账号
- **自动同步** — 每次数据变更 800ms 防抖推送
- **手动同步** — 设置面板中的「手动同步」按钮（双向：先拉后推）
- **账号状态横幅** — 4 种状态可视化：未配置 / 加载中 / 匿名 / 已登录
- **同步指示器** — 紧贴齿轮按钮左侧，任何状态变化 5s 后自动隐藏（刷新页面重现）
- **在线/离线感知** — 浏览器 `offline` 时显示 ⚠，`online` 时自动恢复同步

### 🧭 顶栏 / 导航
- **分类标签** + 数量徽章
- **长按拖拽排序** — 标签支持 250ms 长按后拖拽重排
- **键盘切换** — `Tab` / `Shift+Tab` 在分类间切换
- **同步指示器** 紧贴齿轮左侧（5s 自动隐藏）

---

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/iszhjane/start-page.git
cd start-page

# 2. 安装依赖
npm install

# 3. 本地开发
npm run dev          # http://localhost:4321

# 4. 构建生产版本
npm run build        # 输出到 dist/
npm run preview      # 本地预览生产构建
```

**无 Supabase 也能用** — 不配置环境变量的话，页面所有功能正常，只是无法跨设备同步。

---

## 🌐 部署

支持任意静态托管平台（Vercel、Netlify、Cloudflare Pages、GitHub Pages 等）。

### Vercel 一键部署

1. Fork 本仓库到你的 GitHub 账号
2. 在 [Vercel](https://vercel.com) 中点击「New Project」→ 选 fork 的仓库
3. （可选）在「Environment Variables」配置 Supabase 凭据，参见下一节
4. 点击「Deploy」

---

## 🔄 跨设备同步（Supabase）— 完整配置指南

### 5.1 设计理念

数据流向：

```
┌────────────┐                        ┌────────────┐
│  浏览器 A  │ ─── 800ms 防抖推送 ──▶ │            │
└────────────┘                        │  Supabase  │
                                      │  Postgres  │
┌────────────┐                        │            │
│  浏览器 B  │ ◀─── 手动/启动拉取 ── │  + RLS 隔离 │
└────────────┘                        └────────────┘
       ▲                                      │
       │       localStorage（始终是主存）       │
       └──────────────────────────────────────┘
```

- **localStorage 始终是数据主源**（`startpage:store:v6`），保证离线可用
- **Supabase 仅做同步** —— 联网时自动 800ms 防抖推送；启动时拉取最新数据
- **手动同步**双向（先 pull 后 push），用于多端冲突收敛

### 5.2 账号模型

支持两种用户类型：

```
首次访问 ──▶ 匿名登录（仅设备本地，user_id 存到 localStorage）
   │
   │  设置面板「同步」标签
   │   └─▶ 「绑定邮箱到当前账号」一键升级
   │         │
   │         ▼
   └─▶ 邮箱注册 / 登录 ─▶ 永久账号（跨设备同步）
```

- **匿名用户**：账号存在 Supabase Auth 但不带 email，设备 `localStorage` 中保留 `user_id`；清除浏览器数据 = 账号丢失
- **邮箱用户**：`user_id` 由 Auth 颁发，跨设备登录即可拉取同一份数据

### 5.3 创建 Supabase 项目

1. 打开 [supabase.com](https://supabase.com)，新建项目（区域选离你近的）
2. 进入项目 → **SQL Editor** → New query
3. 粘贴并执行以下完整 schema（**4 张表 + RLS 策略**）：

```sql
-- ========== 书签表 ==========
create table if not exists public.bookmarks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  href text not null,
  title text not null,
  category_id text not null default '',
  created_at bigint not null,
  updated_at timestamptz not null default now()
);
create index if not exists bookmarks_user_idx on public.bookmarks(user_id);

-- ========== 分类表 ==========
create table if not exists public.categories (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  "order" int not null,
  builtin boolean not null default false,
  created_at bigint not null,
  updated_at timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories(user_id);

-- ========== 工作流表 ==========
create table if not exists public.workflows (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  bookmark_ids text[] not null default '{}',
  urls text[] not null default '{}',
  created_at bigint not null,
  updated_at timestamptz not null default now()
);
create index if not exists workflows_user_idx on public.workflows(user_id);

-- ========== 用户设置表 ==========
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme_mode text not null default 'light',
  theme_style text not null default 'default',
  bookmark_sort text not null default 'alpha',
  search_engine text not null default 'google',
  custom_search_name text,
  custom_search_url text,
  updated_at timestamptz not null default now()
);

-- ========== RLS（行级安全）==========
alter table public.bookmarks     enable row level security;
alter table public.categories    enable row level security;
alter table public.workflows     enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "user own" on public.bookmarks;
create policy "user own" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user own" on public.categories;
create policy "user own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user own" on public.workflows;
create policy "user own" on public.workflows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user own" on public.user_settings;
create policy "user own" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

4. 进入 **Authentication → Providers → Email** → 打开 **「Allow anonymous sign-ins」** 开关

### 5.4 Vercel 环境变量

在 Vercel 项目 **Settings → Environment Variables** 添加以下两个变量（对 Production / Preview / Development 全部勾选）：

| 变量名 | 来源 |
|--------|------|
| `PUBLIC_SUPABASE_URL` | Supabase Dashboard → **Settings → API → Project URL** |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → **Settings → API → Project API keys → `anon` / `public`** |

> ⚠️ `PUBLIC_*` 前缀是 Astro 约定的浏览器可见变量；这里**只需要 `anon` key**，不要把 `service_role` 泄露到客户端。

保存后**重新部署一次**（Deployments → 最新一条 → Redeploy），配置才能生效。

### 5.5 同步面板的 4 种状态横幅

打开设置 → 同步标签，顶部横幅实时反映当前状态：

| 状态 | 颜色 | 含义 |
|------|------|------|
| `loading` | 灰色 | 启动时正在恢复 / 创建会话 |
| `anon` | 琥珀色 | 匿名登录成功，可一键绑定邮箱升级 |
| `signed-in` | 绿色 | 已登录邮箱账号，正在自动同步 |
| `unconfigured` | 红色 | 未配置 Supabase 凭据（环境变量缺失） |

### 5.6 同步指示器（齿轮左侧）

- **位置**：齿轮按钮**正左方** 8px
- **图标含义**：
  - `▷` 空闲
  - `↻` 同步中（旋转动画）
  - `✓` 同步成功
  - `✗` 同步失败
  - `⚠` 离线
- **5s 自动隐藏**：每次状态变化重置定时器，5s 内无新变化则 `hidden = true`
- **刷新重现**：页面刷新后 DOM 重建，指示器重新显示，再次绑定监听

### 5.7 常见问题 FAQ

#### Q1：绑定的邮箱是 GitHub 邮箱还是 Supabase 账号？

**两者都不是。** 这里的「邮箱」是 Supabase Auth 模块的用户标识，**任意可用邮箱**即可（推荐 Gmail / Outlook / 自有域名邮箱）。它和你的 GitHub 登录、Supabase Dashboard 登录**完全独立**。

#### Q2：不配置 Supabase 还能用吗？

能。所有功能（书签、主题、工作流、快捷键、设置）都基于 `localStorage`，只是没有跨设备同步。**完全离线可用**。

#### Q3：数据安全吗？

- localStorage 只在当前浏览器
- Supabase 配置了 RLS（`auth.uid() = user_id`），**任何用户都只能读写自己的数据**
- 客户端只有 `anon` key（公共），无法绕过 RLS

#### Q4：清浏览器数据会怎样？

匿名用户：本地和云端数据**都会丢**（匿名 user_id 重新生成）。
邮箱用户：本地数据丢，但登录后可从 Supabase **全量拉回**。

#### Q5：多端冲突怎么办？

每次 `doSync()` 双向：先 `pullData()` 拉取远端覆盖本地，再 `pushData()` 推送最新本地到远端。**远端始终为最新一次同步的来源**。极端冲突场景（两端同时离线编辑）会以最后一次推送到 Supabase 的版本为准。

---

## ⌨️ 快捷键

| 快捷键 | 作用 |
|--------|------|
| `/` | 聚焦终端栏输入框 |
| `Tab` | 切换到下一个分类 |
| `Shift+Tab` | 切换到上一个分类 |
| `Esc` | 关闭设置面板 / 清空输入框 |
| `↑` / `↓` | 浏览终端栏历史命令 |
| `Enter` | 提交输入（打开搜索 / 触发命令） |

终端栏特殊命令：

| 语法 | 作用 |
|------|------|
| `关键词` | 命中已有书签则直接打开，否则用默认引擎搜索 |
| `r:<查询>` | 强制搜索（不命中书签） |
| `m:<查询>` | 强制搜索（不命中书签） |
| `add <url> <标题> <分组>` | 快速添加书签（分组不存在自动新建） |
| `wf+名称` / `workflow+名称` | 批量打开工作流中的所有 URL |

---

## 🏗️ 项目结构

```
.
├── public/                          # 静态资源
│   └── fonts/                       # 自托管字体（Inter / Source Code Pro / 像素字体）
├── src/
│   ├── components/
│   │   ├── Topbar.astro             # 顶栏：分类 tabs + 同步指示器 + 齿轮
│   │   ├── card.astro               # 书签网格（4 列 → 2 列 → 1 列响应式）
│   │   ├── commandLine.astro        # 终端风格搜索框
│   │   ├── ManageModal.astro        # 设置面板（7 子标签）
│   │   ├── Pager.astro              # 分页圆点
│   │   └── Toast.astro              # 全局 Toast 通知
│   ├── lib/
│   │   ├── store.ts                 # 数据层：localStorage + 订阅 + 触发同步
│   │   ├── sync.ts                  # 同步引擎：push/pull/doSync
│   │   ├── auth.ts                  # 认证：anon + email + linkEmail
│   │   ├── supabase.ts              # Supabase 客户端单例
│   │   ├── themes.ts                # 主题注册表
│   │   ├── squircle.ts              # Squircle 圆角生成（SVG path）
│   │   └── helpers.ts               # escapeHtml / openUrls / showToast
│   ├── layouts/
│   │   └── Layout.astro             # 全局布局 + 主题应用
│   ├── pages/
│   │   └── index.astro              # 主页
│   ├── content/                     # build-time 初始内容
│   └── env.d.ts
├── screenshots/                     # README 截图资源
├── .env.example                     # Supabase 凭据模板
├── astro.config.mjs                 # Astro 配置
├── tailwind.config                  # Tailwind 配置
└── package.json
```

### 关键数据流

```
用户操作（增删改书签/分组/工作流/设置）
    ↓
store.ts: commit()
    ↓
localStorage.setItem("startpage:store:v6", ...)
    ↓
enqueueSync()  ← 800ms 防抖
    ↓
doSync()
    ├─→ pullData()    拉取 Supabase 覆盖本地
    └─→ pushData()    推送本地到 Supabase
    ↓
onSyncStatus 监听者更新 UI 指示器
```

---

## 🛠️ 技术栈

- **[Astro 6](https://astro.build/)** — 静态站点框架，零 JS 默认
- **[Tailwind CSS 4](https://tailwindcss.com/)** — 实用类样式
- **[Supabase](https://supabase.com/)** — Auth + Postgres + RLS
- **TypeScript** — 全栈类型安全
- **零后端** — 纯静态 + 客户端 Supabase

---

## 🧪 本地调试

```bash
# 本地 dev
npm run dev

# 复制环境变量模板
cp .env.example .env
# 编辑 .env 填入真实 Supabase 凭据
# 重新 npm run dev 即可
```

打开浏览器 DevTools → Network 标签，可以观察：

- `bookmarks?user_id=...` — 拉取请求
- `bookmarks` upsert — 推送请求
- `auth/v1/token` — 匿名登录 / 邮箱登录

---

## 📄 许可证

MIT — 参见 [LICENCE](./LICENCE)

## 🙏 致谢

- [ahmetdem/start-page](https://github.com/ahmetdem/start-page) — 上游原项目
- [Z 工坊像素黑体](https://github.com/SolidZORO/zpix-pixel-font) — 像素主题字体
- [Supabase](https://supabase.com) — 同步后端
