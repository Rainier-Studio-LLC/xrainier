#!/usr/bin/env node
// Checks web/social/index.json and its files before a push: every post valid for Instagram, every file present, JPEGs
// and MP4s really are what they say, Reels 9:16-ready sizes. Usage: node tools/instagram/check.mjs [web]
import { readFile, stat } from 'node:fs/promises';
import { problemsOf, SLUG_RE } from './ig-api.mjs';
const web = process.argv[2] || 'web';
const idx = JSON.parse(await readFile(web + '/social/index.json', 'utf8'));
let bad = 0; const seen = new Set();
const fail = (m) => { bad++; console.error('✗ ' + m); };
if (!Array.isArray(idx.posts)) fail('index.json: "posts" must be a list');
for (const p of idx.posts || []) {
  if (seen.has(p.slug)) fail(`${p.slug}: slug used twice`); seen.add(p.slug);
  for (const m of problemsOf(p)) fail(`${p.slug || '(no slug)'}: ${m}`);
  for (const f of [...(p.media || []).map((m) => m.path), ...(p.cover ? [p.cover] : [])]) {
    let buf;
    try { const s = await stat(web + '/' + f); if (s.size > 24 * 1024 * 1024) fail(`${f}: ${(s.size / 1048576).toFixed(1)} MB (the site serves files up to 25 MB)`); buf = await readFile(web + '/' + f); }
    catch { fail(`${p.slug}: ${f} is missing`); continue; }
    if (/\.jpe?g$/i.test(f) && !(buf[0] === 0xff && buf[1] === 0xd8)) fail(`${f}: not a real JPEG`);
    if (/\.mp4$/i.test(f) && buf.subarray(4, 8).toString() !== 'ftyp') fail(`${f}: not a real MP4`);
  }
  if (bad === 0) console.log(`✔ ${p.slug} (${p.kind}, ${(p.media || []).length} file(s), ${String(p.caption || '').length} chars)`);
}
if (idx.settings && typeof idx.settings !== 'object') fail('settings must be an object');
if (bad) { console.error(`${bad} problem(s) in web/social`); process.exit(1); }
console.log('instagram: index.json and files OK');
