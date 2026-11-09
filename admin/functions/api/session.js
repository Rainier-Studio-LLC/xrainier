// POST /api/session {idToken} → {token, email}: Google sign-in, owner emails only (ADMIN_EMAILS)
import { json, admins, verifyGoogle, makeSession, setupProblems } from "../../lib/core.js";
export async function onRequestPost({ request, env }) {
  const miss = setupProblems(env); if (miss.length) return json({ error: "not configured", message: "This admin isn't set up yet: " + miss.join(", ") + "." }, 503);
  const b = await request.json().catch(() => ({}));
  let c; try { c = await verifyGoogle(b.idToken, env.GOOGLE_CLIENT_ID); } catch (e) { return json({ error: "sign-in failed", message: "Google sign-in couldn't be checked (" + e.message + ")." }, 401); }
  if (!admins(env).includes(String(c.email).toLowerCase())) return json({ error: "not allowed", message: c.email + " can't use the XRainier admin." }, 403);
  return json({ token: await makeSession(env, c.email), email: c.email });
}
