# Beta: SkyHere website, admin and www.xrainier.com

| | Live (branch `main`) | Beta (branch `beta`) |
|---|---|---|
| SkyHere website | skyabove.xrainier.com | **beta.skyabove.xrainier.com** |
| Admin | admin.skyabove.xrainier.com | **beta-admin.skyabove.xrainier.com** |
| XRainier portal | www.xrainier.com | **beta.xrainier.com** |
| API (proxy) | api.skyabove.xrainier.com · Worker `skyabove-proxy` | **api-beta.skyabove.xrainier.com** · Worker `skyabove-proxy-beta` |
| Data | D1 `skyabove`, KV `LICENSES` | D1 `skyabove-beta`, its own KV |
| Payments | Stripe live keys | Stripe **test** keys |

The same code runs in both. A page opened at an address with "beta" in it (beta.*, beta-admin.*, or a `…beta….pages.dev` preview)
talks to the beta API, shows an amber **BETA** tag, puts [BETA] in the tab title, tells search engines not to index it, and links to the other beta sites.
The beta proxy (`ENV_NAME=beta`) accepts those beta addresses; the live proxy never does.

## One-time setup

### 1. Branches
In each repo (skyabove, skyabove-proxy, xrainier), from an up-to-date main:
```bash
git -C <repo> checkout main && git -C <repo> pull && git -C <repo> checkout -B beta && git -C <repo> push -u origin beta
```

### 2. Beta proxy (run in the skyabove-proxy folder)
```bash
npx wrangler d1 create skyabove-beta                     # copy the database_id it prints
npx wrangler kv namespace create skyabove-beta-licenses  # copy the id it prints
```
Paste both ids into `wrangler.beta.jsonc`, then deploy (this also adds the api-beta domain and the hourly cron):
```bash
npx wrangler deploy -c wrangler.beta.jsonc
```
Secrets for the beta proxy (each command asks for the value):
```bash
for s in SESSION_SECRET ADMIN_TOKEN ADMIN_EMAILS GOOGLE_CLIENT_ID STRIPE_SECRET_KEY STRIPE_PRICE_MONTH STRIPE_PRICE_YEAR STRIPE_WEBHOOK_SECRET STRIPE_API_VERSION TURNSTILE_SITE_KEY TURNSTILE_SECRET; do
  echo "== $s"; npx wrangler secret put $s -c wrangler.beta.jsonc
done
```
- **SESSION_SECRET, ADMIN_TOKEN:** new random values, not the live ones (`openssl rand -base64 48`).
- **GOOGLE_CLIENT_ID, ADMIN_EMAILS, TURNSTILE_\*:** same as live.
- **STRIPE_\*:** from Stripe **test mode**: test secret key (`sk_test_…`), test prices, and a test webhook (see step 5).
- Optional: `MS_TENANT_ID MS_CLIENT_ID MS_CLIENT_SECRET MAIL_SENDER` to send real sign-in emails from beta.
- Leave `RAPIDAPI_KEY` unset unless you need flight schedules on beta: it shares your AeroDataBox allowance with live.

Check: `curl -s https://api-beta.skyabove.xrainier.com/auth/config`

### 3. Beta sites in Cloudflare
Make a second project for each site, connected to the same repo, with **production branch `beta`**:
- **skyabove-beta** (Pages): repo `skyabove`, build command empty, output `web`, custom domain `beta.skyabove.xrainier.com`.
- **skyabove-admin-beta**: same kind as your live admin. As a Pages project: output `admin`. As a Worker: deploy command
  `npx wrangler deploy --assets=./admin --name=skyabove-admin-beta --compatibility-date=2026-11-04`. Custom domain `beta-admin.skyabove.xrainier.com`.
- **xrainier-beta** (Worker): repo `xrainier`, branch `beta`, deploy command `npx wrangler deploy -c wrangler.beta.jsonc` (publishes `web/`), custom domain `beta.xrainier.com`.

Set the production branch under Settings → Builds → Branch control. In the **live** projects, keep production = `main`
and set preview deployments to **None**, so beta pushes don't create extra previews there.

### 4. Sign-in
- Google Cloud Console → OAuth client → Authorized JavaScript origins: add `https://beta-admin.skyabove.xrainier.com` and `https://beta.skyabove.xrainier.com`.
- Cloudflare → Turnstile → your SkyHere widget → Hostnames: add `beta.skyabove.xrainier.com`.

### 5. Stripe (test mode)
Developers → Webhooks (test mode) → Add endpoint `https://api-beta.skyabove.xrainier.com/stripe/webhook` with the same events as live;
use its signing secret as the beta `STRIPE_WEBHOOK_SECRET`. Test card: 4242 4242 4242 4242.

### 6. Keep beta private (recommended)
Cloudflare Zero Trust → Access → Applications → Add → Self-hosted, domains `beta.skyabove.xrainier.com`, `beta-admin.skyabove.xrainier.com`,
`beta.xrainier.com`; policy: allow your email(s). Don't protect `api-beta`: the beta pages call it directly.

## Every day
Work and push on `beta` → test on the beta sites → **Actions → Release (beta → main)**. Release the proxy first.
Beta proxy changes: `npx wrangler deploy -c wrangler.beta.jsonc` from the beta branch.

The iPhone app is unchanged: TestFlight builds still use the live API (a later step can point TestFlight at beta).
