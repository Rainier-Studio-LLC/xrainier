// Products on the XRainier site and their status (Live / Coming soon / Off).
//   GET /api/products   public (site.js reads it; cached 60 s) → {products:[{id, name, status, show}], unlisted, at}
//                       signed in: the full list plus what the home page has, incoming products and the "new products start as" setting
//   PUT /api/products   owner only, {products:[{id, name, status, incoming?}], newStatus?} in display order
// New products are found automatically: a product on the home page (data-product="id") whose id has never been in the list
// is added with the "new products start as" status (default Off on xrainier.com, Live on beta) and flagged incoming.
// The admin view checks the home page every time; public reads check it in the background at most every 10 minutes.
import { json, readSession, readProducts, syncProducts, knownIds, publicView, newStatusOf, isBetaSite, siteUrl, addLog, STATUSES, LABEL, PRODUCTS_DEFAULT } from "../../lib/core.js";
const CORS = { "Access-Control-Allow-Origin": "*" }, EVERY = 600000;
let lastSync = 0;   // per isolate; the Cache API marker below covers the rest of the edge
async function due(request) {
  if (Date.now() - lastSync < EVERY) return false;
  lastSync = Date.now();
  try {
    const c = typeof caches !== "undefined" && caches.default, key = new Request(new URL("/api/products?sync-marker", request.url));
    if (c) { if (await c.match(key)) return false; await c.put(key, new Response("1", { headers: { "Cache-Control": "max-age=600" } })); }
  } catch (e) {}
  return true;
}
export async function onRequestGet({ request, env, waitUntil }) {
  const me = await readSession(env, request);
  if (me) {   // admin view: who saved it and when, what the home page has, which ids were removed on purpose
    const { v, found, added, error } = await syncProducts(env, request), ids = new Set(v.products.map((p) => p.id));
    return json({ ...v, defaults: PRODUCTS_DEFAULT, found, siteError: error || null, added: added.map((p) => p.id), removed: knownIds(v).filter((id) => !ids.has(id)),
      newStatus: newStatusOf(v, env, request), newStatusSet: STATUSES.includes(v.newStatus), beta: isBetaSite(env, request), site: siteUrl(env, request) });
  }
  const v = await readProducts(env, request);
  if (env.SITE && (await due(request))) { const s = syncProducts(env, request).catch(() => {}); if (waitUntil) waitUntil(s); else await s; }
  return json(publicView(v, env, request), 200, { ...CORS, "Cache-Control": "public, max-age=60" });
}
export const onRequestOptions = () => new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "GET", "Access-Control-Max-Age": "86400" } });
export async function onRequestPut({ request, env }) {
  const me = await readSession(env, request); if (!me) return json({ error: "sign in required" }, 401);
  if (!env.SITE) return json({ error: "not configured", message: "The SITE storage (KV) isn't connected to this admin." }, 503);
  const b = await request.json().catch(() => ({})), seen = new Set(), list = [];
  for (const p of Array.isArray(b.products) ? b.products.slice(0, 30) : []) {
    const id = String((p && p.id) || "").toLowerCase().trim(), name = String((p && p.name) || "").trim().slice(0, 40);
    if (!/^[a-z0-9][a-z0-9-]{0,29}$/.test(id) || seen.has(id)) return json({ error: "id", message: `"${id || "(empty)"}" isn't a valid product id: use a-z, 0-9 and -, each once.` }, 400);
    const status = STATUSES.includes(p.status) ? p.status : p.show === false ? "off" : p.show === true ? "live" : null;
    if (!status) return json({ error: "status", message: `Pick Live, Coming soon or Off for "${name || id}".` }, 400);
    seen.add(id); list.push({ id, name: name || id, status, ...(p.auto ? { auto: +p.auto || Date.now() } : {}), ...(p.incoming ? { incoming: +p.incoming || Date.now() } : {}) });
  }
  if (!list.length) return json({ error: "empty", message: "Keep at least one product in the list." }, 400);
  if (b.newStatus != null && !STATUSES.includes(b.newStatus)) return json({ error: "newStatus", message: "New products start as Live, Coming soon or Off." }, 400);
  const prev = await readProducts(env, request), newStatus = b.newStatus != null ? b.newStatus : prev.newStatus;
  const v = { v2: true, products: list, known: [...new Set([...knownIds(prev), ...list.map((p) => p.id)])], ...(STATUSES.includes(newStatus) ? { newStatus } : {}), at: Date.now(), by: me.email };
  await env.SITE.put("products", JSON.stringify(v));
  // Activity: say what changed, not the whole list
  const before = new Map(prev.products.map((p) => [p.id, p])), what = [];
  for (const p of list) { const o = before.get(p.id); if (!o) what.push(`${p.name} added (${LABEL[p.status]})`); else if (o.status !== p.status) what.push(`${p.name}: ${LABEL[o.status]} → ${LABEL[p.status]}`); }
  for (const o of prev.products) if (!seen.has(o.id)) what.push(`${o.name} removed`);
  if (prev.products.filter((p) => seen.has(p.id)).map((p) => p.id).join() !== list.filter((p) => before.has(p.id)).map((p) => p.id).join()) what.push("order: " + list.map((p) => p.name).join(", "));
  if (newStatus !== prev.newStatus && STATUSES.includes(newStatus)) what.push(`new products start as ${LABEL[newStatus]}`);
  await addLog(env, me.email, what.join(" · ") || "saved, no changes");
  return json({ ok: true, ...v });
}
