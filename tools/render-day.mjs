// Render a Day_N.excalidraw file to PNG headlessly and embed it into Day_N.md
//
// Usage:
//   node tools/render-day.mjs 6            -> renders days/Day_6/Day_6.excalidraw
//   node tools/render-day.mjs Day_6
//   node tools/render-day.mjs path/to/file.excalidraw
//
// Flags:
//   --scale=2        export scale (default 2, sharper = higher)
//   --no-embed       just write the PNG, do not touch the .md
//
// Output: writes Day_N.png next to the source and inserts
//   ![Day N HLD](./Day_N.png) into Day_N.md (idempotent).

import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DAYS = path.join(ROOT, "days");
const LIB = path.join(__dirname, "vendor", "excalidraw-utils.mjs");

// ---- args ----------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const positional = argv.filter((a) => !a.startsWith("--"));
if (positional.length === 0) {
  console.error("usage: node tools/render-day.mjs <dayNumber | Day_N | path.excalidraw>");
  process.exit(1);
}

const scale = Number(flags.scale ?? 2);
const embed = !flags["no-embed"];

// ---- resolve the .excalidraw file ---------------------------------------
function resolveSource(arg) {
  if (arg.endsWith(".excalidraw")) return path.resolve(arg);
  const m = String(arg).match(/(\d+)/);
  if (!m) throw new Error(`cannot parse a day number from "${arg}"`);
  const n = m[1];
  return path.join(DAYS, `Day_${n}`, `Day_${n}.excalidraw`);
}

const src = resolveSource(positional[0]);
if (!fs.existsSync(src)) throw new Error(`file not found: ${src}`);
const dir = path.dirname(src);
const base = path.basename(src, ".excalidraw"); // Day_6
const pngPath = path.join(dir, `${base}.png`);
const mdPath = path.join(dir, `${base}.md`);

const scene = JSON.parse(fs.readFileSync(src, "utf8"));
const elements = scene.elements ?? [];
const files = scene.files ?? {};
const appState = scene.appState ?? {};
if (!elements.length) throw new Error(`no elements in ${src}`);

console.log(`> source : ${path.relative(ROOT, src)}`);
console.log(`> elements: ${elements.length}, scale: ${scale}`);

// ---- tiny local server so the browser can ESM-import the lib -------------
const libSource = fs.readFileSync(LIB, "utf8");
const html = `<!doctype html><meta charset="utf8"><body>
<script type="module">
  import { exportToBlob } from "/lib.mjs";
  window.__exportToBlob = exportToBlob;
  window.__ready = true;
</script></body>`;

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/lib.mjs")) {
    res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
    res.end(libSource);
  } else {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  }
});

async function main() {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: scale });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load" });
  await page.waitForFunction("window.__ready === true", { timeout: 30000 });

  const dataUrl = await page.evaluate(
    async ({ elements, appState, files, scale }) => {
      const blob = await window.__exportToBlob({
        elements,
        files,
        appState: {
          ...appState,
          exportBackground: true,
          exportWithDarkMode: appState.theme === "dark" || appState.exportWithDarkMode,
          exportScale: scale,
        },
        mimeType: "image/png",
        quality: 1,
      });
      return await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.readAsDataURL(blob);
      });
    },
    { elements, appState, files, scale }
  );

  await browser.close();
  server.close();

  if (errors.length) console.warn("  (page warnings)", errors.slice(0, 3));

  const b64 = dataUrl.split(",")[1];
  fs.writeFileSync(pngPath, Buffer.from(b64, "base64"));
  const kb = (fs.statSync(pngPath).size / 1024).toFixed(0);
  console.log(`> wrote  : ${path.relative(ROOT, pngPath)} (${kb} KB)`);

  if (embed && fs.existsSync(mdPath)) {
    embedIntoMarkdown(mdPath, `${base}.png`, base.replace("_", " "));
  } else if (embed) {
    console.log(`  (no ${path.basename(mdPath)} to embed into)`);
  }
}

function embedIntoMarkdown(md, pngName, title) {
  let text = fs.readFileSync(md, "utf8");
  const imgLine = `![${title} HLD](./${pngName})`;
  if (text.includes(`(./${pngName})`)) {
    console.log(`> md     : image already embedded, skipped`);
    return;
  }
  const block = `\n---\n\n## HLD diagram\n\n${imgLine}\n`;
  if (!text.endsWith("\n")) text += "\n";
  fs.writeFileSync(md, text + block);
  console.log(`> md     : embedded image into ${path.basename(md)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
