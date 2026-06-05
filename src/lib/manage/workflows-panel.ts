import { getState, addWorkflow, updateWorkflow, deleteWorkflow, type Store } from "../../lib/store";
import { escapeHtml, escapeAttr } from "../../lib/helpers";
import { panelState, confirm, showToast, saveFocus, restoreFocus } from "./shared";

const wfList = document.getElementById("wf-list")!;
const wfAddBtn = document.getElementById("wf-add")!;
const wfPopover = document.getElementById("wf-popover")!;
const wfPopoverName = document.getElementById("wf-popover-name") as HTMLInputElement;
const wfPopoverUrls = document.getElementById("wf-popover-urls") as HTMLTextAreaElement;
const wfPopoverGrid = document.getElementById("wf-popover-grid")!;
const wfCatFilters = document.getElementById("wf-cat-filters")!;
let wfActiveCatFilter = "all";

export function renderWorkflows(state: Store): void {
  if (state.workflows.length === 0) {
    wfList.innerHTML = `<div style="color: var(--muted); font-size: 13px; text-align: center; padding: 24px;">还没有工作流</div>`;
    return;
  }
  wfList.innerHTML = state.workflows.map((w) => {
    const count = (w.urls?.length ?? 0) || state.bookmarks.filter((b) => w.bookmarkIds.includes(b.id)).length;
    return `
      <div class="cat-row" data-id="${escapeAttr(w.id)}">
        <div class="cat-row-info">
          <span class="cat-row-name">${escapeHtml(w.name)}</span>
          <span class="cat-row-count">${count} 项</span>
        </div>
        <div class="cat-row-actions">
          <button type="button" class="btn" data-act="wf-edit">编辑</button>
          <button type="button" class="btn danger" data-act="wf-delete">删除</button>
        </div>
      </div>
    `;
  }).join("");

  wfList.querySelectorAll<HTMLElement>(".cat-row").forEach((row) => {
    row.querySelector<HTMLButtonElement>('[data-act="wf-edit"]')?.addEventListener("click", () => {
      const wfId = row.dataset.id!;
      const wf = getState().workflows.find((w) => w.id === wfId);
      if (!wf) return;
      panelState.editingWfId = wfId;
      wfPopoverName.value = wf.name;
      wfPopoverUrls.value = (wf.urls ?? []).join("\n");
      wfActiveCatFilter = "all";
      const state = getState();
      renderWfCatFilters(state);
      renderWfBookmarks(state);
      wfPopoverGrid.querySelectorAll<HTMLLabelElement>(".bm-grid-item").forEach((label) => {
        const bm = state.bookmarks.find((b) => b.id === label.dataset.id);
        if (!bm) return;
        const checked = wf.bookmarkIds.includes(bm.id);
        const cb = label.querySelector<HTMLInputElement>("input[type=checkbox]");
        if (cb) cb.checked = checked;
        label.classList.toggle("selected", checked);
      });
      saveFocus();
      wfPopover.hidden = false;
      setTimeout(() => wfPopoverName.focus(), 0);
      document.querySelector("#wf-popover .bm-popover-panel h3")?.remove();
      const title = document.createElement("h3");
      title.style.cssText = "margin:0 0 8px;font-size:14px;font-weight:600";
      title.textContent = "编辑工作流";
      wfPopoverName.parentElement?.insertBefore(title, wfPopoverName);
    });
    row.querySelector<HTMLButtonElement>('[data-act="wf-delete"]')?.addEventListener("click", () => {
      confirm("删除工作流", "确认删除该工作流？", () => { deleteWorkflow(row.dataset.id!); });
    });
  });
}

function renderWfCatFilters(state: Store): void {
  wfCatFilters.innerHTML = `<button type="button" class="wf-cat-filter ${wfActiveCatFilter === "all" ? "active" : ""}" data-cat="all">全部</button>` +
    state.categories
      .sort((a, b) => a.order - b.order)
      .map((c) =>
        `<button type="button" class="wf-cat-filter ${wfActiveCatFilter === c.id ? "active" : ""}" data-cat="${c.id}">${escapeHtml(c.name)}</button>`,
      )
      .join("");

  wfCatFilters.querySelectorAll<HTMLButtonElement>(".wf-cat-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      wfActiveCatFilter = btn.dataset.cat!;
      renderWfBookmarks(getState());
    });
  });
}

