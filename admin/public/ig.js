// 📸 Instagram tab: posts from web/social/index.json, what the GitHub workflow published (social-log branch) and the
// owner's settings (Auto, posts a day, Hold, Post next run). Uses the admin session the page already has.
// Posts go out from the release only (www.xrainier.com): on admin-beta the tab is read-only and also lists the beta
// posts waiting for a release.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pane = $('p-ig'); if (!pane) return;
  let D = null, busy = false;
  const tok = () => sessionStorage.getItem('xa.token') || '';
  async function api(method, body) {
    const r = await fetch('/api/ig', { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || j.error || 'Error ' + r.status);
    return j;
  }
  const note = (m, bad) => { const t = $('toast'); if (!t) return alert(m); t.textContent = m; t.className = bad ? 'bad' : ''; t.style.display = 'block'; clearTimeout(note.t); note.t = setTimeout(() => (t.style.display = 'none'), bad ? 7000 : 3500); };
  const when = (t) => (t ? new Date(t).toLocaleString() : '');
  const ago = (t) => { if (!t) return 'never'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  const KIND = { image: '🖼 Photo', carousel: '🗂 Carousel', reel: '🎬 Reel' };
  const tags = (c) => (String(c || '').match(/#[\p{L}\p{N}_]+/gu) || []).length;

  function stateOf(p) {
    const L = (D.log && D.log.posts && D.log.posts[p.slug]) || {}, S = D.settings;
    if (L.status === 'published') return { k: 'ok', t: '✓ Published', sub: (L.via === 'auto' ? '🤖 Auto · ' : L.via === 'manual' ? '▶ Run by hand · ' : '📌 From the admin · ') + when(L.at), link: L.permalink };
    if (L.status === 'publishing') return { k: 'run', t: '⏳ Publishing', sub: 'Started ' + ago(L.startedAt) };
    if (L.status === 'invalid') return { k: 'bad', t: '⚠ Needs fixing', sub: L.error };
    if (S.hold.includes(p.slug)) return { k: 'hold', t: '⏸ On hold', sub: 'Will not be posted until you release it.' };
    if (L.status === 'failed') return { k: 'bad', t: '✕ Failed' + (L.tries ? ` (${L.tries}×)` : ''), sub: L.error };
    if (S.now.includes(p.slug)) return { k: 'next', t: '📌 Next run', sub: 'Goes out on the next run of the workflow.' };
    return { k: 'q', t: S.auto ? '🕒 Queued' : '⏸ Waiting', sub: S.auto ? 'Goes out automatically on the next run.' : 'Automatic posting is off: press Post next run.' };
  }
  function media(p) {
    const base = p.base || '', ms = Array.isArray(p.media) ? p.media : [];
    if (p.kind === 'reel' && ms[0]) return `<video class="igv" src="${esc(base + ms[0].path)}" ${p.cover ? `poster="${esc(base + p.cover)}"` : ''} controls playsinline preload="none"></video>`;
    return `<div class="igstrip">${ms.map((m, i) => `<a href="${esc(base + m.path)}" target="_blank" rel="noopener"><img src="${esc(base + m.path)}" alt="${esc((p.title || p.slug) + ' ' + (i + 1))}" loading="lazy"></a>`).join('')}</div>`;
  }
  function draw() {
    const S = D.settings, A = (D.log && D.log.account) || null, run = (D.log && D.log.run) || null, wf = D.workflow || {};
    const published = Object.values((D.log && D.log.posts) || {}).filter((x) => x.status === 'published');
    const day = published.filter((x) => Date.now() - (x.at || 0) < 864e5).length;
    const RO = !!D.readOnly, dis = RO ? 'disabled' : '', liveHost = String(D.liveAdmin || '').replace(/^https?:\/\//, '');
    let h = '';
    h += `<div class="card igrel"><b>🚀 Instagram posts go out from the release only</b> <span class="muted">· live site <a href="${esc(D.site)}" target="_blank" rel="noopener">${esc(String(D.site).replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>, branch <code>${esc(D.branch)}</code>. Beta never posts.</span>${RO ? `<p class="muted small" style="margin:6px 0 0">This is the beta admin, so this tab is read-only. Change Auto, Hold or Post next run in <a href="${esc(D.liveAdmin)}" target="_blank" rel="noopener">${esc(liveHost)} ↗</a>.</p>` : ''}</div>`;
    // set-up
    if (wf.installed === false) h += `<div class="card igsetup"><h3>🚀 One step to switch it on</h3>
      <p class="muted">Posting runs in GitHub Actions with the secrets you added (<code>IG_USER_ID</code>, <code>IG_ACCESS_TOKEN</code>). GitHub only lets a person add a workflow file, so add it once:</p>
      <ol><li>Press <b>Add the workflow on GitHub</b>: the file is filled in for you (<code>.github/workflows/instagram.yml</code> on <b>${esc(D.branch)}</b>).</li>
      <li>Press <b>Commit changes…</b> on GitHub. The first run starts by itself and posts what is queued below.</li></ol>
      <p>${wf.add ? `<a class="btn pri" href="${esc(wf.add)}" target="_blank" rel="noopener">Add the workflow on GitHub ↗</a>` : ''} <a class="btn" href="${esc(wf.template)}" target="_blank" rel="noopener">See the file ↗</a> <a class="btn" href="${esc(wf.secrets)}" target="_blank" rel="noopener">Secrets ↗</a></p></div>`;
    // connection + settings
    h += `<div class="card"><h3>📸 Instagram <span class="sp"></span><a class="btn" href="${esc(wf.page)}" target="_blank" rel="noopener" title="Open the workflow on GitHub and press Run workflow">▶ Run now on GitHub ↗</a> <button class="btn" id="igRe">↻</button></h3>
      <div class="igconn">${A ? (A.ok ? `<span class="igdot ok"></span><b>Connected as @${esc(A.username || A.userId)}</b> <span class="muted">· ${A.kind === 'facebook' ? 'Facebook (EAA…) token' : 'Instagram (IGAA…) token'} · checked ${ago(A.checkedAt)}${A.quota ? ` · ${A.quota.used}/${A.quota.total} API posts in 24 h` : ''}</span>`
        : `<span class="igdot bad"></span><b>Not connected</b> <span class="bad">${esc(A.error)}</span>`) : `<span class="igdot"></span><b>No run yet.</b> <span class="muted">${wf.installed === false ? 'Add the workflow above.' : 'It connects on the first run of the workflow.'}</span>`}</div>
      ${A && A.tokenWarning ? `<p class="warnbox">⚠ ${esc(A.tokenWarning)}</p>` : ''}
      ${run ? `<p class="muted small">Last run ${ago(run.t)} on ${esc(run.branch || '')} (${esc(run.site || '')})${run.dry ? ' · dry run' : ''}${run.url ? ` · <a href="${esc(run.url)}" target="_blank" rel="noopener">log ↗</a>` : ''}. Settings from ${run.settingsFrom === 'admin' ? 'the release admin' : 'index.json'}.</p>` : ''}
      <div class="igset"><label class="sw"><input type="checkbox" id="igAuto" ${S.auto ? 'checked' : ''} ${dis}> 🤖 Post new ones automatically</label>
        <label>Posts a day <input type="number" id="igMax" min="1" max="25" value="${esc(S.maxPerDay)}" ${dis}></label>
        <label>Minutes between posts <input type="number" id="igGap" min="0" max="1440" value="${esc(S.gapMinutes)}" ${dis}></label>
        <span class="muted small">${day} posted in the last 24 h${S.set ? '' : ' · not saved yet: the defaults in web/social/index.json apply'}</span></div>
      <p class="muted small" style="margin:10px 0 0">The workflow runs when posts are released to ${esc(D.branch)}, every 2 hours and when you press Run now. A post is never published twice.</p></div>`;
    // posts
    h += `<div class="card"><h3>Posts <span class="muted small">(released: web/social/index.json on ${esc(D.site)})</span></h3>${D.indexError ? `<p class="bad">${esc(D.indexError)}</p>` : ''}
      ${D.posts.map((p) => { const s = stateOf(p), cap = String(p.caption || ''), held = S.hold.includes(p.slug), nx = S.now.includes(p.slug), done = s.k === 'ok';
        return `<div class="igpost"><div class="igm">${media(p)}</div><div class="igb">
          <div class="igtop"><span class="tag igk">${KIND[p.kind] || esc(p.kind)}</span><b>${esc(p.title || p.slug)}</b><span class="igst ${s.k}">${esc(s.t)}</span></div>
          <div class="muted small">${esc(p.slug)} · ${cap.length} / 2,200 characters · ${tags(cap)} / 30 hashtags${p.added ? ' · added ' + esc(p.added) : ''}</div>
          ${s.sub ? `<div class="small ${s.k === 'bad' ? 'bad' : 'muted'}" style="margin-top:4px">${esc(s.sub)}</div>` : ''}
          <details><summary>Caption</summary><pre class="igcap">${esc(cap)}</pre></details>
          <div class="igact">${done ? (s.link ? `<a class="btn go" href="${esc(s.link)}" target="_blank" rel="noopener">Open on Instagram ↗</a>` : '') : `
            <button class="btn" data-hold="${esc(p.slug)}" ${dis}>${held ? '▶ Release' : '⏸ Hold'}</button>
            <button class="btn ${nx ? '' : 'pri'}" data-now="${esc(p.slug)}" ${held || RO ? 'disabled' : ''}>${nx ? '✕ Not next run' : '📌 Post next run'}</button>`}
            <button class="btn" data-copy="${esc(p.slug)}">📋 Copy caption</button></div></div></div>`; }).join('') || '<p class="muted">No posts yet. Add them to web/social/index.json (docs/INSTAGRAM.md).</p>'}</div>`;
    // beta posts not released yet
    if ((D.waiting || []).length) h += `<div class="card"><h3>On beta, waiting for release <span class="muted small">(${D.waiting.length})</span></h3>
      <p class="muted small">Preview only. They go to Instagram after you release beta to the live site.</p>
      ${D.waiting.map((p) => `<div class="igpost"><div class="igm">${media(p)}</div><div class="igb"><div class="igtop"><span class="tag igk">${KIND[p.kind] || esc(p.kind)}</span><b>${esc(p.title || p.slug)}</b><span class="igst hold">🚀 After release</span></div>
        <div class="muted small">${esc(p.slug)} · ${String(p.caption || '').length} / 2,200 characters · ${tags(p.caption)} / 30 hashtags</div>
        <details><summary>Caption</summary><pre class="igcap">${esc(p.caption || '')}</pre></details></div></div>`).join('')}</div>`;
    // history
    const evs = (D.log && D.log.events) || [];
    h += `<div class="card"><h3>History</h3><table><thead><tr><th>When</th><th>Post</th><th>What happened</th></tr></thead><tbody>${evs.slice(0, 40).map((e) => `<tr><td>${esc(when(e.t))}</td><td><code>${esc(e.slug || '—')}</code></td><td>${e.what === 'published' ? `✓ Published${e.permalink ? ` · <a href="${esc(e.permalink)}" target="_blank" rel="noopener">open ↗</a>` : ''}` : e.what === 'failed' ? `<span class="bad">✕ ${esc(e.error)}</span>` : esc(e.what + (e.error ? ': ' + e.error : ''))}${e.run ? ` · <a href="${esc(e.run)}" target="_blank" rel="noopener">run ↗</a>` : ''}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Nothing published yet.</td></tr>'}</tbody></table></div>`;
    pane.innerHTML = h;
    const put = async (body, msg) => { if (busy || RO) return; busy = true; try { const j = await api('PUT', body); D.settings = j.settings; draw(); note(msg); } catch (e) { note(e.message, 1); } finally { busy = false; } };
    $('igRe').onclick = () => load();
    $('igAuto').onchange = (e) => put({ auto: e.target.checked }, e.target.checked ? '🤖 New posts go out automatically.' : 'Automatic posting is off. Use 📌 Post next run.');
    $('igMax').onchange = (e) => put({ maxPerDay: +e.target.value }, 'Saved.');
    $('igGap').onchange = (e) => put({ gapMinutes: +e.target.value }, 'Saved.');
    pane.querySelectorAll('[data-hold]').forEach((b) => (b.onclick = () => { const s = b.dataset.hold, on = !D.settings.hold.includes(s); put({ hold: { [s]: on }, ...(on ? { now: { [s]: false } } : {}) }, on ? 'On hold.' : 'Released.'); }));
    pane.querySelectorAll('[data-now]').forEach((b) => (b.onclick = () => { const s = b.dataset.now, on = !D.settings.now.includes(s); put({ now: { [s]: on } }, on ? '📌 It goes out on the next run. Press ▶ Run now on GitHub to run it right away.' : 'Removed from the next run.'); }));
    pane.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = async () => { const p = [...D.posts, ...(D.waiting || [])].find((x) => x.slug === b.dataset.copy); try { await navigator.clipboard.writeText(p.caption || ''); note('✓ Caption copied'); } catch (e) { note('Could not copy: ' + e.message, 1); } }));
  }
  async function load() {
    pane.innerHTML = '<div class="card muted">Loading Instagram…</div>';
    try { D = await api('GET'); draw(); } catch (e) { pane.innerHTML = `<div class="card bad">${esc(e.message)}</div>`; }
  }
  document.querySelectorAll('.tab[data-p="ig"]').forEach((b) => b.addEventListener('click', load));
})();
