# 多设备同步增强 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 subagent-driven-development（推荐）或 executing-plans 逐任务实现此计划。

**目标：** 重构同步引擎，支持智能合并/本地上传/云端下载三种模式，实现真正的多设备数据同步。

**架构：** 在 Store v7 中为每条数据添加 `updatedAt` 时间戳；`doSync(mode)` 根据模式执行 pull→逐条合并→push 或单向覆盖流程。

**技术栈：** TypeScript, Supabase, localStorage

**前置说明：** 项目无测试框架，所有验证通过 `astro dev` 手动测试。已有未提交的工作区变更（ManageModal.astro, card.astro, commandLine.astro, bookmarks-panel.ts），注意不要干扰。

---

### 任务 1：Store v7 — 数据模型添加 updatedAt 字段

**文件：**
- 修改：`src/lib/store.ts`

**步骤说明：** 为所有数据实体添加 `updatedAt` 字段，Store version 升至 7，编写迁移逻辑，所有 CRUD 函数设 `updatedAt`。

- [ ] **步骤 1：修改数据类型的 updatedAt 字段**

```typescript
// Bookmark 新增 updatedAt
export type Bookmark = {
  id: string;
  href: string;
  title: string;
  categoryId: string;
  createdAt: number;
  updatedAt: number;       // ← 新增
};

// Category 新增 updatedAt
export type Category = {
  id: string;
  name: string;
  order: number;
  builtin?: boolean;
  updatedAt: number;       // ← 新增
};

// Workflow 新增 updatedAt
export type Workflow = {
  id: string;
  name: string;
  bookmarkIds: string[];
  urls: string[];
  updatedAt: number;       // ← 新增
};

// Store type 修改
export type Store = {
  version: 7;              // 6 → 7
  categories: Category[];
  bookmarks: Bookmark[];
  workflows: Workflow[];
  themeMode: ThemeMode;
  themeStyle: ThemeStyle;
  bookmarkSort: BookmarkSort;
  searchEngine: SearchEngineId;
  customSearchEngine?: { name: string; url: string };
  settingsUpdatedAt: number;  // ← 新增
};

export const STORAGE_KEY = "startpage:store:v7";  // v6 → v7

// 修改 getState() SSR fallback
```

- [ ] **步骤 2：修改 buildDefaultStore()**

```typescript
function buildDefaultStore(): Store {
  const now = Date.now();
  const bookmarks: Bookmark[] = DEFAULT_BOOKMARKS.map((b, idx) => ({
    ...b,
    id: `bm-default-${idx}`,
    categoryId: BOOKMARK_CATEGORY_INDEX[idx] ?? "cat-productivity",
    createdAt: now,
    updatedAt: now,          // ← 新增
  }));
  return {
    version: 7,              // 6 → 7
    categories: [...DEFAULT_CATEGORIES].map(c => ({ ...c, updatedAt: now })),  // ← 新增
    bookmarks,
    workflows: [],           // 空数组不需要 updatedAt
    themeMode: ...,
    themeStyle: ...,
    bookmarkSort: ...,
    searchEngine: ...,
    customSearchEngine: ...,
    settingsUpdatedAt: now,   // ← 新增
  };
}
```

- [ ] **步骤 3：修改 load() 迁移逻辑：v6 → v7**

```typescript
function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = buildDefaultStore();
      save(init);
      return init;
    }
    const parsed = JSON.parse(raw) as Store;

    if (parsed.version === 7) return parsed;

    // 版本 < 7：迁移逻辑
    const now = Date.now();
    // v6 及其他旧版本：补 updatedAt
    const addUpdatedAt = <T extends { updatedAt?: number }>(item: T): T => ({
      ...item,
      updatedAt: item.updatedAt ?? now,
    });

    const init: Store = {
      version: 7,
      categories: (parsed.categories || []).map(addUpdatedAt),
      bookmarks: (parsed.bookmarks || []).map((b: any) => ({
        ...b,
        updatedAt: b.updatedAt ?? b.createdAt ?? now,
      })),
      workflows: ((parsed as any).workflows || []).map(addUpdatedAt),
      themeMode: (parsed as any).themeMode ?? "light",
      themeStyle: (parsed as any).themeStyle ?? "default",
      bookmarkSort: (parsed as any).bookmarkSort ?? "alpha",
      searchEngine: (parsed as any).searchEngine ?? "google",
      customSearchEngine: (parsed as any).customSearchEngine ?? undefined,
      settingsUpdatedAt: (parsed as any).settingsUpdatedAt ?? now,
    };
    save(init);
    return init;
  } catch (e) {
    console.warn("store: load failed, fallback to defaults", e);
    return buildDefaultStore();
  }
}
```

