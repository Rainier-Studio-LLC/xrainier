// On the beta portal (beta.xrainier.com), every link to a product site opens that product's beta:
// https://<product>.xrainier.com/... → https://beta.<product>.xrainier.com/...  (live xrainier.com is unchanged).
(() => {
  'use strict';
  if (!/^beta\./.test(location.hostname)) return;
  const SKIP = /^(www|beta|admin|admin-beta|api|api-beta)\./;
  const fix = (a) => {
    let u; try { u = new URL(a.href); } catch { return; }
    if (u.protocol !== 'https:' || !/\.xrainier\.com$/.test(u.hostname) || u.hostname.split('.').length !== 3 || SKIP.test(u.hostname)) return;
    u.hostname = 'beta.' + u.hostname; a.href = u.toString();
  };
  const run = () => document.querySelectorAll('a[href^="https://"]').forEach(fix);
  run();
  // menus or cards added later by other scripts
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches?.('a[href^="https://"]')) fix(n); n.querySelectorAll?.('a[href^="https://"]').forEach(fix); } })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
