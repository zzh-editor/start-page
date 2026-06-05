import { getSearchUrl } from "../../lib/store";

export function getEngineUrl(query: string): string {
  const st = (window as any).__startpageStore?.();
  if (!st) return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  return getSearchUrl(st.searchEngine, query, st.customSearchEngine);
}

export function navigate(value: string): void {
  if (value.startsWith("r:")) {
    const q = value.slice(2).trim();
    window.location.href = getEngineUrl(`site:reddit.com ${q}`);
    return;
  }
  if (value.startsWith("m:")) {
    const q = value.slice(2).trim();
    window.location.href = getEngineUrl(`site:myanimelist.net ${q}`);
    return;
  }
  if (/^(javascript|data|vbscript):/i.test(value)) return;
  if (/^[\w-]+(\.[a-z]{2,})+(\/.*)?$/i.test(value)) {
    window.location.href = `https://${value}`;
    return;
  }
  window.location.href = getEngineUrl(value);
}

export function runCategory(name: string): boolean {
  const needle = name.trim().toLowerCase();
  if (!needle) return false;
  const state = (window as any).__startpageStore?.();
  if (!state) {
    import("../../lib/helpers").then(({ showToast }) => showToast("数据未就绪", "error"));
    return true;
  }
  const matches = state.categories.filter((c: any) => c.name.toLowerCase().includes(needle));
  if (matches.length === 0) {
    import("../../lib/helpers").then(({ showToast }) => showToast(`未找到分类「${name}」`, "error"));
    return true;
  }
  const cat = matches[0];
  if (matches.length > 1) {
    import("../../lib/helpers").then(({ showToast }) =>
      showToast(`匹配到 ${matches.length} 个分类，已打开：${matches.map((m: any) => m.name).join("、")}`, "info"),
    );
  }
  const bms = state.bookmarks
    .filter((b: any) => b.categoryId === cat.id)
    .sort((a: any, b: any) => a.title.localeCompare(b.title));
  if (bms.length === 0) {
    import("../../lib/helpers").then(({ showToast }) => showToast(`分类「${cat.name}」下还没有书签`, "error"));
    return true;
  }
  import("../../lib/helpers").then(({ openUrls }) => {
    openUrls(bms.map((b: any) => b.href));
    showToast(`已打开 ${bms.length} 个标签页（${cat.name}）`, "info");
  });
  return true;
}
