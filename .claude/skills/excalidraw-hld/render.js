/*
 * excalidraw-hld PNG renderer (headless, no MCP browser needed)
 * -------------------------------------------------------------
 * Renders a .excalidraw file to a PNG through excalidraw.com itself, so the
 * output matches Taral's hand-drawn / dark-canvas house style exactly.
 *
 * Usage:
 *   node render.js "D:/Linkedin_Content/days/Day_7/Day_7.excalidraw" [out.png]
 * If out.png is omitted it writes <same-name>.png next to the .excalidraw.
 *
 * Why this shape (learned the hard way, keep it):
 *  - The Playwright MCP browser tools are often NOT available in-session, but a
 *    full Chromium + `playwright-core` already ship on this machine. We drive
 *    Chromium directly from Node instead of relying on the MCP server.
 *  - Do NOT fetch the scene from a local HTTP server inside the page:
 *    excalidraw.com's CSP blocks cross-origin fetch (even from 127.0.0.1), so
 *    it fails with "Failed to fetch". Instead we read the file in Node and pass
 *    the elements array straight into page.evaluate() to seed localStorage.
 *  - The builder stores light-theme colors that only look right inverted, so we
 *    force Dark mode. We seed exportScale:3 / exportBackground / dark so the PNG
 *    comes out at 3x with the dark background baked in.
 *  - The headless save-file picker throws, but excalidraw calls toBlob() to
 *    build the full-res PNG *before* that failure, so we patch toBlob to capture
 *    the largest blob and read it back as base64.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const EXCALI = process.argv[2];
if (!EXCALI || !fs.existsSync(EXCALI)) {
  console.error('usage: node render.js <path-to.excalidraw> [out.png]');
  process.exit(2);
}
const OUTPNG = process.argv[3] || EXCALI.replace(/\.excalidraw$/i, '.png');

// --- locate playwright-core (bundled with a global tool, or installed) -------
function loadChromium() {
  const tries = [
    'playwright-core',
    'C:/nvm4w/nodejs/node_modules/openclaw/node_modules/playwright-core',
    path.join(process.env.APPDATA || '', 'npm/node_modules/playwright-core'),
  ];
  for (const p of tries) {
    try { return require(p).chromium; } catch (e) {}
  }
  // last resort: scan the global node_modules tree one level deep
  const roots = ['C:/nvm4w/nodejs/node_modules', path.join(process.env.APPDATA || '', 'npm/node_modules')];
  for (const root of roots) {
    try {
      for (const d of fs.readdirSync(root)) {
        const cand = path.join(root, d, 'node_modules/playwright-core');
        try { return require(cand).chromium; } catch (e) {}
      }
    } catch (e) {}
  }
  throw new Error('playwright-core not found');
}

// --- find the newest installed Chromium executable ---------------------------
function findChromeExe() {
  const base = path.join(os.homedir(), 'AppData/Local/ms-playwright');
  const dirs = fs.readdirSync(base)
    .filter(d => /^chromium-\d+$/.test(d))
    .sort((a, b) => parseInt(b.split('-')[1]) - parseInt(a.split('-')[1]));
  for (const d of dirs) {
    for (const sub of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe']) {
      const exe = path.join(base, d, sub);
      if (fs.existsSync(exe)) return exe;
    }
  }
  throw new Error('no installed chromium found under ' + base);
}

(async () => {
  const chromium = loadChromium();
  const CHROME = findChromeExe();
  const scene = JSON.parse(fs.readFileSync(EXCALI, 'utf8'));
  const elements = scene.elements;

  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 2 });
  page.on('console', m => { const t = m.text(); if (/\[dbg\]/.test(t)) console.log(t); });

  await page.goto('https://excalidraw.com', { waitUntil: 'networkidle', timeout: 120000 });

  // seed the scene directly (no in-page fetch: CSP blocks it). exportScale:3 +
  // dark background so "Export to PNG" produces a 3x dark-canvas image.
  const seeded = await page.evaluate((els) => {
    localStorage.setItem('excalidraw', JSON.stringify(els));
    localStorage.setItem('excalidraw-state', JSON.stringify({
      theme: 'dark', viewBackgroundColor: '#ffffff',
      exportScale: 3, exportBackground: true, exportWithDarkMode: true,
    }));
    return Array.isArray(els) ? els.length : -1;
  }, elements);
  console.log('[dbg] seeded elements:', seeded);

  await page.reload({ waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(2500);

  // ensure dark mode (Shift+Alt+D toggles theme)
  const isDark = async () => page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('excalidraw-state') || '{}').theme === 'dark'; } catch { return false; }
  });
  if (!(await isDark())) { await page.keyboard.press('Shift+Alt+D'); await page.waitForTimeout(800); }
  console.log('[dbg] dark mode:', await isDark());

  // patch toBlob to capture the largest PNG blob excalidraw builds
  await page.evaluate(() => {
    window.__capBlob = null;
    const orig = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (cb, type, q) {
      return orig.call(this, (blob) => {
        try { if (blob && (!window.__capBlob || blob.size > window.__capBlob.size)) window.__capBlob = blob; } catch (e) {}
        cb(blob);
      }, type, q);
    };
  });

  // open the Export image dialog and click "Export to PNG"
  await page.keyboard.press('Control+Shift+E');
  await page.waitForTimeout(1800);
  let clicked = false;
  for (const sel of ['button[aria-label="Export to PNG"]', 'button:has-text("PNG")', '[data-testid="export-to-png"]']) {
    try {
      const b = page.locator(sel).first();
      if (await b.count()) { await b.click({ timeout: 3000 }); clicked = true; console.log('[dbg] clicked', sel); break; }
    } catch (e) {}
  }
  console.log('[dbg] png button clicked:', clicked);
  await page.waitForTimeout(2500);

  // read the captured blob back as base64 (chunked to avoid call-stack limits)
  const b64 = await page.evaluate(async () => {
    if (!window.__capBlob) return null;
    const buf = new Uint8Array(await window.__capBlob.arrayBuffer());
    let s = ''; const CH = 0x8000;
    for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode.apply(null, buf.subarray(i, i + CH));
    return btoa(s);
  });
  await browser.close();

  if (!b64) { console.log('RESULT: NO_BLOB'); process.exit(3); }
  const bytes = Buffer.from(b64, 'base64');
  fs.writeFileSync(OUTPNG, bytes);
  const ok = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const w = bytes.readUInt32BE(16), h = bytes.readUInt32BE(20);
  console.log('RESULT: WROTE', OUTPNG, 'bytes=', bytes.length, 'validPNG=', ok, 'dims=', w + 'x' + h);
  if (!ok) process.exit(4);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
