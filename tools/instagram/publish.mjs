#!/usr/bin/env node
// XRainier → Instagram publisher. Run by .github/workflows/instagram.yml (template: tools/instagram/instagram.yml).
// Reads the posts in web/social/index.json, the admin's Instagram settings (Auto on/off, Hold, Post next run) and the
// log on the social-log branch, publishes what is due through Meta's Instagram API, and writes the log back
// (instagram/log.json), which the admin's 📸 Instagram tab shows. Secrets come from GitHub (IG_USER_ID, IG_ACCESS_TOKEN)
// and are never written anywhere.
//
// Env: IG_USER_ID, IG_ACCESS_TOKEN, IG_API_HOST (optional), SITE_URL (https://beta.xrainier.com/), ADMIN_URL
// (https://admin-beta.xrainier.com), INDEX (web/social/index.json), LOG_DIR (_log), ONLY (comma-separated slugs, a
// manual run), DRY_RUN=1 (check everything, publish nothing), RUN_URL, BRANCH, WAIT_SECONDS (wait for the site deploy).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { authFrom, whoAmI, publishingLimit, publish, plan, problemsOf, urlsOf, IgError, RULES, hashtagCount } from './ig-api.mjs';

const env = process.env;
const SITE = String(env.SITE_URL || 'https://beta.xrainier.com/').replace(/\/?$/, '/');
const ADMIN = String(env.ADMIN_URL || '').replace(/\/+$/, '');
const LOG_DIR = env.LOG_DIR || '_log', LOG = LOG_DIR + '/instagram/log.json';
const ONLY = String(env.ONLY || '').split(/[,\s]+/).filter(Boolean);
const DRY = /^(1|true|yes)$/i.test(env.DRY_RUN || '');
const now = Date.now();
const say = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readJson(p, dflt) { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return dflt; } }

