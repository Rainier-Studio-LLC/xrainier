# XRainier admin (admin.xrainier.com)

Owner-only admin for the XRainier site. Its own Cloudflare Pages project (**xrainier-admin**):
root directory `admin`, output `public`, server code in `functions/` (helpers in `lib/`).

- `main` → admin.xrainier.com (controls xrainier.com) · `beta` → admin-beta.xrainier.com (controls beta.xrainier.com)
- Sign-in: Google, only emails in `ADMIN_EMAILS`. Settings live in Cloudflare (this repo is public, no secrets here):
  `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `SESSION_SECRET` (secret) and the KV binding `SITE` (separate namespaces for Production and Preview).
- Website tab: which products the home page shows, and their order. The home page reads `GET /api/products`.
