// Kavodly introduction page: on beta.xrainier.com, links to the app open the beta app; tap the Hebrew word for its meaning.
(() => {
  'use strict';
  // On beta.xrainier.com, links to the app open the Kavodly beta app (kavodly-beta.xrainier.com). The site's general
  // beta-link script turns app links into beta.<app>.xrainier.com, which Kavodly doesn't use, so fix any form after it runs.
  if (/(^|[.-])beta([.-]|$)/.test(location.hostname)) {
    const fix = () => document.querySelectorAll('a[href*="kavodly"]').forEach((a) => {
      const h = a.getAttribute('href');
      const n = h.replace(/^https:\/\/(?:beta\.)?kavodly(?:-beta)?\.xrainier\.com/, 'https://kavodly-beta.xrainier.com');
      if (n !== h) a.setAttribute('href', n);
    });
    fix(); addEventListener('load', fix); setTimeout(fix, 600); setTimeout(fix, 2000);
  }
  const he = document.querySelector('.kv-he'), tip = document.getElementById('kvMeaning');
  if (he && tip) {
    he.addEventListener('click', (e) => { e.stopPropagation(); tip.classList.toggle('on'); });
    document.addEventListener('click', () => tip.classList.remove('on'));
  }
  // Gentle reveal as sections scroll into view.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.kv-card, .kv-tile, .kv-note, .kv-plan, .kv-langs li').forEach((el) => { el.classList.add('kv-rise'); io.observe(el); });
  }
})();
