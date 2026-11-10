// Products shown on the XRainier home page.
//   GET /api/products   public (the home page reads it; cached 60 s)   → {products:[{id, name, show}], at}
//   PUT /api/products   owner only, {products:[{id, name, show}]} in display order
// New products are added automatically: a product card on the home page (data-product="id") whose id has never been in
// the list is appended (shown) and saved. The admin view checks the home page every time; public reads check it in the
// background at most every 10 minutes. A product the owner removed is never added back by itself.
import { json, readSession, readProducts, syncProducts, knownIds, PRODUCTS_DEFAULT } from "../../lib/core.js";
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
    const { v, found, added } = await syncProducts(env, request), ids = new Set(v.products.map((p) => p.id));
    return json({ ...v, defaults: PRODUCTS_DEFAULT, found, added: added.map((p) => p.id), removed: knownIds(v).filter((id) => !ids.has(id)) });
  }
  const v = await readProducts(env);
  if (env.SITE && (await due(request))) { const s = syncProducts(env, request).catch(() => {}); if (waitUntil) waitUntil(s); else await s; }
  return json({ products: v.products.map(({ id, name, show }) => ({ id, name, show: !!show })), at: v.at || null }, 200, { ...CORS, "Cache-Control": "public, max-age=60" });
}
export const onRequestOptions = () => new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "GET", "Access-Control-Max-Age": "86400" } });
export async function onRequestPut({ request, env }) {
  const me = await readSession(env, request); if (!me) return json({ error: "sign in required" }, 401);
  if (!env.SITE) return json({ error: "not configured", message: "The SITE storage (KV) isn't connected to this admin." }, 503);
  const b = await request.json().catch(() => ({})), seen = new Set(), list = [];
  for (const p of Array.isArray(b.products) ? b.products.slice(0, 30) : []) {
    const id = String((p && p.id) || "").toLowerCase().trim(), name = String((p && p.name) || "").trim().slice(0, 40);
    if (!/^[a-z0-9][a-z0-9-]{0,29}$/.test(id) || seen.has(id)) return json({ error: "id", message: `"${id || "(empty)"}" isn't a valid product id: use a-z, 0-9 and -, each once.` }, 400);
    seen.add(id); list.push({ id, name: name || id, show: !!p.show });
  }
  if (!list.length) return json({ error: "empty", message: "Keep at least one product in the list." }, 400);
  const prev = await readProducts(env), v = { products: list, known: [...new Set([...knownIds(prev), ...list.map((p) => p.id)])], at: Date.now(), by: me.email };
  await env.SITE.put("products", JSON.stringify(v));
  const log = (await env.SITE.get("log", "json").catch(() => null)) || [];
  log.unshift({ t: v.at, by: me.email, what: list.map((p) => p.name + (p.show ? "" : " (hidden)")).join(", ") });
  await env.SITE.put("log", JSON.stringify(log.slice(0, 50)));
  return json({ ok: true, ...v });
}
