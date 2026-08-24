# Content Dashboard

A Next.js dashboard (frontend + API) that lists your daily content from MongoDB.
Each row: **Sr no · Title · LinkedIn post · X post · Image (downloadable)** with
copy-to-clipboard on the title, LinkedIn post, and X post. Mark a day **Posted**
and it saves to the DB instantly and drops to the bottom (dimmed). Light theme,
mobile-responsive.

## Tech
- Next.js 15 (App Router) — frontend **and** API routes in one app
- MongoDB (Atlas) — collection `days`, one doc per day, image stored as base64
- No other services; deploys as a single app to Vercel

## Local setup
```bash
cd dashboard
npm install
# .env.local already contains your MONGODB_URI + MONGODB_DB
node scripts/seed.mjs      # loads days/Day_1..N into MongoDB (run once)
npm run dev                # http://localhost:3000
```
> On Windows, if `npm run seed` fails with "node is not recognized", call the
> script directly: `node scripts/seed.mjs`.

## Adding a new day
The daily pipeline (see `../master-prompt.md`, step 8) auto-uploads. To do it manually:
```bash
node scripts/upload-day.mjs 9    # reads days/Day_9 and upserts it
```
The site reads live from the DB, so new rows appear on next load — no redeploy.

## Deploy to Vercel
1. Push this `dashboard/` folder to a GitHub repo (or `vercel` CLI from here).
2. On https://vercel.com → **New Project** → import the repo. Set **Root Directory**
   to `dashboard` if the repo has other folders.
3. Add Environment Variables (Project → Settings → Environment Variables):
   - `MONGODB_URI` = your Atlas connection string
   - `MONGODB_DB` = `linkedin_content`
4. Deploy. That's it — the app is fully serverless.
5. In **MongoDB Atlas → Network Access**, add `0.0.0.0/0` (allow from anywhere) so
   Vercel's servers can connect. Seed once from a working network (see below);
   the deployed site then reads the same data.

## Data model (`days` collection)
```
srNo, date, title, mainQuestion, hldFocus,
concept, geminiPrompt, linkedinPost, xPost,
imageBase64, imageMime, posted, createdAt, updatedAt
```

## API
- `GET  /api/days` — list (no image payload)
- `POST /api/days` — upsert a day (optional; guarded by `UPLOAD_SECRET` if set)
- `PATCH /api/days/:srNo` — `{ posted: boolean }`
- `GET  /api/days/:srNo/image` — the PNG (`?download=1` to download)

## Troubleshooting: `tlsv1 alert internal error` on seed
If `seed.mjs` fails with an SSL/TLS `internal error` while TCP to Atlas succeeds,
your **local network is breaking the TLS/SNI handshake on port 27017** (common
causes: antivirus HTTPS/SSL scanning, a corporate/ISP firewall, or DPI). Atlas
shared clusters route by SNI, so a stripped SNI makes the proxy reply with this
exact alert. Fixes, in order of ease:
1. Run the seed from a **different network** — a phone hotspot almost always works.
2. Disable your antivirus/firewall's **HTTPS/SSL scanning** temporarily.
3. Confirm Atlas **Network Access** allows your IP (or `0.0.0.0/0`).
The deployed Vercel app is unaffected — it connects from Vercel's network.
