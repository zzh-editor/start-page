// =====================================================================
// 数据层：分类、书签、主题的运行时管理
// - 默认数据来自 build-time 的 bookmarks.md（保持用户原 20 条内容）
// - 运行时变更写入 localStorage（key: startpage:store:v4）
// - 同步到 Supabase（若已配置）
// - 提供订阅机制，让 UI 响应式刷新
// =====================================================================

import { enqueueSync } from "./sync";

export type ThemeMode = "light" | "dark";
export type ThemeStyle = "default" | "pixel";

export type BookmarkSort = "added" | "alpha";

export type Workflow = {
  id: string;
  name: string;
  bookmarkIds: string[];
  urls: string[];
};

export type SearchEngineId = "google" | "bing" | "duckduckgo" | "brave" | "custom";

export const SEARCH_ENGINES: Record<Exclude<SearchEngineId, "custom">, { label: string; url: string }> = {
  google: { label: "Google", url: "https://www.google.com/search?q=" },
  bing: { label: "Bing", url: "https://www.bing.com/search?q=" },
  duckduckgo: { label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  brave: { label: "Brave Search", url: "https://search.brave.com/search?q=" },
};

export type Category = {
  id: string;
  name: string;
  order: number;
  builtin?: boolean;
};

export type Bookmark = {
  id: string;
  href: string;
  title: string;
  categoryId: string;
  createdAt: number;
};

export type Store = {
  version: 6;
  categories: Category[];
  bookmarks: Bookmark[];
  workflows: Workflow[];
  themeMode: ThemeMode;
  themeStyle: ThemeStyle;
  bookmarkSort: BookmarkSort;
  searchEngine: SearchEngineId;
  customSearchEngine?: { name: string; url: string };
};

export function getSearchUrl(engine: SearchEngineId, query: string, custom?: Store["customSearchEngine"]): string {
  const q = encodeURIComponent(query);
  if (engine === "custom" && custom?.url) {
    return custom.url.replace("{q}", q).replace("${q}", q);
  }
  const base = SEARCH_ENGINES[engine as Exclude<SearchEngineId, "custom">]?.url ?? SEARCH_ENGINES.google.url;
  return `${base}${q}`;
}

export const STORAGE_KEY = "startpage:store:v6";

// ---------- 默认数据：4 个预填分类 + 20 条原始书签 ----------
// 与 src/content/bookmarks.md 保持一致，迁移后通过 store 接管
const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-ai", name: "AI", order: 0, builtin: true },
  { id: "cat-social", name: "社交", order: 1, builtin: true },
  { id: "cat-productivity", name: "效率", order: 2, builtin: true },
  { id: "cat-media", name: "阅读娱乐", order: 3, builtin: true },
];

const DEFAULT_BOOKMARKS: Omit<Bookmark, "id" | "createdAt" | "categoryId">[] = [
  { href: "https://claude.ai/", title: "Claude" },
  { href: "https://chatgpt.com/", title: "ChatGpt" },
  { href: "https://discord.com/app", title: "Discord" },
  { href: "https://web.telegram.org/k/", title: "Telegram" },
  { href: "https://elk.zone/m.cmx.im/public/local", title: "Mastodon" },
  { href: "https://www.instagram.com/", title: "Instagram" },
  { href: "https://mail.google.com/", title: "Gmail" },
  { href: "https://github.com", title: "Github" },
  { href: "https://notion.so/", title: "Notion" },
  { href: "https://www.deepl.com/en/translator", title: "DeepL" },
  { href: "https://www.icloud.com.cn/", title: "iCloud" },
  { href: "https://noodsradio.com/shows", title: "noodsradio" },
  { href: "https://youtube.com", title: "YouTube" },
  { href: "https://sspai.com/", title: "SSPAI" },
  { href: "https://vimeo.com/watch", title: "Vimeo" },
  { href: "https://www.bilibili.com/", title: "Bilibili" },
  { href: "https://appinn.com/", title: "Appinn" },
  { href: "https://podcasts.apple.com/", title: "Podcasts" },
  { href: "https://z-library.sk/", title: "Zlibrary" },
  { href: "https://tr.pinterest.com/", title: "Pinterest" },
];

