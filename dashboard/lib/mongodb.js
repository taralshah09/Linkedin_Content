import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "linkedin_content";

if (!uri) {
  throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
}

// Reuse the client across hot-reloads / serverless invocations.
let cached = global._mongoClientPromise;
if (!cached) {
  const client = new MongoClient(uri);
  cached = global._mongoClientPromise = client.connect();
}

export async function getDb() {
  const client = await cached;
  return client.db(dbName);
}

export async function getDaysCollection() {
  const db = await getDb();
  return db.collection("days");
}

export const DB_NAME = dbName;
