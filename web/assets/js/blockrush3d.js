// BlockRush 3D introduction page: today's Daily number, beta links, and the hero well you can spin with a finger or mouse.
(() => {
  'use strict';
  // Daily #1 was 2026-11-11 (UTC); a new puzzle starts every day at 00:00 UTC
  const day = Math.max(1, Math.floor((Date.now() - Date.UTC(2026, 10, 11)) / 864e5) + 1);
  document.querySelectorAll('[data-b3-day]').forEach((e) => (e.textContent = day));

  // on beta.xrainier.com, game links go to the beta game
  if (/(^|[.-])beta([.-]|$)/.test(location.hostname)) {
    document.querySelectorAll('a[href^="https://blockrush3d.xrainier.com"]').forEach((a) => {
      a.href = a.getAttribute('href').replace('https://blockrush3d.', 'https://beta.blockrush3d.');
    });
  }

  // hero: slow auto-orbit; drag to spin it yourself (it keeps the spin you give it, then eases back to the orbit)
  const scene = document.querySelector('.b3-scene'), world = scene && scene.querySelector('.b3-world');
  if (!scene || !world) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  scene.classList.add('b3-js');
  let ry = 35, rx = -26, v = still ? 0 : 0.22, drag = null, last = 0, visible = true;
  const draw = () => { world.style.transform = `translateY(calc(var(--s) * 1.4)) rotateX(${rx}deg) rotateY(${ry}deg)`; };
  const tick = (t) => {
    const dt = last ? Math.min(50, t - last) / 16.7 : 1; last = t;
    if (!drag) {
      const auto = still ? 0 : 0.22;
      v += (auto - v) * 0.02 * dt; ry += v * dt;
      rx += (-26 - rx) * 0.04 * dt;
    }
    draw();
    if (visible) requestAnimationFrame(tick); else last = 0;
  };
  draw();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was) requestAnimationFrame(tick); }).observe(scene);
  }
  requestAnimationFrame(tick);
  scene.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, t: performance.now() }; v = 0;
    scene.classList.add('drag'); scene.setPointerCapture(e.pointerId);
  });
  scene.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now(), dt = Math.max(8, now - drag.t);
    ry += dx * 0.45; rx = Math.max(-70, Math.min(10, rx - dy * 0.3));
    v = (dx * 0.45) / (dt / 16.7);
    drag = { x: e.clientX, y: e.clientY, t: now };
  });
  const end = () => { if (!drag) return; drag = null; scene.classList.remove('drag'); v = Math.max(-12, Math.min(12, v)); };
  scene.addEventListener('pointerup', end); scene.addEventListener('pointercancel', end);
})();
