import { getDaysCollection } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// GET /api/days/:srNo/image — streams the stored PNG.
export async function GET(req, ctx) {
  const { srNo } = await ctx.params;
  const n = parseInt(srNo, 10);

  const col = await getDaysCollection();
  const doc = await col.findOne(
    { srNo: n },
    { projection: { imageBase64: 1, imageMime: 1, title: 1 } }
  );

  if (!doc || !doc.imageBase64) {
    return new Response("Not found", { status: 404 });
  }

  const buf = Buffer.from(doc.imageBase64, "base64");
  const download = req.nextUrl?.searchParams?.get("download");
  const headers = {
    "Content-Type": doc.imageMime || "image/png",
    "Cache-Control": "public, max-age=3600",
  };
  if (download) {
    headers["Content-Disposition"] = `attachment; filename="Day_${n}.png"`;
  }
  return new Response(buf, { headers });
}
