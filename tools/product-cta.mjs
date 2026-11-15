// Product pages: the top-menu button opens the product itself ("Open DrizzleTown", "Open TankWar"…) instead of SkyHere.
// Safe to re-run. Run from the repo root: node tools/product-cta.mjs
//  - a product page is web/<page>.html whose menu has a link with data-product pointing at /<page>(.html)
//  - its name = that menu link's text; its address = the first https://<product>.xrainier.com link in the page's <main>
//    (the page's own "Play"/"Open" button), shortened to the site's home page
//  - the home page, 404 and forwarding pages keep "Open SkyHere"
//  - also replaces any leftover LandLord name/link in the site's own scripts (web/assets/js/*.js)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WEB = 'web', out = [], warn = [];
const read = (p) => readFileSync(p, 'utf8');
const save = (p, s) => { if (read(p) !== s) { writeFileSync(p, s); out.push(p); } };
const strip = (s) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

for (const f of readdirSync(WEB).filter((x) => x.endsWith('.html') && !['index.html', '404.html', 'landlord.html'].includes(x))) {
  const p = join(WEB, f), page = f.replace(/\.html$/, '');
  let html = read(p);
  const hdr = /<header\b[\s\S]*?<\/header>/.exec(html); if (!hdr) continue;
  // this page's own menu entry
  const me = new RegExp(`<a\\b[^>]*href="/${page}(?:\\.html)?"[^>]*data-product="[^"]+"[^>]*>([\\s\\S]*?)</a>|<a\\b[^>]*data-product="[^"]+"[^>]*href="/${page}(?:\\.html)?"[^>]*>([\\s\\S]*?)</a>`).exec(html);
  if (!me) continue;   // not a product page
  const name = strip(me[1] ?? me[2]);
  const main = (/<main\b[\s\S]*?<\/main>/.exec(html) || [''])[0];
  const links = [...main.matchAll(/<a\b([^>]*)href="(https:\/\/(?!(?:beta\.)?xrainier\.com)[a-z0-9-]+(?:\.[a-z0-9-]+)*\.xrainier\.com)(?:\/[^"]*)?"/g)];
  const pri = links.find((m) => /class="[^"]*\b(pri|primary)\b/.test(m[1])) || links[0];
  if (!name || !pri) { warn.push(`${f}: no product link found in the page, button left as it is`); continue; }
  const url = pri[2].replace('https://beta.', 'https://') + '/';
  // the header's main button (class "btn pri"), wherever it sits in the header
  const btnRe = /<a\b([^>]*\bclass="[^"]*\bbtn\b[^"]*\bpri\b[^"]*"[^>]*)>([\s\S]*?)<\/a>/;
  const b = btnRe.exec(hdr[0]);
  if (!b) { warn.push(`${f}: no main button in the menu`); continue; }
  const attrs = b[1].replace(/\shref="[^"]*"/, ` href="${url}"`);
  const btn = `<a${attrs}>Open ${name}</a>`;   // SkyHere's plane icon is dropped on the other products
  const nh = hdr[0].replace(b[0], btn);
  if (nh !== hdr[0]) { html = html.replace(hdr[0], nh); save(p, html); }
  console.log(`  ${f}: Open ${name} → ${url}`);
}
// leftover LandLord in the site's scripts (menus built in JavaScript)
const js = join(WEB, 'assets', 'js');
if (existsSync(js)) for (const f of readdirSync(js).filter((x) => x.endsWith('.js'))) {
  const p = join(js, f), s = read(p);
  if (/LandLord|\/landlord\.html/.test(s)) save(p, s.replace(/LandLord/g, 'DrizzleTown').replace(/\/landlord\.html/g, '/drizzletown.html'));
  if (/Open SkyHere/.test(s)) warn.push(`${p} also writes "Open SkyHere": check whether it overrides the page buttons`);
}
console.log(out.length ? 'Product buttons updated:\n  ' + out.join('\n  ') : 'Product buttons: already done');
for (const w of warn) console.log('  note: ' + w);
