// XRainier → Instagram: the Graph API calls and the posting rules (no dependencies; Node 20+ or any fetch runtime).
// Shared by tools/instagram/publish.mjs (the GitHub Actions publisher) and the tests. Nothing here holds a secret.
export const IG_VERSION = 'v21.0';
export const IG_GRAPH = 'https://graph.instagram.com';   // Instagram tokens (IGAA…): "API setup with Instagram login"
export const FB_GRAPH = 'https://graph.facebook.com';    // Facebook user / Page tokens (EAA…): "Facebook login"
export const RULES = { caption: 2200, hashtags: 30, carouselMin: 2, carouselMax: 10, daily: 50, tokenWarnDays: 50 };
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,59}$/;
export class IgError extends Error { constructor(message, status = 502) { super(message); this.status = status; } }

export const tokenKind = (tok) => (/^EAA/.test(String(tok || '')) ? 'facebook' : 'instagram');
export function graphHost(env, tok) {
  const o = String(env.IG_API_HOST || '').trim().replace(/\/+$/, '');
  if (o) return /^https:\/\//.test(o) ? o.replace(/\/v\d+(\.\d+)?$/, '') : 'https://' + o;
  return tokenKind(tok) === 'facebook' ? FB_GRAPH : IG_GRAPH;
}

/** One Graph API call. GET puts the token in the query, POST in the form body. Errors never include the token. */
export async function igCall(path, { method = 'GET', api, token, params = {}, fetchImpl = fetch } = {}) {
  const u = new URL(path.startsWith('https://') ? path : api + path);
  const init = { method, headers: { Accept: 'application/json' } };
  if (method === 'GET') { for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v)); if (token) u.searchParams.set('access_token', token); }
  else {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') body.set(k, String(v));
    if (token) body.set('access_token', token);
    init.headers['Content-Type'] = 'application/x-www-form-urlencoded'; init.body = body.toString();
  }
  let r;
  try { r = await fetchImpl(u.toString(), init); } catch (e) { throw new IgError('Could not reach Instagram: ' + (e.message || 'network error')); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) {
    const e = d.error || {};
    let msg = String(e.error_user_msg || e.message || `Instagram answered ${r.status}`);
    if (token) msg = msg.split(token).join('…');
    throw new IgError('Instagram: ' + msg.slice(0, 400), r.status === 429 || e.code === 4 || e.code === 9 ? 429 : r.status || 502);
  }
  return d;
}

export function authFrom(env) {
  const token = String(env.IG_ACCESS_TOKEN || '').trim();
  if (!token) return null;
  const host = graphHost(env, token), kind = tokenKind(token);
  return { token, kind, host, api: host + '/' + IG_VERSION, userId: String(env.IG_USER_ID || '').trim() };
}
/** The account: {userId, username}. IGAA tokens can ask /me; EAA tokens need IG_USER_ID. */
export async function whoAmI(auth, fetchImpl = fetch) {
  if (auth.kind === 'facebook') {
    if (!auth.userId) throw new IgError('IG_USER_ID is needed with a Facebook (EAA…) token: GET /me/accounts → your Page → ?fields=instagram_business_account (docs/INSTAGRAM.md).', 409);
    const d = await igCall('/' + auth.userId, { api: auth.api, token: auth.token, params: { fields: 'username' }, fetchImpl });
    return { userId: auth.userId, username: d.username || null };
  }
  const me = await igCall('/me', { api: auth.api, token: auth.token, params: { fields: 'user_id,username' }, fetchImpl });
  return { userId: auth.userId || String(me.user_id || me.id || ''), username: me.username || null };
}
export async function publishingLimit(auth, uid, fetchImpl = fetch) {
  const d = await igCall(`/${uid}/content_publishing_limit`, { api: auth.api, token: auth.token, params: { fields: 'quota_usage,config' }, fetchImpl });
  const x = (d.data || [])[0] || {};
  return { used: Number(x.quota_usage) || 0, total: Number(x.config?.quota_total) || RULES.daily };
}

