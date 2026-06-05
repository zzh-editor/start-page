import { setThemeMode, setThemeStyle, type Store } from "../../lib/store";
import { applyTheme, THEME_OPTIONS } from "../../lib/themes";

export function renderTheme(state: Store): void {
  const cardsEl = document.getElementById("theme-cards")!;
  cardsEl.innerHTML = THEME_OPTIONS.map(
    (opt) => `
      <button type="button" class="theme-card ${opt.id === state.themeStyle ? "active" : ""}" data-theme="${opt.id}">
        <div class="theme-card-preview">${opt.label}</div>
        <div class="theme-card-name">${opt.label}</div>
        <div class="theme-card-desc">${opt.description}</div>
      </button>
    `,
  ).join("");

  cardsEl.querySelectorAll<HTMLButtonElement>(".theme-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.theme as "default" | "pixel";
      setThemeStyle(id);
      const mode = document.querySelector<HTMLElement>('[data-mode].active')?.dataset.mode as "light" | "dark" ?? "light";
      applyTheme(mode, id);
    });
  });

  const modeEl = document.getElementById("theme-mode")!;
  modeEl.querySelectorAll<HTMLButtonElement>("button[data-mode]").forEach((b) => {
    const isActive = b.dataset.mode === state.themeMode;
    b.classList.toggle("active", isActive);
    b.setAttribute("aria-pressed", String(isActive));
    b.onclick = () => {
      const mode = b.dataset.mode as "light" | "dark";
      setThemeMode(mode);
      applyTheme(mode, getComputedStyle(document.documentElement).getPropertyValue("--theme-style").trim() || "default");
    };
  });
}
