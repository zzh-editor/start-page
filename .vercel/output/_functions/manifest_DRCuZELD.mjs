import 'kleur/colors';
import { d as decodeKey } from './chunks/astro/server_Cl31kswn.mjs';
import 'clsx';
import 'cookie';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_Dx9otN-n.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///app/","cacheDir":"file:///app/node_modules/.astro/","outDir":"file:///app/dist/","srcDir":"file:///app/src/","publicDir":"file:///app/public/","buildClientDir":"file:///app/dist/client/","buildServerDir":"file:///app/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/aisearch","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/aiSearch\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"aiSearch","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/aiSearch.ts","pathname":"/api/aiSearch","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"inline","content":"*{margin:0;padding:0}body{background-color:var(--md-sys-color-surface-container-lowest, #fff);color:var(--md-sys-color-on-surface, #000);height:100vh;display:flex;align-items:center;justify-content:center}@media only screen and (max-width: 1200px){body{align-items:flex-start}}.bookmark-sections[data-astro-cid-hpdudsth]{display:flex;flex-direction:row;flex-wrap:wrap;gap:20px;width:100%;max-width:1200px;margin:0 auto}.bookmark-section[data-astro-cid-hpdudsth]{flex:1 1 calc(20% - 20px)}md-icon[data-astro-cid-hpdudsth] img[data-astro-cid-hpdudsth]{max-width:24px;max-height:24px}@media (max-width: 600px){.bookmark-sections[data-astro-cid-hpdudsth]{flex-direction:column;gap:10px}}section[data-astro-cid-tz62szaw]{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:20px;padding:5px;border-radius:var(--border-radius);background-color:#fff;border:1px solid black}p[data-astro-cid-tz62szaw]{font-family:var(--monospace-font-family);font-size:20px}#username[data-astro-cid-tz62szaw]{color:#000}#browser-info[data-astro-cid-tz62szaw]{font-size:20px;font-weight:500}#terminal-input[data-astro-cid-tz62szaw]{background:none;border:none;font-family:var(--monospace-font-family);font-size:20px;color:var(--text-color);width:750px}#terminal-input[data-astro-cid-tz62szaw]:focus{border:none;outline:none}@media only screen and (max-width: 1200px){section[data-astro-cid-tz62szaw]{flex-direction:column;align-items:flex-start}}ul[data-astro-cid-tz62szaw] li[data-astro-cid-tz62szaw] a[data-astro-cid-tz62szaw]:hover{background-color:var(--card-item-hover-background-color)!important;transform:scale(1.03)!important;box-shadow:0 4px 8px #0003!important;opacity:1!important;filter:none!important}.content[data-astro-cid-j7pv25f6]{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2rem;padding:2rem;min-height:100vh;position:relative;z-index:1}@media (max-width: 768px){.content[data-astro-cid-j7pv25f6]{padding:1.5rem;gap:1.5rem}.card[data-astro-cid-j7pv25f6]{padding:1.5rem;backdrop-filter:blur(4px)}.command-line[data-astro-cid-j7pv25f6]{padding:.75rem}}\n"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/app/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:src/pages/api/aiSearch@_@ts":"pages/api/aisearch.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","/app/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_DY6GXPK3.mjs","/app/src/content/bookmarks.md":"chunks/bookmarks_D_wb0_Ct.mjs","\u0000@astrojs-manifest":"manifest_DRCuZELD.mjs","/app/src/components/commandLine.astro?astro&type=script&index=0&lang.ts":"_astro/commandLine.astro_astro_type_script_index_0_lang.B7fNCzpD.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/app/src/components/commandLine.astro?astro&type=script&index=0&lang.ts","function c(){const t=document.getElementById(\"browser-info\"),o=navigator.userAgent;o.includes(\"Chrome\")||o.includes(\"Firefox\"),t.textContent=\"张橡胶\"}function l(t,o,r=50){let e=0,n=0;function a(){n<o[e].length?(t.placeholder+=o[e].charAt(n),n++,setTimeout(a,r)):setTimeout(()=>{t.placeholder=\"\",n=0,e=(e+1)%o.length,a()},2e3)}a()}const i=document.createElement(\"style\");i.textContent=`\n  .bookmark-match {\n    opacity: 1 !important;\n    filter: brightness(1.3) !important;\n    transform: scale(1.02) !important;\n    transition: all 0.2s ease !important;\n    box-shadow: 0 0 8px rgba(0, 0, 0, 0.8) !important;\n  }\n\n  .bookmark-nomatch {\n    opacity: 0.3 !important;\n    filter: grayscale(80%) !important;\n    transform: scale(0.97) !important;\n    transition: all 0.3s ease !important;\n  }\n\n  .bookmark-nomatch-parent {\n    text-decoration: line-through !important;\n  }\n\n  /* Ensure hover effects always take priority */\n  ul li a:hover {\n    background-color: var(--card-item-hover-background-color) !important;\n    transform: scale(1.03) !important;\n    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;\n    opacity: 1 !important;\n    filter: none !important;\n  }\n`;document.head.appendChild(i);function s(t){t.forEach(o=>{o.classList.remove(\"bookmark-match\",\"bookmark-nomatch\"),o.parentElement.classList.remove(\"bookmark-nomatch-parent\"),o.style.mixBlendMode=\"\"})}function d(t,o){t.addEventListener(\"input\",()=>{const r=t.value.toLowerCase();if(r===\"\"){s(o);return}o.forEach(e=>{const a=e.textContent.toLowerCase().includes(r.replace(/^r:|^s:|^m:/,\"\"));e.classList.toggle(\"bookmark-match\",a),e.classList.toggle(\"bookmark-nomatch\",!a),e.parentElement.classList.toggle(\"bookmark-nomatch-parent\",!a),r===\"\"||a?e.style.mixBlendMode=\"\":e.style.mixBlendMode=\"color-burn\"})}),t.addEventListener(\"blur\",function(){t.value===\"\"&&s(o)})}function h(t,o){const r=[];let e=-1;t.addEventListener(\"keydown\",n=>{const a=t.value.toLowerCase();if(n.ctrlKey&&n.key===\"c\"){t.value=\"\",s(o);return}n.key===\"ArrowUp\"&&e>0?(e--,t.value=r[e]):n.key===\"ArrowDown\"&&e<r.length-1?(e++,t.value=r[e]):n.key===\"Enter\"&&(m(a,o,r),e=r.length)})}function m(t,o,r){let e=!1;o.forEach(n=>{t!==\"\"&&n.textContent.toLowerCase().includes(t.replace(/^r:|^s:|^m:/,\"\"))&&(window.location.href=n.href,e=!0)}),e||f(t),t.trim()!==\"\"&&r.push(t.trim())}async function f(t){if(t.startsWith(\"r:\"))window.location.href=`https://google.com/search?q=site:reddit.com ${t.replace(\"r:\",\"\")}`;else if(t.startsWith(\"m:\"))window.location.href=`https://google.com/search?q=site:myanimelist.net ${t.replace(\"m:\",\"\")}`;else if(t.startsWith(\"a:\")){const o=t.replace(\"a:\",\"\").trim();try{const r=await fetch(`/api/aiSearch?q=${encodeURIComponent(o)}&results=true`);if(!r.ok)throw new Error(`Server error: ${r.status}`);const e=await r.json();e.result&&e.result.startsWith(\"http\")?window.location.href=e.result:window.location.href=`https://google.com/search?q=${encodeURIComponent(e.result||o)}`}catch(r){console.error(\"Error fetching AI result:\",r),alert(\"AI search failed!\")}}else t.split(\".\").length>=2?window.location.href=`http://${t}`:window.location.href=`https://google.com/search?q=${t}`}function u(){const t=document.getElementById(\"terminal-input\"),o=[\"how to tie a tie?\",\"today's weather\",\"search on reddit with r:query\",\"search stackoverflow with s:query\",\"make the terminal great again\",\"hey sexy! wanna kill all humans?\",\"press ctrl+c to clear\",\"Bunu okuyan gaydır.\"],r=document.querySelectorAll(\"a\");c(),l(t,o),d(t,r),h(t,r),s(r),t.focus(),document.addEventListener(\"keydown\",()=>t.focus()),document.addEventListener(\"DOMContentLoaded\",function(){s(r)})}document.addEventListener(\"DOMContentLoaded\",u);"]],"assets":["/Bilibili.svg","/android.svg","/aniwave.svg","/appinn.svg","/chatgpt.svg","/claude.svg","/coolors.svg","/deepl.svg","/deepseek.svg","/discord.svg","/drive.svg","/favicon.svg","/figma.svg","/github.svg","/gmail.svg","/gphotos.svg","/hackernews.svg","/iCloud.svg","/instagram.svg","/linkedin.svg","/mangadex.svg","/mastodon.svg","/myanimelist.svg","/notion.svg","/pinterest.svg","/podcasts.svg","/radio.svg","/reddit.svg","/render.gif","/sspai.svg","/telegram.svg","/twitch.svg","/verge.svg","/viemo.svg","/whatsapp.svg","/x.svg","/xhs.svg","/youtube.svg","/zlibrary.svg"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"0mwybl+1kAT/MjgI7t9vdHCa4Lp0xqGVS7cNvi+OspU="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
