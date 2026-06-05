export const PREFIX_RE = /^(?:r:|m:)/;

export function stripPrefix(value: string): string {
  return value.replace(PREFIX_RE, "");
}

export function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Chrome")) return "chrome";
  if (ua.includes("Safari")) return "safari";
  return "web";
}

export function resetStyles(elements: NodeListOf<HTMLAnchorElement>): void {
  elements.forEach((el) => {
    el.classList.remove("bookmark-match", "bookmark-nomatch");
    el.parentElement?.classList.remove("bookmark-match", "bookmark-nomatch", "bookmark-nomatch-parent");
  });
}

export function highlightMatches(value: string, elements: NodeListOf<HTMLAnchorElement>): void {
  if (value === "") {
    resetStyles(elements);
    return;
  }
  const needle = stripPrefix(value).toLowerCase();
  elements.forEach((el) => {
    const li = el.parentElement!;
    const isMatch = el.textContent!.toLowerCase().includes(needle);
    li.classList.toggle("bookmark-match", isMatch);
    li.classList.toggle("bookmark-nomatch", !isMatch);
    li.classList.toggle("bookmark-nomatch-parent", !isMatch);
  });
}

export function findBookmarkMatch(value: string, elements: NodeListOf<HTMLAnchorElement>): HTMLAnchorElement | null {
  const needle = stripPrefix(value);
  if (!needle) return null;
  for (const el of elements) {
    if (el.textContent!.toLowerCase().includes(needle)) return el;
  }
  return null;
}

export function refreshElements(): NodeListOf<HTMLAnchorElement> {
  return document.querySelectorAll<HTMLAnchorElement>(".bookmark-list a");
}