- [ ] **步骤 4：修改所有创建类 CRUD 函数，设 updatedAt**

```typescript
// addBookmark
export function addBookmark(input: { href: string; title?: string; categoryId: string }): Bookmark {
  // ... existing checks ...
  const bm: Bookmark = {
    id: uid(),
    href,
    title,
    categoryId: input.categoryId,
    createdAt: Date.now(),
    updatedAt: Date.now(),      // ← 新增
  };
  // ...
}

// addWorkflow
export function addWorkflow(name: string, bookmarkIds: string[], urls?: string[]): Workflow | null {
  // ...
  const wf: Workflow = {
    id: uid(),
    name: trimmed,
    bookmarkIds,
    urls: urls ?? [],
    updatedAt: Date.now(),      // ← 新增
  };
  // ...
}

// addCategory
export function addCategory(name: string): Category {
  // ...
  const cat: Category = {
    id: uid(),
    name: trimmed,
    order,
    updatedAt: Date.now(),      // ← 新增
  };
  // ...
}
```

- [ ] **步骤 5：修改所有更新类 CRUD 函数，设 updatedAt**

```typescript
// updateBookmark — 在 map 回调中设 updatedAt
export function updateBookmark(id: string, patch: Partial<Pick<Bookmark, "href" | "title" | "categoryId">>): void {
  const list = getState().bookmarks.map((bm) => {
    if (bm.id !== id) return bm;
    const next = { ...bm, ...patch, updatedAt: Date.now() };  // ← 新增
    // ...
  });
  commit({ ...getState(), bookmarks: list });
}

// renameCategory
export function renameCategory(id: string, name: string): void {
  const list = getState().categories.map((c) =>
    c.id === id ? { ...c, name: trimmed, updatedAt: Date.now() } : c  // ← 新增
  );
  // ...
}

// reorderCategory
export function reorderCategory(fromIndex: number, toIndex: number): void {
  // ...
  const updated = cats.map((c, i) => ({ ...c, order: i, updatedAt: Date.now() }));  // ← 新增
  // ...
}

// deleteCategory — 书签的 categoryId 被改也要更新 updatedAt
export function deleteCategory(id: string): void {
  // ...
  const bookmarks = getState().bookmarks.map((bm) =>
    bm.categoryId === id ? { ...bm, categoryId: "", updatedAt: Date.now() } : bm  // ← 新增
  );
  // ...
}

// renameWorkflow, updateWorkflow — 同理添加 updatedAt: Date.now()
```

- [ ] **步骤 6：修改所有 settings setter，设 settingsUpdatedAt**

```typescript
export function setThemeMode(mode: ThemeMode): void {
  commit({ ...getState(), themeMode: mode, settingsUpdatedAt: Date.now() });
}
export function setThemeStyle(style: ThemeStyle): void {
  commit({ ...getState(), themeStyle: style, settingsUpdatedAt: Date.now() });
}
export function setBookmarkSort(sort: BookmarkSort): void {
  commit({ ...getState(), bookmarkSort: sort, settingsUpdatedAt: Date.now() });
}
export function setSearchEngine(engine: SearchEngineId): void {
  commit({ ...getState(), searchEngine: engine, settingsUpdatedAt: Date.now() });
}
export function setCustomSearchEngine(name: string, url: string): void {
  commit({
    ...getState(),
    customSearchEngine: { name, url },
    searchEngine: "custom",
    settingsUpdatedAt: Date.now(),
  });
}
```

- [ ] **步骤 7：修改 addBookmarksBatch 中的创建逻辑设 updatedAt**

```typescript
// addBookmarksBatch 中：
return {
  id: uid(),
  href,
  title: item.title?.trim() || extractHostname(href),
  categoryId: catId,
  createdAt: now + idx,
  updatedAt: now + idx,          // ← 新增
};
```

