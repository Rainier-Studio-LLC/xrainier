// 📸 Instagram tab of the XRainier admin.
// Publishing runs in GitHub Actions (.github/workflows/instagram.yml, template tools/instagram/instagram.yml) with the
// repo secrets IG_USER_ID and IG_ACCESS_TOKEN; this admin never sees the token. It shows the posts (web/social/index.json
// on the site), the log the workflow keeps on the social-log branch (instagram/log.json), and stores the owner's
// settings in KV (key "ig"), which the workflow reads before each run:
//   GET /api/ig?settings=1   public, no secrets: {set, auto, maxPerDay, gapMinutes, hold:[slug], now:[slug], at}
//   GET /api/ig              owner: settings + posts + log + set-up state
//   PUT /api/ig              owner: {auto?, maxPerDay?, gapMinutes?, hold?:{slug:bool}, now?:{slug:bool}}
// Posts go out from the RELEASE only (main → www.xrainier.com, settings from admin.xrainier.com). admin-beta shows the
// same log and the release settings read-only, plus the posts on beta that are waiting for a release.
// Optional Pages settings: GITHUB_REPO (default Rainier-Studio-LLC/xrainier), IG_LOG_BRANCH (default social-log),
// IG_WORKFLOW_BRANCH (default main), IG_LIVE_SITE (default https://www.xrainier.com/), IG_LIVE_ADMIN (default
// https://admin.xrainier.com).
import { json, readSession, siteUrl, isBetaSite, addLog } from "../../lib/core.js";
const SLUG = /^[a-z0-9][a-z0-9-]{1,59}$/;
const repoOf = (env) => env.GITHUB_REPO || "Rainier-Studio-LLC/xrainier";
const liveSite = (env) => String(env.IG_LIVE_SITE || "https://www.xrainier.com/").replace(/\/?$/, "/");
const liveAdmin = (env) => String(env.IG_LIVE_ADMIN || "https://admin.xrainier.com").replace(/\/+$/, "");
const DEF = { auto: true, maxPerDay: 3, gapMinutes: 0, hold: [], now: [] };
async function readSettings(env) {
  const v = env.SITE ? await env.SITE.get("ig", "json").catch(() => null) : null;
  return v ? { ...DEF, ...v, set: true } : { ...DEF, set: false };
}
async function getText(url) {
  const r = await fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Math.floor(Date.now() / 30000), { headers: { "User-Agent": "xrainier-admin", Accept: "*/*" }, cf: { cacheTtl: 0 } });
  return { ok: r.ok, status: r.status, text: r.ok ? await r.text() : "" };
}
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url), s = await readSettings(env);
  if (url.searchParams.has("settings")) {
    const { set, auto, maxPerDay, gapMinutes, hold, now, at, by } = s;
    return json({ set, auto, maxPerDay, gapMinutes, hold, now, at: at || null, by: by ? "owner" : null });
  }
  const me = await readSession(env, request); if (!me) return json({ error: "sign in required" }, 401);
  const repo = repoOf(env), beta = isBetaSite(env, request), here = siteUrl(env, request).replace(/\/?$/, "/"), site = liveSite(env);
  const wfBranch = env.IG_WORKFLOW_BRANCH || "main", logBranch = env.IG_LOG_BRANCH || "social-log";
  const raw = (branch, path) => `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
  const fail = (e) => ({ ok: false, status: e.message });
  const out = { settings: s, site, beta, readOnly: beta, liveAdmin: liveAdmin(env), repo, branch: wfBranch, posts: [], waiting: [], indexError: null, log: null, logError: null, workflow: { installed: null } };
  const [idx, lg, wf, tpl, tplBeta, idxHere, liveSet] = await Promise.all([
    getText(site + "social/index.json").catch(fail),
    getText(raw(logBranch, "instagram/log.json")).catch(fail),
    getText(raw(wfBranch, ".github/workflows/instagram.yml")).catch(fail),
    getText(raw(wfBranch, "tools/instagram/instagram.yml")).catch(fail),
    beta ? getText(raw("beta", "tools/instagram/instagram.yml")).catch(fail) : null,
    beta && here !== site ? getText(here + "social/index.json").catch(fail) : null,
    beta ? getText(liveAdmin(env) + "/api/ig?settings=1").catch(fail) : null,
  ]);
  const postsOf = (r) => { const j = JSON.parse(r.text); return { posts: Array.isArray(j.posts) ? j.posts : [], settings: j.settings || null }; };
  if (idx.ok) { try { const j = postsOf(idx); out.posts = j.posts.map((p) => ({ ...p, base: site })); out.indexSettings = j.settings; } catch (e) { out.indexError = "web/social/index.json on the live site is not valid JSON"; } }
  else out.indexError = idx.status === 404 ? "No posts on the live site yet: they appear here once released." : `${site}social/index.json answered ${idx.status}`;
  // admin-beta: the release decides, so show its settings, and list the beta posts that are not released yet
  if (liveSet && liveSet.ok) { try { const j = JSON.parse(liveSet.text); out.settings = { ...DEF, ...out.indexSettings, ...(j.set ? j : {}), set: !!j.set }; } catch (e) { /* keep defaults */ } }
  else if (beta) out.settings = { ...DEF, ...(out.indexSettings || {}), set: false };
  if (idxHere && idxHere.ok) { try { const have = new Set(out.posts.map((p) => p.slug)); out.waiting = postsOf(idxHere).posts.filter((p) => !have.has(p.slug)).map((p) => ({ ...p, base: here })); } catch (e) { /* beta index broken: the checks catch it */ } }
  if (lg.ok) { try { out.log = JSON.parse(lg.text); } catch (e) { out.logError = "the log is not valid JSON"; } }
  else out.logError = lg.status === 404 ? "none yet" : `log answered ${lg.status}`;
  out.workflow.installed = wf.ok ? true : wf.status === 404 ? false : null;
  out.workflow.page = `https://github.com/${repo}/actions/workflows/instagram.yml`;
  out.workflow.secrets = `https://github.com/${repo}/settings/secrets/actions`;
  const t = tpl.ok ? tpl : tplBeta && tplBeta.ok ? tplBeta : null;
  if (t) out.workflow.add = `https://github.com/${repo}/new/${wfBranch}?filename=${encodeURIComponent(".github/workflows/instagram.yml")}&value=${encodeURIComponent(t.text)}`;
  out.workflow.edit = `https://github.com/${repo}/edit/${wfBranch}/.github/workflows/instagram.yml`;
  out.workflow.betaFile = `https://github.com/${repo}/blob/beta/.github/workflows/instagram.yml`;
  out.workflow.template = `https://github.com/${repo}/blob/${wfBranch}/tools/instagram/instagram.yml`;
  return json(out);
}
export async function onRequestPut({ request, env }) {
  const me = await readSession(env, request); if (!me) return json({ error: "sign in required" }, 401);
  if (isBetaSite(env, request)) return json({ error: "release only", message: `Instagram posts go out from the release, so its settings are changed in ${liveAdmin(env).replace(/^https?:\/\//, "")}.` }, 409);
  if (!env.SITE) return json({ error: "not configured", message: "The SITE storage (KV) isn't connected to this admin." }, 503);
  const b = await request.json().catch(() => ({})), prev = await readSettings(env), what = [];
  const v = { auto: prev.auto, maxPerDay: prev.maxPerDay, gapMinutes: prev.gapMinutes, hold: [...prev.hold], now: [...prev.now] };
  if (typeof b.auto === "boolean" && b.auto !== v.auto) { v.auto = b.auto; what.push("automatic posting " + (b.auto ? "on" : "off")); }
  if (b.maxPerDay != null) { const n = Math.round(+b.maxPerDay); if (!(n >= 1 && n <= 25)) return json({ error: "maxPerDay", message: "Posts a day: 1 to 25." }, 400); if (n !== v.maxPerDay) { v.maxPerDay = n; what.push(`${n} post(s) a day`); } }
  if (b.gapMinutes != null) { const n = Math.round(+b.gapMinutes); if (!(n >= 0 && n <= 1440)) return json({ error: "gapMinutes", message: "Time between posts: 0 to 1440 minutes." }, 400); if (n !== v.gapMinutes) { v.gapMinutes = n; what.push(`${n} min between posts`); } }
  for (const [key, label] of [["hold", "on hold"], ["now", "post next run"]]) {
    for (const [slug, on] of Object.entries(b[key] && typeof b[key] === "object" ? b[key] : {})) {
      if (!SLUG.test(slug)) return json({ error: "slug", message: `"${slug}" isn't a post id.` }, 400);
      const has = v[key].includes(slug);
      if (on && !has) { v[key].push(slug); what.push(`${slug}: ${label}`); }
      if (!on && has) { v[key] = v[key].filter((x) => x !== slug); what.push(`${slug}: not ${label}`); }
    }
    v[key] = v[key].slice(-200);
  }
  const nv = { ...v, at: Date.now(), by: me.email };
  await env.SITE.put("ig", JSON.stringify(nv));
  await addLog(env, me.email, "📸 Instagram: " + (what.join(" · ") || "saved, no changes"));
  return json({ ok: true, settings: { ...nv, set: true } });
}