// 分类映射：书签 index → categoryId
const BOOKMARK_CATEGORY_INDEX: Record<number, string> = {
  0: "cat-ai", 1: "cat-ai",
  2: "cat-social", 3: "cat-social", 4: "cat-social", 5: "cat-social",
  6: "cat-productivity", 7: "cat-productivity", 8: "cat-productivity", 9: "cat-productivity", 10: "cat-productivity",
  11: "cat-media", 12: "cat-media", 13: "cat-media", 14: "cat-media", 15: "cat-media",
  16: "cat-media", 17: "cat-media", 18: "cat-media", 19: "cat-media",
};

function buildDefaultStore(): Store {
  const now = Date.now();
  const bookmarks: Bookmark[] = DEFAULT_BOOKMARKS.map((b, idx) => ({
    ...b,
    id: `bm-default-${idx}`,
    categoryId: BOOKMARK_CATEGORY_INDEX[idx] ?? "cat-productivity",
    createdAt: now,
  }));
  return {
    version: 6,
    categories: [...DEFAULT_CATEGORIES],
    bookmarks,
    workflows: [],
    themeMode: (document.documentElement.dataset.mode as "light" | "dark") || "light",
    themeStyle: (document.documentElement.dataset.style as ThemeStyle) || "default",
    bookmarkSort: "alpha",
    searchEngine: "google",
    customSearchEngine: undefined,
  };
}

// ---------- 持久化 ----------
function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = buildDefaultStore();
      save(init);
      return init;
    }
    const parsed = JSON.parse(raw) as Store;
    if (parsed.version !== 6) {
      const oldTheme = (parsed as unknown as { theme?: "light" | "dark" }).theme;
      const oldStyle = (parsed as { themeStyle?: string }).themeStyle;
      let style: ThemeStyle = "default";
      if (oldStyle === "pixel") {
        style = oldStyle as ThemeStyle;
      }
      const init: Store = {
        version: 6,
        categories: parsed.categories || [],
        bookmarks: parsed.bookmarks || [],
        workflows: (parsed as { workflows?: Workflow[] }).workflows ?? [],
        themeMode: oldTheme ?? parsed.themeMode ?? "light",
        themeStyle: style || parsed.themeStyle || "default",
        bookmarkSort: (parsed as { bookmarkSort?: BookmarkSort }).bookmarkSort ?? "alpha",
        searchEngine: (parsed as { searchEngine?: SearchEngineId }).searchEngine ?? "google",
        customSearchEngine: (parsed as { customSearchEngine?: { name: string; url: string } }).customSearchEngine ?? undefined,
      };
      save(init);
      return init;
    }
    return parsed;
  } catch (e) {
    console.warn("store: load failed, fallback to defaults", e);
    try { window.dispatchEvent(new CustomEvent("toast", { detail: { msg: "本地数据已损坏，已重置为默认值", kind: "error" } })); } catch {}
    return buildDefaultStore();
  }
}

function save(state: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("store: save failed", e);
  }
}

let _skipNextSync = false;

function commit(next: Store): void {
  state = next;
  save(next);
  if (!_skipNextSync) {
    enqueueSync();
  }
  _skipNextSync = false;
  listeners.forEach((fn) => fn(next));
}

export function replaceStore(partial: Partial<Store>): void {
  const current = getState();
  _skipNextSync = true;
  commit({ ...current, ...partial });
}

// ---------- 订阅机制 ----------
type Listener = (state: Store) => void;
const listeners = new Set<Listener>();

let state: Store | null = null;

let _remoteInitDone = false;

