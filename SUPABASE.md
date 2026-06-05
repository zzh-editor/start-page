# Supabase 同步配置

启用跨设备同步需要配置 Supabase 项目。

## 1. 创建 Supabase 项目

前往 [supabase.com](https://supabase.com) 注册并创建一个新项目。创建完成后记录以下信息：

- **Project URL** — 位于 Settings → API → Project URL
- **anon public key** — 位于 Settings → API → anon public

## 2. 配置环境变量

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```ini
PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
```

## 3. 创建数据库表

在 Supabase Dashboard 的 **SQL Editor** 中执行以下 SQL：

```sql
-- 书签表
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  href TEXT NOT NULL,
  title TEXT NOT NULL,
  category_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 分组表
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  builtin BOOLEAN DEFAULT FALSE,
  created_at TEXT,
  updated_at TEXT
);

-- 工作流表
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bookmark_ids TEXT[] DEFAULT '{}',
  urls TEXT[] DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

-- 用户设置表
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY,
  theme_mode TEXT DEFAULT 'light',
  theme_style TEXT DEFAULT 'default',
  bookmark_sort TEXT DEFAULT 'alpha',
  search_engine TEXT DEFAULT 'google',
  custom_search_name TEXT,
  custom_search_url TEXT,
  updated_at TEXT
);
```

## 4. 配置行级安全（RLS）

执行完建表语句后，执行以下 SQL 开启 RLS 并设置访问策略：

```sql
-- 开启 RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 允许用户管理自己的书签
CREATE POLICY "用户管理自己的书签" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- 允许用户管理自己的分组
CREATE POLICY "用户管理自己的分组" ON categories
  FOR ALL USING (auth.uid() = user_id);

-- 允许用户管理自己的工作流
CREATE POLICY "用户管理工作流" ON workflows
  FOR ALL USING (auth.uid() = user_id);

-- 允许用户管理自己的设置
CREATE POLICY "用户管理自己的设置" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
```

## 5. 完成

重启开发服务器：

```bash
npm run dev
```

打开设置 → 同步面板。如果之前显示"同步未配置"，现在应该可以看到登录/注册按钮。

点击**注册**创建账号 → **登录** → 自动开始同步。

## 同步原理

- **双向同步**：每次同步先拉取远程数据合并到本地，再将本地最新数据推送到远程
- **自动同步**：登录后默认开启自动同步，本地数据变更后自动触发（800ms 防抖）
- **手动同步**：可在同步面板点击"立即同步"强制执行
- **离线检测**：浏览器离线时自动暂停同步，恢复连接后自动重试
