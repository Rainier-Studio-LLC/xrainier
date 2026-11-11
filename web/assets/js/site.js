// XRainier portal: menu, scroll reveal, screenshots (with placeholders), lightbox, section highlight.
(() => {
  // beta.xrainier.com (or any address with "beta" in it) uses the beta SkyHere server and shows a BETA tag
  const BETA = /(^|[.-])beta([.-]|$)/.test(location.hostname);
  if (BETA) {
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
    document.querySelectorAll('a[href^="https://skyabove.xrainier.com"]').forEach((a) => (a.href = a.href.replace('://skyabove.', '://beta.skyabove.')));
    const b = document.createElement('div'); b.className = 'betatag'; b.textContent = 'BETA'; document.body.appendChild(b); document.title = '[BETA] ' + document.title;
  }
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // mobile menu
  const menu = $('.menu'), links = $('.links');
  if (menu) menu.onclick = () => { const o = links.classList.toggle('open'); menu.setAttribute('aria-expanded', o); };
  $$('.links a').forEach((a) => (a.onclick = () => links.classList.remove('open')));
  // reveal on scroll
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 }) : null;
  $$('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  // screenshots: <figure class="shot" data-src="assets/shots/x.jpg" data-cap="..."> — a missing file shows a placeholder
  $$('.shot[data-src]').forEach((f) => {
    const img = new Image(); img.alt = f.dataset.cap || ''; img.loading = 'lazy'; img.decoding = 'async';
    img.onerror = () => f.classList.add('missing');
    img.src = f.dataset.src; f.prepend(img);
    if (!f.classList.contains('phone')) f.insertAdjacentHTML('afterbegin', '<div class="bar"><i></i><i></i><i></i></div>');
    f.insertAdjacentHTML('beforeend', `<div class="ph"><span class="em">${f.dataset.icon || '🛰️'}</span><b>${f.dataset.cap || ''}</b><span>Screenshot coming soon</span></div>` + (f.dataset.cap ? `<figcaption>${f.dataset.cap}</figcaption>` : ''));
  });
  // lightbox
  const lb = document.createElement('div'); lb.className = 'lb'; lb.innerHTML = '<img alt=""><p></p>'; document.body.appendChild(lb);
  lb.onclick = () => lb.classList.remove('on');
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('on'); });
  document.addEventListener('click', (e) => {
    const f = e.target.closest('.shot'); if (!f || f.classList.contains('missing')) return;
    const img = $('img', f); if (!img) return;
    $('img', lb).src = img.src; $('p', lb).textContent = f.dataset.cap || ''; lb.classList.add('on');
  });
  // highlight the section you're reading in the sub-navigation
  const sub = $$('.subnav a');
  if (sub.length && io) {
    const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) sub.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    sub.forEach((a) => { const t = document.querySelector(a.getAttribute('href')); if (t) so.observe(t); });
  }
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  // featured SkyHere promotion (set in the SkyHere admin, Promotions tab → ★)
  const slots = $$('[data-promo]');
  if (slots.length) fetch((BETA ? 'https://api-beta.skyabove.xrainier.com' : 'https://api.skyabove.xrainier.com') + '/promo/featured').then((r) => r.json()).then((f) => {
    if (!f || !f.code) return;
    const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const until = f.ends ? new Date(f.ends).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
    slots.forEach((el) => { el.innerHTML = `<span class="pz">🎁</span><span><b>${esc(f.banner || f.label)}</b><small>Use code <code>${esc(f.code)}</code>${until ? ' · until ' + until : ''}</small></span><a class="btn pri" href="https://${BETA ? 'beta.' : ''}skyabove.xrainier.com/?promo=${encodeURIComponent(f.code)}">Get the offer</a>`; el.hidden = false; });
  }).catch(() => {});
  // products on the site: each one is Live, Coming soon or Off, set in the XRainier admin (admin.xrainier.com → Website;
  // beta.xrainier.com uses admin-beta).
  //   Live: card, top menu, header buttons and footer links show.  Coming soon: the card shows with a COMING SOON tag and
  //   no link; menu and footer links hide.  Off: everything hides; the product's own page still opens but isn't indexed.
  // A card or link marked data-product="id" whose id isn't in the admin's list yet is a new (incoming) product: it gets
  // the admin's "new products start as" status (list.unlisted), so a new product can't go public before it's turned on.
  // The last known list is applied at once (no flicker), then the latest one. If it can't be loaded, everything shows.
  const PKEY = 'xr.products' + (BETA ? '.beta' : ''), PAPI = (BETA ? 'https://admin-beta.xrainier.com' : 'https://admin.xrainier.com') + '/api/products';
  const WORDS = ['No products', 'One product', 'Two products', 'Three products', 'Four products', 'Five products', 'Six products', 'Seven products', 'Eight products', 'Nine products'];
  const ST = ['live', 'soon', 'off'];
  const prodOf = (el) => {
    if (el.dataset.product) return el.dataset.product;
    const h = el.getAttribute('href') || el.dataset.xrHref || '', m = /^\/([a-z0-9-]+)\.html(?:[?#].*)?$/i.exec(h) || /^https?:\/\/(?:beta\.)?([a-z0-9-]+)\.xrainier\.com\/?(?:[?#].*)?$/i.exec(h);
    return m ? m[1].toLowerCase() : null;
  };
  if (!$('#xr-soon-css')) document.head.insertAdjacentHTML('beforeend', '<style id="xr-soon-css">.xr-soon{cursor:default}.xr-soon:hover{transform:none}.xr-soon .more{opacity:.7}</style>');
  // a product card in the grid: Coming soon keeps it visible but without its link; Live puts the link back
  const cardMode = (el, soon) => {
    const tag = $('.tag.live', el), more = $('.more', el);
    if (soon && !el.classList.contains('xr-soon')) {
      el.classList.add('soon', 'xr-soon');
      if (el.hasAttribute('href')) { el.dataset.xrHref = el.getAttribute('href'); el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); }
      if (tag) { tag.dataset.xrText = tag.textContent; tag.textContent = 'COMING SOON'; tag.classList.replace('live', 'xr-was-live'); }
      if (more) { more.dataset.xrText = more.textContent; more.textContent = 'Coming soon'; }
    } else if (!soon && el.classList.contains('xr-soon')) {
      el.classList.remove('soon', 'xr-soon');
      if (el.dataset.xrHref) { el.setAttribute('href', el.dataset.xrHref); delete el.dataset.xrHref; el.removeAttribute('aria-disabled'); }
      const t = $('.tag.xr-was-live', el); if (t) { t.textContent = t.dataset.xrText || 'LIVE'; t.classList.replace('xr-was-live', 'live'); }
      if (more && more.dataset.xrText) more.textContent = more.dataset.xrText;
    }
  };
  const applyProducts = (c) => {
    if (!c || !Array.isArray(c.products) || !c.products.length) return;
    const status = {}, ord = {}; c.products.forEach((p, i) => { status[p.id] = ST.includes(p.status) ? p.status : p.show === false ? 'off' : 'live'; ord[p.id] = i; });
    const unlisted = ST.includes(c.unlisted) ? c.unlisted : 'live';
    const live = new Set();
    $$('[data-product], header a[href], nav a[href], footer a[href], a[data-xr-href]').forEach((el) => {
      const id = prodOf(el); if (!id) return;
      if (!(id in status) && !el.dataset.product) return;   // a plain link to a page that isn't a product: leave it alone
      const s = id in status ? status[id] : unlisted, card = !!el.closest('#products .grid');
      el.style.display = s === 'live' || (s === 'soon' && card) ? '' : 'none';
      if (card) cardMode(el, s === 'soon');
      if (s === 'live' && card) live.add(id);
    });
    const g = $('#products .grid');
    if (g) { const cards = [...g.children].filter((e) => e.dataset.product), rest = [...g.children].filter((e) => !e.dataset.product);
      const rank = (e) => { const s = status[e.dataset.product] || unlisted; return (s === 'soon' ? 1000 : 0) + (ord[e.dataset.product] ?? 99); };   // coming soon after live
      cards.sort((a, b) => rank(a) - rank(b)); [...cards, ...rest].forEach((e) => g.appendChild(e)); }
    const n = live.size;
    $$('[data-live-count]').forEach((e) => (e.textContent = n));
    $$('[data-live-words]').forEach((e) => (e.textContent = WORDS[n] || n + ' products'));
    // this page belongs to a product that's Off: keep it out of search results
    const me = (/^\/([a-z0-9-]+)\.html$/i.exec(location.pathname) || [])[1];
    const off = me && (status[me.toLowerCase()] || null) === 'off';
    let rob = $('meta[name="robots"][data-xr]');
    if (off && !rob) { rob = document.createElement('meta'); rob.name = 'robots'; rob.content = 'noindex'; rob.dataset.xr = '1'; document.head.appendChild(rob); }
    else if (!off && rob) rob.remove();
  };
  try { applyProducts(JSON.parse(localStorage.getItem(PKEY))); } catch (e) {}
  fetch(PAPI).then((r) => (r.ok ? r.json() : null)).then((c) => { if (c && c.products) { try { localStorage.setItem(PKEY, JSON.stringify(c)); } catch (e) {} applyProducts(c); } }).catch(() => {});
})();
