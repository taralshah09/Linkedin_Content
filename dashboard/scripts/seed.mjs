// Seeds all existing days/Day_N/ folders into MongoDB.
// Run from the dashboard/ dir:  npm run seed
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDayMarkdown } from "../lib/parseDay.js";

// Load env from .env.local (Node >= 20.12).
try {
  process.loadEnvFile(new URL("../.env.local", import.meta.url).pathname.replace(/^\//, ""));
} catch {
  try { process.loadEnvFile(".env.local"); } catch {}
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DAYS_DIR = path.resolve(__dirname, "../../days");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "linkedin_content";
if (!uri) {
  console.error("MONGODB_URI not set. Copy .env.example to .env.local first.");
  process.exit(1);
}

function pickImage(dir, n) {
  const candidates = [`Day_${n}.png`, "image.png", "image-1.png"];
  for (const c of candidates) {
    const p = path.join(dir, c);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(dbName).collection("days");
  await col.createIndex({ srNo: 1 }, { unique: true });

  const dayFolders = fs
    .readdirSync(DAYS_DIR)
    .filter((f) => /^Day_\d+$/.test(f))
    .sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)));

  let count = 0;
  for (const folder of dayFolders) {
    const n = parseInt(folder.slice(4), 10);
    const dir = path.join(DAYS_DIR, folder);
    const mdPath = path.join(dir, `Day_${n}.md`);
    if (!fs.existsSync(mdPath)) {
      console.warn(`skip ${folder}: no Day_${n}.md`);
      continue;
    }
    const md = fs.readFileSync(mdPath, "utf8");
    const parsed = parseDayMarkdown(md);

    const imgPath = pickImage(dir, n);
    let imageBase64 = null;
    let imageMime = null;
    if (imgPath) {
      imageBase64 = fs.readFileSync(imgPath).toString("base64");
      imageMime = "image/png";
    }

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
    count++;
    console.log(`seeded Day ${parsed.srNo ?? n} — ${parsed.title}${imgPath ? "" : "  (no image)"}`);
  }

  console.log(`\nDone. Upserted ${count} day(s) into ${dbName}.days`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
