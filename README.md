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

### Products shown on the site
The admin decides which products appear and in what order. `web/assets/js/site.js` reads the list from
`admin.xrainier.com/api/products` (beta pages read `admin-beta`) and hides the cards, menu and footer links of hidden products.
If the list can't be loaded, everything shows. Mark new product links with `data-product="<id>"` where needed.

### Add a product
1. Copy `web/skyabove.html` to `web/<product>.html` and change the text, icon and screenshots.
2. On `web/index.html`, add a card for it (`data-product="<id>"`) in the products grid.
3. Add the page to `web/sitemap.xml`, then add the product in the admin.

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
