// DoodleHere introduction page: on beta.xrainier.com, links to the app open the beta app.
(() => {
  'use strict';
  if (/(^|[.-])beta([.-]|$)/.test(location.hostname)) {
    document.querySelectorAll('a[href^="https://doodlehere.xrainier.com"]').forEach((a) => {
      a.href = a.getAttribute('href').replace('https://doodlehere.', 'https://beta.doodlehere.');
    });
  }
})();
