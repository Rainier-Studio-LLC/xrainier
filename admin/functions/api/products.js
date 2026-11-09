// Products shown on the XRainier home page.
//   GET /api/products   public (the home page reads it; cached 60 s)   → {products:[{id, name, show}], at}
//   PUT /api/products   owner only, {products:[{id, name, show}]} in display order
import { json, readSession, readProducts, PRODUCTS_DEFAULT } from "../../lib/core.js";
const CORS = { "Access-Control-Allow-Origin": "*" };
export async function onRequestGet({ request, env }) {
  const v = await readProducts(env), me = await readSession(env, request);
  if (me) return json({ ...v, defaults: PRODUCTS_DEFAULT });   // admin view: who saved it and when
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
  const v = { products: list, at: Date.now(), by: me.email };
  await env.SITE.put("products", JSON.stringify(v));
  const log = (await env.SITE.get("log", "json").catch(() => null)) || [];
  log.unshift({ t: v.at, by: me.email, what: list.map((p) => p.name + (p.show ? "" : " (hidden)")).join(", ") });
  await env.SITE.put("log", JSON.stringify(log.slice(0, 50)));
  return json({ ok: true, ...v });
}
