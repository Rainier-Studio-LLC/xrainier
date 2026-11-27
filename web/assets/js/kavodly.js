// Kavodly introduction page: on beta.xrainier.com, links to the app open the beta app; tap the Hebrew word for its meaning.
(() => {
  'use strict';
  if (/(^|[.-])beta([.-]|$)/.test(location.hostname)) {
    document.querySelectorAll('a[href^="https://kavodly.xrainier.com"]').forEach((a) => {
      a.href = a.getAttribute('href').replace('https://kavodly.', 'https://kavodly-beta.');
    });
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
