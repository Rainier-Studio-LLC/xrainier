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
  // Kavodly's Privacy and Terms pages are on another site, where the browser hides where you came from; tell them,
  // so their Back button returns to this page (in the language you chose).
  const backLinks = () => document.querySelectorAll('a[href*="kavodly"][href*=".xrainier.com/"]').forEach((a) => {
    let u; try { u = new URL(a.href); } catch (e) { return; }
    if (!/^\/(privacy|terms)(\.html)?$|^\/legal\//.test(u.pathname)) return;
    u.searchParams.set('back', location.href.split('#')[0]); a.href = u.toString();
  });
  backLinks(); addEventListener('load', backLinks); setTimeout(backLinks, 700); setTimeout(backLinks, 2100);
  document.addEventListener('click', (e) => { if (e.target.closest?.('a[href*="kavodly"]')) backLinks(); }, true);
  // Language: buttons at the top switch the whole page; the choice is remembered. ?lang=xx and the
  // browser's language pick the first one.
  const D = window.KV_I18N || {}, LANGS = Object.keys(D);
  const pick = () => {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && D[q]) return q;
    try { const s = localStorage.getItem('kv.lang'); if (s && D[s]) return s; } catch (e) {}
    for (const l of navigator.languages || [navigator.language || 'en']) {
      const x = String(l).toLowerCase();
      if (/^zh-(hant|tw|hk|mo)/.test(x)) return 'zh-Hant';
      const b = x.split('-')[0];
      if (D[b]) return b;
    }
    return 'en';
  };
  const HTML_LANG = { zh: 'zh-Hans', 'zh-Hant': 'zh-Hant' };
  const apply = (lg, save) => {
    const t = D[lg]; if (!t) return;
    document.querySelectorAll('[data-i]').forEach((el) => { const v = t[el.dataset.i]; if (v != null) el.innerHTML = v; });
    document.documentElement.lang = HTML_LANG[lg] || lg;
    document.documentElement.dataset.kvLang = lg;
    if (t.title) document.title = t.title;
    const md = document.querySelector('meta[name=description]'); if (md && t.desc) md.setAttribute('content', t.desc);
    document.querySelectorAll('.kv-langsw [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lg)));
    if (save) { try { localStorage.setItem('kv.lang', lg); } catch (e) {} const u = new URL(location.href); u.searchParams.set('lang', lg); history.replaceState(null, '', u); }
  };
  if (LANGS.length) {
    const first = pick(); if (first !== 'en') apply(first, false); else apply('en', false);
    document.querySelectorAll('.kv-langsw [data-lang]').forEach((b) => b.addEventListener('click', () => apply(b.dataset.lang, true)));
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
