// node --test tools/instagram/ig.test.mjs  (no network: Instagram is mocked)
import test from 'node:test';
import assert from 'node:assert/strict';
import { authFrom, graphHost, publish, plan, problemsOf, urlsOf, igCall, whoAmI } from './ig-api.mjs';

function mockIG(script) {
  const calls = [];
  const f = async (url, init = {}) => {
    const u = new URL(url), body = init.body ? Object.fromEntries(new URLSearchParams(init.body)) : {};
    calls.push({ method: init.method || 'GET', path: u.pathname, q: Object.fromEntries(u.searchParams), body });
    const out = script({ method: init.method || 'GET', path: u.pathname, q: Object.fromEntries(u.searchParams), body, n: calls.length });
    return { ok: !out.error, status: out.error ? 400 : 200, json: async () => out };
  };
  f.calls = calls; return f;
}
const post = (kind, n = 1) => ({ slug: 'p-' + kind, kind, caption: 'Hi #xrainier', media: Array.from({ length: n }, (_, i) => ({ path: `social/x/${kind === 'reel' ? 'v.mp4' : i + '.jpg'}`, type: kind === 'reel' ? 'video' : 'image' })), ...(kind === 'reel' ? { cover: 'social/x/c.jpg' } : {}) });

test('token kind picks the host; IG_API_HOST overrides', () => {
  assert.equal(graphHost({}, 'IGAAxyz'), 'https://graph.instagram.com');
  assert.equal(graphHost({}, 'EAAxyz'), 'https://graph.facebook.com');
  assert.equal(graphHost({ IG_API_HOST: 'graph.facebook.com' }, 'IGAA'), 'https://graph.facebook.com');
  assert.equal(authFrom({}), null);
});
test('errors never contain the token', async () => {
  const f = mockIG(() => ({ error: { message: 'bad token SECRET123 here' } }));
  await assert.rejects(igCall('/me', { api: 'https://graph.instagram.com/v21.0', token: 'SECRET123', fetchImpl: f }), (e) => !e.message.includes('SECRET123'));
});
test('EAA token needs IG_USER_ID', async () => {
  await assert.rejects(whoAmI(authFrom({ IG_ACCESS_TOKEN: 'EAAx' }), mockIG(() => ({}))), /IG_USER_ID/);
});
test('carousel: a container per item, then CAROUSEL, then media_publish and the permalink', async () => {
  const f = mockIG(({ method, path }) => method === 'POST' && path.endsWith('/media') ? { id: 'c' + Math.random().toString(36).slice(2, 6) }
    : method === 'POST' && path.endsWith('/media_publish') ? { id: 'M1' } : path.endsWith('/M1') ? { permalink: 'https://www.instagram.com/p/abc/' } : { status_code: 'FINISHED' });
  const a = authFrom({ IG_ACCESS_TOKEN: 'IGAAx', IG_USER_ID: '42' }), p = post('carousel', 3);
  const r = await publish(a, '42', p, urlsOf(p, 'https://beta.xrainier.com'), { fetchImpl: f, every: 0 });
  assert.equal(r.permalink, 'https://www.instagram.com/p/abc/');
  const posts = f.calls.filter((c) => c.method === 'POST');
  assert.equal(posts.filter((c) => c.body.is_carousel_item === 'true').length, 3);
  assert.equal(posts.find((c) => c.body.media_type === 'CAROUSEL').body.caption, 'Hi #xrainier');
  assert.equal(posts[0].body.image_url, 'https://beta.xrainier.com/social/x/0.jpg');
});
test('Reel: REELS container with cover, waits while IN_PROGRESS, fails on ERROR', async () => {
  let n = 0;
  const f = mockIG(({ method, path }) => method === 'POST' && path.endsWith('/media') ? { id: 'R' } : method === 'POST' ? { id: 'M2' } : path.endsWith('/R') ? { status_code: ++n < 3 ? 'IN_PROGRESS' : 'FINISHED' } : {});
  const a = authFrom({ IG_ACCESS_TOKEN: 'IGAAx' }), p = post('reel');
  await publish(a, '7', p, urlsOf(p, 'https://beta.xrainier.com/'), { fetchImpl: f, every: 0 });
  const c = f.calls.find((x) => x.body.media_type === 'REELS');
  assert.equal(c.body.cover_url, 'https://beta.xrainier.com/social/x/c.jpg'); assert.equal(c.body.share_to_feed, 'true');
  const g = mockIG(({ method }) => method === 'POST' ? { id: 'R' } : { status_code: 'ERROR', status: 'bad video' });
  await assert.rejects(publish(a, '7', p, urlsOf(p, 'https://x.y/'), { fetchImpl: g, every: 0 }), /bad video/);
});
test('plan: published, held, auto off, daily limit, gap, failed 3 times, manual run', () => {
  const P = ['a', 'b', 'c', 'd'].map((s) => ({ slug: s, problems: [] })), now = Date.now();
  assert.deepEqual(plan(P, { auto: true, maxPerDay: 3 }, { posts: { a: { status: 'published', at: now - 1000 } } }, { now }).go.map((p) => p.slug), ['b', 'c']);
  assert.deepEqual(plan(P, { auto: true, maxPerDay: 9, hold: ['b'] }, {}, { now }).go.map((p) => p.slug), ['a', 'c', 'd']);
  assert.deepEqual(plan(P, { auto: false, now: ['c'] }, {}, { now }).go.map((p) => p.slug), ['c']);
  assert.deepEqual(plan(P, { auto: true, maxPerDay: 9, gapMinutes: 60 }, {}, { now }).go.map((p) => p.slug), ['a']);
  assert.deepEqual(plan(P, { auto: true, maxPerDay: 9, gapMinutes: 60 }, { posts: { z: { status: 'published', at: now - 60000 } } }, { now }).go.length, 0);
  assert.deepEqual(plan(P, { auto: true, maxPerDay: 9 }, { posts: { a: { status: 'failed', tries: 3 } } }, { now }).go.map((p) => p.slug), ['b', 'c', 'd']);
  assert.deepEqual(plan(P, { auto: false, hold: ['d'] }, {}, { now, only: ['d'] }).go.map((p) => p.slug), ['d']);
  assert.deepEqual(plan([{ slug: 'x', problems: ['bad'] }], {}, {}, { now }).go.length, 0);
});
test('post checks: kinds, JPEG / MP4, carousel size, caption and hashtags', () => {
  assert.deepEqual(problemsOf(post('carousel', 3)), []);
  assert.deepEqual(problemsOf(post('reel')), []);
  assert.ok(problemsOf(post('carousel', 1)).length);
  assert.ok(problemsOf({ ...post('image'), media: [{ path: 'social/a.png', type: 'image' }] }).some((m) => /JPEG/.test(m)));
  assert.ok(problemsOf({ ...post('image'), caption: '#a '.repeat(31) }).some((m) => /hashtags/.test(m)));
  assert.ok(problemsOf({ ...post('image'), media: [{ path: '../x.jpg', type: 'image' }] }).length);
});
