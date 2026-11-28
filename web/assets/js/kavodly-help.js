// Kavodly Help 101: open the question named in the link (#no-sound), keep the address in step, one open at a time on phones.
(() => {
  'use strict';
  const qs = [...document.querySelectorAll('.kh-q')];
  const openHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const d = id && document.getElementById(id);
    if (d && d.classList.contains('kh-q')) { d.open = true; setTimeout(() => d.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60); }
  };
  qs.forEach((d) => d.addEventListener('toggle', () => {
    if (!d.open) return;
    if (matchMedia('(max-width: 720px)').matches) qs.forEach((o) => { if (o !== d) o.open = false; });
    history.replaceState(null, '', location.pathname + location.search + '#' + d.id);
  }));
  addEventListener('hashchange', openHash);
  openHash();
})();
