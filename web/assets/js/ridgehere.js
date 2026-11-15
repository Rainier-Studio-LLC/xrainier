// RidgeHere introduction page: on beta.xrainier.com, links to the app open the beta app.
(() => {
  'use strict';
  if (/(^|[.-])beta([.-]|$)/.test(location.hostname)) {
    document.querySelectorAll('a[href^="https://ridgehere.xrainier.com"]').forEach((a) => {
      a.href = a.getAttribute('href').replace('https://ridgehere.', 'https://beta.ridgehere.');
    });
  }
})();
