import { getState, addBookmark, addBookmarksBatch, deleteBookmarks, updateBookmarksCategory, updateBookmark, deleteBookmark, normalizeUrl, parseBatchInput, setBookmarkSort, exportForBrowser, importJSON, importFromHtml, importFromHtmlPreview, type Store, type BookmarkSort, type HtmlImportPreview } from "../../lib/store";
import { escapeHtml, escapeAttr } from "../../lib/helpers";
import { panelState, confirm, showToast, saveFocus, restoreFocus } from "./shared";

const bmGrid = document.getElementById("bm-grid")!;
const bmSelectionInfo = document.getElementById("bm-selection-info")!;
const bmSelectAll = document.getElementById("bm-select-all")!;
const bmMoveForm = document.getElementById("bm-move-form")!;
const bmMoveCat = document.getElementById("bm-move-cat") as HTMLSelectElement;
const bmMoveDelete = document.getElementById("bm-move-delete")!;
const bmAddBtn = document.getElementById("bm-add")!;
const bmForm = document.getElementById("bm-form")!;
const bmFormTitle = document.getElementById("bm-form-title") as HTMLInputElement;
const bmFormUrl = document.getElementById("bm-form-url") as HTMLInputElement;
const bmFormCat = document.getElementById("bm-form-cat") as HTMLSelectElement;
const bmFormSave = document.getElementById("bm-form-save") as HTMLButtonElement;
const bmBatchBtn = document.getElementById("bm-batch")!;
const bmBatchForm = document.getElementById("bm-batch-form")!;
const bmBatchText = document.getElementById("bm-batch-text") as HTMLTextAreaElement;
const bmBatchCat = document.getElementById("bm-batch-cat") as HTMLSelectElement;
const bmSortBtn = document.getElementById("bm-sort")!;
const bmSortMenu = document.getElementById("bm-sort-menu")!;
const importPopover = document.getElementById("import-popover")!;

export function fillCategorySelect(sel: HTMLSelectElement, categories: Category[]): void {
  sel.innerHTML = `<option value=""></option>` + categories
    .sort((a, b) => a.order - b.order)
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join("");
}

export function renderBmGrid(state: Store): void {
  bmGrid.innerHTML = state.bookmarks
    .map((b) => {
      const cat = state.categories.find((c) => c.id === b.categoryId);
      return `
        <div class="bm-grid-item ${panelState.selectedIds.has(b.id) ? "selected" : ""}" data-id="${b.id}">
          <label class="bm-grid-checkbox-wrap">
            <input type="checkbox" ${panelState.selectedIds.has(b.id) ? "checked" : ""} />
          </label>
          <span class="bm-name" title="${escapeAttr(b.href)}">${escapeHtml(b.title)}</span>
          <span class="bm-cat">${escapeHtml(cat?.name ?? "未分类")}</span>
          <div class="bm-grid-actions">
            <button type="button" class="btn sm" data-act="bm-edit" title="编辑">✎</button>
            <button type="button" class="btn sm danger" data-act="bm-delete" title="删除">✕</button>
          </div>
        </div>
      `;
    })
    .join("");

  bmGrid.querySelectorAll<HTMLElement>(".bm-grid-item").forEach((el) => {
    const id = el.dataset.id!;
    const cb = el.querySelector<HTMLInputElement>("input[type=checkbox]")!;
    const toggleSelect = () => {
      if (panelState.selectedIds.has(id)) panelState.selectedIds.delete(id);
      else panelState.selectedIds.add(id);
      el.classList.toggle("selected", panelState.selectedIds.has(id));
      cb.checked = panelState.selectedIds.has(id);
      updateSelectionInfo();
    };
    cb.addEventListener("change", toggleSelect);
    el.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("button, input[type=checkbox]")) return;
      toggleSelect();
    });
    el.querySelector<HTMLButtonElement>('[data-act="bm-edit"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const bm = getState().bookmarks.find((b) => b.id === id);
      if (!bm) return;
      panelState.editingBmId = id;
      bmBatchForm.hidden = true;
      bmGrid.hidden = true;
      fillCategorySelect(bmFormCat, getState().categories);
      bmFormTitle.value = bm.title;
      bmFormUrl.value = bm.href;
      bmFormCat.value = bm.categoryId || "";
      bmForm.hidden = false;
      bmFormUrl.focus();
      bmFormSave.textContent = "更新";
    });
    el.querySelector<HTMLButtonElement>('[data-act="bm-delete"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const bm = getState().bookmarks.find((b) => b.id === id);
      if (!bm) return;
      confirm("删除书签", `确认删除「${bm.title}」？`, () => {
        deleteBookmark(id);
      });
    });
  });
}

