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
  // new products v1: DoodleHere and RidgeHere in the menu and the showcase
  [
    { id: 'doodlehere', name: 'DoodleHere', href: '/doodlehere.html', icon: '/assets/img/doodlehere-icon.png', kind: 'APP', line: 'Drawing that talks back, for kids' },
    { id: 'ridgehere', name: 'RidgeHere', href: '/ridgehere.html', icon: '/assets/img/ridgehere-icon.png', kind: 'APP', line: 'Name every peak you can see' },
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
  // ---------- product footer v1: every product page gets the same footer as the home page,
  // and its Privacy link goes to that product's own privacy page (not SkyHere's) ----------
  (() => {
    // xrainier privacy v1: pages that aren't a product (home, 404, privacy) link Privacy to XRainier's own policy
    const genPriv = () => $$('footer a').forEach((a) => { if (/^\s*privacy\s*$/i.test(a.textContent)) a.setAttribute('href', '/privacy.html'); });
    if (!here || here === 'index' || here === '404' || here === 'privacy' || here === 'terms') { genPriv(); return; }
    const SKIP = /^(www|admin|admin-beta|beta|api|api-beta)$/;
    const count = {};
    $$('a[href]').forEach((a) => {
      if (a.closest('header.nav')) return;
      const m = /^https?:\/\/(?:beta\.)?([a-z0-9-]+)\.xrainier\.com(?:\/|$)/i.exec(a.getAttribute('href') || '');
      if (m && !SKIP.test(m[1].toLowerCase())) { const h = m[1].toLowerCase(); count[h] = (count[h] || 0) + 1 + (h === here || (mine && h === mine.id) ? 100 : 0); }
    });
    const host = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
    if (!host) { genPriv(); return; }   // not a product page
    const old = $('footer');
    const keep = old ? $$('a[href]', old).filter((a) => /terms|credits|licen|legal|imprint/i.test(a.textContent)) : [];
    const mail = old && $('a[href^="mailto:"]', old);
    const f = document.createElement('footer');
    f.innerHTML = '<div class="wrap"><a class="logo" href="/"><img src="/assets/img/xr-emblem.png" alt="" style="width:26px"><span style="font-size:15px">XRAINIER</span></a>' +
      '<span>© <span data-year>' + new Date().getFullYear() + '</span> Rainier Studio LLC<br><small style="color:#6f7a99">XRainier is a trademark of Rainier Studio LLC.</small></span><span class="sp"></span>' +
      keep.map((a) => '<a href="' + esc(a.getAttribute('href')) + '">' + esc(a.textContent.trim()) + '</a>').join('') +
      '<a href="https://' + host + '.xrainier.com/privacy" data-xr-privacy>Privacy</a><a href="' + esc(mail ? mail.getAttribute('href') : 'mailto:support@xrainier.com') + '">Support</a></div>';
    if (old) old.replaceWith(f); else (document.querySelector('script[src*="site.js"]') || document.body.lastChild).before(f);
  })();
  // ---------- home showcase v3: replaces the home hero and the product cards; SkyHere keeps its live radar,
  // every other product shows its postcard picture (the hero picture from its own page), 6 s each ----------
  let renderShow = () => {};
  const hero0 = (here === '' || here === 'index') && $('section.hero');
  if (hero0) {
    const SECS = 6;
    const TINT = { skyabove: '56,189,248', memorylane: '251,191,36', tankwar: '163,230,53', turbotoons: '251,113,133', blockrush: '168,85,247', blockrush3d: '34,225,255', landlord: '52,211,153', starviewer: '129,140,248', doodlehere: '244,114,182', ridgehere: '45,212,191' };
    const HL = {
      skyabove: ['Every plane over your head, live', ['Live radar, routes and altitude', '3D replays with a cockpit view', 'Encrypted Sky Link chat']],
      tankwar: ['Realistic 3D tank battles', ['8 famous tanks, 4 real battlefields', 'Driver periscope and gunner sight', 'Online battles up to 16 v 16']],
      turbotoons: ['Cartoon racing, 8 players online', ['Drift to boost', '4 Pacific-Northwest worlds', 'Share any track as a code']],
      blockrush: ['The daily block puzzle', ['Clear rows and columns on 8×8', 'Chain combos for big scores', 'Same pieces for everyone']],
      blockrush3d: ['The block puzzle, in 3D', ['Spin pieces to any angle', 'Clear lines on all three axes', 'A new 5×5×5 puzzle every day']],
      landlord: ['The family board game in 3D', ['Play together on one device', 'Online with a room code', 'Or take on the computer']],
      memorylane: ['Your photos from days like today', ['Same place, same season, same sky', 'Plays back as a film or a book', 'Private: photos stay yours']],
      starviewer: ['The night sky, live, wherever you are', ['Point your phone at the sky', 'Tap any star for its story', 'Chat with stargazers in 20 languages']],
      doodlehere: ['Drawing that talks back, for kids', ['Draw, colour and hear it', '9 languages to explore', 'Made for little hands']],
      ridgehere: ['Name every peak you can see', ['Point at a ridge, get its name', 'Trails, photos and Ridge Link chat', 'Works on any mountain view']],
    };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const radar0 = $('.radar', hero0);
    const SCENE = {
      skyabove: () => radar0 ? radar0.outerHTML : '<div class="radar"><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i><i class="x"></i><i class="y"></i><div class="sweep"></div><span class="blip" style="left:68%;top:30%"><small>UAL1660 · 35,000 ft</small></span><span class="blip v" style="left:30%;top:62%;animation-delay:2s"><small>ASA660 · 12,400 ft</small></span><img class="center" src="/assets/img/skyabove-icon.png" alt="" style="border-radius:16px"></div>',
    };
    const gen = (p) => '<div class="sc-gen"><i class="o o1"></i><i class="o o2"></i><img src="' + esc(p.icon) + '" alt=""></div>';
    // showcase v3: each product's postcard is the hero picture from its own product page
    const PIC = {
      tankwar: '/assets/img/tankwar/hero.jpg', turbotoons: '/assets/img/turbotoons/hero.jpg', blockrush: '/assets/img/blockrush/hero.jpg',
      blockrush3d: '/assets/img/blockrush3d-hero.jpg', landlord: '/assets/img/drizzletown-hero.jpg', memorylane: '/assets/img/memorylane/hero.jpg',
      starviewer: '/assets/img/starviewer-hero-v2.jpg', doodlehere: '/assets/img/doodlehere-hero.jpg', ridgehere: '/assets/img/ridgehere-hero.jpg',
    };
    const pic = (p, first) => '<div class="sc-pic"><img src="' + esc(PIC[p.id]) + '" alt="' + esc(p.name) + '" decoding="async"' + (first ? ' fetchpriority="high"' : ' fetchpriority="low"') + ' onerror="this.remove()"></div>';
    // home showcase v3.2: BlockRush 3D gets a shiny glass picture with light effects on top (glint sweep, glowing clear, rising sparkles)
    SCENE.blockrush3d = () => { let s = ''; for (let i = 0; i < 14; i++) s += '<b style="left:' + (52 + Math.random() * 30).toFixed(1) + '%;animation-delay:' + (Math.random() * 4).toFixed(2) + 's;--d:' + (3 + Math.random() * 2.5).toFixed(2) + 's"></b>';
      return '<div class="sc-pic sc-b3x"><img src="/assets/img/blockrush3d-showcase.jpg" alt="BlockRush 3D" decoding="async" onerror="this.remove()"><i class="pulse"></i><i class="gl"></i><i class="sp">' + s + '</i></div>'; };
    const scene = (p, first) => (SCENE[p.id] ? SCENE[p.id]() : PIC[p.id] ? pic(p, first) : gen(p));
    const box = document.createElement('div');
    box.className = 'xr-show'; box.setAttribute('aria-roledescription', 'carousel'); box.setAttribute('aria-label', 'XRainier products');
    const h1 = $('h1', hero0);
    box.innerHTML = '<h1 class="xr-sr">' + esc(h1 ? h1.textContent.replace(/ +/g, ' ').trim() : 'XRainier') + '</h1><div class="xr-stage"></div><button class="xr-nav-b prev" type="button" aria-label="Previous product">&#8249;</button><button class="xr-nav-b next" type="button" aria-label="Next product">&#8250;</button><div class="xr-dots" role="tablist"></div>';
    // showcase v3: the showcase is the Products section now; the cards stay in the page (hidden) for the admin statuses
    // home showcase v3.2: the showcase takes the old top section's place; the What we make cards stay below it
    hero0.insertAdjacentElement('beforebegin', box);
    hero0.hidden = true;
    const stage = $('.xr-stage', box), dots = $('.xr-dots', box);
    let at = 0, sig = '';
    const go = (i) => {
      const sl = $$('.xr-sl', stage), dt = $$('.xr-dot', dots); if (!sl.length) return;
      at = (i + sl.length) % sl.length;
      sl.forEach((s, k) => { s.classList.toggle('on', k === at); s.setAttribute('aria-hidden', k === at ? 'false' : 'true'); s.inert = k !== at; });
      dt.forEach((d) => d.classList.remove('on')); void dots.offsetWidth;
      dt.forEach((d, k) => { d.classList.toggle('on', k === at); d.setAttribute('aria-selected', k === at ? 'true' : 'false'); });
      const od = dt[at]; if (od && dots.scrollWidth > dots.clientWidth + 4) dots.scrollTo({ left: od.offsetLeft - (dots.clientWidth - od.offsetWidth) / 2, behavior: 'smooth' });
    };
    dots.addEventListener('animationend', (e) => { if (e.animationName === 'xrshowfill') go(at + 1); });
    // showcase strip v1: if the names don't fit, show icons only (the current product keeps its name)
    const fitStrip = () => { $$('.xr-dot', dots).forEach((d) => (d.title = d.getAttribute('aria-label') || '')); dots.classList.remove('tight'); if (dots.scrollWidth > dots.clientWidth + 2) dots.classList.add('tight'); };
    new MutationObserver(fitStrip).observe(dots, { childList: true }); addEventListener('resize', fitStrip, { passive: true }); fitStrip();
    dots.addEventListener('click', (e) => { const d = e.target.closest('.xr-dot'); if (d) go(+d.dataset.i); });
    $('.prev', box).addEventListener('click', () => go(at - 1));
    $('.next', box).addEventListener('click', () => go(at + 1));
    const hold = (on) => box.classList.toggle('held', on);
    box.addEventListener('mouseenter', () => hold(true)); box.addEventListener('mouseleave', () => hold(false));
    box.addEventListener('focusin', () => hold(true)); box.addEventListener('focusout', () => hold(false));
    document.addEventListener('visibilitychange', () => hold(document.hidden));
    // showcase 3d v1: tilt the panel a little toward the mouse, and move the edge light with it
    if (matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches) {
      box.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        stage.style.setProperty('--ry', (x * 4).toFixed(2) + 'deg'); stage.style.setProperty('--rx', (-y * 3).toFixed(2) + 'deg');
        stage.style.setProperty('--gx', ((x + .5) * 100).toFixed(1) + '%'); stage.style.setProperty('--gy', ((y + .5) * 100).toFixed(1) + '%'); }, { passive: true });
      box.addEventListener('pointerleave', () => { ['--rx', '--ry', '--gx', '--gy'].forEach((k) => stage.style.removeProperty(k)); });
    }
    // home showcase v3.3: match the width of the page sections below (their .wrap content width)
    const fit = () => {
      const ref = $('#products .wrap') || $('#lab .wrap') || $('main .wrap:not(.hero .wrap)');
      if (ref) { const cs = getComputedStyle(ref); box.style.setProperty('--xr-w', Math.round(ref.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) + 'px'); }
      box.style.setProperty('--xr-mid', Math.round(stage.offsetHeight / 2) + 'px');
    };
    fit(); addEventListener('resize', fit, { passive: true }); addEventListener('load', fit);
    // home showcase v3.1: a plain block (not a <section>, so page section styles don't squeeze it); measure the scrollbar for the edge-to-edge width
    const sbw = () => document.documentElement.style.setProperty('--xr-sbw', Math.max(0, innerWidth - document.documentElement.clientWidth) + 'px');
    sbw(); addEventListener('resize', sbw, { passive: true });
    let x0 = null;
    stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    stage.addEventListener('pointerup', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 45) go(at + (e.clientX < x0 ? 1 : -1)); x0 = null; });
    renderShow = (status, unlisted, ord) => {
      const st = (id) => (status ? (id in status ? status[id] : unlisted) : 'live');
      const rank = (p) => (st(p.id) === 'soon' ? 1000 : 0) + (ord && p.id in ord ? ord[p.id] : 99);
      const list = XR.filter((p) => st(p.id) === 'live' || st(p.id) === 'soon').sort((a, b) => rank(a) - rank(b));
      const s = list.map((p) => p.id + ':' + st(p.id)).join(',');
      if (s === sig) return; sig = s;
      const cur = $$('.xr-sl', stage)[at]; const curId = cur && cur.dataset.id;
      box.hidden = !list.length; hero0.hidden = !!list.length;
      stage.innerHTML = list.map((p, i) => {
        const soon = st(p.id) === 'soon', t = TINT[p.id] || '120,170,255', hl = HL[p.id] || [p.line, []];
        return '<article class="xr-sl" data-id="' + esc(p.id) + '" style="--t:' + t + '" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + list.length + ': ' + esc(p.name) + '">' +
          '<div class="xr-sc">' + scene(p, i === 0) + '</div>' +
          '<div class="xr-sl-txt"><span class="xr-sl-k"><img src="' + esc(p.icon) + '" alt="" onerror="this.remove()">' + esc(p.kind || 'APP') + (soon ? ' · COMING SOON' : '') + '</span>' +
          '<h2>' + esc(p.name) + '</h2><p class="xr-sl-line">' + esc(hl[0] || p.line) + '</p>' +
          (hl[1].length ? '<ul class="xr-hl">' + hl[1].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
          // showcase soon v1: a product that isn't live has no link to its page, only a Coming soon badge
          '<div class="xr-sl-cta">' + (soon ? '<span class="xr-sl-soon">Coming soon</span>' : '<a class="btn pri" href="' + esc(p.href) + '">Explore ' + esc(p.name) + ' →</a>') + '</div></div></article>';
      }).join('');
      dots.innerHTML = list.map((p, i) => '<button class="xr-dot" type="button" role="tab" data-i="' + i + '" aria-label="' + esc(p.name) + '" style="--t:' + (TINT[p.id] || '120,170,255') + '"><img src="' + esc(p.icon) + '" alt="" onerror="this.remove()"><span>' + esc(p.name) + '</span><i></i></button>').join('');
      const k = list.findIndex((p) => p.id === curId);
      go(k < 0 ? 0 : k);
    };
    if (!$('#xr-show-css')) document.head.insertAdjacentHTML('beforeend', `<style id="xr-show-css">
.xr-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.xr-show{position:relative;max-width:1480px;margin:10px auto 0;padding:0 20px}
.xr-prods{padding:0!important;scroll-margin-top:76px}
.xr-stage{position:relative;height:clamp(560px,82vh,860px);border-radius:28px;overflow:hidden;border:1px solid var(--line,rgba(120,170,255,.18));background:#050915;box-shadow:0 30px 80px rgba(0,0,0,.45);touch-action:pan-y}
.xr-sl{position:absolute;inset:0;opacity:0;visibility:hidden;
 background:radial-gradient(60% 70% at 66% 50%,rgba(var(--t),.20),transparent 70%),radial-gradient(40% 50% at 0% 100%,rgba(var(--t),.10),transparent 70%),linear-gradient(135deg,#0a1022,#050812);transition:opacity 1s ease,visibility 0s linear 1s}
.xr-sl.on{opacity:1;visibility:visible;transition:opacity 1s ease,visibility 0s}
.xr-sl:not(.on) *{animation-play-state:paused!important}
.xr-sc{position:absolute;inset:0;overflow:hidden}
.xr-sc:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(4,7,16,.86) 0,rgba(4,7,16,.5) 24%,rgba(4,7,16,0) 46%),linear-gradient(0deg,rgba(4,7,16,.8) 0,rgba(4,7,16,0) 38%)}
.xr-sl-txt{position:absolute;left:0;bottom:0;z-index:2;width:min(520px,92%);padding:0 0 46px 52px}
.xr-sl-txt>*{opacity:0;transform:translateY(14px);transition:opacity .7s ease,transform .8s cubic-bezier(.2,.7,.2,1)}
.xr-sl.on .xr-sl-txt>*{opacity:1;transform:none}
.xr-sl.on .xr-sl-txt>:nth-child(2){transition-delay:.08s}.xr-sl.on .xr-sl-txt>:nth-child(3){transition-delay:.16s}.xr-sl.on .xr-sl-txt>:nth-child(4){transition-delay:.26s}.xr-sl.on .xr-sl-txt>:nth-child(5){transition-delay:.36s}
.xr-sl-k{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.12em;padding:4px 12px 4px 4px;border-radius:999px;color:rgb(var(--t));border:1px solid rgba(var(--t),.45);background:rgba(6,10,22,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.xr-sl-k img{width:24px;height:24px;border-radius:7px}
.xr-sl h2{margin:14px 0 6px;font-size:clamp(40px,5.2vw,72px);line-height:1;color:#fff;letter-spacing:-.01em;text-shadow:0 4px 30px rgba(0,0,0,.55)}
.xr-sl-line{margin:0 0 14px;font-size:clamp(17px,1.5vw,21px);color:#e6ebff;text-shadow:0 2px 14px rgba(0,0,0,.6)}
.xr-hl{list-style:none;margin:0 0 20px;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.xr-hl li{display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;font-size:13.5px;color:#dfe6ff;background:rgba(6,10,22,.5);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.xr-hl li:before{content:"";width:7px;height:7px;border-radius:50%;flex:none;background:rgb(var(--t));box-shadow:0 0 10px rgb(var(--t))}
.xr-sl-cta{display:flex;gap:10px;flex-wrap:wrap}
/* showcase 3d v1: the stage is a raised glass panel: layered drop shadows, bevelled lit edges, gentle tilt toward the mouse */
.xr-show{perspective:1600px}
.xr-show .xr-stage.xr-stage{transform-style:preserve-3d;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .5s cubic-bezier(.2,.7,.2,1),box-shadow .5s;
 border:1px solid rgba(160,200,255,.22);
 box-shadow:0 1px 0 rgba(255,255,255,.06),0 2px 3px rgba(0,0,0,.5),0 12px 24px -6px rgba(0,0,0,.55),0 34px 70px -18px rgba(0,0,0,.75),0 60px 120px -40px rgba(34,225,255,.22),0 0 0 1px rgba(0,0,0,.6)}
.xr-show:hover .xr-stage.xr-stage{box-shadow:0 1px 0 rgba(255,255,255,.08),0 3px 4px rgba(0,0,0,.5),0 18px 30px -8px rgba(0,0,0,.6),0 46px 90px -20px rgba(0,0,0,.8),0 70px 140px -40px rgba(168,85,247,.28),0 0 0 1px rgba(0,0,0,.6)}
.xr-stage:after{content:"";position:absolute;inset:0;z-index:5;pointer-events:none;border-radius:inherit;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -1px 0 rgba(0,0,0,.6),inset 1px 0 0 rgba(255,255,255,.08),inset -1px 0 0 rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.04),inset 0 -40px 60px -30px rgba(0,0,0,.55),inset 0 30px 50px -36px rgba(255,255,255,.10);
 background:radial-gradient(600px 300px at var(--gx,50%) var(--gy,0%),rgba(255,255,255,.07),transparent 60%)}
@media(prefers-reduced-motion:reduce),(hover:none){.xr-show .xr-stage.xr-stage{transform:none}}
.xr-sl-soon{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:12px;font-weight:700;color:#fbbf24;border:1px solid rgba(251,191,36,.45);background:rgba(251,191,36,.08)}
.xr-sl-soon:before{content:"";width:8px;height:8px;border-radius:50%;background:#fbbf24;box-shadow:0 0 10px #fbbf24}
.xr-nav-b{position:absolute;top:calc(clamp(560px,82vh,860px)/2);transform:translateY(-50%);z-index:3;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(10,16,34,.55);color:#fff;font-size:26px;line-height:1;cursor:pointer;opacity:0;transition:opacity .2s,background .2s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.xr-nav-b.prev{left:34px}.xr-nav-b.next{right:34px}
.xr-show:hover .xr-nav-b,.xr-nav-b:focus-visible{opacity:1}.xr-nav-b:hover{background:rgba(34,225,255,.18)}
.xr-dots{display:flex;justify-content:center;gap:8px;margin:14px 0 0;padding:2px 2px 6px;overflow-x:auto;scrollbar-width:none}
.xr-dots::-webkit-scrollbar{display:none}
.xr-dot{position:relative;flex:none;display:inline-flex;align-items:center;gap:8px;padding:7px 14px 9px 7px;border-radius:12px;border:1px solid var(--line,rgba(120,170,255,.18));background:rgba(255,255,255,.03);color:#aab4d4;font:600 13px/1 Inter,system-ui,sans-serif;cursor:pointer;overflow:hidden;transition:background .2s,border-color .2s,color .2s}
.xr-dot img{width:26px;height:26px;border-radius:8px}
.xr-dot:hover{color:#fff;background:rgba(120,170,255,.08)}
.xr-dot.on{color:#fff;border-color:rgba(var(--t),.55);background:rgba(var(--t),.12)}
/* showcase strip v1: every product fits; centred when there is room, scrollable to both ends when there isn't */
.xr-dots.xr-dots{justify-content:flex-start}
.xr-dots>.xr-dot:first-child{margin-left:auto}.xr-dots>.xr-dot:last-child{margin-right:auto}
.xr-dots.tight .xr-dot:not(.on) span{display:none}
.xr-dots.tight .xr-dot:not(.on){padding:7px 7px 9px}
.xr-dot i{position:absolute;left:0;bottom:0;height:3px;width:0;background:rgb(var(--t))}
.xr-dot.on i{animation:xrshowfill ${SECS}s linear forwards}
.xr-show.held .xr-dot.on i{animation-play-state:paused}
@keyframes xrshowfill{to{width:100%}}
/* scenes: the SkyHere radar, product postcards, and a fallback for a product with no picture yet */
.xr-sc>div{position:absolute;inset:0}
.xr-sc .radar{position:absolute;inset:auto;left:64%;top:50%;height:90%;width:auto;max-width:none;aspect-ratio:1;transform:translate(-50%,-50%);margin:0}
.sc-pic img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;transform:scale(1.07);transition:transform 7s ease-out}
.xr-sl.on .sc-pic img{transform:scale(1)}
/* home showcase v3.3: same width as the sections below, 16:9 so the pictures show whole (no stretching or heavy cropping) */
@media(min-width:821px){
.xr-show.xr-show{box-sizing:border-box!important;width:auto!important;max-width:var(--xr-w,1180px)!important;margin:12px auto 0!important;padding:0!important}
.xr-show.xr-show .xr-stage{width:100%!important;height:auto!important;aspect-ratio:16/9!important;max-height:calc(100vh - 140px)!important}
.xr-show.xr-show .xr-nav-b{top:var(--xr-mid,50%)!important}
.xr-show.xr-show .xr-nav-b.prev{left:16px!important}.xr-show.xr-show .xr-nav-b.next{right:16px!important}
.xr-show .sc-pic img{transform:none!important}
}
/* home showcase v3.2: BlockRush 3D glass picture effects */
.sc-b3x img{object-position:70% 50%}
.sc-b3x .gl{position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.0) 44%,rgba(190,240,255,.28) 49%,rgba(255,255,255,.08) 52%,transparent 58%);background-size:250% 100%;background-repeat:no-repeat;mix-blend-mode:screen;animation:xrb3gl 4.5s ease-in-out infinite 0.6s}
@keyframes xrb3gl{0%{background-position:130% 0}55%,100%{background-position:-40% 0}}
.sc-b3x .pulse{position:absolute;left:66%;top:74%;width:34%;height:30%;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(255,236,190,.55),rgba(255,180,90,.18) 55%,transparent);mix-blend-mode:screen;animation:xrb3pulse 2.4s ease-in-out infinite}
@keyframes xrb3pulse{0%,100%{opacity:.25;transform:translate(-50%,-50%) scale(.85)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}
.sc-b3x .sp{position:absolute;inset:0;pointer-events:none}
.sc-b3x .sp b{position:absolute;bottom:24%;width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px rgba(150,230,255,.9);opacity:0;animation:xrb3sp var(--d,4s) ease-out infinite}
@keyframes xrb3sp{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1}100%{transform:translateY(-260px) scale(1.2);opacity:0}}
@media(max-width:820px){.sc-b3x .pulse{display:none}.sc-b3x img{object-position:68% 50%}}
.sc-gen{display:grid;place-items:center}.sc-gen img{width:180px;height:180px;border-radius:40px;box-shadow:0 20px 60px rgba(var(--t),.5)}
.sc-gen .o{position:absolute;left:50%;top:50%;border-radius:50%;border:1px dashed rgba(var(--t),.5);animation:xrrot 20s linear infinite}.sc-gen .o1{width:320px;height:320px;margin:-160px}.sc-gen .o2{width:480px;height:480px;margin:-240px;animation-direction:reverse}
@keyframes xrrot{to{transform:rotate(360deg)}}
@media(max-width:820px){.xr-show{padding:0 12px}.xr-stage{height:min(760px,86vh);border-radius:22px}.xr-sc:after{background:linear-gradient(0deg,rgba(4,7,16,.92) 0,rgba(4,7,16,.6) 30%,rgba(4,7,16,0) 58%)}.xr-sc .radar{left:50%;top:36%;height:auto;width:92%}.xr-sl-txt{width:100%;padding:0 20px 24px}.xr-sl h2{font-size:clamp(34px,10vw,48px)}.xr-hl{margin-bottom:14px}.xr-hl li{font-size:12.5px;padding:5px 10px}.xr-nav-b{display:none}.xr-dots{justify-content:flex-start}.xr-dot span{display:none}.xr-dot{padding:6px 6px 9px}}
/* home showcase v3.1: edge to edge (wider than the sections below) and fills the screen height */
@media(min-width:821px){
.xr-show{box-sizing:border-box!important;width:calc(100vw - var(--xr-sbw,0px))!important;max-width:none!important;margin:8px 0 0 calc(50% - (100vw - var(--xr-sbw,0px))/2)!important;padding:0 clamp(12px,1.6vw,28px)!important}
.xr-stage{height:clamp(600px,calc(100vh - 150px),1000px)!important;width:100%!important;max-width:none!important}
.xr-nav-b{top:calc(clamp(600px,calc(100vh - 150px),1000px)/2)!important}
.xr-nav-b.prev{left:calc(clamp(12px,1.6vw,28px) + 18px)!important}.xr-nav-b.next{right:calc(clamp(12px,1.6vw,28px) + 18px)!important}
}
@media(prefers-reduced-motion:reduce){.xr-sc *{animation-duration:0s!important;animation-iteration-count:1!important}.xr-sl,.xr-sl.on,.xr-sl-txt>*,.sc-pic img{transition-duration:.01s}}
</style>`);
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
/* menu fit v1: wider Products panel; the Coming soon column always fits inside it */
@media(min-width:821px){
.xr-mega:not(.one){width:min(1000px,calc(100vw - 32px))}
.xr-mega:not(.one) .xr-mega-in{grid-template-columns:minmax(0,1.7fr) minmax(0,1fr)}
.xr-mega-in>.xr-col,.xr-live>*,.xr-soonl>*,.xr-tile,.xr-t{min-width:0}
.xr-t b{flex-wrap:wrap;row-gap:3px}
.xr-note{white-space:normal;line-height:1.5}
}
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
