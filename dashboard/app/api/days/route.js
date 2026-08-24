import { NextResponse } from "next/server";
import { getDaysCollection } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// GET /api/days — list all days (without the heavy image payload).
export async function GET() {
  try {
    const col = await getDaysCollection();
    const docs = await col
      .find({}, { projection: { imageBase64: 0 } })
      .sort({ srNo: 1 })
      .toArray();

    const days = docs.map((d) => ({
      srNo: d.srNo,
      date: d.date || "",
      title: d.title || "",
      mainQuestion: d.mainQuestion || "",
      hldFocus: d.hldFocus || "",
      concept: d.concept || "",
      geminiPrompt: d.geminiPrompt || "",
      linkedinPost: d.linkedinPost || "",
      xPost: d.xPost || "",
      posted: !!d.posted,
      hasImage: !!d.imageMime,
    }));

    return NextResponse.json({ days });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

// POST /api/days — upsert one day (optional remote upload path).
// Protected by UPLOAD_SECRET if that env var is set.
export async function POST(req) {
  try {
    const secret = process.env.UPLOAD_SECRET;
    if (secret) {
      const auth = req.headers.get("authorization") || "";
      if (auth !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    if (typeof body.srNo !== "number") {
      return NextResponse.json({ error: "srNo (number) is required" }, { status: 400 });
    }

    const col = await getDaysCollection();
    const set = {
      srNo: body.srNo,
      date: body.date || "",
      title: body.title || "",
      mainQuestion: body.mainQuestion || "",
      hldFocus: body.hldFocus || "",
      concept: body.concept || "",
      geminiPrompt: body.geminiPrompt || "",
      linkedinPost: body.linkedinPost || "",
      xPost: body.xPost || "",
      updatedAt: new Date().toISOString(),
    };
    if (typeof body.imageBase64 === "string" && body.imageBase64.length) {
      set.imageBase64 = body.imageBase64;
      set.imageMime = body.imageMime || "image/png";
    }

    await col.updateOne(
      { srNo: body.srNo },
      { $set: set, $setOnInsert: { posted: false, createdAt: new Date().toISOString() } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, srNo: body.srNo });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