export function updateSelectionInfo(): void {
  const n = panelState.selectedIds.size;
  bmSelectionInfo.textContent = n === 0 ? "" : `已选 ${n} 项`;
  if (n > 0) {
    fillCategorySelect(bmMoveCat, getState().categories);
    bmMoveForm.hidden = false;
  } else {
    bmMoveForm.hidden = true;
  }
  const total = getState().bookmarks.length;
  if (total === 0) return;
  bmSelectAll.textContent = n === total ? "返选" : "全选";
}

export function renderSortMenu(state: Store): void {
  const labels: Record<BookmarkSort, string> = { alpha: "首字母", added: "添加时间" };
  bmSortBtn.textContent = `排序：${labels[state.bookmarkSort]} ▾`;
  bmSortMenu.querySelectorAll<HTMLButtonElement>(".bm-sort-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.sort === state.bookmarkSort);
  });
}

function saveBmForm(): void {
  const url = bmFormUrl.value.trim();
  if (!url) {
    showToast("请输入网址", "error");
    return;
  }
  const state = getState();
  const href = normalizeUrl(url);
  if (panelState.editingBmId) {
    updateBookmark(panelState.editingBmId, {
      href: url,
      title: bmFormTitle.value || undefined,
      categoryId: bmFormCat.value,
    });
    panelState.editingBmId = null;
    showToast("书签已更新", "info");
  } else {
    if (state.bookmarks.some((b) => b.href === href)) {
      showToast("该书签已存在", "error");
      return;
    }
    addBookmark({
      href: url,
      title: bmFormTitle.value || undefined,
      categoryId: bmFormCat.value,
    });
    showToast("书签已添加", "info");
  }
  bmFormTitle.value = "";
  bmFormUrl.value = "";
  bmForm.hidden = true;
  bmGrid.hidden = false;
}

function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

let lastImportPreview: HtmlImportPreview | null = null;
let lastImportHtml = "";