function renderWfBookmarks(state: Store): void {
  const bms = wfActiveCatFilter === "all"
    ? state.bookmarks
    : state.bookmarks.filter((b) => b.categoryId === wfActiveCatFilter);

  wfPopoverGrid.innerHTML = bms
    .map((b) => {
      const checked = wfPopoverUrls.value.split("\n").map((l) => l.trim()).some((l) => l === b.href);
      return `
        <label class="bm-grid-item ${checked ? "selected" : ""}" data-id="${b.id}">
          <input type="checkbox" ${checked ? "checked" : ""} />
          <span class="bm-name" title="${escapeAttr(b.href)}">${escapeHtml(b.title)}</span>
        </label>
      `;
    })
    .join("");

  wfPopoverGrid.querySelectorAll<HTMLLabelElement>(".bm-grid-item").forEach((label) => {
    const id = label.dataset.id!;
    const bm = getState().bookmarks.find((b) => b.id === id);
    if (!bm) return;
    const cb = label.querySelector("input")!;
    const toggle = () => {
      const url = bm.href;
      const lines = wfPopoverUrls.value.split("\n").map((l) => l.trim()).filter(Boolean);
      if (cb.checked) {
        if (!lines.includes(url)) wfPopoverUrls.value = [...lines, url].join("\n");
      } else {
        wfPopoverUrls.value = lines.filter((l) => l !== url).join("\n");
      }
      label.classList.toggle("selected", cb.checked);
    };
    cb.addEventListener("change", toggle);
  });
}

function saveWfPopover(): void {
  const name = wfPopoverName.value.trim();
  if (!name) { showToast("请输入工作流名称", "error"); return; }
  const lines = wfPopoverUrls.value.split("\n").map((l) => l.trim()).filter(Boolean);
  const checkedIds: string[] = [];
  const checkedUrls: string[] = [];
  wfPopoverGrid.querySelectorAll<HTMLLabelElement>(".bm-grid-item").forEach((label) => {
    const cb = label.querySelector<HTMLInputElement>("input[type=checkbox]");
    if (cb?.checked) {
      checkedIds.push(label.dataset.id!);
      const bm = getState().bookmarks.find((b) => b.id === label.dataset.id);
      if (bm) checkedUrls.push(bm.href);
    }
  });
  const allUrls = [...new Set([...lines, ...checkedUrls])];
  if (allUrls.length === 0) { showToast("请至少输入一个链接或选择一个书签", "error"); return; }

  if (panelState.editingWfId) {
    const ok = updateWorkflow(panelState.editingWfId, { name, bookmarkIds: checkedIds, urls: allUrls });
    if (!ok) { showToast("工作流名称已存在", "error"); return; }
    panelState.editingWfId = null;
    wfPopover.hidden = true;
    showToast(`已更新工作流「${name}」(${allUrls.length} 项)`);
  } else {
    const result = addWorkflow(name, checkedIds, allUrls);
    if (!result) { showToast("工作流名称已存在", "error"); return; }
    wfPopover.hidden = true;
    showToast(`已创建工作流「${name}」(${allUrls.length} 项)`);
  }
}

export function initWorkflowsPanel(): void {
  document.body.appendChild(wfPopover);

  wfAddBtn.addEventListener("click", () => {
    panelState.editingWfId = null;
    wfPopoverName.value = "";
    wfPopoverUrls.value = "";
    wfActiveCatFilter = "all";
    const state = getState();
    renderWfCatFilters(state);
    renderWfBookmarks(state);
    saveFocus();
    wfPopover.hidden = false;
    setTimeout(() => wfPopoverName.focus(), 0);
    document.querySelector("#wf-popover .bm-popover-panel h3")?.remove();
    const title = document.createElement("h3");
    title.style.cssText = "margin:0 0 8px;font-size:14px;font-weight:600";
    title.textContent = "新建工作流";
    wfPopoverName.parentElement?.insertBefore(title, wfPopoverName);
  });

  wfPopover.querySelectorAll<HTMLElement>("[data-wf-close]").forEach((el) => {
    el.addEventListener("click", () => { panelState.editingWfId = null; wfPopover.hidden = true; restoreFocus(); });
  });

  document.getElementById("wf-popover-save")!.addEventListener("click", saveWfPopover);
  wfPopoverName.addEventListener("keydown", (e) => { if (e.key === "Enter") saveWfPopover(); });
}
