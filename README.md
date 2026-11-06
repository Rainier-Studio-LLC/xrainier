# XRainier Portal

Static website for **xrainier.com**: the XRainier home page and one page per product (SkyAbove first).
No build step: plain HTML, CSS and JavaScript.

## Pages
- `index.html`: home (products, lab, about, contact)
- `skyabove.html`: SkyAbove introduction, features, pricing and gallery
- `404.html`: not found

## Add a product
1. Copy `skyabove.html` to `<product>.html` and change the text, icon and screenshots.
2. On `index.html`, replace one of the "In the lab" cards with a card for the product.
3. Add the page to `sitemap.xml`.

## Screenshots
`assets/shots/` holds the SkyAbove screenshots (names in `assets/shots/README.md`). Missing ones show a placeholder.
To capture them automatically (Node 18+):
```bash
cd tools
npm install
npx playwright install --with-deps chromium
node capture.mjs            # SKYLINK=<id> node capture.mjs to include a Sky Link page
```

## Deploy (Cloudflare Pages)
Workers & Pages → Create → Pages → Connect to Git → `evanlwj/xrainier`
- Framework preset: None · Build command: empty · Build output directory: `/`
- Custom domains: `xrainier.com` and `www.xrainier.com`

Mail for xrainier.com keeps working: the website only adds web records; the MX record stays with Microsoft 365.
