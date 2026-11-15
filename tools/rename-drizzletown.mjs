// One-time (safe to re-run) rename of the LandLord product to DrizzleTown on the XRainier portal.
// Run from the repo root: node tools/rename-drizzletown.mjs   — edits the files in place and prints what changed.
//  - every web/**/*.html: elements with data-product="landlord" (home card, Products menu, footer links) say
//    DrizzleTown, use the DrizzleTown icon and open /drizzletown.html. The id stays "landlord" so the admin keeps its status.
//  - web/drizzletown.html gets the site's current menu (copied from the home page) with DrizzleTown marked as the current page
//  - web/landlord.html becomes a small page that forwards to /drizzletown; web/_redirects sends /landlord there with a 301
//  - web/sitemap.xml lists drizzletown.html instead of landlord.html
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WEB = 'web', ID = 'landlord', NAME = 'DrizzleTown', PAGE = '/drizzletown.html';
const DESC = 'The family board game in 3D. Roll the dice and build a rainy little town together on one device, online with a share-invite link, or against the computer.';
const changed = [];
const read = (p) => readFileSync(p, 'utf8');
const save = (p, s) => { if (!existsSync(p) || read(p) !== s) { writeFileSync(p, s); changed.push(p); } };
const htmlFiles = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? (f === 'assets' ? [] : htmlFiles(p)) : f.endsWith('.html') ? [p] : []; });

/** [start, end) of the element that starts at `start` (matching nested tags of the same name). */
function element(s, start) {
  const tag = /^<([a-zA-Z0-9]+)/.exec(s.slice(start))[1];
  const re = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, 'gi'); re.lastIndex = start; let depth = 0, m;
  while ((m = re.exec(s))) { if (m[2]) continue; depth += m[1] ? -1 : 1; if (depth === 0) return [start, re.lastIndex]; }
  throw new Error('unclosed <' + tag + '>');
}
function renameEl(el) {
  el = el.replace(/href="(?:\/landlord(?:\.html)?|https?:\/\/(?:beta\.)?landlord\.xrainier\.com[^"]*)"/g, `href="${PAGE}"`);
  el = el.replace(/\/assets\/img\/landlord-icon\.png/g, '/assets/img/drizzletown-icon.png');
  el = el.replace(/Land\s*<span([^>]*)>\s*Lord\s*<\/span>/g, `Drizzle<span$1>Town</span>`);
  el = el.replace(/LandLord|Landlord|Land Lord/g, NAME);
  if (/<h3[^>]*>/.test(el)) {   // the home-page product card: fresh blurb and tags
    el = el.replace(/(<p(?:\s[^>]*)?>)([\s\S]*?)(<\/p>)/, (_, a, __, c) => a + DESC + c);
    el = el.replace(/<span class="tag">DAILY PUZZLE<\/span>/, '<span class="tag">FAMILY</span>');
  }
  return el;
}
function renameAll(html) {
  let pos = 0, n = 0;
  const re = new RegExp(`<[a-zA-Z][^>]*\\sdata-product="${ID}"[^>]*>`);
  for (;;) {
    const m = re.exec(html.slice(pos)); if (!m) break;
    const [a, b] = element(html, pos + m.index), el = renameEl(html.slice(a, b));
    html = html.slice(0, a) + el + html.slice(b); pos = a + el.length; n++;
  }
  return [html, n];
}

const pages = htmlFiles(WEB).filter((p) => !/[\\/]landlord\.html$/.test(p));
for (const p of pages) { const [s, n] = renameAll(read(p)); if (n) save(p, s); }

// drizzletown.html: the home page's current header (menu), DrizzleTown marked as the current page
const dt = join(WEB, 'drizzletown.html'), idx = join(WEB, 'index.html');
if (existsSync(dt) && existsSync(idx)) {
  const hdr = /<header\b[\s\S]*?<\/header>/.exec(read(idx));
  if (hdr) {
    let h = hdr[0].replace(/href="#/g, 'href="/#').replace(/\saria-current="page"/g, '');
    h = h.replace(new RegExp(`(<a\\b[^>]*data-product="${ID}"[^>]*)>`), '$1 aria-current="page">');
    save(dt, read(dt).replace(/<header\b[\s\S]*?<\/header>/, h));
  }
}
// the old address forwards (pretty URL /landlord and /landlord.html)
save(join(WEB, 'landlord.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DrizzleTown · XRainier</title>
<link rel="canonical" href="https://xrainier.com/drizzletown">
<meta http-equiv="refresh" content="0; url=/drizzletown">
<meta name="robots" content="noindex">
</head><body><p>LandLord is now called DrizzleTown. <a href="/drizzletown">Go to the DrizzleTown page</a>.</p></body></html>
`);
const rd = join(WEB, '_redirects');
{
  const cur = existsSync(rd) ? read(rd) : '';
  const want = ['/landlord /drizzletown 301', '/landlord.html /drizzletown 301'].filter((l) => !cur.split('\n').some((x) => x.trim().startsWith(l.split(' ')[0] + ' ')));
  if (want.length) save(rd, (cur && !cur.endsWith('\n') ? cur + '\n' : cur) + want.join('\n') + '\n');
}
const sm = join(WEB, 'sitemap.xml');
if (existsSync(sm)) {
  let s = read(sm);
  if (!s.includes('drizzletown.html')) s = s.includes('/landlord.html') ? s.replace(/https:\/\/xrainier\.com\/landlord\.html/g, 'https://xrainier.com/drizzletown.html') : s.replace('</urlset>', '  <url><loc>https://xrainier.com/drizzletown.html</loc></url>\n</urlset>');
  save(sm, s);
}
console.log(changed.length ? 'DrizzleTown rename:\n  ' + changed.join('\n  ') : 'DrizzleTown rename: already done');