- [ ] **步骤 8：修改 import/export 函数兼容 v7**

```typescript
export const STORAGE_KEY = "startpage:store:v7";

export function importJSON(text: string, mode: "merge" | "replace" = "replace"): { ok: boolean; message: string } {
  // 检查 version 从 !== 6 改为 !== 7
  if (parsed.version !== 7 || !Array.isArray(parsed.categories) || !Array.isArray(parsed.bookmarks)) {
    return { ok: false, message: "JSON 格式不匹配（需要 version: 7）" };
  }
  // replace 模式的 commit 中要设 updatedAt 默认值
  if (mode === "replace") {
    commit({
      version: 7,
      // ... 所有现有字段 ...
      settingsUpdatedAt: parsed.settingsUpdatedAt || Date.now(),
    });
  }
}
```

- [ ] **步骤 9：把 getState SSR fallback 也更新 version 为 7**

---

### 任务 2：同步引擎 — 三模式 + 智能合并

**文件：**
- 修改：`src/lib/sync.ts`
- 修改：`src/lib/store.ts`（新增 pull-compatible replaceStore）

- [ ] **步骤 1：定义 SyncMode 类型**

```typescript
export type SyncMode = "merge" | "upload" | "download";
```

- [ ] **步骤 2：修改 doSync 签名，接受 mode 参数**

```typescript
// 适配现有调用方：enqueueSync 固定传 "merge"，手动同步传所选模式
export async function doSync(mode: SyncMode = "merge"): Promise<void> {
  if (!navigator.onLine) {
    setSyncStatus("offline");
    return;
  }
  if (!assertCanSync()) {
    setSyncStatus("idle");
    return;
  }
  setSyncStatus("syncing");

  if (mode === "upload") {
    // 仅推送本地到远端
    const ok = await pushData();
    localStorage.setItem("startpage:sync:last", String(Date.now()));
    setSyncStatus(ok ? "synced" : "error");
    return;
  }

  if (mode === "download") {
    // 远端覆盖本地
    const { store, hasRemoteData } = await pullData();
    if (hasRemoteData && store) {
      replaceStore(store);
    }
    localStorage.setItem("startpage:sync:last", String(Date.now()));
    setSyncStatus("synced");
    return;
  }

  // mode === "merge": pull → merge → push
  const { store: remoteStore, hasRemoteData } = await pullData();
  if (hasRemoteData && remoteStore) {
    const merged = mergeStore(getState(), remoteStore);
    replaceStore(merged);
  }
  const ok = await pushData();
  localStorage.setItem("startpage:sync:last", String(Date.now()));
  setSyncStatus(ok ? "synced" : "error");
}
```

- [ ] **步骤 3：修改 pullData 返回 updated_at**

```typescript
async function pullData(): Promise<{
  store: Partial<Store> | null;
  hasRemoteData: boolean;
}> {
  // ... existing code ...

  // 拉取 bookmarks 时读取 updated_at
  const bookmarks: Bookmark[] = (bmRes.data ?? []).map((r: any) => ({
    id: r.id,
    href: r.href,
    title: r.title,
    categoryId: r.category_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : r.created_at,  // ← 新增
  }));

  // 拉取 categories 时读取 updated_at
  const categories: Category[] = (catRes.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    order: r.order,
    builtin: r.builtin ?? false,
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),  // ← 新增
  }));

  // 拉取 workflows 时读取 updated_at
  const workflows: Workflow[] = (wfRes.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    bookmarkIds: r.bookmark_ids ?? [],
    urls: r.urls ?? [],
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),  // ← 新增
  }));

  // 拉取 settings 时读取 updated_at
  if (settingsRes.data) {
    // ...existing fields...
    store.settingsUpdatedAt = settingsRes.data.updated_at
      ? new Date(settingsRes.data.updated_at).getTime()
      : Date.now();
  }

  return { store, hasRemoteData };
}
```

- [ ] **步骤 4：实现 mergeStore 函数**

