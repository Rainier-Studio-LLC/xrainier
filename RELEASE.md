# Releasing (beta → main)

- **beta** = where you work and test. The repo's **default branch** (main, or **master** in the skyabove repo) = live. Cloudflare deploys whatever is on each branch.
- **Checks** run by themselves on every push to beta or main and on pull requests (Actions tab → Checks).

## Release
1. GitHub → this repo → **Actions** → **Release (beta → live)** → **Run workflow**.
2. Type `RELEASE`, optionally add a note, and press **Run workflow**.
3. The checks run on beta. If they pass, main moves forward to the exact beta commit you tested, and the release is tagged (for example `v2026.11.06`). The run's summary lists every change that went out.
4. Cloudflare deploys main. Open the live site and press Ctrl+F5.

If it stops with "main has changes that beta doesn't", a fix was made straight on main. Bring it into beta, test, and release again:
`git checkout beta && git merge origin/main && git push`

## Order
Release the **proxy first**, then the website and admin (new pages may need new proxy features; old pages keep working with a newer proxy).

## Undo
Cloudflare → the project → **Deployments** → **Rollback** on the previous version (instant). Then fix on beta and release again.

## Notes
- If main has branch protection that blocks pushes, allow GitHub Actions to push to main (Settings → Branches → the rule → allow `github-actions[bot]`), or use a pull request instead.
- A release made by this workflow doesn't start other GitHub workflows (for example the iOS build). Start those by hand from the Actions tab when you need them.
