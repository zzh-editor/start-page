import { getState, setSearchEngine, setCustomSearchEngine, SEARCH_ENGINES, type Store, type SearchEngineId } from "../../lib/store";
import { escapeHtml } from "../../lib/helpers";
import { showToast } from "./shared";

function engineLabel(state: Store, id: SearchEngineId): string {
  if (id === "custom") return state.customSearchEngine?.name ?? "+";
  const entry = SEARCH_ENGINES[id as Exclude<SearchEngineId, "custom">];
  return entry?.label ?? "Google";
}

export function renderSearch(state: Store): void {
  const cardsEl = document.getElementById("search-cards")!;
  const presetEntries = Object.entries(SEARCH_ENGINES) as [SearchEngineId, { label: string; url: string }][];
  const custom = state.customSearchEngine;

  let html = presetEntries.map(
    ([id, info]) => `
      <button type="button" class="theme-card search-card ${id === state.searchEngine ? "active" : ""}" data-engine="${id}">
        <span class="theme-card-name">${info.label}</span>
      </button>
    `,
  ).join("");

  if (custom?.name) {
    html += `
      <button type="button" class="theme-card search-card ${state.searchEngine === "custom" ? "active" : ""}" data-engine="custom">
        <span class="theme-card-name search-card-custom">${escapeHtml(custom.name)}</span>
      </button>
    `;
  }
  html += `
    <button type="button" class="theme-card search-card" data-engine="custom">
      <span class="theme-card-name search-card-custom">+</span>
    </button>
  `;

  cardsEl.innerHTML = html;

  cardsEl.querySelectorAll<HTMLButtonElement>(".theme-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.engine as SearchEngineId;
      if (id === "custom") {
        const form = document.getElementById("search-custom-form")!;
        const nameInput = document.getElementById("search-custom-name") as HTMLInputElement;
        const urlInput = document.getElementById("search-custom-url") as HTMLInputElement;
        const st = getState();
        nameInput.value = st.customSearchEngine?.name ?? "";
        urlInput.value = st.customSearchEngine?.url ?? "";
        form.hidden = false;
        nameInput.focus();
      } else {
        setSearchEngine(id);
        renderSearch(getState());
        showToast(`搜索引擎已切换为 ${engineLabel(getState(), id)}`, "info");
      }
    });
  });

  const promptEl = document.querySelector<HTMLElement>("#prompt-engine");
  if (promptEl) promptEl.textContent = engineLabel(state, state.searchEngine);
}

function saveCustomSearch(): void {
  const name = (document.getElementById("search-custom-name") as HTMLInputElement).value.trim();
  const url = (document.getElementById("search-custom-url") as HTMLInputElement).value.trim();
  if (!name || !url) {
    showToast("请填写引擎名称和搜索 URL", "error");
    return;
  }
  if (!url.includes("{q}") && !url.includes("${q}")) {
    showToast("搜索 URL 中需要包含 {q} 作为关键词占位符", "error");
    return;
  }
  setCustomSearchEngine(name, url);
  document.getElementById("search-custom-form")!.hidden = true;
  renderSearch(getState());
  showToast(`已设置自定义搜索引擎：${name}`, "info");
}

export function initSearchPanel(): void {
  document.getElementById("search-custom-cancel")?.addEventListener("click", () => {
    document.getElementById("search-custom-form")!.hidden = true;
  });
  document.getElementById("search-custom-save")?.addEventListener("click", saveCustomSearch);
  document.getElementById("search-custom-name")?.addEventListener("keydown", (e) => { if (e.key === "Enter") saveCustomSearch(); });
  document.getElementById("search-custom-url")?.addEventListener("keydown", (e) => { if (e.key === "Enter") saveCustomSearch(); });
}