```typescript
function mergeStore(local: Store, remote: Partial<Store>): Store {
  const now = Date.now();

  // Bookmark 合并：按 id 逐条比 updatedAt
  const remoteBmMap = new Map<string, Bookmark>();
  for (const bm of remote.bookmarks ?? []) {
    remoteBmMap.set(bm.id, bm);
  }

  const mergedBookmarks: Bookmark[] = [];
  const seenIds = new Set<string>();

  // 本地书签：与远端比对
  for (const localBm of local.bookmarks) {
    seenIds.add(localBm.id);
    const remoteBm = remoteBmMap.get(localBm.id);
    if (!remoteBm) {
      // 仅本地有 → 保留本地（push 时会 upsert 到远端）
      mergedBookmarks.push(localBm);
    } else {
      // 两端都有 → 保留 updatedAt 较新的
      mergedBookmarks.push(localBm.updatedAt >= remoteBm.updatedAt ? localBm : remoteBm);
    }
  }

  // 远端有但本地没有的 → 加入
  for (const bm of remote.bookmarks ?? []) {
    if (!seenIds.has(bm.id)) {
      mergedBookmarks.push(bm);
    }
  }

  // Category 合并（同理）
  const remoteCatMap = new Map<string, Category>();
  for (const cat of remote.categories ?? []) {
    remoteCatMap.set(cat.id, cat);
  }
  const mergedCategories: Category[] = [];
  const seenCatIds = new Set<string>();
  for (const localCat of local.categories) {
    seenCatIds.add(localCat.id);
    const remoteCat = remoteCatMap.get(localCat.id);
    if (!remoteCat) {
      mergedCategories.push(localCat);
    } else {
      mergedCategories.push(localCat.updatedAt >= remoteCat.updatedAt ? localCat : remoteCat);
    }
  }
  for (const cat of remote.categories ?? []) {
    if (!seenCatIds.has(cat.id)) {
      mergedCategories.push(cat);
    }
  }

  // Workflow 合并（同理）
  const remoteWfMap = new Map<string, Workflow>();
  for (const wf of remote.workflows ?? []) {
    remoteWfMap.set(wf.id, wf);
  }
  const mergedWorkflows: Workflow[] = [];
  const seenWfIds = new Set<string>();
  for (const localWf of local.workflows) {
    seenWfIds.add(localWf.id);
    const remoteWf = remoteWfMap.get(localWf.id);
    if (!remoteWf) {
      mergedWorkflows.push(localWf);
    } else {
      mergedWorkflows.push(localWf.updatedAt >= remoteWf.updatedAt ? localWf : remoteWf);
    }
  }
  for (const wf of remote.workflows ?? []) {
    if (!seenWfIds.has(wf.id)) {
      mergedWorkflows.push(wf);
    }
  }

  // Settings 合并：比单个 settingsUpdatedAt
  let mergedSettings = {
    themeMode: local.themeMode,
    themeStyle: local.themeStyle,
    bookmarkSort: local.bookmarkSort,
    searchEngine: local.searchEngine,
    customSearchEngine: local.customSearchEngine,
  };

  if (remote.themeMode !== undefined) {
    const localSettingsTime = local.settingsUpdatedAt ?? 0;
    const remoteSettingsTime = remote.settingsUpdatedAt ?? 0;
    if (remoteSettingsTime > localSettingsTime) {
      mergedSettings = {
        themeMode: remote.themeMode,
        themeStyle: remote.themeStyle ?? "default",
        bookmarkSort: remote.bookmarkSort ?? "alpha",
        searchEngine: remote.searchEngine ?? "google",
        customSearchEngine: remote.customSearchEngine,
      };
    }
  }

  return {
    ...local,
    ...mergedSettings,
    bookmarks: mergedBookmarks,
    categories: mergedCategories,
    workflows: mergedWorkflows,
    settingsUpdatedAt: Math.max(local.settingsUpdatedAt ?? 0, remote.settingsUpdatedAt ?? 0),
  };
}
```

- [ ] **步骤 5：在 store.ts 中暴露 getState 给 mergeStore 使用**（`getState` 已导出，无需额外修改）

- [ ] **步骤 6：修改 enqueueSync 检查 auto toggle**

```typescript
export function enqueueSync(): void {
  // 检查自动同步开关
  const autoSync = localStorage.getItem("startpage:sync:auto");
  if (autoSync === "false") return;

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => doSync("merge"), 800);
}
```