// ---- posts -------------------------------------------------------------------------------------------------------------
const TAG_RE = /#[\p{L}\p{N}_]+/gu;
export const hashtagCount = (c) => (String(c || '').match(TAG_RE) || []).length;
export function publicHttps(u) {
  let x; try { x = new URL(u); } catch { return false; }
  const h = x.hostname.toLowerCase();
  return x.protocol === 'https:' && !x.username && !x.password && h.includes('.') && !/^[\d.]+$/.test(h) && h !== 'localhost' && !/\.(local|localhost|internal|test)$/.test(h);
}
const pathOf = (u) => { try { return new URL(u).pathname; } catch { return String(u || ''); } };
const okPath = (p) => typeof p === 'string' && /^social\/[A-Za-z0-9._\/-]+$/.test(p) && !p.includes('..');

/** Checks one entry of web/social/index.json the way Instagram will. Returns a list of problems (empty = fine). */
export function problemsOf(p) {
  const out = [];
  if (!p || !SLUG_RE.test(String(p.slug || ''))) out.push('slug: lowercase letters, digits and dashes (2–60)');
  const kind = String(p?.kind || '');
  if (!['image', 'carousel', 'reel'].includes(kind)) out.push('kind: image, carousel or reel');
  const media = Array.isArray(p?.media) ? p.media : [];
  if (!media.length) out.push('media: add the picture(s) or the video');
  media.forEach((m, i) => {
    if (!okPath(m?.path)) out.push(`media ${i + 1}: path must be social/… on the site`);
    else if (m.type === 'image' && !/\.jpe?g$/i.test(m.path)) out.push(`media ${i + 1}: pictures must be JPEG`);
    else if (m.type === 'video' && !/\.mp4$/i.test(m.path)) out.push(`media ${i + 1}: videos must be MP4`);
    else if (!['image', 'video'].includes(m.type)) out.push(`media ${i + 1}: type image or video`);
  });
  if (kind === 'image' && (media.length !== 1 || media[0]?.type !== 'image')) out.push('a photo post has exactly one JPEG');
  if (kind === 'reel' && (media.length !== 1 || media[0]?.type !== 'video')) out.push('a Reel has exactly one MP4');
  if (kind === 'carousel' && (media.length < RULES.carouselMin || media.length > RULES.carouselMax)) out.push(`a carousel has ${RULES.carouselMin}–${RULES.carouselMax} items`);
  if (p?.cover && (!okPath(p.cover) || !/\.jpe?g$/i.test(p.cover))) out.push('cover must be a JPEG under social/');
  const cap = String(p?.caption || '');
  if (!cap.trim()) out.push('caption is empty');
  if (cap.length > RULES.caption) out.push(`caption is ${cap.length} characters (max ${RULES.caption})`);
  if (hashtagCount(cap) > RULES.hashtags) out.push(`caption has ${hashtagCount(cap)} hashtags (max ${RULES.hashtags})`);
  return out;
}
/** Full addresses for a post's files on the site. */
export function urlsOf(p, site) {
  const base = String(site).replace(/\/?$/, '/');
  return { media: p.media.map((m) => ({ url: base + m.path, type: m.type })), cover: p.cover ? base + p.cover : null };
}

