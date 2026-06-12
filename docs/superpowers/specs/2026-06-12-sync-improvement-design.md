# 多设备同步增强设计

## 问题

当前 zzhstart-page 的同步机制存在关键缺陷：首次同步后**后续只 push 不 pull**，导致设备 A 修改书签/设置后，设备 B 看不到更新。同时缺少冲突检测机制和方向控制。

## 方案

采用**智能合并**策略：每次同步先 pull 远端数据，逐条比较 `updatedAt` 保留最新版本，再 push 回远端。同时提供方向选择器，让用户手动控制同步方向。

### 三种同步模式

| 模式 | 行为 | 适用场景 |
|------|------|----------|
| `merge`（默认） | pull → 逐条比 `updatedAt` → 合并 → push | 日常使用 |
| `upload` | 直接 push，本地覆盖远端 | 本地做了大量调整后推送 |
| `download` | 直接 pull，远端覆盖本地 | 新设备首次使用，从云端恢复 |

## 变更范围

### 1. 数据模型（store.ts）

**新增字段：**
- `Bookmark.updatedAt: number`
- `Category.updatedAt: number`
- `Workflow.updatedAt: number`
- `Store.settingsUpdatedAt: number`
- `Store.version` 从 6 升至 7

**CRUD 函数修改：**
所有创建/修改操作（addBookmark, updateBookmark, renameCategory, reorderCategory, setThemeMode 等）设 `updatedAt = Date.now()`

**迁移逻辑：**
v6 → v7：为现有每条数据补 `updatedAt = createdAt`（或 `Date.now()`），settingsUpdatedAt 设为 `Date.now()`

### 2. 同步引擎（sync.ts）

```typescript
type SyncMode = "merge" | "upload" | "download";

async function doSync(mode: SyncMode = "merge"): Promise<void>
```

**merge 模式流程：**
1. 调用 `pullData()`，获取远端所有数据（含 `updated_at`）
2. 逐表合并：
   - **bookmarks**: 以 `id` 为 key 建立映射，逐条比较 `updatedAt`
   - **categories**: 同上
   - **workflows**: 同上
   - **settings**: 比较 `settingsUpdatedAt` vs 远端 `updated_at`
3. 远端有但本地没有的 → 自动添加到本地 Store
4. 远端没有但本地有的 → 保留本地，push 时 upsert
5. 写入合并后的 Store 到 localStorage
6. 调用 `pushData()` 将结果推回 Supabase

**upload 模式：**
直接调用 `pushData()`（已有逻辑，本地覆盖远端）

**download 模式：**
调用 `pullData()`，结果直接 `replaceStore()`（远端覆盖本地）

**enqueueSync 变更：**
修复自动同步开关检查——`enqueueSync()` 中检查 `startpage:sync:auto` localStorage 值，为 `false` 时跳过同步。

### 3. 同步面板 UI（sync-panel.ts + ManageModal.astro）

**新增「同步方向」选择器：**
- `<select>` 下拉或三按钮单选组
- 选项：智能合并 / 本地上传 / 云端下载
- 默认「智能合并」
- 选择持久化到 localStorage

**「立即同步」按钮：**
点击后读取当前方向模式，调用 `doSync(mode)`

**修复自动同步开关：**
```typescript
autoToggle.onchange = () => {
  const enabled = autoToggle.checked;
  localStorage.setItem("startpage:sync:auto", String(enabled));
};
```

### 4. 数据流总览

```
用户操作 → CRUD (store.ts)
           ├── 写入 localStorage + updatedAt
           └── enqueueSync() ── 检查 auto toggle ──┐
                                                    ▼
                                              doSync("merge")
                                                ├── pullData()
                                                ├── mergeByTimestamp()
                                                ├── replaceStore(merged)
                                                └── pushData()

手动点击「立即同步」──── 读取方向选择器 ──→ doSync(selectedMode)
```

## 不变的部分

- Supabase 表结构不变（updated_at 字段已存在）
- Auth 流程不变
- RLS 策略不变
- 离线检测机制不变
- 首次启动 initRemoteSync 流程不变
- Store CRUD 接口签名不变

## 验证场景

| 场景 | 预期 |
|------|------|
| 设备 A 新增书签 → 设备 B 打开 | B 自动拉取后看到新书签 |
| 设备 A 改标题 → 设备 B 打开 | B 合并后更新标题 |
| 双设备同时改不同书签 | 合并后各取最新版本 |
| 本地做了大量调整 | 选「本地上传」强制覆盖 |
| 新设备/清缓存后 | 选「云端下载」恢复所有数据 |
| 关闭自动同步 → 修改数据 | 不同步，手动点按钮才同步 |