- [ ] **步骤 7：修改 pushData，将本地 updatedAt 写入远端 updated_at**

```typescript
// pushData 中每条数据都包含 updated_at
const bmRows = state.bookmarks.map((b) => ({
  // ... 现有字段 ...
  updated_at: new Date(b.updatedAt ?? Date.now()).toISOString(),  // ← 新增
}));

const catRows = state.categories.map((c) => ({
  // ... 现有字段 ...
  updated_at: new Date(c.updatedAt ?? Date.now()).toISOString(),  // ← 新增
}));

const wfRows = state.workflows.map((w) => ({
  // ... 现有字段 ...
  updated_at: new Date(w.updatedAt ?? Date.now()).toISOString(),  // ← 新增
}));

const { error: settingsErr } = await supabase.from("user_settings").upsert({
  // ... 现有字段 ...
  updated_at: new Date(state.settingsUpdatedAt ?? Date.now()).toISOString(),  // ← 新增
});
```

- [ ] **步骤 8：修改 initSync 适配新签名**

```typescript
export async function initSync(): Promise<boolean> {
  // ...
  return doSync("merge").then(() => true).catch(() => false);  // 指定 "merge"
}
```

---

### 任务 3：同步面板 UI — 方向选择器 + 自动同步开关修复

**文件：**
- 修改：`src/components/ManageModal.astro`
- 修改：`src/lib/manage/sync-panel.ts`

- [ ] **步骤 1：在 ManageModal.astro 中新增同步方向选择器**

在「立即同步」按钮上方添加：

```html
<div class="sync-direction-row">
  <label class="sync-direction-label" for="sync-direction-select">同步方向</label>
  <select id="sync-direction-select" class="sync-direction-select">
    <option value="merge">智能合并</option>
    <option value="upload">本地上传</option>
    <option value="download">云端下载</option>
  </select>
</div>
```

- [ ] **步骤 2：在 sync-panel.ts 中实现方向选择器状态管理**

```typescript
const directionSelect = document.getElementById("sync-direction-select") as HTMLSelectElement;

// 从 localStorage 恢复上次选择
const savedDirection = localStorage.getItem("startpage:sync:direction");
if (savedDirection) {
  directionSelect.value = savedDirection;
}

// 选择变化时持久化
directionSelect.onchange = () => {
  localStorage.setItem("startpage:sync:direction", directionSelect.value);
};
```

- [ ] **步骤 3：修改「立即同步」按钮，读取方向选择器**

```typescript
forceBtn.onclick = () => {
  indicator.textContent = "同步中...";
  indicator.className = "sync-state-value syncing";
  const mode = (document.getElementById("sync-direction-select") as HTMLSelectElement).value as SyncMode;
  doSync(mode);
};
```

- [ ] **步骤 4：修复自动同步开关**

```typescript
// syncAutoEnabled 局部变量不再需要
// 自动同步开关直接读写 localStorage

// 初始化
const autoSync = localStorage.getItem("startpage:sync:auto");
autoToggle.checked = autoSync !== "false";  // 默认 true

autoToggle.onchange = () => {
  localStorage.setItem("startpage:sync:auto", String(autoToggle.checked));
};
```

- [ ] **步骤 5：同步删除不再使用的 syncAutoEnabled 变量**

```typescript
// 移除 syncAutoEnabled 变量声明（第 42 行）
// let syncAutoEnabled = true;  ← 删除
```

---

### 任务 4：验证与修复

- [ ] **步骤 1：运行 `astro dev` 确认项目编译通过**

```bash
npm run dev
```

预期：无 TypeScript 编译错误，页面正常打开。

- [ ] **步骤 2：手动测试验证场景**

| 测试场景 | 操作 | 预期 |
|----------|------|------|
| 自动合并同步 | 修改书签标题，等待 >800ms | 数据推送到 Supabase |
| 云端下载 | 选「云端下载」点「立即同步」 | 本地数据被远端覆盖 |
| 本地上传 | 选「本地上传」点「立即同步」 | 远端数据被本地覆盖 |
| 自动同步开关 | 关闭自动同步 → 修改书签 | 不自动同步 |
| 自动同步开关 | 打开自动同步 → 修改书签 | 800ms 后自动同步 |
