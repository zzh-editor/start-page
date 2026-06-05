import { getState, addCategory, renameCategory, deleteCategory, reorderCategory, type Store, type Category } from "../../lib/store";
import { escapeHtml, escapeAttr } from "../../lib/helpers";
import { panelState, confirm } from "./shared";

const catListEl = document.getElementById("cat-list")!;
const catAddForm = document.getElementById("cat-add-form")!;
const catAddName = document.getElementById("cat-add-name") as HTMLInputElement;

export function renderCatList(state: Store): void {
  const sortedCats = [...state.categories].sort((a, b) => a.order - b.order);
  if (sortedCats.length === 0) {
    catListEl.innerHTML = `<div style="color: var(--muted); font-size: 13px; text-align: center; padding: 24px;">还没有分组</div>`;
    return;
  }
  catListEl.innerHTML = sortedCats
    .map((c) => {
      const count = state.bookmarks.filter((b) => b.categoryId === c.id).length;
      const isEditing = panelState.editingCatId === c.id;
      const info = isEditing
        ? `<div class="cat-row-edit">
            <input type="text" class="cat-edit-input" value="${escapeAttr(c.name)}" />
            <button type="button" class="btn primary" data-act="save-edit">保存</button>
            <button type="button" class="btn" data-act="cancel-edit">取消</button>
          </div>`
        : `<div class="cat-row-info">
            <span class="cat-row-name">${escapeHtml(c.name)}</span>
            <span class="cat-row-count">${count} 项</span>
            ${c.builtin ? '<span class="cat-row-badge">内置</span>' : ""}
          </div>`;
      const actions = isEditing
        ? ""
        : `<div class="cat-row-actions">
            <button type="button" class="btn" data-act="edit">重命名</button>
            <button type="button" class="btn danger" data-act="delete" ${c.builtin ? "" : ""}>删除</button>
          </div>`;
      return `<div class="cat-row" data-id="${c.id}">${info}${actions}</div>`;
    })
    .join("");

  catListEl.querySelectorAll<HTMLElement>(".cat-row").forEach((row) => {
    const id = row.dataset.id!;
    const editBtn = row.querySelector<HTMLButtonElement>('[data-act="edit"]');
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        panelState.editingCatId = id;
        renderCatList(getState());
      });
    }
    const delBtn = row.querySelector<HTMLButtonElement>('[data-act="delete"]');
    if (delBtn) {
      delBtn.addEventListener("click", () => {
        const cat = getState().categories.find((c) => c.id === id);
        if (!cat) return;
        const count = getState().bookmarks.filter((b) => b.categoryId === id).length;
        const msg = count > 0
          ? `分组「${cat.name}」下有 ${count} 个书签。删除分组后这些书签将移出分类（仍保留在「全部」中）。`
          : `确认删除分组「${cat.name}」？`;
        confirm("删除分组", msg, () => { deleteCategory(id); });
      });
    }
    const saveBtn = row.querySelector<HTMLButtonElement>('[data-act="save-edit"]');
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const input = row.querySelector<HTMLInputElement>(".cat-edit-input");
        if (!input) return;
        const name = input.value.trim();
        if (!name) return;
        renameCategory(id, name);
        panelState.editingCatId = null;
      });
    }
    const cancelBtn = row.querySelector<HTMLButtonElement>('[data-act="cancel-edit"]');
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        panelState.editingCatId = null;
        renderCatList(getState());
      });
    }
    const editInput = row.querySelector<HTMLInputElement>(".cat-edit-input");
    if (editInput) {
      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveBtn?.click();
        else if (e.key === "Escape") cancelBtn?.click();
      });
      editInput.focus();
      editInput.select();
    }

    setupDragReorder(row, id);
  });
}

function setupDragReorder(row: HTMLElement, id: string): void {
  let dragTimer: ReturnType<typeof setTimeout> | null = null;
  let dragActive = false;
  let dragFrom = -1;
  row.draggable = false;

  row.addEventListener("mousedown", () => {
    dragTimer = setTimeout(() => { dragActive = true; row.draggable = true; }, 250);
  });
  row.addEventListener("mouseup", () => {
    if (dragTimer) clearTimeout(dragTimer);
    dragTimer = null;
    row.draggable = false;
    setTimeout(() => { dragActive = false; }, 10);
  });
  row.addEventListener("mouseleave", () => {
    if (dragTimer) clearTimeout(dragTimer);
    dragTimer = null;
    row.draggable = false;
  });
  row.addEventListener("dragstart", (e) => {
    if (!dragActive) { e.preventDefault(); return; }
    dragFrom = Array.from(catListEl.querySelectorAll(".cat-row")).indexOf(row);
    e.dataTransfer?.setData("text/plain", String(dragFrom));
    row.style.opacity = "0.5";
  });
  row.addEventListener("dragend", () => {
    row.style.opacity = "1";
    dragActive = false;
    dragFrom = -1;
    catListEl.querySelectorAll<HTMLElement>(".cat-row").forEach((r) => { r.style.borderBottom = ""; });
  });
  row.addEventListener("dragover", (e) => {
    e.preventDefault();
    catListEl.querySelectorAll<HTMLElement>(".cat-row").forEach((r) => { r.style.borderBottom = ""; });
    const idx = Array.from(catListEl.querySelectorAll(".cat-row")).indexOf(row);
    if (idx !== dragFrom) row.style.borderBottom = "2px solid var(--accent)";
  });
  row.addEventListener("dragleave", () => { row.style.borderBottom = ""; });
  row.addEventListener("drop", (e) => {
    e.preventDefault();
    catListEl.querySelectorAll<HTMLElement>(".cat-row").forEach((r) => { r.style.borderBottom = ""; });
    const toIdx = Array.from(catListEl.querySelectorAll(".cat-row")).indexOf(row);
    if (dragFrom !== -1 && toIdx !== -1 && dragFrom !== toIdx) reorderCategory(dragFrom, toIdx);
    dragActive = false;
  });
}

export function initCategoriesPanel(): void {
  document.getElementById("cat-add")!.addEventListener("click", () => {
    catAddForm.hidden = false;
    catAddName.value = "";
    catAddName.focus();
  });
  document.getElementById("cat-add-cancel")!.addEventListener("click", () => { catAddForm.hidden = true; });
  document.getElementById("cat-add-save")!.addEventListener("click", () => {
    const name = catAddName.value.trim();
    if (!name) return;
    addCategory(name);
    catAddForm.hidden = true;
  });
  catAddName.addEventListener("keydown", (e) => {
    if (e.key === "Enter") (document.getElementById("cat-add-save") as HTMLButtonElement).click();
  });
}
