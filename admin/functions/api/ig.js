// 📸 Instagram tab of the XRainier admin.
// Publishing runs in GitHub Actions (.github/workflows/instagram.yml, template tools/instagram/instagram.yml) with the
// repo secrets IG_USER_ID and IG_ACCESS_TOKEN; this admin never sees the token. It shows the posts (web/social/index.json
// on the site), the log the workflow keeps on the social-log branch (instagram/log.json), and stores the owner's
// settings in KV (key "ig"), which the workflow reads before each run:
//   GET /api/ig?settings=1   public, no secrets: {set, auto, maxPerDay, gapMinutes, hold:[slug], now:[slug], at}
//   GET /api/ig              owner: settings + posts + log + set-up state
//   PUT /api/ig              owner: {auto?, maxPerDay?, gapMinutes?, hold?:{slug:bool}, now?:{slug:bool}}
// Optional Pages settings: GITHUB_REPO (default Rainier-Studio-LLC/xrainier), IG_LOG_BRANCH (default social-log),
// IG_WORKFLOW_BRANCH (default beta on admin-beta, main on admin).
import { json, readSession, siteUrl, isBetaSite, addLog } from "../../lib/core.js";
const SLUG = /^[a-z0-9][a-z0-9-]{1,59}$/;
const repoOf = (env) => env.GITHUB_REPO || "Rainier-Studio-LLC/xrainier";
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
  const repo = repoOf(env), beta = isBetaSite(env, request), site = siteUrl(env, request).replace(/\/?$/, "/");
  const wfBranch = env.IG_WORKFLOW_BRANCH || (beta ? "beta" : "main"), logBranch = env.IG_LOG_BRANCH || "social-log";
  const raw = (branch, path) => `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
  const out = { settings: s, site, beta, repo, branch: wfBranch, posts: [], indexError: null, log: null, logError: null, workflow: { installed: null } };
  const [idx, lg, wf, tpl] = await Promise.all([
    getText(site + "social/index.json").catch((e) => ({ ok: false, status: e.message })),
    getText(raw(logBranch, "instagram/log.json")).catch((e) => ({ ok: false, status: e.message })),
    getText(raw(wfBranch, ".github/workflows/instagram.yml")).catch((e) => ({ ok: false, status: e.message })),
    getText(raw(wfBranch, "tools/instagram/instagram.yml")).catch((e) => ({ ok: false, status: e.message })),
  ]);
  if (idx.ok) { try { const j = JSON.parse(idx.text); out.posts = (Array.isArray(j.posts) ? j.posts : []).map((p) => ({ ...p, base: site })); out.indexSettings = j.settings || null; } catch (e) { out.indexError = "web/social/index.json is not valid JSON"; } }
  else out.indexError = `${site}social/index.json answered ${idx.status}`;
  if (lg.ok) { try { out.log = JSON.parse(lg.text); } catch (e) { out.logError = "the log is not valid JSON"; } }
  else out.logError = lg.status === 404 ? "none yet" : `log answered ${lg.status}`;
  out.workflow.installed = wf.ok ? true : wf.status === 404 ? false : null;
  out.workflow.page = `https://github.com/${repo}/actions/workflows/instagram.yml`;
  out.workflow.secrets = `https://github.com/${repo}/settings/secrets/actions`;
  if (tpl.ok) out.workflow.add = `https://github.com/${repo}/new/${wfBranch}?filename=${encodeURIComponent(".github/workflows/instagram.yml")}&value=${encodeURIComponent(tpl.text)}`;
  out.workflow.template = `https://github.com/${repo}/blob/${wfBranch}/tools/instagram/instagram.yml`;
  return json(out);
}
export async function onRequestPut({ request, env }) {
  const me = await readSession(env, request); if (!me) return json({ error: "sign in required" }, 401);
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
