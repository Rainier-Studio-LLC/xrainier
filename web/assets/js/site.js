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
  // ---------- home showcase v2: replaces the home hero; every product in turn with its own animated scene, 5 s each ----------
  let renderShow = () => {};
  const hero0 = (here === '' || here === 'index') && $('section.hero');
  if (hero0) {
    const SECS = 5;
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
      tankwar: () => '<div class="sc-tank"><i class="hz"></i><i class="hill a"></i><i class="hill b"></i><svg class="tk" viewBox="0 0 120 50"><path d="M10 38h100l-8 10H18z" fill="#1d2410"/><path d="M22 22h66l10 16H14z" fill="#2b3518"/><rect x="40" y="10" width="34" height="14" rx="4" fill="#33401c"/><rect x="72" y="14" width="44" height="4" rx="2" fill="#33401c"/></svg><i class="flash"></i>' +
        '<svg class="ret" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="none" stroke="rgba(190,255,120,.35)" stroke-width="1.5"/><path d="M100 20v62M100 118v62M20 100h62M118 100h62" stroke="rgba(190,255,120,.85)" stroke-width="1.5"/><path d="M100 100l-14 18M100 100l14 18M86 118h28" fill="none" stroke="rgba(190,255,120,.85)" stroke-width="1.5"/><path d="M60 140h80M70 150h60M80 160h40" stroke="rgba(190,255,120,.5)"/></svg><b class="rng">RANGE 1450 m · HEAT</b></div>',
      turbotoons: () => '<div class="sc-race"><i class="sun"></i><i class="hl a"></i><i class="hl b"></i><div class="road"><i></i></div><i class="sp s1"></i><i class="sp s2"></i><i class="sp s3"></i>' +
        '<svg class="car" viewBox="0 0 160 90"><ellipse cx="80" cy="84" rx="62" ry="6" fill="rgba(0,0,0,.35)"/><path d="M14 62q0-18 22-20l18-18q8-8 22-8h22q14 0 22 12l10 14q20 2 20 20v8H14z" fill="#fb7185"/><path d="M58 30q4-6 14-6h18q8 0 12 8l6 10H50z" fill="#bae6fd"/><circle cx="44" cy="70" r="13" fill="#111"/><circle cx="44" cy="70" r="5" fill="#fde047"/><circle cx="118" cy="70" r="13" fill="#111"/><circle cx="118" cy="70" r="5" fill="#fde047"/><rect x="138" y="52" width="8" height="5" rx="2" fill="#fde047"/></svg></div>',
      blockrush: () => { const C = ['#a855f7', '#22e1ff', '#f472b6', '#fbbf24', '#34d399']; let h = ''; for (let i = 0; i < 64; i++) { const r = i >> 3; const full = r === 5 || (r > 5 && Math.random() < .7) || (r === 4 && Math.random() < .35); h += '<i' + (full ? ' style="--c:' + C[i % 5] + '"' : '') + (r === 5 ? ' class="clr"' : '') + '></i>'; } return '<div class="sc-br"><div class="bd">' + h + '</div><div class="pc"><i></i><i></i><i></i><i></i></div><b class="cb">COMBO ×3</b></div>'; },
      blockrush3d: () => '<div class="sc-b3"><div class="cube"><i class="f bk"></i><i class="f lf"></i><i class="f rt"></i><i class="f bt"></i><div class="pz"><i class="s1"></i><i class="s2"></i><i class="s3"></i><i class="s4"></i><i class="s5"></i><i class="s6"></i></div></div></div>',
      landlord: () => { let t = ''; for (let i = 0; i < 24; i++) { const s = i < 7 ? [i, 0] : i < 13 ? [6, i - 6] : i < 19 ? [18 - i, 6] : [0, 24 - i]; t += '<i style="grid-area:' + (s[1] + 1) + '/' + (s[0] + 1) + ';--h:' + (i % 3 === 0 ? 1 : 0) + '"></i>'; } return '<div class="sc-ll"><div class="brd">' + t + '<b class="tok"></b><span class="town">🏠🏨🌲</span></div><div class="dice"><i class="d1">⚂</i><i class="d2">⚄</i></div></div>'; },
      memorylane: () => '<div class="sc-ml"><i class="ph p1"><b>2019</b></i><i class="ph p2"><b>2021</b></i><i class="ph p3"><b>2023</b></i><i class="ph p4"><b>Today</b></i><span class="cap">This place · this season · days like today</span></div>',
      starviewer: () => { let s = ''; for (let i = 0; i < 90; i++) s += '<i style="left:' + rnd(0, 100).toFixed(1) + '%;top:' + rnd(0, 100).toFixed(1) + '%;--z:' + rnd(1, 3).toFixed(1) + 'px;animation-delay:' + rnd(0, 4).toFixed(1) + 's"></i>'; return '<div class="sc-sv"><div class="sky">' + s + '</div><svg class="cn" viewBox="0 0 400 260"><path d="M40 120L110 100L170 110L220 130L250 190L340 200L350 140L250 130" fill="none" stroke="rgba(165,180,252,.8)" stroke-width="1.6"/><g fill="#fff"><circle cx="40" cy="120" r="3.5"/><circle cx="110" cy="100" r="3"/><circle cx="170" cy="110" r="3.5"/><circle cx="220" cy="130" r="3"/><circle cx="250" cy="190" r="3.5"/><circle cx="340" cy="200" r="3.5"/><circle cx="350" cy="140" r="3.5"/><circle cx="250" cy="130" r="3"/></g></svg><b class="lbl">Alioth · 81 light-years</b></div>'; },
      doodlehere: () => '<div class="sc-dd"><svg viewBox="0 0 400 260"><path class="d1" d="M300 70m-34 0a34 34 0 1 0 68 0a34 34 0 1 0-68 0" stroke="#fbbf24"/><path class="d2" d="M70 200V130l60-50 60 50v70z" stroke="#f472b6"/><path class="d3" d="M115 200v-40h30v40" stroke="#22e1ff"/><path class="d4" d="M250 210c0-30 0-50 0-60m0 0c-20-20-30 0-14 10m14-10c20-20 30 0 14 10" stroke="#34d399"/><path class="d5" d="M20 222c90-14 260-14 360 0" stroke="#a3e635"/></svg><b class="say">Sun! · ¡Sol! · 太阳!</b></div>',
      ridgehere: () => '<div class="sc-rh"><svg viewBox="0 0 400 260" preserveAspectRatio="none"><path class="m3" d="M0 190L60 140L110 160L170 90L215 120L260 60L310 115L360 95L400 130V260H0z"/><path class="m2" d="M0 210L50 180L120 200L190 150L250 185L320 160L400 190V260H0z"/><path class="m1" d="M0 235L80 215L160 230L240 205L320 228L400 215V260H0z"/></svg><b class="pk k1" style="left:65%;top:23%">Mount Rainier · 4,392 m</b><b class="pk k2" style="left:42%;top:34%">Little Tahoma · 3,383 m</b><b class="pk k3" style="left:88%;top:36%">Gibraltar Rock</b></div>',
    };
    const gen = (p) => '<div class="sc-gen"><i class="o o1"></i><i class="o o2"></i><img src="' + esc(p.icon) + '" alt=""></div>';
    const box = document.createElement('section');
    box.className = 'xr-show'; box.setAttribute('aria-roledescription', 'carousel'); box.setAttribute('aria-label', 'XRainier products');
    const h1 = $('h1', hero0);
    box.innerHTML = '<h1 class="xr-sr">' + esc(h1 ? h1.textContent.replace(/ +/g, ' ').trim() : 'XRainier') + '</h1><div class="xr-stage"></div><button class="xr-nav-b prev" type="button" aria-label="Previous product">&#8249;</button><button class="xr-nav-b next" type="button" aria-label="Next product">&#8250;</button><div class="xr-dots" role="tablist"></div>';
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
    };
    dots.addEventListener('animationend', (e) => { if (e.animationName === 'xrshowfill') go(at + 1); });
    dots.addEventListener('click', (e) => { const d = e.target.closest('.xr-dot'); if (d) go(+d.dataset.i); });
    $('.prev', box).addEventListener('click', () => go(at - 1));
    $('.next', box).addEventListener('click', () => go(at + 1));
    const hold = (on) => box.classList.toggle('held', on);
    box.addEventListener('mouseenter', () => hold(true)); box.addEventListener('mouseleave', () => hold(false));
    box.addEventListener('focusin', () => hold(true)); box.addEventListener('focusout', () => hold(false));
    document.addEventListener('visibilitychange', () => hold(document.hidden));
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
          '<div class="xr-sc">' + (SCENE[p.id] ? SCENE[p.id]() : gen(p)) + '</div>' +
          '<div class="xr-sl-txt"><span class="xr-sl-k"><img src="' + esc(p.icon) + '" alt="" onerror="this.remove()">' + esc(p.kind || 'APP') + (soon ? ' · COMING SOON' : '') + '</span>' +
          '<h2>' + esc(p.name) + '</h2><p class="xr-sl-line">' + esc(hl[0] || p.line) + '</p>' +
          (hl[1].length ? '<ul class="xr-hl">' + hl[1].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
          '<div class="xr-sl-cta"><a class="btn pri" href="' + esc(p.href) + '">' + (soon ? 'See what’s coming' : 'Explore ' + esc(p.name)) + ' →</a><a class="btn ghost" href="#products">All products</a></div></div></article>';
      }).join('');
      dots.innerHTML = list.map((p, i) => '<button class="xr-dot" type="button" role="tab" data-i="' + i + '" aria-label="' + esc(p.name) + '"><i></i></button>').join('');
      const k = list.findIndex((p) => p.id === curId);
      go(k < 0 ? 0 : k);
    };
    if (!$('#xr-show-css')) document.head.insertAdjacentHTML('beforeend', `<style id="xr-show-css">
.xr-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.xr-show{position:relative;max-width:1280px;margin:16px auto 10px;padding:0 20px}
.xr-stage{position:relative;height:clamp(540px,76vh,700px);border-radius:28px;overflow:hidden;border:1px solid var(--line,rgba(120,170,255,.18));background:#050915;box-shadow:0 30px 80px rgba(0,0,0,.4);touch-action:pan-y}
.xr-sl{position:absolute;inset:0;display:grid;grid-template-columns:minmax(300px,.72fr) 1.28fr;align-items:center;opacity:0;visibility:hidden;
 background:radial-gradient(60% 70% at 70% 50%,rgba(var(--t),.20),transparent 70%),radial-gradient(40% 50% at 0% 100%,rgba(var(--t),.10),transparent 70%),linear-gradient(135deg,#0a1022,#050812);transition:opacity 1s ease,visibility 0s linear 1s}
.xr-sl.on{opacity:1;visibility:visible;transition:opacity 1s ease,visibility 0s}
.xr-sl:not(.on) *{animation-play-state:paused!important}
.xr-sc{grid-column:2;grid-row:1;position:relative;height:100%;overflow:hidden;transform:scale(1.04);transition:transform 6s ease-out}
.xr-sl.on .xr-sc{transform:scale(1)}
.xr-sl-txt{grid-column:1;grid-row:1;position:relative;z-index:2;padding:40px 10px 40px 56px}
.xr-sl-txt>*{opacity:0;transform:translateY(14px);transition:opacity .7s ease,transform .8s cubic-bezier(.2,.7,.2,1)}
.xr-sl.on .xr-sl-txt>*{opacity:1;transform:none}
.xr-sl.on .xr-sl-txt>:nth-child(2){transition-delay:.08s}.xr-sl.on .xr-sl-txt>:nth-child(3){transition-delay:.16s}.xr-sl.on .xr-sl-txt>:nth-child(4){transition-delay:.26s}.xr-sl.on .xr-sl-txt>:nth-child(5){transition-delay:.36s}
.xr-sl-k{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.12em;padding:4px 12px 4px 4px;border-radius:999px;color:rgb(var(--t));border:1px solid rgba(var(--t),.45);background:rgba(var(--t),.08)}
.xr-sl-k img{width:24px;height:24px;border-radius:7px}
.xr-sl h2{margin:14px 0 6px;font-size:clamp(34px,4.6vw,58px);line-height:1;color:#fff;letter-spacing:-.01em}
.xr-sl-line{margin:0 0 16px;font-size:clamp(17px,1.6vw,21px);color:#dfe6ff}
.xr-hl{list-style:none;margin:0 0 22px;padding:0;display:grid;gap:8px}
.xr-hl li{display:flex;align-items:center;gap:10px;font-size:15px;color:#c3cce6}
.xr-hl li:before{content:"";width:8px;height:8px;border-radius:50%;flex:none;background:rgb(var(--t));box-shadow:0 0 10px rgb(var(--t))}
.xr-sl-cta{display:flex;gap:10px;flex-wrap:wrap}
.xr-nav-b{position:absolute;top:calc(clamp(540px,76vh,700px)/2);transform:translateY(-50%);z-index:3;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(10,16,34,.55);color:#fff;font-size:24px;line-height:1;cursor:pointer;opacity:0;transition:opacity .2s,background .2s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.xr-nav-b.prev{left:30px}.xr-nav-b.next{right:30px}
.xr-show:hover .xr-nav-b,.xr-nav-b:focus-visible{opacity:1}.xr-nav-b:hover{background:rgba(34,225,255,.18)}
.xr-dots{display:flex;justify-content:center;gap:8px;margin-top:14px}
.xr-dot{position:relative;width:28px;height:6px;padding:0;border:0;border-radius:6px;background:rgba(255,255,255,.16);cursor:pointer;overflow:hidden}
.xr-dot i{position:absolute;inset:0;width:0;background:var(--grad,linear-gradient(90deg,#22e1ff,#a855f7))}
.xr-dot.on{width:46px}.xr-dot.on i{animation:xrshowfill ${SECS}s linear forwards}
.xr-show.held .xr-dot.on i{animation-play-state:paused}
@keyframes xrshowfill{to{width:100%}}
/* scenes */
.xr-sc>div{position:absolute;inset:0}
.xr-sc .radar{position:absolute;inset:auto;left:50%;top:50%;width:min(88%,560px);height:auto;aspect-ratio:1;transform:translate(-50%,-50%);margin:0}
.sc-tank{background:radial-gradient(closest-side at 50% 50%,#3d4a22,#1a2010 70%,#050805 100%)}
.sc-tank .hz{position:absolute;left:0;right:0;top:0;height:55%;background:linear-gradient(#5b6a3a,#8a9a5a)}
.sc-tank .hill{position:absolute;bottom:30%;width:70%;height:30%;background:#4a5a2a;border-radius:50% 50% 0 0}.sc-tank .hill.a{left:-10%}.sc-tank .hill.b{right:-15%;height:24%;background:#55663a}
.sc-tank .tk{position:absolute;bottom:40%;width:120px;left:0;animation:xrtk 9s linear infinite alternate;filter:drop-shadow(0 4px 2px rgba(0,0,0,.4))}
.sc-tank .ret{position:absolute;left:50%;top:50%;width:min(70%,440px);transform:translate(-50%,-50%)}
.sc-tank:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,transparent 34%,rgba(0,0,0,.92) 36%)}
.sc-tank .flash{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px;border-radius:50%;background:radial-gradient(#fff7c2,#fbbf24 40%,transparent 70%);opacity:0;animation:xrflash 2.5s ease-out infinite 1.6s}
.sc-tank .rng{position:absolute;left:50%;bottom:16%;transform:translateX(-50%);z-index:2;font:600 12px/1 'JetBrains Mono',monospace;color:#bef264;letter-spacing:.1em}
@keyframes xrtk{from{left:22%}to{left:62%}}
@keyframes xrflash{0%{opacity:0;transform:scale(.4)}6%{opacity:1;transform:scale(1.2)}25%{opacity:0;transform:scale(2)}100%{opacity:0}}
.sc-race{background:linear-gradient(#ff9a8b 0%,#fbc2eb 35%,#a6c1ee 55%)}
.sc-race .sun{position:absolute;left:62%;top:14%;width:90px;height:90px;border-radius:50%;background:#fde68a;box-shadow:0 0 60px #fde68a}
.sc-race .hl{position:absolute;bottom:38%;width:80%;height:30%;border-radius:50% 50% 0 0;background:#34d399}.sc-race .hl.a{left:-20%}.sc-race .hl.b{right:-25%;background:#10b981;height:22%}
.sc-race .road{position:absolute;left:-30%;right:-30%;bottom:-10%;height:52%;perspective:300px}
.sc-race .road i{position:absolute;inset:0;transform:rotateX(62deg);transform-origin:bottom;background:linear-gradient(90deg,#fff 0 1.5%,#374151 1.5% 48.5%,#fbbf24 48.5% 51.5%,#374151 51.5% 98.5%,#fff 98.5%);background-size:100% 100%}
.sc-race .road i:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(#0000 0 40px,rgba(55,65,81,1) 40px 80px);background-size:100% 80px;-webkit-mask:linear-gradient(90deg,#0000 48.5%,#000 48.5% 51.5%,#0000 51.5%);mask:linear-gradient(90deg,#0000 48.5%,#000 48.5% 51.5%,#0000 51.5%);animation:xrroad .35s linear infinite}
@keyframes xrroad{to{background-position:0 80px}}
.sc-race .car{position:absolute;left:50%;bottom:9%;width:min(48%,300px);transform:translateX(-50%);animation:xrbounce .45s ease-in-out infinite alternate,xrsway 2.6s ease-in-out infinite alternate}
@keyframes xrbounce{to{bottom:11%}}
@keyframes xrsway{from{margin-left:-60px}to{margin-left:60px}}
.sc-race .sp{position:absolute;height:3px;width:120px;border-radius:3px;background:rgba(255,255,255,.8);animation:xrsp .7s linear infinite}
.sc-race .s1{top:58%;left:10%}.sc-race .s2{top:66%;left:70%;animation-delay:.25s}.sc-race .s3{top:74%;left:30%;animation-delay:.5s}
@keyframes xrsp{from{transform:translateX(60px);opacity:0}30%{opacity:1}to{transform:translateX(-160px);opacity:0}}
.sc-br{display:grid;place-items:center}
.sc-br .bd{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;width:min(70%,400px);aspect-ratio:1;padding:10px;border-radius:16px;background:rgba(10,14,30,.8);box-shadow:inset 0 0 0 1px rgba(168,85,247,.3),0 20px 60px rgba(168,85,247,.25)}
.sc-br .bd i{border-radius:6px;background:rgba(255,255,255,.05)}
.sc-br .bd i[style]{background:var(--c);box-shadow:inset 0 -4px 0 rgba(0,0,0,.25),inset 0 3px 0 rgba(255,255,255,.3)}
.sc-br .bd i.clr{animation:xrclr 2.5s ease-in-out infinite}
@keyframes xrclr{0%,40%{filter:none;transform:none;opacity:1}50%{filter:brightness(2.4);transform:scale(1.08)}65%{opacity:0;transform:scale(.3)}90%{opacity:0}100%{opacity:1}}
.sc-br .pc{position:absolute;left:50%;top:12%;display:grid;grid-template-columns:repeat(2,40px);gap:5px;animation:xrpc 2.5s ease-in-out infinite}
.sc-br .pc i{height:40px;border-radius:6px;background:#22e1ff;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25),0 10px 30px rgba(34,225,255,.5)}.sc-br .pc i:nth-child(4){background:transparent;box-shadow:none}
@keyframes xrpc{0%{transform:translate(120px,-20px) rotate(10deg);opacity:0}20%{opacity:1}45%{transform:translate(-40px,30px) rotate(0)}60%,100%{transform:translate(-40px,30px);opacity:0}}
.sc-br .cb{position:absolute;right:12%;top:18%;font:800 22px/1 Orbitron,sans-serif;color:#fbbf24;text-shadow:0 0 18px #fbbf24;animation:xrcb 2.5s ease-out infinite}
@keyframes xrcb{0%,45%{opacity:0;transform:scale(.6)}55%{opacity:1;transform:scale(1.15)}85%{opacity:0;transform:translateY(-20px)}100%{opacity:0}}
.sc-b3{display:grid;place-items:center;perspective:900px}
.sc-b3 .cube{position:relative;width:240px;height:240px;transform-style:preserve-3d;animation:xrspin 14s linear infinite}
.sc-b3 .f{position:absolute;inset:0;background:rgba(34,225,255,.05);border:2px solid rgba(34,225,255,.6);background-image:linear-gradient(rgba(34,225,255,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(34,225,255,.35) 1px,transparent 1px);background-size:48px 48px;box-shadow:0 0 30px rgba(34,225,255,.2) inset}
.sc-b3 .bk{transform:translateZ(-120px)}.sc-b3 .lf{transform:rotateY(90deg) translateZ(-120px)}.sc-b3 .rt{transform:rotateY(90deg) translateZ(120px)}.sc-b3 .bt{transform:rotateX(90deg) translateZ(-120px);background-color:rgba(34,225,255,.15)}
.sc-b3 .pz{position:absolute;left:96px;top:0;width:48px;height:48px;transform-style:preserve-3d;animation:xrfall 3s cubic-bezier(.5,0,.8,1) infinite}
.sc-b3 .pz i{position:absolute;inset:0;background:linear-gradient(135deg,#a855f7,#22e1ff);border:1px solid rgba(255,255,255,.5)}
.sc-b3 .s1{transform:translateZ(24px)}.sc-b3 .s2{transform:rotateY(180deg) translateZ(24px)}.sc-b3 .s3{transform:rotateY(90deg) translateZ(24px)}.sc-b3 .s4{transform:rotateY(-90deg) translateZ(24px)}.sc-b3 .s5{transform:rotateX(90deg) translateZ(24px)}.sc-b3 .s6{transform:rotateX(-90deg) translateZ(24px)}
@keyframes xrspin{from{transform:rotateX(-22deg) rotateY(0)}to{transform:rotateX(-22deg) rotateY(360deg)}}
@keyframes xrfall{0%{transform:translateY(-140px) rotateY(0);opacity:0}15%{opacity:1}80%{transform:translateY(192px) rotateY(180deg);opacity:1}100%{transform:translateY(192px) rotateY(180deg);opacity:0}}
.sc-ll{display:grid;place-items:center;perspective:1000px}
.sc-ll .brd{position:relative;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:4px;width:min(66%,380px);aspect-ratio:1;padding:8px;border-radius:18px;background:#5b6b2a;box-shadow:0 30px 60px rgba(0,0,0,.5),inset 0 0 0 6px #3f4d1c;transform:rotateX(55deg) rotateZ(-35deg);transform-style:preserve-3d;animation:xrll 16s linear infinite alternate}
.sc-ll .brd i{border-radius:4px;background:#f5efe0;box-shadow:inset 0 -3px 0 rgba(0,0,0,.15)}
.sc-ll .brd i[style*="--h:1"]{background:linear-gradient(#34d399 0 30%,#f5efe0 30%)}
.sc-ll .town{grid-area:3/3/6/6;display:grid;place-items:center;font-size:44px;transform:translateZ(20px)}
.sc-ll .tok{position:absolute;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#ef4444 45%,#7f1d1d);box-shadow:0 6px 8px rgba(0,0,0,.4);transform:translateZ(14px);animation:xrtok 8s linear infinite}
@keyframes xrtok{0%{left:4%;top:4%}25%{left:88%;top:4%}50%{left:88%;top:88%}75%{left:4%;top:88%}100%{left:4%;top:4%}}
@keyframes xrll{to{transform:rotateX(55deg) rotateZ(-55deg)}}
.sc-ll .dice{position:absolute;right:10%;bottom:10%;display:flex;gap:10px}
.sc-ll .dice i{display:grid;place-items:center;width:58px;height:58px;border-radius:12px;background:#fff;color:#111;font-size:54px;font-style:normal;line-height:1;box-shadow:0 10px 24px rgba(0,0,0,.45);animation:xrdice 2.5s cubic-bezier(.3,1.4,.5,1) infinite}
.sc-ll .dice .d2{animation-delay:.12s}
@keyframes xrdice{0%{transform:translate(-80px,-60px) rotate(-200deg)}40%,100%{transform:none}}
.sc-ml{display:grid;place-items:center}
.sc-ml .ph{position:absolute;left:50%;top:50%;width:min(44%,280px);aspect-ratio:4/5;margin-left:calc(min(44%,280px)/-2);margin-top:calc(min(44%,280px)*-.62);padding:10px 10px 38px;border-radius:6px;background:#fbf7ee;box-shadow:0 20px 40px rgba(0,0,0,.45);animation:xrph 8s ease-in-out infinite}
.sc-ml .ph:before{content:"";display:block;height:100%;border-radius:3px;background:var(--g);background-size:130% 130%;animation:xrkb 8s ease-in-out infinite alternate}
.sc-ml .ph b{position:absolute;left:0;right:0;bottom:10px;text-align:center;font:600 14px/1 'JetBrains Mono',monospace;color:#555}
.sc-ml .p1{--g:linear-gradient(160deg,#fde68a,#f97316 55%,#7c2d12);--r:-14deg;--x:-120px}
.sc-ml .p2{--g:linear-gradient(180deg,#7dd3fc,#e0f2fe 45%,#0e7490 46%,#155e75);--r:-5deg;--x:-40px;animation-delay:.3s}
.sc-ml .p3{--g:linear-gradient(170deg,#bbf7d0,#22c55e 50%,#14532d);--r:6deg;--x:40px;animation-delay:.6s}
.sc-ml .p4{--g:linear-gradient(200deg,#fbcfe8,#c084fc 50%,#312e81);--r:13deg;--x:120px;animation-delay:.9s}
@keyframes xrph{0%,6%{transform:translate(0,30px) rotate(0) scale(.9);opacity:0}18%,80%{transform:translate(var(--x),0) rotate(var(--r));opacity:1}100%{transform:translate(var(--x),0) rotate(var(--r));opacity:1}}
@keyframes xrkb{to{background-position:100% 100%}}
.sc-ml .cap{position:absolute;bottom:9%;left:0;right:0;text-align:center;color:#fde68a;font-size:15px;letter-spacing:.04em}
.sc-sv{background:radial-gradient(ellipse at 50% 120%,#1e1b4b,#050714 60%)}
.sc-sv .sky{position:absolute;inset:-20%;animation:xrrot 80s linear infinite}
.sc-sv .sky i{position:absolute;width:var(--z);height:var(--z);border-radius:50%;background:#fff;box-shadow:0 0 6px #fff;animation:xrtw 3s ease-in-out infinite alternate}
@keyframes xrtw{from{opacity:.25}to{opacity:1}}
@keyframes xrrot{to{transform:rotate(360deg)}}
.sc-sv .cn{position:absolute;left:8%;top:18%;width:84%}
.sc-sv .cn path{stroke-dasharray:900;stroke-dashoffset:900;animation:xrdraw 5s ease-out infinite}
.sc-sv .cn circle{filter:drop-shadow(0 0 6px #c7d2fe)}
.sc-sv .lbl{position:absolute;left:58%;top:70%;padding:6px 12px;border-radius:999px;font-size:13px;color:#e0e7ff;background:rgba(129,140,248,.18);border:1px solid rgba(165,180,252,.5);animation:xrpop 5s ease-out infinite}
@keyframes xrdraw{0%{stroke-dashoffset:900}60%,100%{stroke-dashoffset:0}}
@keyframes xrpop{0%,55%{opacity:0;transform:translateY(8px)}65%,100%{opacity:1;transform:none}}
.sc-dd{background:#fffaf0;background-image:radial-gradient(rgba(0,0,0,.06) 1px,transparent 1px);background-size:18px 18px}
.sc-dd svg{position:absolute;left:6%;top:8%;width:88%;height:84%}
.sc-dd path{fill:none;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:600;stroke-dashoffset:600;animation:xrdraw2 5s ease-in-out infinite}
.sc-dd .d2{animation-delay:.6s}.sc-dd .d3{animation-delay:1.2s}.sc-dd .d4{animation-delay:1.6s}.sc-dd .d5{animation-delay:.2s}
@keyframes xrdraw2{0%{stroke-dashoffset:600}50%,100%{stroke-dashoffset:0}}
.sc-dd .say{position:absolute;right:8%;top:40%;padding:8px 14px;border-radius:16px 16px 16px 4px;background:#fff;color:#be185d;font-size:16px;box-shadow:0 8px 20px rgba(0,0,0,.15);animation:xrpop 5s ease-out infinite}
.sc-rh{background:linear-gradient(#0f172a,#1e3a5f 45%,#f59e0b 100%)}
.sc-rh svg{position:absolute;inset:0;width:100%;height:100%}
.sc-rh .m3{fill:#334155;animation:xrpar 12s ease-in-out infinite alternate}.sc-rh .m2{fill:#1e293b;animation:xrpar 9s ease-in-out infinite alternate-reverse}.sc-rh .m1{fill:#0b1220}
@keyframes xrpar{to{transform:translateX(-12px)}}
.sc-rh .pk{position:absolute;transform:translate(-50%,-140%);padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;color:#ccfbf1;background:rgba(13,148,136,.35);border:1px solid rgba(45,212,191,.6);white-space:nowrap;animation:xrpop 5s ease-out infinite}
.sc-rh .pk:after{content:"";position:absolute;left:50%;top:100%;height:26px;border-left:1px dashed rgba(45,212,191,.8)}
.sc-rh .k2{animation-delay:.5s}.sc-rh .k3{animation-delay:1s}
.sc-gen{display:grid;place-items:center}.sc-gen img{width:160px;height:160px;border-radius:36px;box-shadow:0 20px 60px rgba(var(--t),.5)}
.sc-gen .o{position:absolute;left:50%;top:50%;border-radius:50%;border:1px dashed rgba(var(--t),.5);animation:xrrot 20s linear infinite}.sc-gen .o1{width:300px;height:300px;margin:-150px}.sc-gen .o2{width:440px;height:440px;margin:-220px;animation-direction:reverse}
.xr-sc:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#070b18 0,rgba(7,11,24,0) 22%)}
@media(max-width:820px){.xr-stage{height:min(760px,92vh)}.xr-sl{grid-template-columns:1fr;grid-template-rows:56% 44%}.xr-sc{grid-column:1;grid-row:1}.xr-sc:after{background:linear-gradient(0deg,#070b18 0,rgba(7,11,24,0) 25%)}.xr-sl-txt{grid-row:2;align-self:start;padding:6px 22px 22px}.xr-hl{margin-bottom:14px}.xr-hl li{font-size:14px}.xr-nav-b{display:none}.xr-show{padding:0 12px}}
@media(prefers-reduced-motion:reduce){.xr-sc *{animation-duration:0s!important;animation-iteration-count:1!important}.xr-sl,.xr-sl.on,.xr-sl-txt>*,.xr-sc{transition-duration:.01s}}
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
