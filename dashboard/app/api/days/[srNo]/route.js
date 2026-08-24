import { NextResponse } from "next/server";
import { getDaysCollection } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// PATCH /api/days/:srNo — toggle posted (and persist immediately).
export async function PATCH(req, ctx) {
  try {
    const { srNo } = await ctx.params;
    const n = parseInt(srNo, 10);
    const body = await req.json();

    const update = {};
    if (typeof body.posted === "boolean") update.posted = body.posted;
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    }
    update.updatedAt = new Date().toISOString();

    const col = await getDaysCollection();
    const res = await col.updateOne({ srNo: n }, { $set: update });
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, srNo: n, ...update });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
