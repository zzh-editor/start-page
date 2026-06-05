import { getClient, isConfigured } from "./supabase";
import { getCurrentUser } from "./auth";
import { getState, replaceStore } from "./store";
import type { Store, Bookmark, Category, Workflow } from "./store";

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

let _syncStatus: SyncStatus = "idle";
const syncListeners = new Set<(status: SyncStatus) => void>();
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastStoreVersion = "";

function assertCanSync(): boolean {
  return isConfigured() && !!getCurrentUser();
}

export function onSyncStatus(fn: (status: SyncStatus) => void): () => void {
  syncListeners.add(fn);
  fn(_syncStatus);
  return () => syncListeners.delete(fn);
}

export function getSyncStatus(): SyncStatus {
  if (!navigator.onLine) return "offline";
  return _syncStatus;
}

function setSyncStatus(status: SyncStatus) {
  _syncStatus = status;
  syncListeners.forEach((fn) => fn(status));
}

// ---------- 导出数据供 UI 展示 ----------
export function getLastSynced(): number | null {
  try {
    const raw = localStorage.getItem("startpage:sync:last");
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

// ---------- 核心推送 ----------
async function pushData(): Promise<boolean> {
  const supabase = getClient();
  const user = getCurrentUser();
  if (!supabase || !user) return false;

  const state = getState();
  if (!state) return false;

  try {
    const now = new Date().toISOString();

    const bmRows = state.bookmarks.map((b) => ({
      id: b.id,
      user_id: user.id,
      href: b.href,
      title: b.title,
      category_id: b.categoryId,
      created_at: b.createdAt,
      updated_at: now,
    }));
    if (bmRows.length > 0) {
      const { error } = await supabase.from("bookmarks").upsert(bmRows, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      if (error) throw error;
    }

    const catRows = state.categories.map((c) => ({
      id: c.id,
      user_id: user.id,
      name: c.name,
      order: c.order,
      builtin: c.builtin ?? false,
      created_at: Date.now(),
      updated_at: now,
    }));
    if (catRows.length > 0) {
      const { error } = await supabase.from("categories").upsert(catRows, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      if (error) throw error;
    }

    const wfRows = state.workflows.map((w) => ({
      id: w.id,
      user_id: user.id,
      name: w.name,
      bookmark_ids: w.bookmarkIds,
      urls: w.urls,
      created_at: Date.now(),
      updated_at: now,
    }));
    if (wfRows.length > 0) {
      const { error } = await supabase.from("workflows").upsert(wfRows, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      if (error) throw error;
    }

    const { error: settingsErr } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          theme_mode: state.themeMode,
          theme_style: state.themeStyle,
          bookmark_sort: state.bookmarkSort,
          search_engine: state.searchEngine,
          custom_search_name: state.customSearchEngine?.name ?? null,
          custom_search_url: state.customSearchEngine?.url ?? null,
          updated_at: now,
        },
        { onConflict: "user_id", ignoreDuplicates: false },
      );
    if (settingsErr) throw settingsErr;

    localStorage.setItem("startpage:sync:last", String(Date.now()));
    return true;
  } catch (e) {
    console.warn("sync: push failed", e);
    return false;
  }
}

// ---------- 核心拉取 ----------
async function pullData(): Promise<{
  store: Partial<Store> | null;
  hasRemoteData: boolean;
}> {
  const supabase = getClient();
  const user = getCurrentUser();
  if (!supabase || !user) return { store: null, hasRemoteData: false };

  try {
    const [bmRes, catRes, wfRes, settingsRes] = await Promise.all([
      supabase.from("bookmarks").select("*").eq("user_id", user.id),
      supabase.from("categories").select("*").eq("user_id", user.id),
      supabase.from("workflows").select("*").eq("user_id", user.id),
      supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (bmRes.error) throw bmRes.error;
    if (catRes.error) throw catRes.error;
    if (wfRes.error) throw wfRes.error;

    const bookmarks: Bookmark[] = (bmRes.data ?? []).map((r: any) => ({
      id: r.id,
      href: r.href,
      title: r.title,
      categoryId: r.category_id,
      createdAt: r.created_at,
    }));

    const categories: Category[] = (catRes.data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      order: r.order,
      builtin: r.builtin ?? false,
    }));

    const workflows: Workflow[] = (wfRes.data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      bookmarkIds: r.bookmark_ids ?? [],
      urls: r.urls ?? [],
    }));

    const hasRemoteData = bookmarks.length > 0 || categories.length > 0;

    const store: Partial<Store> = {
      bookmarks,
      categories,
      workflows,
    };

    if (settingsRes.data) {
      store.themeMode = settingsRes.data.theme_mode ?? "light";
      store.themeStyle = settingsRes.data.theme_style ?? "default";
      store.bookmarkSort = settingsRes.data.bookmark_sort ?? "alpha";
      store.searchEngine = settingsRes.data.search_engine ?? "google";
      if (settingsRes.data.custom_search_name && settingsRes.data.custom_search_url) {
        store.customSearchEngine = {
          name: settingsRes.data.custom_search_name,
          url: settingsRes.data.custom_search_url,
        };
      }
    }

    return { store, hasRemoteData };
  } catch (e) {
    console.warn("sync: pull failed", e);
    return { store: null, hasRemoteData: false };
  }
}

// ---------- 执行同步（双向：先拉后推）----------
export async function doSync(): Promise<void> {
  if (!navigator.onLine) {
    setSyncStatus("offline");
    return;
  }
  if (!assertCanSync()) {
    setSyncStatus("idle");
    return;
  }
  setSyncStatus("syncing");
  const { store, hasRemoteData } = await pullData();
  if (hasRemoteData && store) {
    replaceStore(store);
  }
  const ok = await pushData();
  setSyncStatus(ok ? "synced" : "error");
}

export function enqueueSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => doSync(), 800);
}

// ---------- 启动同步（拉取）----------
export async function initSync(): Promise<boolean> {
  if (!assertCanSync()) return false;
  if (!navigator.onLine) {
    setSyncStatus("offline");
    return false;
  }

  setSyncStatus("syncing");
  const { store, hasRemoteData } = await pullData();

  if (hasRemoteData && store) {
    localStorage.setItem("startpage:sync:last", String(Date.now()));
    setSyncStatus("synced");
    return true;
  }

  if (!hasRemoteData) {
    const ok = await pushData();
    setSyncStatus(ok ? "synced" : "error");
    return ok;
  }

  setSyncStatus("error");
  return false;
}

// ---------- 拉取并返回数据供 store 使用 ----------
export async function fetchRemoteStore(): Promise<{
  store: Partial<Store> | null;
  hasRemoteData: boolean;
}> {
  return pullData();
}

// ---------- 在线/离线监听 ----------
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (getSyncStatus() === "offline") {
      setSyncStatus("idle");
      doSync();
    }
  });
  window.addEventListener("offline", () => {
    setSyncStatus("offline");
  });
}
