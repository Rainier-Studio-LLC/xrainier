// XRainier portal: one shared top menu (Products panel with Live and Coming soon), scroll reveal, screenshots
// (with placeholders), lightbox, section highlight, product status from the admin.
(() => {
  // beta.xrainier.com (or any address with "beta" in it) uses the beta SkyHere server and shows a BETA tag
  const BETA = /(^|[.-])beta([.-]|$)/.test(location.hostname);
  if (BETA) {
    // every product link opens its beta site (game.xrainier.com → beta.game.xrainier.com); www, admin and api hosts stay
    document.querySelectorAll('a[href^="https://"]').forEach((a) => { const re = /^https:\/\/(?!beta\.|www\.|admin|api)([a-z0-9-]+)\.xrainier\.com(?=[\/?#]|$)/i, h = a.getAttribute('href'); if (re.test(h)) a.setAttribute('href', h.replace(re, 'https://beta.$1.xrainier.com')); });
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
    document.querySelectorAll('a[href^="https://skyabove.xrainier.com"]').forEach((a) => (a.href = a.href.replace('://skyabove.', '://beta.skyabove.')));
    const b = document.createElement('div'); b.className = 'betatag'; b.textContent = 'BETA'; document.body.appendChild(b); document.title = '[BETA] ' + document.title;
  }
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- one menu for every page ----------
  // Every page's top menu is rebuilt from this list, so the home page and every product page show the same menu:
  // a Products panel (Live now, Coming soon: from the admin's statuses) and the page's own non-product links.
  // A product the list doesn't know yet (a new card or link with data-product="id") is picked up from the page.
  const XR = [
    { id: 'skyabove', name: 'SkyHere', href: '/skyabove.html', icon: '/assets/img/skyabove-icon.png', kind: 'APP', line: 'Every plane over your head, live' },
    { id: 'memorylane', name: 'MemoryLane', href: '/memorylane.html', icon: '/assets/img/memorylane/icon.png', kind: 'APP', line: 'Your photos from days like today' },
    { id: 'tankwar', name: 'TankWar', href: '/tankwar.html', icon: '/assets/img/tankwar/icon.png', kind: 'GAME', line: 'Realistic 3D tank battles, 16 v 16' },
    { id: 'turbotoons', name: 'TurboToons', href: '/turbotoons.html', icon: '/assets/img/turbotoons/icon.png', kind: 'GAME', line: 'Cartoon racing, 8 players online' },
    { id: 'blockrush', name: 'BlockRush', href: '/blockrush.html', icon: '/assets/img/blockrush/icon.png', kind: 'GAME', line: 'The daily block puzzle' },
    { id: 'blockrush3d', name: 'BlockRush 3D', href: '/blockrush3d.html', icon: '/assets/img/blockrush/blockrush3d-icon.png', kind: 'GAME', line: 'The block puzzle in a 5×5×5 well' },
  ];
  // menu icons v1: products added after the list above, with their own icon, line and kind
  [
    { id: 'landlord', name: 'DrizzleTown', href: '/drizzletown.html', icon: '/assets/img/drizzletown-icon.png', kind: 'GAME', line: 'The family board game in 3D' },
    { id: 'starviewer', name: 'Star Viewer', href: '/starviewer.html', icon: '/assets/img/starviewer-icon.png', kind: 'APP', line: 'The night sky, live, wherever you are' },
  ].forEach((q) => { if (!XR.some((p) => p.id === q.id)) XR.push(q); });
  $$('[data-product]').forEach((el) => {
    const id = el.dataset.product; if (!id) return;
    const img = $('img', el), h = $('h3', el), p = $('p', el);
    const game = $$('.tag', el).some((t) => /^\s*game\s*$/i.test(t.textContent));
    const line = p ? p.textContent.trim().split(/(?<=[.:!])\s/)[0].replace(/[.:]$/, '') : '';
    const known = XR.find((q) => q.id === id);
    if (known) {   // a menu link seen first: let the home card fill in its icon, line and kind
      if (!known.icon && img) known.icon = img.getAttribute('src');
      if (!known.line && line) known.line = line;
      if (game && known.auto) known.kind = 'GAME';
      return;
    }
    XR.push({ id, auto: true, name: (h || el).textContent.trim(), href: el.getAttribute('href') || el.dataset.xrHref || '/#products',
      icon: img ? img.getAttribute('src') : '', kind: game ? 'GAME' : 'APP', line });
  });
  const IDS = new Set(XR.map((p) => p.id));
  const here = ((/^\/([a-z0-9-]+)(?:\.html)?\/?$/i.exec(location.pathname) || [])[1] || '').toLowerCase();
  const mine = XR.find((p) => p.id === here);
  const nav = $('header.nav .links'), wrapEl = $('header.nav .wrap');
  // ---------- home showcase v1: under the top menu, every product in turn, 5 seconds each, smooth cross-fade ----------
  let renderShow = () => {};
  if (here === '' || here === 'index') {
    const hdr = $('header.nav');
    const TINT = { skyabove: '56,189,248', memorylane: '251,191,36', tankwar: '163,230,53', turbotoons: '251,113,133', blockrush: '168,85,247', blockrush3d: '34,225,255', landlord: '52,211,153', starviewer: '129,140,248', doodlehere: '244,114,182', ridgehere: '45,212,191' };
    const SECS = 5;
    const box = document.createElement('section');
    box.className = 'xr-show'; box.setAttribute('aria-roledescription', 'carousel'); box.setAttribute('aria-label', 'XRainier products');
    box.innerHTML = '<div class="xr-stage" aria-live="off"></div><button class="xr-nav-b prev" type="button" aria-label="Previous product">&#8249;</button><button class="xr-nav-b next" type="button" aria-label="Next product">&#8250;</button><div class="xr-dots" role="tablist"></div>';
    if (hdr) hdr.insertAdjacentElement('afterend', box);
    const stage = $('.xr-stage', box), dots = $('.xr-dots', box);
    let at = 0, sig = '';
    const go = (i) => {
      const sl = $$('.xr-sl', stage), dt = $$('.xr-dot', dots); if (!sl.length) return;
      at = (i + sl.length) % sl.length;
      sl.forEach((s, k) => { s.classList.toggle('on', k === at); s.setAttribute('aria-hidden', k === at ? 'false' : 'true'); s.inert = k !== at; });
      dt.forEach((d) => d.classList.remove('on')); void dots.offsetWidth;     // restart the 5-second bar
      dt.forEach((d, k) => { d.classList.toggle('on', k === at); d.setAttribute('aria-selected', k === at ? 'true' : 'false'); });
    };
    dots.addEventListener('animationend', (e) => { if (e.animationName === 'xrshowfill') go(at + 1); });
    dots.addEventListener('click', (e) => { const d = e.target.closest('.xr-dot'); if (d) go(+d.dataset.i); });
    $('.prev', box).addEventListener('click', () => go(at - 1));
    $('.next', box).addEventListener('click', () => go(at + 1));
    const hold = (on) => box.classList.toggle('held', on);
    box.addEventListener('mouseenter', () => hold(true)); box.addEventListener('mouseleave', () => hold(false));
    box.addEventListener('focusin', () => hold(true)); box.addEventListener('focusout', () => hold(false));
    let x0 = null;
    stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    stage.addEventListener('pointerup', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 45) go(at + (e.clientX < x0 ? 1 : -1)); x0 = null; });
    renderShow = (status, unlisted, ord) => {
      const st = (id) => (status ? (id in status ? status[id] : unlisted) : 'live');
      const rank = (p) => (st(p.id) === 'soon' ? 1000 : 0) + (ord && p.id in ord ? ord[p.id] : 99);
      const list = XR.filter((p) => st(p.id) === 'live' || st(p.id) === 'soon').sort((a, b) => rank(a) - rank(b));
      const s = list.map((p) => p.id + ':' + st(p.id)).join(',');
      if (s === sig) return; sig = s;
      const cur = ($$('.xr-sl', stage)[at] || {}).dataset; const curId = cur && cur.id;
      box.hidden = !list.length;
      stage.innerHTML = list.map((p, i) => {
        const card = $('.prod[data-product="' + p.id + '"], [data-product="' + p.id + '"]:not(a)');
        const pics = card ? $$('img', card).map((im) => im.getAttribute('src')).filter((u) => u && u !== p.icon) : [];
        const desc = card && $('p', card) ? $('p', card).textContent.trim().replace(/ +/g, ' ') : '';
        const soon = st(p.id) === 'soon', t = TINT[p.id] || '120,170,255';
        return '<article class="xr-sl" data-id="' + esc(p.id) + '" style="--t:' + t + '" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + list.length + ': ' + esc(p.name) + '">' +
          '<div class="xr-sl-txt"><span class="xr-sl-k">' + esc(p.kind || 'APP') + (soon ? ' · Coming soon' : '') + '</span>' +
          '<h2>' + esc(p.name) + '</h2><p class="xr-sl-line">' + esc(p.line) + '</p>' + (desc && desc !== p.line ? '<p class="xr-sl-desc">' + esc(desc.length > 170 ? desc.slice(0, 167) + '…' : desc) + '</p>' : '') +
          '<a class="btn pri xr-sl-go" href="' + esc(p.href) + '">' + (soon ? 'See what’s coming' : 'Explore ' + esc(p.name)) + ' →</a></div>' +
          '<div class="xr-sl-art">' + (pics[0] ? '<img class="xr-sl-pic" src="' + esc(pics[0]) + '" alt="" loading="lazy">' : '') +
          '<img class="xr-sl-ic" src="' + esc(p.icon) + '" alt="" onerror="this.remove()"></div></article>';
      }).join('');
      dots.innerHTML = list.map((p, i) => '<button class="xr-dot" type="button" role="tab" data-i="' + i + '" aria-label="' + esc(p.name) + '"><i></i></button>').join('');
      const k = list.findIndex((p) => p.id === curId);
      go(k < 0 ? 0 : k);
    };
    if (!$('#xr-show-css')) document.head.insertAdjacentHTML('beforeend', `<style id="xr-show-css">
.xr-show{position:relative;max-width:1180px;margin:18px auto 8px;padding:0 20px}
.xr-stage{position:relative;height:320px;border-radius:24px;overflow:hidden;border:1px solid var(--line,rgba(120,170,255,.18));background:#060a18;box-shadow:0 24px 60px rgba(0,0,0,.35);touch-action:pan-y}
.xr-sl{position:absolute;inset:0;display:grid;grid-template-columns:1.15fr .85fr;align-items:center;gap:24px;padding:34px 64px;opacity:0;visibility:hidden;
 background:radial-gradient(520px 320px at 78% 50%,rgba(var(--t),.30),transparent 70%),radial-gradient(420px 260px at 10% 110%,rgba(var(--t),.14),transparent 70%),linear-gradient(135deg,#0a1022,#060914);
 transition:opacity 1s ease,visibility 0s linear 1s}
.xr-sl.on{opacity:1;visibility:visible;transition:opacity 1s ease,visibility 0s}
.xr-sl-txt>*{opacity:0;transform:translateY(14px);transition:opacity .7s ease,transform .8s cubic-bezier(.2,.7,.2,1)}
.xr-sl.on .xr-sl-txt>*{opacity:1;transform:none}
.xr-sl.on .xr-sl-txt>*:nth-child(2){transition-delay:.08s}.xr-sl.on .xr-sl-txt>*:nth-child(3){transition-delay:.16s}.xr-sl.on .xr-sl-txt>*:nth-child(4){transition-delay:.24s}.xr-sl.on .xr-sl-txt>*:nth-child(5){transition-delay:.32s}
.xr-sl-k{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.12em;padding:4px 10px;border-radius:999px;color:rgb(var(--t));border:1px solid rgba(var(--t),.45);background:rgba(var(--t),.08)}
.xr-sl h2{margin:12px 0 6px;font-size:clamp(28px,4vw,44px);line-height:1.05;color:#fff}
.xr-sl-line{margin:0 0 8px;font-size:18px;color:#dfe6ff}
.xr-sl-desc{margin:0 0 16px;color:var(--mut,#9aa6c8);font-size:15px;max-width:52ch}
.xr-sl-go{display:inline-flex;margin-top:4px}
.xr-sl-art{position:relative;height:100%;display:grid;place-items:center}
.xr-sl-ic{width:150px;height:150px;border-radius:34px;object-fit:cover;box-shadow:0 0 0 1px rgba(255,255,255,.12),0 20px 60px rgba(var(--t),.45);transform:scale(.86) rotate(-4deg);opacity:0;transition:transform 1.2s cubic-bezier(.2,.7,.2,1),opacity .9s}
.xr-sl.on .xr-sl-ic{transform:none;opacity:1;animation:xrshowfloat 5s ease-in-out infinite alternate}
.xr-sl-pic{position:absolute;inset:8% 0;width:100%;height:84%;object-fit:cover;border-radius:18px;opacity:.28;filter:blur(1px) saturate(1.2);-webkit-mask-image:radial-gradient(closest-side,#000 55%,transparent)}
@keyframes xrshowfloat{to{transform:translateY(-8px)}}
.xr-nav-b{position:absolute;top:160px;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(10,16,34,.55);color:#fff;font-size:24px;line-height:1;cursor:pointer;opacity:0;transition:opacity .2s,background .2s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.xr-nav-b.prev{left:32px}.xr-nav-b.next{right:32px}
.xr-show:hover .xr-nav-b,.xr-nav-b:focus-visible{opacity:1}.xr-nav-b:hover{background:rgba(34,225,255,.18)}
.xr-dots{display:flex;justify-content:center;gap:8px;margin-top:12px}
.xr-dot{position:relative;width:28px;height:6px;padding:0;border:0;border-radius:6px;background:rgba(255,255,255,.16);cursor:pointer;overflow:hidden}
.xr-dot i{position:absolute;inset:0;width:0;background:var(--grad,linear-gradient(90deg,#22e1ff,#a855f7))}
.xr-dot.on{width:44px}.xr-dot.on i{animation:xrshowfill ${SECS}s linear forwards}
.xr-show.held .xr-dot.on i{animation-play-state:paused}
@keyframes xrshowfill{to{width:100%}}
@media(max-width:760px){.xr-stage{height:400px}.xr-sl{grid-template-columns:1fr;grid-template-rows:150px auto;padding:22px 22px 26px;gap:8px;text-align:center}.xr-sl-art{order:-1}.xr-sl-ic{width:110px;height:110px;border-radius:26px}.xr-sl-desc{margin-left:auto;margin-right:auto}.xr-nav-b{display:none}}
@media(prefers-reduced-motion:reduce){.xr-sl,.xr-sl.on,.xr-sl-txt>*,.xr-sl-ic{transition-duration:.01s}.xr-sl.on .xr-sl-ic{animation:none}}
</style>`);
    document.addEventListener('visibilitychange', () => box.classList.toggle('held', document.hidden));
    renderShow();
  }
  let renderNav = () => {};
  if (nav && wrapEl) {
    const idOfLink = (a) => {
      const h = a.getAttribute('href') || '';
      if (/^\/?#products$/.test(h)) return 'products';
      if (a.dataset.product) return a.dataset.product;
      const m = /^\/([a-z0-9-]+)\.html(?:[?#].*)?$/i.exec(h) || /^https?:\/\/(?:beta\.)?([a-z0-9-]+)\.xrainier\.com\/?(?:[?#].*)?$/i.exec(h);
      return m ? m[1].toLowerCase() : null;
    };
    const keep = $$('a', nav).filter((a) => { const id = idOfLink(a); return !(id === 'products' || IDS.has(id)); });
    const chev = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    nav.innerHTML = `<div class="xr-dd"><button type="button" class="xr-dd-btn" aria-expanded="false" aria-controls="xr-mega">Products${chev}</button>
      <div class="xr-mega" id="xr-mega" role="region" aria-label="Products"><div class="xr-mega-in">
        <div class="xr-col"><div class="xr-h"><i></i>Live now</div><div class="xr-live" data-xr-live></div></div>
        <div class="xr-col xr-soon-col" data-xr-soon-col><div class="xr-h"><i></i>Coming soon</div><div class="xr-soonl" data-xr-soon></div>
          <p class="xr-note">Want to hear first? <a href="mailto:support@xrainier.com?subject=Tell%20me%20when%20it%27s%20live">Get notified</a></p></div>
      </div><div class="xr-foot"><a href="/#products">See all products →</a><span>Free to try · runs in your browser</span></div></div></div>`;
    keep.forEach((a) => nav.appendChild(a));
    const cta = $('.btn.pri', wrapEl);
    if (cta) { const c = cta.cloneNode(true); c.classList.add('xr-mcta'); c.removeAttribute('style'); nav.appendChild(c); }
    if (mine) {
      const logo = $('.logo', wrapEl);
      if (logo) logo.insertAdjacentHTML('afterend', `<a class="xr-crumb" href="${esc(mine.href)}" aria-label="${esc(mine.name)} overview"><img src="${esc(mine.icon)}" alt="" onerror="this.remove()"><span>${esc(mine.name)}</span></a>`);
    }
    const dd = $('.xr-dd', nav), btn = $('.xr-dd-btn', nav);
    let openedAt = 0;
    const setOpen = (o) => { if (o && !dd.classList.contains('open')) openedAt = Date.now(); dd.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
    btn.onclick = (e) => { e.stopPropagation(); const o = dd.classList.contains('open'); setOpen(!o || Date.now() - openedAt < 500); };
    document.addEventListener('click', (e) => { if (!e.target.closest('.xr-dd')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dd.classList.contains('open')) { setOpen(false); btn.focus(); } });
    const hover = matchMedia('(hover: hover) and (min-width: 821px)');
    let t;
    dd.addEventListener('mouseenter', () => { if (hover.matches) { clearTimeout(t); setOpen(true); } });
    dd.addEventListener('mouseleave', () => { if (hover.matches) t = setTimeout(() => setOpen(false), 220); });
    const tile = (p, soon) => {
      const ic = p.icon ? `<img class="xr-ic" src="${esc(p.icon)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;xr-ic letter&quot;>${esc(p.name[0])}</span>'">` : `<span class="xr-ic letter">${esc(p.name[0])}</span>`;
      const body = `${ic}<span class="xr-t"><b>${esc(p.name)}<em class="xr-k">${soon ? 'SOON' : p.kind}</em></b><small>${esc(p.line)}</small></span>`;
      return soon ? `<div class="xr-tile soon">${body}</div>`
        : `<a class="xr-tile" data-xr-nav href="${esc(p.href)}"${p.id === here ? ' aria-current="page"' : ''}>${body}</a>`;
    };
    renderNav = (status, unlisted, ord) => {
      const st = (id) => (status ? (id in status ? status[id] : unlisted) : 'live');
      const list = [...XR].sort((a, b) => (ord && a.id in ord ? ord[a.id] : 99) - (ord && b.id in ord ? ord[b.id] : 99));
      const live = list.filter((p) => st(p.id) === 'live'), soon = list.filter((p) => st(p.id) === 'soon');
      $('[data-xr-live]', nav).innerHTML = live.map((p) => tile(p, false)).join('') || '<p class="xr-empty">New products are on the way.</p>';
      $('[data-xr-soon]', nav).innerHTML = soon.map((p) => tile(p, true)).join('');
      $('[data-xr-soon-col]', nav).hidden = !soon.length;
      $('.xr-mega', nav).classList.toggle('one', !soon.length);
      if (BETA) $$('a[href^="https://skyabove.xrainier.com"]', nav).forEach((a) => (a.href = a.href.replace('://skyabove.', '://beta.skyabove.')));
    };
    renderNav();
    // menu glass v1: the hover light follows the pointer
  document.addEventListener('pointermove', (e) => { const t = e.target && e.target.closest && e.target.closest('.xr-tile,.xr-dd-btn,.xr-crumb,header.nav .links>a:not(.btn)'); if (!t) return; const r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });
  // top menu glass v1: the hover light follows the pointer on the top menu pills
  document.addEventListener('pointermove', (e) => { const t = e.target && e.target.closest && e.target.closest('header.nav .links>a, header.nav .links .xr-dd-btn'); if (!t) return; const r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });
  if (!$('#xr-nav-css')) document.head.insertAdjacentHTML('beforeend', `<style id="xr-nav-css">
.nav .wrap{gap:16px}
.xr-dd{position:relative;display:flex}
.xr-dd-btn{display:inline-flex;align-items:center;gap:6px;background:none;border:0;color:#c3cce6;padding:8px 12px;border-radius:8px;font:inherit;font-size:15px;cursor:pointer}
.xr-dd-btn:hover,.xr-dd.open .xr-dd-btn{color:#fff;background:rgba(120,170,255,.1)}
.xr-dd-btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s}
.xr-dd.open .xr-dd-btn svg{transform:rotate(180deg)}
.xr-mega{position:fixed;top:72px;left:50%;width:min(820px,calc(100vw - 32px));transform:translate(-50%,-8px);opacity:0;visibility:hidden;transition:opacity .18s,transform .18s,visibility .18s;
 background:linear-gradient(180deg,rgba(14,20,44,.95),rgba(7,11,26,.93));border:1px solid var(--line2);border-radius:16px;box-shadow: 0 30px 80px rgba(0,0,0,.45),0 0 0 1px rgba(34,225,255,.06),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);overflow:hidden;z-index:60}
.xr-dd.open .xr-mega{opacity:1;visibility:visible;transform:translate(-50%,0)}
.xr-mega:before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:var(--grad)}
.xr-mega-in{display:grid;grid-template-columns:1.55fr 1fr}
.xr-mega.one{width:min(620px,calc(100vw - 32px))}.xr-mega.one .xr-mega-in{grid-template-columns:1fr}
.xr-col{padding:20px}
.xr-soon-col{background:linear-gradient(180deg,rgba(168,85,247,.06),rgba(34,225,255,0));border-left:1px solid var(--line)}
.xr-h{display:flex;align-items:center;gap:8px;margin:0 0 12px 4px;font:600 11px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#86efac}
.xr-h i{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80}
.xr-soon-col .xr-h{color:var(--am)}.xr-soon-col .xr-h i{background:var(--am);box-shadow:0 0 8px var(--am)}
.xr-live{display:grid;grid-template-columns:1fr 1fr;gap:4px}.xr-soonl{display:grid;gap:4px}
.xr-tile{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:12px;color:var(--txt);border:1px solid transparent;transition:background .15s,border-color .15s,transform .15s}
a.xr-tile:hover{background:rgba(120,170,255,.08);border-color:var(--line);color:#fff;transform:translateX(2px)}
.xr-tile[aria-current]{background:rgba(34,225,255,.07);border-color:rgba(34,225,255,.35)}
/* top menu glass v1: glass sheen + cursor light on the top menu pills */
header.nav .links>a:not(.btn):not(.xr-mcta),header.nav .links .xr-dd-btn{isolation:isolate;transition:color .2s,box-shadow .25s,transform .2s,background-color .2s}
header.nav .links>a:not(.btn):not(.xr-mcta):hover,header.nav .links .xr-dd-btn:hover,header.nav .links .xr-dd.open .xr-dd-btn{background-color:rgba(120,170,255,.06);background-image:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.30) 47%,rgba(255,255,255,.08) 53%,transparent 62%),radial-gradient(90px circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.20),transparent 65%),linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.02) 50%,rgba(255,255,255,0) 51%),linear-gradient(135deg,rgba(34,225,255,.16),rgba(168,85,247,.18));background-size:260% 100%,100% 100%,100% 100%,100% 100%;background-repeat:no-repeat;background-position:-20% 0,0 0,0 0,0 0;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -1px 0 rgba(0,0,0,.25),inset 0 0 0 1px rgba(120,170,255,.25),0 4px 16px rgba(34,225,255,.14);transform:translateY(-1px);animation:xrglasstop .9s cubic-bezier(.2,.7,.2,1) both}
@keyframes xrglasstop{from{background-position:120% 0,0 0,0 0,0 0}to{background-position:-20% 0,0 0,0 0,0 0}}
@media (prefers-reduced-motion:reduce){header.nav .links>a:not(.btn):not(.xr-mcta):hover,header.nav .links .xr-dd-btn:hover,header.nav .links .xr-dd.open .xr-dd-btn{animation:none;transform:none}}
/* menu glass v1: glass sheen + cursor light on hover */
.xr-tile,.xr-dd-btn,.xr-crumb,header.nav .links>a:not(.btn){position:relative;isolation:isolate}
.xr-tile.xr-tile:hover,.xr-dd-btn.xr-dd-btn:hover,.xr-dd.open .xr-dd-btn.xr-dd-btn,.xr-crumb.xr-crumb:hover,header.nav .links>a:not(.btn):hover{background-image:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.28) 47%,rgba(255,255,255,.08) 53%,transparent 62%),radial-gradient(140px circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.16),transparent 62%),linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,0) 55%);background-size:260% 100%,100% 100%,100% 100%;background-repeat:no-repeat;background-position:-20% 0,0 0,0 0;box-shadow:inset 0 1px 0 rgba(255,255,255,.20),inset 0 -1px 0 rgba(0,0,0,.25),0 6px 18px rgba(0,0,0,.22);animation:xrglass .9s cubic-bezier(.2,.7,.2,1) both}
@keyframes xrglass{from{background-position:120% 0,0 0,0 0}to{background-position:-20% 0,0 0,0 0}}
@media (prefers-reduced-motion:reduce){.xr-tile.xr-tile:hover,.xr-dd-btn.xr-dd-btn:hover,.xr-dd.open .xr-dd-btn.xr-dd-btn,.xr-crumb.xr-crumb:hover,header.nav .links>a:not(.btn):hover{animation:none}}
.xr-ic{width:40px;height:40px;border-radius:11px;flex:none;object-fit:cover;box-shadow:0 6px 16px rgba(0,0,0,.45)}
.xr-ic.letter{display:grid;place-items:center;font:800 17px "Orbitron",sans-serif;color:#05060f;background:var(--grad)}
.xr-t{display:flex;flex-direction:column;min-width:0;line-height:1.3}
.xr-t b{display:flex;align-items:center;gap:7px;font-size:14.5px;font-weight:700}
.xr-t small{font-size:12.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xr-k{font:600 9px/1 "JetBrains Mono",ui-monospace,monospace;font-style:normal;letter-spacing:.1em;padding:3px 5px;border-radius:4px;border:1px solid var(--line2);color:#9fb0d8}
.xr-tile.soon .xr-ic{filter:grayscale(.6) brightness(.8)}.xr-tile.soon .xr-k{border-color:rgba(251,191,36,.45);color:var(--am)}
.xr-empty{color:var(--mut);font-size:13px;margin:6px}
.xr-note{margin:12px 4px 0;font-size:12.5px;color:var(--mut)}.xr-note a{color:#d8b4fe}
.xr-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 24px;border-top:1px solid var(--line);font-size:13px;color:var(--mut);background:rgba(4,6,14,.6)}
.xr-foot a{font-weight:700}
.xr-crumb{display:inline-flex;align-items:center;gap:8px;margin-left:-6px;padding:4px 12px 4px 4px;border-radius:999px;color:var(--txt);font-weight:600;font-size:14px;border:1px solid var(--line);background:rgba(120,170,255,.05);white-space:nowrap;transition:border-color .15s,background .15s}
.xr-crumb:hover{color:#fff;border-color:var(--line2);background:rgba(120,170,255,.1)}
.xr-crumb img{width:26px;height:26px;border-radius:8px}
.xr-mcta{display:none!important}
@media(max-width:1080px){.xr-crumb span{display:none}.xr-crumb{padding:4px}}
@media(max-width:820px){
 .links{max-height:calc(100vh - 64px);overflow-y:auto}
 .xr-dd{flex-direction:column}.xr-dd-btn{justify-content:space-between;width:100%}
 .xr-mega,.xr-mega.one{position:static;display:none;width:auto;transform:none!important;opacity:1;visibility:visible;margin:4px 0 8px;box-shadow:none;border-radius:12px}
 .xr-dd.open .xr-mega{display:block}
 .xr-mega-in{grid-template-columns:1fr}.xr-soon-col{border-left:0;border-top:1px solid var(--line)}
 .xr-live{grid-template-columns:1fr}.xr-col{padding:12px}.xr-foot{padding:10px 14px}.xr-foot span{display:none}
 .nav .links .xr-mcta{display:inline-flex!important;justify-content:center;margin-top:10px}
 .xr-crumb{margin-left:0}
}
/* home page: products that are Coming soon sit under their own heading */
.xr-soon-head{grid-column:1/-1;display:flex;align-items:center;gap:14px;margin:22px 0 -2px}
.xr-soon-head .kick{color:var(--am)}.xr-soon-head .kick:before{background:var(--am);box-shadow:0 0 8px var(--am)}
.xr-soon-head span{color:var(--mut);font-size:14px}
.xr-soon-head:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line2),transparent)}
.prod.xr-soon{position:relative;overflow:hidden;border-style:dashed;background:linear-gradient(160deg,rgba(168,85,247,.07),rgba(14,22,48,.45))}
.prod.xr-soon .ic{filter:grayscale(.5) brightness(.85)}
.prod.xr-soon:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.05) 50%,transparent 65%);transform:translateX(-100%);animation:xrsheen 5s ease-in-out infinite}
@keyframes xrsheen{55%,100%{transform:translateX(100%)}}
.prod.xr-soon .tag.xr-was-live{border-color:rgba(251,191,36,.5);color:var(--am)}
</style>`);
  }

  // mobile menu
  const menu = $('.menu'), links = $('.links');
  if (menu) menu.onclick = () => { const o = links.classList.toggle('open'); menu.setAttribute('aria-expanded', o); };
  if (links) links.addEventListener('click', (e) => { if (e.target.closest('a')) links.classList.remove('open'); });
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
    const until = f.ends ? new Date(f.ends).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
    slots.forEach((el) => { el.innerHTML = `<span class="pz">🎁</span><span><b>${esc(f.banner || f.label)}</b><small>Use code <code>${esc(f.code)}</code>${until ? ' · until ' + until : ''}</small></span><a class="btn pri" href="https://${BETA ? 'beta.' : ''}skyabove.xrainier.com/?promo=${encodeURIComponent(f.code)}">Get the offer</a>`; el.hidden = false; });
  }).catch(() => {});
  // products on the site: each one is Live, Coming soon or Off, set in the XRainier admin (admin.xrainier.com → Website;
  // beta.xrainier.com uses admin-beta).
  //   Live: card, Products menu (Live now), header buttons and footer links show.  Coming soon: the card shows under the
  //   Coming soon heading with no link, and the Products menu lists it under Coming soon; footer links hide.
  //   Off: everything hides; the product's own page still opens but isn't indexed.
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
      if (el.closest('.xr-mega') || el.classList.contains('xr-crumb') || el.classList.contains('xr-mcta')) return;   // the shared menu shows statuses itself
      const id = prodOf(el); if (!id) return;
      if (!(id in status) && !el.dataset.product) return;   // a plain link to a page that isn't a product: leave it alone
      const s = id in status ? status[id] : unlisted, card = !!el.closest('#products .grid');
      el.style.display = s === 'live' || (s === 'soon' && card) ? '' : 'none';
      if (card) cardMode(el, s === 'soon');
      if (s === 'live' && card) live.add(id);
    });
    const g = $('#products .grid');
    if (g) { const cards = [...g.children].filter((e) => e.dataset.product), rest = [...g.children].filter((e) => !e.dataset.product && !e.classList.contains('xr-soon-head'));
      const rank = (e) => { const s = status[e.dataset.product] || unlisted; return (s === 'soon' ? 1000 : 0) + (ord[e.dataset.product] ?? 99); };   // coming soon after live
      cards.sort((a, b) => rank(a) - rank(b)); [...cards, ...rest].forEach((e) => g.appendChild(e));
      // a "Coming soon" heading in front of the first coming-soon card
      let head = $('.xr-soon-head', g); const first = cards.find((e) => (status[e.dataset.product] || unlisted) === 'soon' && e.style.display !== 'none');
      if (first) { if (!head) { head = document.createElement('div'); head.className = 'xr-soon-head'; head.innerHTML = '<div class="kick">Coming soon</div><span>In the lab now, opening soon.</span>'; } g.insertBefore(head, first); }
      else if (head) head.remove();
    }
    const n = live.size;
    $$('[data-live-count]').forEach((e) => (e.textContent = n));
    $$('[data-live-words]').forEach((e) => (e.textContent = WORDS[n] || n + ' products'));
    renderNav(status, unlisted, ord);
    renderShow(status, unlisted, ord);
    // this page belongs to a product that's Off: keep it out of search results
    const me = (/^\/([a-z0-9-]+)(?:\.html)?\/?$/i.exec(location.pathname) || [])[1];
    const off = me && (status[me.toLowerCase()] || null) === 'off';
    let rob = $('meta[name="robots"][data-xr]');
    if (off && !rob) { rob = document.createElement('meta'); rob.name = 'robots'; rob.content = 'noindex'; rob.dataset.xr = '1'; document.head.appendChild(rob); }
    else if (!off && rob) rob.remove();
  };
  try { applyProducts(JSON.parse(localStorage.getItem(PKEY))); } catch (e) {}
  fetch(PAPI).then((r) => (r.ok ? r.json() : null)).then((c) => { if (c && c.products) { try { localStorage.setItem(PKEY, JSON.stringify(c)); } catch (e) {} applyProducts(c); } }).catch(() => {});
})();
