// On the beta site (beta.xrainier.com, preview hosts, local dev) send BlockRush links to the beta game.
(function () {
  var h = location.hostname;
  var beta = h.indexOf('beta.') === 0 || /\.workers\.dev$/.test(h) || /\.pages\.dev$/.test(h) || h === 'localhost' || h === '127.0.0.1';
  if (!beta) return;
  function fix() {
    var links = document.querySelectorAll('a[href*="//blockrush.xrainier.com"]');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('href', links[i].getAttribute('href').replace('//blockrush.xrainier.com', '//beta.blockrush.xrainier.com'));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fix);
  else fix();
})();
