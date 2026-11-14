// LandLord introduction page: on beta.xrainier.com, links to the game open the beta game.
(() => {
  'use strict';
  if (/(^|[.-])beta([.-]|$)/.test(location.hostname)) {
    document.querySelectorAll('a[href^="https://landlord.xrainier.com"]').forEach((a) => {
      a.href = a.getAttribute('href').replace('https://landlord.', 'https://beta.landlord.');
    });
  }
})();
