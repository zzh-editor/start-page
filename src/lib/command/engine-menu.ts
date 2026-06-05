import { SEARCH_ENGINES, setSearchEngine } from "../../lib/store";

export function updateSearchEnginePrompt(): void {
  const state = (window as any).__startpageStore?.();
  if (!state) return;
  const el = document.getElementById("prompt-engine");
  if (!el) return;
  if (state.searchEngine === "custom" && state.customSearchEngine?.name) {
    el.textContent = state.customSearchEngine.name;
  } else {
    const map: Record<string, string> = { google: "Google", bing: "Bing", duckduckgo: "DuckDuckGo", brave: "Brave" };
    el.textContent = map[state.searchEngine] ?? "Google";
  }
}

export function renderEngineMenu(): void {
  const menu = document.getElementById("engine-menu") as HTMLDivElement;
  if (!menu) return;
  const state = (window as any).__startpageStore?.();
  if (!state) return;
  const current = state.searchEngine;
  const custom = state.customSearchEngine;
  let html = "";
  for (const [id, info] of Object.entries(SEARCH_ENGINES)) {
    const active = current === id ? "active" : "";
    html += `<button type="button" class="engine-item ${active}" data-engine="${id}">${info.label}</button>`;
  }
  if (custom?.name) {
    const active = current === "custom" ? "active" : "";
    html += `<button type="button" class="engine-item ${active}" data-engine="custom">${custom.name}</button>`;
  }
  menu.innerHTML = html;
  menu.querySelectorAll<HTMLButtonElement>(".engine-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setSearchEngine(btn.dataset.engine! as any);
      menu.hidden = true;
      updateSearchEnginePrompt();
    });
  });
}

export function positionEngineMenu(): void {
  const promptEl = document.getElementById("prompt-engine")!;
  const menu = document.getElementById("engine-menu")!;
  const rect = promptEl.getBoundingClientRect();
  menu.style.left = rect.left + "px";
  menu.style.top = (rect.bottom + 6) + "px";
  menu.style.minWidth = Math.max(160, rect.width) + "px";
}

export function positionWfSuggest(): void {
  const suggest = document.getElementById("wf-suggest") as HTMLDivElement;
  if (!suggest || suggest.hidden) return;
  const input = document.getElementById("terminal-input") as HTMLInputElement;
  if (!input) return;
  const inputRect = input.getBoundingClientRect();
  suggest.style.left = inputRect.left + "px";
  suggest.style.top = (inputRect.bottom + 6) + "px";
  suggest.style.minWidth = Math.max(220, inputRect.width) + "px";
}

export function repositionAllMenus(): void {
  const menu = document.getElementById("engine-menu")!;
  if (!menu.hidden) positionEngineMenu();
  positionWfSuggest();
}
