#!/usr/bin/env bash
# Takes real SkyHere screenshots for the xrainier.com product page and publishes them to the beta branch.
#   bash tools/shots.sh        (from the xrainier repo, on a PC with internet; uses tools/capture.mjs)
# Optional: SKYLINK=<sky link id> for the Sky Link picture, SITE=https://beta.skyabove.xrainier.com to shoot beta instead of live.
set -euo pipefail
REPO=${REPO:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}
[ -f "$REPO/tools/capture.mjs" ] || { echo "tools/capture.mjs not found in $REPO"; exit 1; }
echo "xrainier repo: $REPO"
cd "$REPO"
git fetch -q origin
git checkout -q beta
git pull -q --ff-only origin beta

# replays are Pro: the tool signs in with your SkyHere token (it stays on this PC)
if [ -z "${TOKEN:-}" ]; then
  echo
  echo "For the 2D/3D replay pictures, paste your SkyHere token (Enter to skip)."
  echo "  Get it: open skyabove.xrainier.com signed in with Pro, F12, Application, Local storage, skyabove.token (copy the value)"
  echo "  Or in Console: copy(localStorage.getItem('skyabove.token'))   (type allow pasting first if Edge blocks paste)"
  read -r -s -p "Token: " TOKEN; echo
fi
export TOKEN

cd tools
if [ ! -d node_modules/playwright ]; then
  [ -f package.json ] || npm init -y >/dev/null
  npm install --no-audit --no-fund playwright
fi
npx playwright install chromium >/dev/null 2>&1 || npx playwright install --with-deps chromium
node capture.mjs
cd ..

ls -la web/assets/shots/
git add web/assets/shots
if git diff --cached --quiet; then echo "No new pictures to publish."; exit 0; fi
git commit -q -m "Product page: real SkyHere screenshots"
git push -q origin beta
echo
echo "Published to beta. Check https://beta.xrainier.com/skyabove (Ctrl+F5). They go live with the next xrainier release."
