# XRainier Portal

Website for **xrainier.com**: the XRainier home page and one page per product (SkyHere, TankWar), plus its own admin.
XRainier is the trade name of Rainier Studio LLC. No build step: plain HTML, CSS and JavaScript.

| Folder | What | Published as |
|---|---|---|
| `web/` | The website (everything in here is public) | xrainier.com · beta.xrainier.com |
| `admin/` | XRainier admin: which products show on the site | admin.xrainier.com · admin-beta.xrainier.com |
| `tools/` | Page checks and the screenshot tool | - |
| `docs/` | How things work | - |

## Website (`web/`)
- `index.html`: home (products, lab, about, contact)
- `skyabove.html`, `tankwar.html`: product pages
- `404.html`: not found
- `assets/`: styles, `js/site.js` (menu, screenshots, lightbox, promotions, product list), images, `shots/` (SkyHere screenshots)

### Products on the site: Live, Coming soon, Off
Every product has a status, set in the admin (Website tab), separately for each site:
admin.xrainier.com controls xrainier.com, admin-beta.xrainier.com controls beta.xrainier.com.

| Status | Home-page card | Top menu, header and footer links | Its own page |
|---|---|---|---|
| **Live** | shows | show | opens |
| **Coming soon** | shows with a COMING SOON tag, no link | hidden | opens |
| **Off** | hidden | hidden | opens, marked noindex |

A status change saves at once; the site follows within about a minute. `web/assets/js/site.js` reads the list from
`admin.xrainier.com/api/products` (beta pages read `admin-beta`), applies the last known list at once (no flicker) and then
the latest one. If the list can't be loaded at all, everything shows.

**Incoming products.** A product needs no code change in the admin. When a card with `data-product="<id>"` lands on the
home page and that id has never been in the list, the admin adds it by itself with the *New products start as* status and
shows it under **Incoming** until you pick Go live, Coming soon or Keep off. Defaults: **Off** on xrainier.com (nothing new
goes public until you click Go live) and **Live** on beta.xrainier.com (so you can check it there). The site applies the same
status to a card whose id the admin hasn't picked up yet, so a new card never flashes on the live site.
A product you remove is never added back by itself; use Off to just hide it.

### Add a product
1. Copy `web/skyabove.html` to `web/<product>.html` and change the text, icon and screenshots.
2. On `web/index.html`, add a card for it in the products grid and its menu and footer links, all with `data-product="<id>"`.
3. Add the page to `web/sitemap.xml`. Push to beta: it shows on beta.xrainier.com and waits in Incoming on the live admin.
4. After the release to main, open admin.xrainier.com → Incoming → **Go live** (or **Coming soon** to tease it first).

### Screenshots
`web/assets/shots/` holds the SkyHere screenshots; missing ones show a placeholder.
To retake them (a PC with internet, Node 18+): `bash tools/shots.sh`. It captures with `tools/capture.mjs`, then commits and pushes to beta.

## Admin (`admin/`)
Its own Cloudflare Pages project (`xrainier-admin`, root `admin`, output `public`) with Google sign-in for the owner only.
Settings and secrets live in Cloudflare, never here (this repo is public). See [admin/README.md](admin/README.md).

## Deploy (Cloudflare, builds straight from GitHub)
| Cloudflare | Branch | Deploy command | Address |
|---|---|---|---|
| Worker `xrainier` | `main` | `npx wrangler deploy` (`wrangler.jsonc`) | xrainier.com, www.xrainier.com |
| Worker `xrainier-beta` | `beta` | `npx wrangler deploy -c wrangler.beta.jsonc` | beta.xrainier.com |
| Pages `xrainier-admin` | `main` / `beta` preview | none (root `admin`) | admin.xrainier.com / admin-beta.xrainier.com |

Both site Workers publish only `web/` and show `404.html` for unknown addresses.
Work on `beta`, check beta.xrainier.com, then release beta → main (see [Releasing](docs/RELEASE.md)).

Check before pushing: `node --check web/assets/js/site.js && node tools/check-pages.mjs web`

Mail for xrainier.com keeps working: the website only adds web records; the MX record stays with Microsoft 365.

## Docs
- [Beta: SkyHere website, admin and www.xrainier.com](docs/BETA.md)
- [Releasing (beta → main)](docs/RELEASE.md)
