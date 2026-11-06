// Page check for the website: every inline script must compile, and all of a page's scripts must load in order
// without errors such as "Cannot access 'x' before initialization" (the bug that froze the site on Nov 6, 2026).
// Usage: node tools/check-pages.mjs web admin        (folders or .html files; Node 18+, no packages needed)
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
const args = process.argv.slice(2).length ? process.argv.slice(2) : ['.'];
const files = [];
const walk = (p) => { const st = fs.statSync(p); if (st.isDirectory()) { for (const f of fs.readdirSync(p)) if (!['node_modules', '.git'].includes(f)) walk(path.join(p, f)); } else if (p.endsWith('.html')) files.push(p); };
args.forEach(walk);
const stub = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'length' ? 0 : k === 'then' ? undefined : stub()), apply: () => stub(), construct: () => stub(), set: () => true, has: () => true });
let bad = 0;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type=["'](?:application\/ld\+json|module|text\/template)["'])[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const problems = [];
  blocks.forEach((b, i) => { try { new vm.Script(b, { filename: `${file}#script${i + 1}` }); } catch (e) { problems.push(`script ${i + 1} doesn't compile: ${e.message}`); } });
  if (!problems.length && blocks.length) {
    const store = new Map();
    const ctx = { console: { log() {}, warn() {}, error() {}, info() {} }, Math, Date, JSON, Intl, URL, URLSearchParams, Promise, Set, Map, WeakMap, WeakSet, Symbol, Proxy, Reflect, Array, Object, String, Number, Boolean, RegExp, Error, TypeError,
      parseFloat, parseInt, isFinite, isNaN, encodeURIComponent, decodeURIComponent, Uint8Array, Uint32Array, Float32Array, ArrayBuffer, DataView, TextEncoder, TextDecoder, atob, btoa,
      setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, queueMicrotask() {},
      localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      location: { search: '', hash: '', href: 'https://example.com/', hostname: 'example.com', pathname: '/', origin: 'https://example.com', replace() {}, assign() {} },
      navigator: stub(), document: stub(), fetch: async () => ({ ok: false, status: 0, json: async () => ({}), text: async () => '', headers: { get: () => null } }),
      matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }), addEventListener() {}, removeEventListener() {}, innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1,
      crypto: globalThis.crypto, performance, history: { replaceState() {}, pushState() {} }, screen: stub(), Image: function () { return stub(); }, CSS: { supports: () => true }, getComputedStyle: () => stub() };
    // libraries the pages load from the internet (<script src=…>): stand-ins, so only the page's own code is checked
    for (const lib of ['Chart', 'L', 'd3', 'topojson', 'Globe', 'google', 'turnstile', 'AppleID', 'Cesium', 'THREE', 'Hls', 'mapboxgl']) ctx[lib] = stub();
    // other browser features the pages may use while loading
    for (const api of ['Path2D', 'OffscreenCanvas', 'ResizeObserver', 'IntersectionObserver', 'MutationObserver', 'Blob', 'File', 'FileReader', 'Audio', 'AudioContext', 'webkitAudioContext', 'Worker', 'DOMParser',
      'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'Notification', 'BroadcastChannel', 'DecompressionStream', 'CompressionStream', 'Response', 'Request', 'Headers',
      'AbortController', 'WebSocket', 'EventSource', 'speechSynthesis', 'SpeechSynthesisUtterance', 'DeviceOrientationEvent', 'Option', 'XMLHttpRequest', 'caches', 'indexedDB', 'visualViewport', 'scrollTo', 'alert', 'confirm', 'prompt', 'open', 'print'])
      if (!(api in ctx)) ctx[api] = stub();
    ctx.structuredClone = (x) => JSON.parse(JSON.stringify(x));
    ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
    vm.createContext(ctx);
    blocks.forEach((b, i) => { try { vm.runInContext(b, ctx, { filename: `${file}#script${i + 1}` }); }
      catch (e) { if (e instanceof ReferenceError || e.name === 'ReferenceError' || /before initialization|is not defined/.test(e.message)) problems.push(`script ${i + 1} fails while loading: ${e.message}`); } });
  }
  if (problems.length) { bad++; console.log(`✘ ${file}`); problems.forEach((p) => console.log('    ' + p)); } else console.log(`✔ ${file} (${blocks.length} script${blocks.length === 1 ? '' : 's'})`);
}
if (!files.length) { console.log('No .html files found.'); process.exit(1); }
console.log(bad ? `\n${bad} page(s) would break. Fix before releasing.` : `\nAll ${files.length} page(s) load cleanly.`);
process.exit(bad ? 1 : 0);
