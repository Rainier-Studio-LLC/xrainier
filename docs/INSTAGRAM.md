# 📸 Instagram posts for XRainier

XRainier posts pictures, carousels and Reels to Instagram by itself, the same way Glowvite does, and logs every post in
the admin (**admin.xrainier.com / admin-beta.xrainier.com → 📸 Instagram**).

| Piece | Where | What it does |
|---|---|---|
| Posts | `web/social/index.json` + files in `web/social/<folder>/` | What to post: kind, files, caption |
| Publisher | `tools/instagram/publish.mjs` (+ `ig-api.mjs`) | Publishes what is due through Meta's Instagram API |
| Workflow | `.github/workflows/instagram.yml` (template `tools/instagram/instagram.yml`) | Runs the publisher with the repo secrets |
| Log | branch `social-log`, file `instagram/log.json` | Account, every post (permalink, when, how), history |
| Admin | `admin/functions/api/ig.js`, `admin/public/ig.js` | Shows posts and log; Auto on/off, posts a day, Hold, Post next run |

The token stays in GitHub: the admin never sees it, and nothing secret is written to the log.

## Set-up (once)

1. **Secrets** (done): `IG_USER_ID` and `IG_ACCESS_TOKEN` in GitHub → Rainier-Studio-LLC/xrainier → Settings → Secrets
   and variables → Actions. Optional `IG_API_HOST` (e.g. `graph.facebook.com`) to override the host picked from the token
   (`IGAA…` → graph.instagram.com, `EAA…` → graph.facebook.com).
2. **Workflow**: the autopilot cannot write `.github/workflows`, so add it once by hand. Easiest: admin → 📸 Instagram →
   **Add the workflow on GitHub** (the file is pre-filled) → **Commit changes**. Or copy `tools/instagram/instagram.yml`
   to `.github/workflows/instagram.yml` on **beta**. The commit itself starts the first run.
3. The first run creates the `social-log` branch. The admin tab then says *Connected as @…*.

## When posts go out

The workflow runs when `web/social/**` changes on beta or main, every 2 hours (GitHub runs schedules only on the default
branch, so after the first release to main), and from **Actions → Instagram → Run workflow** (optional: slugs to post now,
or a dry run). Each run:

1. reads the admin's settings (`GET /api/ig?settings=1`; until you change anything there, `settings` in index.json apply):
   **Auto** (post new ones by themselves), **posts a day** (default 3), **minutes between posts** (default 0), **Hold**,
   **Post next run**;
2. waits until the site serves the files (the push may still be deploying, up to 10 minutes);
3. publishes each due post: a container per picture / video, waits until Instagram has processed it (Reels take a minute),
   `media_publish`, then saves the permalink to the log at once. A slug that is in the log as published is never posted
   again, from either branch. A post that fails 3 times waits for **Post next run**.

Media addresses use the branch's own site: beta → `https://beta.xrainier.com/social/…`, main → `https://www.xrainier.com/social/…`.

## Adding a post

1. Put the files in `web/social/<folder>/`:
   - pictures: **JPEG**, 1080 × 1350 (4:5) or 1080 × 1080; carousels 2–10, all the same shape;
   - Reels: **MP4** H.264 + AAC, 1080 × 1920, 3–90 s, `-movflags +faststart`, under ~15 MB (the site serves up to 25 MB),
     plus a 1080 × 1920 JPEG cover.
2. Add an entry to `posts` in `web/social/index.json`:
   ```json
   { "slug": "my-post", "title": "What it is", "kind": "carousel", "added": "2026-12-01",
     "media": [{ "path": "social/my-post/1.jpg", "type": "image" }, { "path": "social/my-post/2.jpg", "type": "image" }],
     "caption": "… #XRainier" }
   ```
   `kind`: `image`, `carousel` or `reel` (`"cover": "social/…/cover.jpg"` for a Reel). Optional `"notBefore":
   "2026-12-05T17:00:00Z"` holds an automatic post until then.
3. `node tools/instagram/check.mjs web` must say OK. Push to beta: with Auto on, the next run posts it.

Limits: caption 2,200 characters and 30 hashtags; 50 API posts per account in 24 hours (shown in the admin).

## Tokens

Instagram-login tokens (`IGAA…`) last about 60 days. The log records when a token was first used here; after 50 days the
admin shows a warning: make a new long-lived token and update the `IG_ACCESS_TOKEN` secret. A Page token made from a
long-lived Facebook user token (`EAA…`, with `IG_USER_ID`) does not expire.

## The first posts (2026-11-24)

`xrainier-lineup-carousel` (5 slides: cover, PrismWell 3D, Glowvite, SkyHere, try them) and `xrainier-lineup-reel`
(25 s, 1080 × 1920, original music made for XRainier, no licensed audio). The Reel shows a few seconds of the Glowvite
envelope demo; the SkyHere scene is an illustration with the radar overlay.

Tests: `node --test tools/instagram/ig.test.mjs` (Instagram mocked, no network).
