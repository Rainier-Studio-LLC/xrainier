// Derekly introduction page (xrainier.com/derekly.html).
// On beta.xrainier.com, app links open the Derekly beta (derekly-beta.xrainier.com). The site's general beta-link
// script turns app links into beta.<app>.xrainier.com, which Derekly doesn't use, so fix them after it runs.
(() => {
  'use strict';
  if (/(^|[.-])beta([.-]|$)/.test(location.hostname)) {
    const fix = () => document.querySelectorAll('a[href*="derekly"]').forEach((a) => {
      const h = a.getAttribute('href') || '';
      const n = h.replace(/^https:\/\/(?:beta\.)?derekly(?:-beta)?\.xrainier\.com/i, 'https://derekly-beta.xrainier.com');
      if (n !== h) a.setAttribute('href', n);
    });
    fix(); addEventListener('DOMContentLoaded', fix); addEventListener('load', fix);
    let n = 0; const t = setInterval(() => { fix(); if (++n > 10) clearInterval(t); }, 300);
  }
  // Gentle reveal as sections scroll into view.
  if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    const els = document.querySelectorAll('.dk-card, .dk-split > *, .dk-stats > div, .dk-grid3 > div, .dk-final');
    els.forEach((e) => e.classList.add('dk-rv'));
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
  }
})();
