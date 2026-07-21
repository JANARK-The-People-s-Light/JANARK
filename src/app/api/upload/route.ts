import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  assertRateLimit,
  hashClientFingerprint,
} from "@/lib/anti-bot";
import { assertSameOrigin } from "@/lib/origin";
import { resolveSessionFromRequest } from "@/lib/session";
import type { MediaType } from "@/lib/media";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const MIME_MAP: Record<string, { ext: string; mediaType: MediaType }> = {
  "image/jpeg": { ext: "jpg", mediaType: "image" },
  "image/jpg": { ext: "jpg", mediaType: "image" },
  "image/png": { ext: "png", mediaType: "image" },
  "image/webp": { ext: "webp", mediaType: "image" },
  "image/gif": { ext: "gif", mediaType: "gif" },
  "video/mp4": { ext: "mp4", mediaType: "video" },
  "video/webm": { ext: "webm", mediaType: "video" },
};

/**
 * Authenticated citizen upload → public/uploads/{id}.{ext}
 * Returns a same-origin /uploads/… URL for use as mediaUrl on posts.
 */
export async function POST(req: Request) {
  const origin = assertSameOrigin(req);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: 403 });
  }

  const session = await resolveSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: "Verify your phone to upload attachments" },
      { status: 401 },
    );
  }

  const rl = await assertRateLimit(
    `upload:${hashClientFingerprint(req)}:${session.phoneHash.slice(0, 16)}`,
    20,
    60 * 60 * 1000,
  );
  if (!rl.ok) {
    return NextResponse.json({ error: rl.error }, { status: rl.status });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be under 8 MB" },
      { status: 400 },
    );
  }

  const mime = (file.type || "").toLowerCase();
  const mapped = MIME_MAP[mime];
  if (!mapped) {
    return NextResponse.json(
      {
        error:
          "Only JPEG, PNG, WebP, GIF, MP4, or WebM files are allowed (no SVG)",
      },
      { status: 400 },
    );
  }

  const id = randomBytes(16).toString("hex");
  const filename = `${id}.${mapped.ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buf);

  const url = `/uploads/${filename}`;
  return NextResponse.json({
    ok: true,
    url,
    mediaType: mapped.mediaType,
    size: file.size,
  });
}
