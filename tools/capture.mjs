// Takes real screenshots of SkyHere for the XRainier site and saves them to ../web/assets/shots/.
// One-time setup (in this tools folder):  npm install   then   npx playwright install --with-deps chromium
// Run:  node capture.mjs
// Options (environment variables):
//   SITE=https://skyabove.xrainier.com   LAT=47.45 LON=-122.30 (where the radar looks; default: near Seattle–Tacoma airport)
//   SKYLINK=<id>      a Sky Link id to capture link.html (optional)
//   HEADED=1          show the browser while it works
//   TOKEN=<token>     your SkyHere sign-in token (Pro), so 2D/3D replay is captured too. In SkyHere on your PC: F12 → Console →
//                     copy(localStorage.getItem('skyabove.token'))   then paste it after TOKEN=
import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SITE = (process.env.SITE || 'https://skyabove.xrainier.com').replace(/\/$/, '');
const LAT = +(process.env.LAT || 47.45), LON = +(process.env.LON || -122.30);
const OUT = fileURLToPath(new URL('../web/assets/shots/', import.meta.url));
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: !process.env.HEADED, args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] });
const ctxOpts = { geolocation: { latitude: LAT, longitude: LON }, permissions: ['geolocation'], colorScheme: 'dark', locale: 'en-US', timezoneId: 'America/Los_Angeles' };
const shot = async (page, name) => { await page.screenshot({ path: OUT + name, type: 'jpeg', quality: 82 }); console.log('✔', name); };
const step = async (name, fn) => { try { await fn(); } catch (e) { console.log('✘', name, '-', String(e.message).split('\n')[0]); } };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- desktop ----
const desk = await browser.newContext({ ...ctxOpts, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
if (process.env.TOKEN) await desk.addInitScript((t) => { try { localStorage.setItem('skyabove.token', t); } catch (e) {} }, process.env.TOKEN.trim());
const page = await desk.newPage();
let replayHref = null;

await step('radar.jpg', async () => {
  await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.card', { timeout: 60000 });
  await pause(5000);
  await shot(page, 'radar.jpg');
});

await step('flight.jpg', async () => {
  await page.locator('.card').first().click();
  await pause(5000);
  await shot(page, 'flight.jpg');
  const a = page.locator('a[href*="replay.html"]').first();
  if (await a.count()) replayHref = await a.getAttribute('href');
});

await step('spotters.jpg', async () => {
  const s = page.getByText(/Spotters/).first();
  await s.scrollIntoViewIfNeeded();
  await pause(1500);
  await shot(page, 'spotters.jpg');
});

await step('showcase.jpg', async () => {
  await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.card', { timeout: 60000 });
  await pause(3000);
  await page.locator('#showBtn').click();
  await pause(6000);
  await shot(page, 'showcase.jpg');
});

await step('replay2d.jpg + replay3d.jpg', async () => {
  if (!replayHref) throw new Error(process.env.TOKEN ? 'no replay link found in the flight panel' : 'replay is Pro: run again with TOKEN=… (see the top of this file)');
  const u = new URL(replayHref, SITE + '/').href;
  await page.goto(u, { waitUntil: 'domcontentloaded' });
  await pause(9000);
  await shot(page, 'replay2d.jpg');
  await page.goto(u + (u.includes('?') ? '&' : '?') + 'view=3d', { waitUntil: 'domcontentloaded' });
  await pause(15000);
  await shot(page, 'replay3d.jpg');
});

if (process.env.SKYLINK) {
  await step('skylink.jpg', async () => {
    await page.goto(`${SITE}/link.html?id=${encodeURIComponent(process.env.SKYLINK)}`, { waitUntil: 'domcontentloaded' });
    await pause(8000);
    await shot(page, 'skylink.jpg');
  });
}
await desk.close();

// ---- phone ----
await step('radar-phone.jpg', async () => {
  const ph = await browser.newContext({ ...devices['iPhone 14 Pro'], ...ctxOpts });
  const p = await ph.newPage();
  await p.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.card', { timeout: 60000 });
  await pause(5000);
  await shot(p, 'radar-phone.jpg');
  await ph.close();
});

await browser.close();
console.log("\nDone. Check the pictures in web/assets/shots/, retake any you don't like (HEADED=1 shows the browser), then commit them.");