export function initRemoteSync(): void {
  if (_remoteInitDone) return;
  _remoteInitDone = true;
  setTimeout(async () => {
    try {
      const { initAuth } = await import("./auth");
      const { initSync } = await import("./sync");
      const user = await initAuth();
      if (user) initSync();
    } catch (e) {
      console.warn("store: remote init failed, using local", e);
    }
  }, 0);
}

export function getState(): Store {
  if (typeof window === "undefined") {
    return {
      version: 6,
      categories: [...DEFAULT_CATEGORIES],
      bookmarks: DEFAULT_BOOKMARKS.map((b, idx) => ({
        ...b,
        id: `bm-default-${idx}`,
        categoryId: BOOKMARK_CATEGORY_INDEX[idx] ?? "cat-productivity",
        createdAt: 0,
      })),
      themeMode: "light",
      themeStyle: "default",
      bookmarkSort: "alpha",
      searchEngine: "google",
      customSearchEngine: undefined,
      workflows: [],
    };
  }
  if (!state) {
    state = load();
  }
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------- 工具函数：URL / 主机名 ----------
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return "about:blank";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function extractHostname(url: string): string {
  try {
    const u = new URL(normalizeUrl(url));
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

// ---------- Bookmark CRUD ----------
function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addBookmark(input: { href: string; title?: string; categoryId: string }): Bookmark {
  const href = normalizeUrl(input.href);
  const existing = getState().bookmarks.find((b) => b.href === href);
  if (existing) {
    try { window.dispatchEvent(new CustomEvent("toast", { detail: { msg: "该书签已存在", kind: "error" } })); } catch {}
    return existing;
  }
  const title = (input.title?.trim()) || extractHostname(href);
  const bm: Bookmark = {
    id: uid(),
    href,
    title,
    categoryId: input.categoryId,
    createdAt: Date.now(),
  };
  const next = { ...getState(), bookmarks: [...getState().bookmarks, bm] };
  commit(next);
  return bm;
}

export function updateBookmark(id: string, patch: Partial<Pick<Bookmark, "href" | "title" | "categoryId">>): void {
  const list = getState().bookmarks.map((bm) => {
    if (bm.id !== id) return bm;
    const next = { ...bm, ...patch };
    if (patch.href) next.href = normalizeUrl(patch.href);
    if (patch.title !== undefined) {
      const trimmed = patch.title.trim();
      next.title = trimmed || extractHostname(next.href);
    }
    return next;
  });
  commit({ ...getState(), bookmarks: list });
}

export function deleteBookmark(id: string): void {
  const list = getState().bookmarks.filter((bm) => bm.id !== id);
  commit({ ...getState(), bookmarks: list });
}

export function deleteBookmarks(ids: string[]): void {
  if (ids.length === 0) return;
  const set = new Set(ids);
  const list = getState().bookmarks.filter((bm) => !set.has(bm.id));
  commit({ ...getState(), bookmarks: list });
}

export function updateBookmarksCategory(ids: string[], categoryId: string): void {
  if (ids.length === 0) return;
  const set = new Set(ids);
  const list = getState().bookmarks.map((bm) => (set.has(bm.id) ? { ...bm, categoryId } : bm));
  commit({ ...getState(), bookmarks: list });
}

export function setThemeMode(mode: ThemeMode): void {
  commit({ ...getState(), themeMode: mode });
}

export function setThemeStyle(style: ThemeStyle): void {
  commit({ ...getState(), themeStyle: style });
}

export function setBookmarkSort(sort: BookmarkSort): void {
  commit({ ...getState(), bookmarkSort: sort });
}

export function setSearchEngine(engine: SearchEngineId): void {
  commit({ ...getState(), searchEngine: engine });
}

export function setCustomSearchEngine(name: string, url: string): void {
  commit({ ...getState(), customSearchEngine: { name, url }, searchEngine: "custom" });
}

// ---------- Workflow CRUD ----------
export function addWorkflow(name: string, bookmarkIds: string[], urls?: string[]): Workflow | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = getState().workflows.find((w) => w.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return null;
  const wf: Workflow = { id: uid(), name: trimmed, bookmarkIds, urls: urls ?? [] };
  commit({ ...getState(), workflows: [...getState().workflows, wf] });
  return wf;
}

export function deleteWorkflow(id: string): void {
  const list = getState().workflows.filter((w) => w.id !== id);
  commit({ ...getState(), workflows: list });
}

export function renameWorkflow(id: string, name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const existing = getState().workflows.find((w) => w.name.toLowerCase() === trimmed.toLowerCase() && w.id !== id);
  if (existing) return false;
  const list = getState().workflows.map((w) => (w.id === id ? { ...w, name: trimmed } : w));
  commit({ ...getState(), workflows: list });
  return true;
}

export function updateWorkflow(id: string, patch: Partial<Pick<Workflow, "name" | "bookmarkIds" | "urls">>): boolean {
  const trimmed = patch.name?.trim();
  if (patch.name !== undefined && !trimmed) return false;
  const existing = getState().workflows.find((w) => w.name.toLowerCase() === trimmed!.toLowerCase() && w.id !== id);
  if (existing) return false;
  const list = getState().workflows.map((w) => {
    if (w.id !== id) return w;
    const next = { ...w };
    if (patch.name) next.name = trimmed!;
    if (patch.bookmarkIds) next.bookmarkIds = patch.bookmarkIds;
    if (patch.urls) next.urls = patch.urls;
    return next;
  });
  commit({ ...getState(), workflows: list });
  return true;
}

// ---------- Category CRUD ----------
export function addCategory(name: string): Category {
  const trimmed = name.trim() || "未命名";
  const order = getState().categories.length;
  const cat: Category = { id: uid(), name: trimmed, order };
  commit({ ...getState(), categories: [...getState().categories, cat] });
  return cat;
}

export function renameCategory(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const list = getState().categories.map((c) => (c.id === id ? { ...c, name: trimmed } : c));
  commit({ ...getState(), categories: list });
}

/**
 * 删除分类：原归属该分类的书签 categoryId 置空（不再归属任何分类）
 * - 保留书签本体，仅脱离分类
 * - "全部" tab 仍会展示这些无分类书签
 * - 其他 tab 的 count 不计入这些书签
 */
export function deleteCategory(id: string): void {
  const list = getState().categories.filter((c) => c.id !== id);
  const bookmarks = getState().bookmarks.map((bm) =>
    bm.categoryId === id ? { ...bm, categoryId: "" } : bm,
  );
  commit({ ...getState(), categories: list, bookmarks });
}

/**
 * 拖拽重排分组顺序
 * fromIndex / toIndex 基于 order 排序后的数组索引
 */
export function reorderCategory(fromIndex: number, toIndex: number): void {
  const cats = [...getState().categories].sort((a, b) => a.order - b.order);
  const [moved] = cats.splice(fromIndex, 1);
  cats.splice(toIndex, 0, moved);
  const updated = cats.map((c, i) => ({ ...c, order: i }));
  commit({ ...getState(), categories: updated });
}

// ---------- 批量导入 ----------
export type ParsedLine = { href: string; title?: string };

export function parseBatchInput(text: string): ParsedLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map<ParsedLine>((line) => {
      const m = line.match(/^(\S+)(?:\s+(.+))?$/);
      if (!m) return { href: line };
      return { href: m[1], title: m[2]?.trim() };
    })
    .filter((p) => p.href);
}

export function addBookmarksBatch(items: ParsedLine[], categoryId: string): Bookmark[] {
  const now = Date.now();
  const created: Bookmark[] = items.map((item, idx) => {
    const href = normalizeUrl(item.href);
    return {
      id: uid(),
      href,
      title: item.title?.trim() || extractHostname(href),
      categoryId,
      createdAt: now + idx,
    };
  });
  commit({ ...getState(), bookmarks: [...getState().bookmarks, ...created] });
  return created;
}

// ---------- 导入 / 导出 ----------
export function exportJSON(): string {
  return JSON.stringify(getState(), null, 2);
}

export function importJSON(text: string, mode: "merge" | "replace" = "replace"): { ok: boolean; message: string } {
  try {
    const parsed = JSON.parse(text) as Partial<Store>;
    if (parsed.version !== 6 || !Array.isArray(parsed.categories) || !Array.isArray(parsed.bookmarks)) {
      return { ok: false, message: "JSON 格式不匹配（需要 version: 6）" };
    }
    if (mode === "replace") {
      commit({
        version: 6,
        categories: parsed.categories as Category[],
        bookmarks: parsed.bookmarks as Bookmark[],
        themeMode: parsed.themeMode || "light",
        themeStyle: parsed.themeStyle || "default",
        bookmarkSort: parsed.bookmarkSort || "alpha",
        searchEngine: parsed.searchEngine || "google",
        customSearchEngine: parsed.customSearchEngine ?? undefined,
        workflows: parsed.workflows ?? [],
      });
    } else {
      const existingBmIds = new Set(getState().bookmarks.map((b) => b.id));
      const newBm = (parsed.bookmarks as Bookmark[]).filter((b) => !existingBmIds.has(b.id));
      const existingCatIds = new Set(getState().categories.map((c) => c.id));
      const newCats = (parsed.categories as Category[]).filter((c) => !existingCatIds.has(c.id));
      commit({
        ...getState(),
        categories: [...getState().categories, ...newCats],
        bookmarks: [...getState().bookmarks, ...newBm],
      });
    }
    return { ok: true, message: "导入成功" };
  } catch (e) {
    return { ok: false, message: `解析失败：${(e as Error).message}` };
  }
}

export function resetToDefaults(): void {
  const init = buildDefaultStore();
  commit(init);
}

// ---------- 浏览器书签 HTML 导入 / 导出 ----------
const UNCATEGORIZED = "未分类";
const BOOKMARK_HTML_HEADER = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>`;

export function exportForBrowser(selectedIds?: string[]): string {
  const state = getState();
  const bookmarks = selectedIds
    ? state.bookmarks.filter((b) => selectedIds.includes(b.id))
    : state.bookmarks;
  const cats = [...state.categories].sort((a, b) => a.order - b.order);
  const uncategorizedBookmarks = bookmarks.filter((b) => !b.categoryId);
  const catMap = new Map<string, Bookmark[]>();
  for (const b of bookmarks) {
    if (!b.categoryId) continue;
    if (!catMap.has(b.categoryId)) catMap.set(b.categoryId, []);
    catMap.get(b.categoryId)!.push(b);
  }

  let html = BOOKMARK_HTML_HEADER + "\n<DL><p>\n";
  for (const cat of cats) {
    const bms = catMap.get(cat.id) || [];
    if (bms.length === 0) continue;
    html += `  <DT><H3>${escapeHtml(cat.name)}</H3>\n  <DL><p>\n`;
    for (const b of bms) {
      html += `    <DT><A HREF="${escapeAttr(b.href)}" ADD_DATE="${b.createdAt}">${escapeHtml(b.title)}</A>\n`;
    }
    html += `  </DL><p>\n`;
  }
  if (uncategorizedBookmarks.length > 0) {
    html += `  <DT><H3>${UNCATEGORIZED}</H3>\n  <DL><p>\n`;
    for (const b of uncategorizedBookmarks) {
      html += `    <DT><A HREF="${escapeAttr(b.href)}" ADD_DATE="${b.createdAt}">${escapeHtml(b.title)}</A>\n`;
    }
    html += `  </DL><p>\n`;
  }
  html += "</DL><p>\n";
  return html;
}

export type HtmlImportEntry = { href: string; title: string; categoryName: string };
export type HtmlImportPreview = { entries: HtmlImportEntry[]; categories: string[] };

function parseNetscapeHtml(html: string): HtmlImportEntry[] {
  const entries: HtmlImportEntry[] = [];
  const lines = html.split(/\r?\n/);
  let currentCategory = UNCATEGORIZED;

  for (const line of lines) {
    const catMatch = line.match(/<H3[^>]*>(.*?)<\/H3>/i);
    if (catMatch) {
      currentCategory = catMatch[1].trim();
      continue;
    }
    const aMatch = line.match(/<A\s+HREF="([^"]*)"[^>]*>(.*?)<\/A>/i);
    if (aMatch) {
      entries.push({ href: aMatch[1], title: aMatch[2].trim() || extractHostname(aMatch[1]), categoryName: currentCategory });
    }
  }
  return entries;
}

export function importFromHtmlPreview(html: string): HtmlImportPreview {
  const entries = parseNetscapeHtml(html);
  const catSet = new Set<string>();
  for (const e of entries) catSet.add(e.categoryName);
  return { entries, categories: Array.from(catSet) };
}

export function importFromHtml(
  html: string,
  mode: "merge" | "replace",
  targetCategoryId?: string,
): { ok: boolean; message: string; imported: number } {
  try {
    const entries = parseNetscapeHtml(html);
    if (entries.length === 0) return { ok: false, message: "未找到书签条目", imported: 0 };

    if (mode === "replace") {
      const newBms: Bookmark[] = entries.map((e, idx) => ({
        id: uid(),
        href: normalizeUrl(e.href),
        title: e.title,
        categoryId: targetCategoryId ?? "",
        createdAt: Date.now() + idx,
      }));
      const seenCats = new Set(getState().categories.map((c) => c.name));
      const newCats: Category[] = [];
      let catOrder = getState().categories.length;
      for (const e of entries) {
        if (e.categoryName !== UNCATEGORIZED && e.categoryName && !seenCats.has(e.categoryName)) {
          newCats.push({ id: uid(), name: e.categoryName, order: catOrder++ });
          seenCats.add(e.categoryName);
        }
      }
      commit({
        ...getState(),
        categories: [...getState().categories, ...newCats],
        bookmarks: newBms,
      });
      return { ok: true, message: `已替换为 ${newBms.length} 条书签`, imported: newBms.length };
    }

    const existingHrefs = new Set(getState().bookmarks.map((b) => b.href));
    const seenCats = new Set(getState().categories.map((c) => c.name));
    const state = getState();
    let catOrder = state.categories.length;
    const newCats: Category[] = [];
    const catNameCache = new Map<string, string>();

    function ensureCat(name: string): string {
      if (!name || name === UNCATEGORIZED) return targetCategoryId ?? "";
      const cached = catNameCache.get(name);
      if (cached) return cached;
      const existing = state.categories.find((c) => c.name === name);
      if (existing) { catNameCache.set(name, existing.id); return existing.id; }
      const created = addCategory(name);
      catNameCache.set(name, created.id);
      return created.id;
    }

    let imported = 0;
    for (const e of entries) {
      const href = normalizeUrl(e.href);
      if (existingHrefs.has(href)) continue;
      existingHrefs.add(href);
      const catId = targetCategoryId || ensureCat(e.categoryName);
      addBookmark({ href: e.href, title: e.title, categoryId: catId });
      imported++;
    }

    return { ok: true, message: `已导入 ${imported} 条新书签${imported > 0 ? "" : "（全部已存在）"}`, imported };
  } catch (e) {
    return { ok: false, message: `解析失败：${(e as Error).message}`, imported: 0 };
  }
}

// 启动时主动恢复认证状态（不再依赖同步面板触发）
if (typeof window !== "undefined") {
  (window as unknown as { __startpageStore: () => Store }).__startpageStore =
    getState;
  initRemoteSync();
}