async function adminSettings() {
  if (!ADMIN) return null;
  try {
    const r = await fetch(ADMIN + '/api/ig?settings=1', { headers: { Accept: 'application/json', 'User-Agent': 'xrainier-instagram' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    return j && j.set ? j : null;   // nothing saved in the admin yet: index.json decides
  } catch (e) { say(`::warning::Could not read the admin's Instagram settings (${e.message}); using web/social/index.json settings.`); return null; }
}

/** Waits until every file of the post answers 200 on the site (the push that added it may still be deploying). */
async function waitForFiles(urls, seconds) {
  const all = [...urls.media.map((m) => m.url), ...(urls.cover ? [urls.cover] : [])];
  const until = Date.now() + seconds * 1000;
  for (;;) {
    const bad = [];
    for (const u of all) {
      try {
        const r = await fetch(u + (u.includes('?') ? '&' : '?') + 'ig-check=' + Date.now(), { method: 'HEAD', headers: { 'User-Agent': 'xrainier-instagram' } });
        const ct = r.headers.get('content-type') || '';
        if (!r.ok || !/^(image\/jpeg|video\/mp4)/.test(ct)) bad.push(`${u} → ${r.status} ${ct}`);
      } catch (e) { bad.push(`${u} → ${e.message}`); }
    }
    if (!bad.length) return;
    if (Date.now() > until) throw new IgError('The site does not serve these files yet: ' + bad.join(', '), 424);
    say('  waiting for the site to serve the files…'); await sleep(20000);
  }
}

async function main() {
  const index = await readJson(env.INDEX || 'web/social/index.json', null);
  if (!index || !Array.isArray(index.posts)) throw new Error('web/social/index.json is missing or has no "posts".');
  await mkdir(LOG_DIR + '/instagram', { recursive: true });
  const log = await readJson(LOG, { v: 1, posts: {}, events: [] });
  log.posts ||= {}; log.events ||= [];
  const ev = (slug, what, extra = {}) => { log.events.unshift({ t: Date.now(), slug, what, site: SITE, branch: env.BRANCH || null, run: env.RUN_URL || null, ...extra }); log.events = log.events.slice(0, 200); };

  const posts = index.posts.map((p) => ({ ...p, problems: problemsOf(p) }));
  const fromAdmin = await adminSettings();
  const settings = { ...(index.settings || {}), ...(fromAdmin || {}) };
  say(`Site ${SITE} · ${posts.length} post(s) · auto ${settings.auto !== false ? 'on' : 'off'} (${fromAdmin ? 'admin' : 'index.json'})${ONLY.length ? ' · only ' + ONLY.join(', ') : ''}${DRY ? ' · DRY RUN' : ''}`);

  const auth = authFrom(env);
  log.run = { t: now, site: SITE, branch: env.BRANCH || null, url: env.RUN_URL || null, dry: DRY, settingsFrom: fromAdmin ? 'admin' : 'index.json' };
  if (!auth) {
    log.account = { ok: false, error: 'IG_ACCESS_TOKEN is not set as a GitHub repository secret.', checkedAt: now };
    await writeFile(LOG, JSON.stringify(log, null, 1) + '\n');
    say('::error::IG_ACCESS_TOKEN is not set (GitHub → Settings → Secrets and variables → Actions).');
    process.exitCode = 1; return;
  }
  // the account, and how old this token is (first seen = when this token first ran here)
  const tokenId = createHash('sha256').update('xr-ig|' + auth.token).digest('hex').slice(0, 10);
  const firstSeen = log.account && log.account.tokenId === tokenId ? log.account.tokenSeen : now;
  let me;
  try { me = await whoAmI(auth); }
  catch (e) {
    log.account = { ok: false, error: e.message, kind: auth.kind, host: auth.host, tokenId, tokenSeen: firstSeen, checkedAt: now };
    ev(null, 'connect-failed', { error: e.message });
    await writeFile(LOG, JSON.stringify(log, null, 1) + '\n');
    say('::error::' + e.message); process.exitCode = 1; return;
  }
  let quota = null;
  try { quota = await publishingLimit(auth, me.userId); } catch (e) { say('::warning::publishing limit: ' + e.message); }
  log.account = { ok: true, username: me.username, userId: me.userId, kind: auth.kind, host: auth.host, tokenId, tokenSeen: firstSeen, quota, checkedAt: now,
    tokenWarning: (now - firstSeen) / 864e5 > RULES.tokenWarnDays ? `This token has been in use for ${Math.floor((now - firstSeen) / 864e5)} days. Instagram tokens last about 60 days: make a new one and update IG_ACCESS_TOKEN.` : null };
  say(`Connected as @${me.username} (${auth.kind} token) · ${quota ? quota.used + '/' + quota.total + ' posts in 24 h' : 'limit unknown'}`);

  // problems are written to the log so the admin shows them
  for (const p of posts) if (p.problems.length && (log.posts[p.slug] || {}).status !== 'published') log.posts[p.slug] = { ...(log.posts[p.slug] || {}), status: 'invalid', error: p.problems.join('; ') };

  const { go, skip } = plan(posts, settings, log, { now, only: ONLY });
  for (const s of skip) say(`- ${s.slug}: ${s.why}`);
  for (const p of go) {
    say(`→ ${p.slug} (${p.kind}, ${p.media.length} file(s), ${p.caption.length} chars, ${hashtagCount(p.caption)} hashtags)`);
    const urls = urlsOf(p, SITE), st = log.posts[p.slug] || {};
    if (quota && quota.used >= quota.total) { say('  Instagram\'s 24-hour limit is used up; stopping.'); break; }
    if (DRY) { say('  dry run: would publish ' + urls.media.map((m) => m.url).join(', ')); continue; }
    try {
      await waitForFiles(urls, Number(env.WAIT_SECONDS || 600));
      log.posts[p.slug] = { ...st, status: 'publishing', kind: p.kind, startedAt: Date.now() };
      const r = await publish(auth, me.userId, p, urls);
      log.posts[p.slug] = { status: 'published', kind: p.kind, at: Date.now(), mediaId: r.mediaId, permalink: r.permalink, site: SITE, run: env.RUN_URL || null,
        via: ONLY.includes(p.slug) ? 'manual' : (settings.now || []).includes(p.slug) ? 'admin' : 'auto', tries: (st.tries || 0) + 1 };
      ev(p.slug, 'published', { permalink: r.permalink, kind: p.kind });
      if (quota) quota.used++;
      await writeFile(LOG, JSON.stringify(log, null, 1) + '\n');   // saved at once: a post is never published twice
      say(`  ✓ published ${r.permalink || r.mediaId}`);
      await sleep(5000);
    } catch (e) {
      log.posts[p.slug] = { ...st, status: 'failed', kind: p.kind, error: e.message, failedAt: Date.now(), tries: (st.tries || 0) + 1 };
      ev(p.slug, 'failed', { error: e.message, kind: p.kind });
      say(`::warning::${p.slug}: ${e.message}`);
      if (e.status === 429) break;
    }
  }
  log.run.planned = go.map((p) => p.slug); log.run.skipped = skip;
  await writeFile(LOG, JSON.stringify(log, null, 1) + '\n');
}
main().catch((e) => { console.error('::error::' + (e.message || e)); process.exitCode = 1; });
