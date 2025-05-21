import { c as createComponent, a as createAstro, r as renderTemplate, b as renderSlot, e as renderHead, f as addAttribute, m as maybeRenderHead, g as renderComponent, h as renderScript } from '../chunks/astro/server_Cl31kswn.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro$1 = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en" color-mode="user"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"', '><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><title>', `</title><script type="module">
      import '@material/web/all.js';
      import { styles as typescaleStyles } from '@material/web/typography/md-typescale-styles.js';

      document.adoptedStyleSheets.push(typescaleStyles.styleSheet);
    <\/script>`, "</head> <body> ", " </body></html>"])), addAttribute(Astro2.generator, "content"), title, renderHead(), renderSlot($$result, $$slots["default"]));
}, "/app/src/layouts/Layout.astro", void 0);

const $$Astro = createAstro();
const $$Card = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Card;
  const { links } = (await Astro2.glob(/* #__PURE__ */ Object.assign({"../content/bookmarks.md": () => import('../chunks/bookmarks_D_wb0_Ct.mjs')}), () => "../content/bookmarks.md"))[0].frontmatter;
  links.sort((a, b) => a.title.localeCompare(b.title));
  return renderTemplate`${maybeRenderHead()}<section class="bookmark-sections" data-astro-cid-hpdudsth> <!-- Section 1 --> ${renderComponent($$result, "md-outlined-card", "md-outlined-card", { "class": "bookmark-section", "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${renderComponent($$result, "md-list", "md-list", { "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${links.slice(0, 5).map((link) => renderTemplate`<!-- First 5 bookmarks -->
        ${renderComponent($$result, "md-list-item", "md-list-item", { "headline": link.title, "href": link.href, "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${renderComponent($$result, "md-icon", "md-icon", { "slot": "start", "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` <img${addAttribute(link.src, "src")}${addAttribute(link.alt, "alt")} data-astro-cid-hpdudsth> ` })} ` })}`)} ` })} ` })} <!-- Section 2 --> ${renderComponent($$result, "md-outlined-card", "md-outlined-card", { "class": "bookmark-section", "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${renderComponent($$result, "md-list", "md-list", { "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${links.slice(5, 10).map((link) => renderTemplate`<!-- Next 5 bookmarks -->
        ${renderComponent($$result, "md-list-item", "md-list-item", { "headline": link.title, "href": link.href, "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${renderComponent($$result, "md-icon", "md-icon", { "slot": "start", "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` <img${addAttribute(link.src, "src")}${addAttribute(link.alt, "alt")} data-astro-cid-hpdudsth> ` })} ` })}`)} ` })} ` })} <!-- Section 3 --> ${renderComponent($$result, "md-outlined-card", "md-outlined-card", { "class": "bookmark-section", "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${renderComponent($$result, "md-list", "md-list", { "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${links.slice(10, 15).map((link) => renderTemplate`<!-- Next 5 bookmarks -->
        ${renderComponent($$result, "md-list-item", "md-list-item", { "headline": link.title, "href": link.href, "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${renderComponent($$result, "md-icon", "md-icon", { "slot": "start", "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` <img${addAttribute(link.src, "src")}${addAttribute(link.alt, "alt")} data-astro-cid-hpdudsth> ` })} ` })}`)} ` })} ` })} <!-- Section 4 --> ${renderComponent($$result, "md-outlined-card", "md-outlined-card", { "class": "bookmark-section", "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${renderComponent($$result, "md-list", "md-list", { "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${links.slice(15, 20).map((link) => renderTemplate`<!-- Next 5 bookmarks -->
        ${renderComponent($$result, "md-list-item", "md-list-item", { "headline": link.title, "href": link.href, "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` ${renderComponent($$result, "md-icon", "md-icon", { "slot": "start", "data-astro-cid-hpdudsth": true }, { "default": () => renderTemplate` <img${addAttribute(link.src, "src")}${addAttribute(link.alt, "alt")} data-astro-cid-hpdudsth> ` })} ` })}`)} ` })} ` })} </section> `;
}, "/app/src/components/card.astro", void 0);

const $$CommandLine = createComponent(async ($$result, $$props, $$slots) => {
  const name = "zhjane";
  return renderTemplate`${maybeRenderHead()}<section data-astro-cid-tz62szaw> <p id="username" data-astro-cid-tz62szaw>${name}@<span id="browser-info" data-astro-cid-tz62szaw></span> |</p> <input id="terminal-input" type="text" data-astro-cid-tz62szaw> </section> <p id="browser-info" data-astro-cid-tz62szaw></p>  <p id="browser-info" data-astro-cid-tz62szaw></p> ${renderScript($$result, "/app/src/components/commandLine.astro?astro&type=script&index=0&lang.ts")}`;
}, "/app/src/components/commandLine.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Rubber's startpage.", "data-astro-cid-j7pv25f6": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="content" data-astro-cid-j7pv25f6> ${renderComponent($$result2, "Card", $$Card, { "data-astro-cid-j7pv25f6": true })} ${renderComponent($$result2, "CommandLine", $$CommandLine, { "data-astro-cid-j7pv25f6": true })} </div> ` })} `;
}, "/app/src/pages/index.astro", void 0);

const $$file = "/app/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
