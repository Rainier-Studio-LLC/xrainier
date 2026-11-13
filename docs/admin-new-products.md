# XRainier admin: say why new products aren't picked up

The admin adds new products by reading the home page it controls (admin → xrainier.com, admin-beta → beta.xrainier.com).
If that read failed, it failed silently, so new product cards never showed up. Now:
* it tries both xrainier.com and www.xrainier.com (the bare domain redirects), with a browser-like User-Agent;
* a page with no product cards (e.g. a Cloudflare challenge page) counts as a failed read;
* the Website tab shows the reason in an amber note above the list, e.g. "https://xrainier.com/ answered HTTP 403".
