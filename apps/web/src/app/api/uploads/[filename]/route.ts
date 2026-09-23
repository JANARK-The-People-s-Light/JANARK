import { NextResponse } from "next/server";
import { getStorageProvider, isValidUploadKey } from "@/lib/object-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ filename: string }> };

/**
 * Serve citizen uploads via StorageProvider (local disk or SeaweedFS).
 * Next.js production does not pick up new files under /public — this route does.
 * Public URL pattern stays /uploads/{key} (ADR-0001).
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { filename } = await ctx.params;
  const key = decodeURIComponent(filename || "").trim();
  if (!isValidUploadKey(key)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const obj = await getStorageProvider().getObject(key);
    if (!obj) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const headers: Record<string, string> = {
      "Content-Type": obj.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    };
    if (obj.contentLength > 0) {
      headers["Content-Length"] = String(obj.contentLength);
    }

    return new NextResponse(obj.stream, { status: 200, headers });
  } catch (e) {
    console.error("[uploads]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
