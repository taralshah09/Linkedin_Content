// Uploads ONE day into MongoDB. Called by the daily content pipeline so the
// dashboard updates automatically. Usage (from the dashboard/ dir):
//   node scripts/upload-day.mjs 8
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDayMarkdown } from "../lib/parseDay.js";

try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url).pathname.replace(/^\//, ""));
} catch {
  try { process.loadEnvFile(".env.local"); } catch {}
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DAYS_DIR = path.resolve(__dirname, "../../days");

const n = parseInt(process.argv[2], 10);
if (!Number.isFinite(n)) {
  console.error("Usage: node scripts/upload-day.mjs <dayNumber>");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "linkedin_content";
if (!uri) {
  console.error("MONGODB_URI not set. Copy .env.example to .env.local first.");
  process.exit(1);
}

function pickImage(dir, num) {
  for (const c of [`Day_${num}.png`, "image.png", "image-1.png"]) {
    const p = path.join(dir, c);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const dir = path.join(DAYS_DIR, `Day_${n}`);
  const mdPath = path.join(dir, `Day_${n}.md`);
  if (!fs.existsSync(mdPath)) {
    console.error(`No file at ${mdPath}`);
    process.exit(1);
  }
  const parsed = parseDayMarkdown(fs.readFileSync(mdPath, "utf8"));

  const imgPath = pickImage(dir, n);
  let imageBase64 = null, imageMime = null;
  if (imgPath) {
    imageBase64 = fs.readFileSync(imgPath).toString("base64");
    imageMime = "image/png";
  }

  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(dbName).collection("days");
  await col.createIndex({ srNo: 1 }, { unique: true });

  await col.updateOne(
    { srNo: parsed.srNo ?? n },
    {
      $set: {
        ...parsed,
        srNo: parsed.srNo ?? n,
        imageBase64,
        imageMime,
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: { posted: false, createdAt: new Date().toISOString() },
    },
    { upsert: true }
  );

  console.log(`Uploaded Day ${parsed.srNo ?? n} — ${parsed.title}${imgPath ? "" : "  (no image)"}`);
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
