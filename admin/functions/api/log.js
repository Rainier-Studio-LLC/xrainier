// GET /api/log → recent changes (owner only)
import { json, readSession } from "../../lib/core.js";
export async function onRequestGet({ request, env }) {
  if (!(await readSession(env, request))) return json({ error: "sign in required" }, 401);
  return json({ log: env.SITE ? (await env.SITE.get("log", "json").catch(() => null)) || [] : [] });
}
