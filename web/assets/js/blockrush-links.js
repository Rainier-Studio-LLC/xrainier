// On the beta site (beta.xrainier.com, preview hosts, local dev) send BlockRush links to the beta game,
// so testers stay on beta. The live site keeps https://blockrush.xrainier.com links unchanged.
(function () {
  var h = location.hostname;
  if (!(/^beta\./.test(h) || /\.workers\.dev$/.test(h) || /\.pages\.dev$/.test(h) || h === 'localhost' || h === '127.0.0.1')) return;
  function fix() {
    var links = document.querySelectorAll('a[href*="//blockrush.xrainier.com"]');
    for (var i = 0; i < links.length; i++) {
      links[i].href = links[i].href.replace('//blockrush.xrainier.com', '//beta.blockrush.xrainier.com');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fix); else fix();
})();