// ---- publishing --------------------------------------------------------------------------------------------------------
const sleep = (ms) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
async function status(auth, cid, fetchImpl) {
  const d = await igCall('/' + cid, { api: auth.api, token: auth.token, params: { fields: 'status_code,status' }, fetchImpl });
  return { code: String(d.status_code || 'FINISHED').toUpperCase(), detail: d.status || '' };
}
/** Waits until a container is FINISHED (Reels take a while). Throws on ERROR / EXPIRED / timeout. */
export async function waitReady(auth, cid, { tries = 40, every = 8000, fetchImpl = fetch, what = 'post' } = {}) {
  let st;
  for (let i = 0; i < tries; i++) {
    st = await status(auth, cid, fetchImpl);
    if (st.code === 'FINISHED') return st;
    if (st.code === 'PUBLISHED') throw new IgError('Instagram says this container was already published.', 409);
    if (st.code === 'ERROR' || st.code === 'EXPIRED') throw new IgError(`Instagram could not process the ${what} (${st.code}${st.detail ? ': ' + st.detail : ''}).`);
    await sleep(every);
  }
  throw new IgError(`Instagram was still processing the ${what} after ${Math.round(tries * every / 1000)} s. It will be tried again on the next run.`, 504);
}
/** Publishes one post. Returns {mediaId, permalink}. */
export async function publish(auth, uid, post, urls, { fetchImpl = fetch, tries, every } = {}) {
  const call = (path, params) => igCall(path, { method: 'POST', api: auth.api, token: auth.token, params, fetchImpl });
  let cid;
  if (post.kind === 'image') {
    cid = (await call(`/${uid}/media`, { image_url: urls.media[0].url, caption: post.caption })).id;
    await waitReady(auth, cid, { fetchImpl, tries, every, what: 'picture' });
  } else if (post.kind === 'reel') {
    cid = (await call(`/${uid}/media`, { media_type: 'REELS', video_url: urls.media[0].url, caption: post.caption, share_to_feed: 'true', cover_url: urls.cover || '' })).id;
    await waitReady(auth, cid, { fetchImpl, tries, every, what: 'video' });
  } else {
    const kids = [];
    for (const m of urls.media) {
      const c = await call(`/${uid}/media`, m.type === 'video' ? { media_type: 'VIDEO', video_url: m.url, is_carousel_item: 'true' } : { image_url: m.url, is_carousel_item: 'true' });
      kids.push(c.id);
    }
    for (const k of kids) await waitReady(auth, k, { fetchImpl, tries, every, what: 'carousel item' });
    cid = (await call(`/${uid}/media`, { media_type: 'CAROUSEL', children: kids.join(','), caption: post.caption })).id;
    await waitReady(auth, cid, { fetchImpl, tries, every, what: 'carousel' });
  }
  const pub = await call(`/${uid}/media_publish`, { creation_id: cid });
  let permalink = null;
  try { permalink = (await igCall('/' + pub.id, { api: auth.api, token: auth.token, params: { fields: 'permalink' }, fetchImpl })).permalink || null; } catch { /* the post is up; the link is a nice-to-have */ }
  return { mediaId: String(pub.id), permalink };
}

// ---- which posts go out on this run ------------------------------------------------------------------------------------
/** settings: {auto, maxPerDay, gapMinutes, hold:[slug], now:[slug]}; log: {posts:{slug:{status, at, tries}}}; only: [slug] (manual run).
 *  Returns the posts to publish now, in index order, with the reason each one is skipped. */
export function plan(posts, settings, log, { now = Date.now(), only = [] } = {}) {
  const S = { auto: true, maxPerDay: 3, gapMinutes: 0, hold: [], now: [], ...settings };
  const L = (log && log.posts) || {};
  const day = Object.values(L).filter((x) => x.status === 'published' && now - (x.at || 0) < 864e5).length;
  const last = Math.max(0, ...Object.values(L).filter((x) => x.status === 'published').map((x) => x.at || 0));
  const go = [], skip = [];
  let autoTaken = false;
  let left = Math.max(0, (Number(S.maxPerDay) || 0) - day);
  for (const p of posts) {
    const st = L[p.slug] || {}, asked = only.includes(p.slug) || (S.now || []).includes(p.slug);
    const why = st.status === 'published' ? 'already published'
      : (S.hold || []).includes(p.slug) && !only.includes(p.slug) ? 'on hold in the admin'
      : p.problems && p.problems.length ? 'needs fixing: ' + p.problems.join('; ')
      : !S.auto && !asked ? 'automatic posting is off (press Post next run in the admin)'
      : (st.tries || 0) >= 3 && !asked ? 'failed 3 times (press Post next run to try again)'
      : !asked && p.notBefore && Date.parse(p.notBefore) > now ? 'scheduled for ' + p.notBefore
      : !asked && left <= 0 ? `daily limit reached (${S.maxPerDay} a day)`
      : !asked && S.gapMinutes > 0 && (autoTaken || (last && now - last < S.gapMinutes * 60000)) ? `waiting: ${S.gapMinutes} min between posts`
      : null;
    if (why) skip.push({ slug: p.slug, why }); else { go.push(p); if (!asked) { left--; autoTaken = true; } }
  }
  return { go, skip };
}
