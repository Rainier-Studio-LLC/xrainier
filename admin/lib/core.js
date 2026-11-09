// XRainier admin — shared server helpers (Cloudflare Pages Functions). No secrets here: this repo is public.
// Settings on the Pages project (Settings → Variables and Secrets):
//   GOOGLE_CLIENT_ID  Google sign-in client (same one as SkyAbove)      ADMIN_EMAILS  who may sign in, comma-separated
//   SESSION_SECRET    random text (secret) that signs admin sessions     Binding SITE  KV namespace for site settings
//   (Production = xrainier.com settings, Preview = beta.xrainier.com settings: give each its own KV namespace.)
const te = new TextEncoder();
export const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const unb64u = (s) => Uint8Array.from(atob(String(s).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(s).length + 3) % 4)), (c) => c.charCodeAt(0));
export const json = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra } });
export const admins = (env) => String(env.ADMIN_EMAILS || "").toLowerCase().split(/[,\s]+/).filter(Boolean);

// ---- Google ID token check (RS256 against Google's published keys)
let jwks = null;
async function googleKeys() {
  if (jwks && jwks.exp > Date.now()) return jwks.keys;
  const r = await fetch("https://www.googleapis.com/oauth2/v3/certs"); if (!r.ok) throw Error("can't reach Google");
  jwks = { keys: (await r.json()).keys || [], exp: Date.now() + 3600000 }; return jwks.keys;
}
export async function verifyGoogle(tok, clientId) {
  const p = String(tok || "").split("."); if (p.length !== 3) throw Error("bad token");
  const head = JSON.parse(new TextDecoder().decode(unb64u(p[0]))), c = JSON.parse(new TextDecoder().decode(unb64u(p[1])));
  if (head.alg !== "RS256") throw Error("bad alg");
  const jwk = (await googleKeys()).find((k) => k.kid === head.kid); if (!jwk) throw Error("unknown key");
  const key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, unb64u(p[2]), te.encode(p[0] + "." + p[1])))) throw Error("bad signature");
  if (!["accounts.google.com", "https://accounts.google.com"].includes(c.iss)) throw Error("bad issuer");
  if ((Array.isArray(c.aud) ? c.aud : [c.aud]).indexOf(clientId) < 0) throw Error("bad audience");
  if (!(c.exp * 1000 > Date.now() - 60000)) throw Error("expired");
  if (!c.email || c.email_verified === false || c.email_verified === "false") throw Error("email not verified");
  return c;
}

// ---- admin session: "XA1.<payload>.<HMAC>", 8 hours
const hmacKey = (env) => crypto.subtle.importKey("raw", te.encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
export async function makeSession(env, email) {
  const body = b64u(te.encode(JSON.stringify({ e: email, x: Date.now() + 8 * 3600000 })));
  return "XA1." + body + "." + b64u(await crypto.subtle.sign("HMAC", await hmacKey(env), te.encode(body)));
}
export async function readSession(env, req) {
  const m = /^Bearer\s+XA1\.([\w-]+)\.([\w-]+)$/.exec(req.headers.get("Authorization") || ""); if (!m || !env.SESSION_SECRET) return null;
  if (!(await crypto.subtle.verify("HMAC", await hmacKey(env), unb64u(m[2]), te.encode(m[1])))) return null;
  const s = JSON.parse(new TextDecoder().decode(unb64u(m[1])));
  return s.x > Date.now() && admins(env).includes(String(s.e).toLowerCase()) ? { email: s.e } : null;   // removing an email from ADMIN_EMAILS ends its sessions
}
export const setupProblems = (env) => ["GOOGLE_CLIENT_ID", "ADMIN_EMAILS", "SESSION_SECRET"].filter((k) => !env[k]).concat(env.SITE ? [] : ["SITE (KV binding)"]);

// ---- products on the home page
export const PRODUCTS_DEFAULT = [{ id: "skyabove", name: "SkyAbove", show: true }, { id: "tankwar", name: "TankWar", show: true }];
export async function readProducts(env) {
  const v = env.SITE ? await env.SITE.get("products", "json").catch(() => null) : null;
  return v && Array.isArray(v.products) ? v : { products: PRODUCTS_DEFAULT, at: null, by: null };
}