export function initBookmarksPanel(): void {
  bmAddBtn.addEventListener("click", () => {
    bmBatchForm.hidden = true;
    bmGrid.hidden = true;
    fillCategorySelect(bmFormCat, getState().categories);
    bmFormTitle.value = "";
    bmFormUrl.value = "";
    bmForm.hidden = false;
    bmFormUrl.focus();
  });
  document.getElementById("bm-form-cancel")!.addEventListener("click", () => {
    panelState.editingBmId = null;
    bmForm.hidden = true;
    bmGrid.hidden = false;
    bmFormSave.textContent = "保存";
  });
  document.getElementById("bm-form-save")!.addEventListener("click", saveBmForm);
  bmFormUrl.addEventListener("keydown", (e) => { if (e.key === "Enter") saveBmForm(); });

  document.getElementById("bm-move-cancel")!.addEventListener("click", () => {
    panelState.selectedIds.clear();
    renderBmGrid(getState());
    updateSelectionInfo();
  });
  document.getElementById("bm-move-save")!.addEventListener("click", () => {
    const target = bmMoveCat.value;
    if (!target) return;
    const ids = Array.from(panelState.selectedIds);
    panelState.selectedIds.clear();
    updateBookmarksCategory(ids, target);
    bmMoveForm.hidden = true;
    updateSelectionInfo();
  });
  bmSelectAll.addEventListener("click", () => {
    const allIds = getState().bookmarks.map((b) => b.id);
    if (panelState.selectedIds.size === allIds.length) {
      panelState.selectedIds.clear();
    } else {
      allIds.forEach((id) => panelState.selectedIds.add(id));
    }
    renderBmGrid(getState());
    updateSelectionInfo();
  });
  bmMoveDelete.addEventListener("click", () => {
    if (panelState.selectedIds.size === 0) return;
    confirm("删除书签", `确认删除 ${panelState.selectedIds.size} 个书签？`, () => {
      deleteBookmarks(Array.from(panelState.selectedIds));
      panelState.selectedIds.clear();
      updateSelectionInfo();
    });
  });

  bmBatchBtn.addEventListener("click", () => {
    bmForm.hidden = true;
    bmGrid.hidden = true;
    fillCategorySelect(bmBatchCat, getState().categories);
    bmBatchText.value = "";
    bmBatchForm.hidden = false;
    bmBatchText.focus();
  });
  document.getElementById("bm-batch-cancel")!.addEventListener("click", () => {
    bmBatchForm.hidden = true;
    bmGrid.hidden = false;
  });
  document.getElementById("bm-batch-save")!.addEventListener("click", () => {
    const lines = bmBatchText.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) { showToast("没有输入任何内容", "error"); return; }
    const existingHrefs = new Set(getState().bookmarks.map((b) => b.href));
    let added = 0, skipped = 0;
    const normalLines: string[] = [];
    for (const line of lines) {
      const addMatch = line.match(/^add\s+(\S+)(?:\s+(.+?)(?:\s+(.+))?)?$/i);
      if (addMatch) {
        const url = addMatch[1];
        const href = normalizeUrl(url);
        if (existingHrefs.has(href)) { skipped++; continue; }
        existingHrefs.add(href);
        const title = addMatch[2]?.trim();
        const catName = addMatch[3]?.trim();
        let catId = "";
        if (catName) {
          const state = getState();
          const existing = state.categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
          catId = existing ? existing.id : addCategory(catName).id;
        }
        addBookmark({ href: url, title, categoryId: catId });
        added++;
      } else {
        const items = parseBatchInput(line);
        const href = items.length > 0 ? normalizeUrl(items[0].href) : "";
        if (!href || existingHrefs.has(href)) { skipped++; }
        else { existingHrefs.add(href); normalLines.push(line); }
      }
    }
    if (normalLines.length > 0) {
      const items = parseBatchInput(normalLines.join("\n"));
      if (items.length > 0) {
        addBookmarksBatch(items, bmBatchCat.value);
        added += items.length;
      }
    }
    showToast(`已导入 ${added} 个书签${skipped > 0 ? `，${skipped} 个重复已跳过` : ""}`, skipped > 0 && added === 0 ? "error" : "info");
    bmBatchText.value = "";
    bmBatchForm.hidden = true;
    bmGrid.hidden = false;
  });

  bmSortBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    bmSortMenu.hidden = !bmSortMenu.hidden;
    bmSortBtn.setAttribute("aria-expanded", String(!bmSortMenu.hidden));
  });
  document.addEventListener("click", (e) => {
    if (!bmSortMenu.hidden && !(e.target as HTMLElement).closest(".bm-sort-wrap")) {
      bmSortMenu.hidden = true;
    }
  });
  bmSortMenu.querySelectorAll<HTMLButtonElement>(".bm-sort-item").forEach((b) => {
    b.addEventListener("click", () => {
      const sort = b.dataset.sort as BookmarkSort;
      setBookmarkSort(sort);
      setTimeout(() => { bmSortMenu.hidden = true; }, 0);
    });
  });

  // ---------- 导入文件（独立 + 批量栏复用） ----------
  function startFileImport(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html,.htm,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const trimmed = text.trim();
        if (trimmed.startsWith("{")) {
          const result = importJSON(trimmed, "merge");
          showToast(result.message, result.ok ? "info" : "error");
        } else {
          lastImportHtml = trimmed;
          lastImportPreview = importFromHtmlPreview(trimmed);
          const info = document.getElementById("import-preview-info")!;
          info.textContent = `发现 ${lastImportPreview.entries.length} 条书签，${lastImportPreview.categories.length} 个分类`;
          const list = document.getElementById("import-preview-list")!;
          list.innerHTML = lastImportPreview.categories.map((c) =>
            `<div style="padding:2px 0">• ${escapeHtml(c)}（${lastImportPreview!.entries.filter((e) => e.categoryName === c).length} 项）</div>`
          ).join("");
          saveFocus();
          importPopover.hidden = false;
        }
      } catch (e) {
        showToast(`读取文件失败：${(e as Error).message}`, "error");
      }
    };
    input.click();
  }

  importPopover.hidden = true;
  document.body.appendChild(importPopover);
  document.getElementById("bm-move-import")!.addEventListener("click", startFileImport);

  document.getElementById("import-confirm-btn")!.addEventListener("click", () => {
    if (!lastImportHtml) return;
    const mode = (document.querySelector<HTMLInputElement>('input[name="import-mode"]:checked')?.value || "merge") as "merge" | "replace";
    const result = importFromHtml(lastImportHtml, mode);
    importPopover.hidden = true;
    restoreFocus();
    lastImportHtml = "";
    lastImportPreview = null;
    showToast(result.message, result.ok ? "info" : "error");
  });
  importPopover.querySelectorAll<HTMLElement>("[data-import-close]").forEach((el) => {
    el.addEventListener("click", () => {
      importPopover.hidden = true;
      restoreFocus();
      lastImportHtml = "";
      lastImportPreview = null;
    });
  });

  // ---------- 导出 HTML（批量栏内） ----------
  document.getElementById("bm-export-html")!.addEventListener("click", () => {
    const ids = panelState.selectedIds.size > 0 ? Array.from(panelState.selectedIds) : undefined;
    const html = exportForBrowser(ids);
    downloadFile(html, "bookmarks.html", "text/html;charset=utf-8");
    showToast("已导出为 HTML 书签文件", "info");
  });
}

// Imported here to avoid circular dependency
import { addCategory } from "../../lib/store";
