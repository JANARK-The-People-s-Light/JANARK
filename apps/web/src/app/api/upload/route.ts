import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  assertRateLimit,
  hashClientFingerprint,
} from "@/lib/anti-bot";
import type { MediaType } from "@/lib/media";
import { assertSameOrigin } from "@/lib/origin";
import { resolveSessionFromRequest } from "@/lib/session";
import { getStorageProvider } from "@/lib/object-storage";

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

function matchesMagic(
  buf: Buffer,
  mediaType: MediaType,
  ext: string,
): boolean {
  if (buf.length < 12) return false;
  if (ext === "png" || mediaType === "image") {
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
      return ext === "png";
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
      return ext === "jpg" || ext === "jpeg";
    if (
      buf[0] === 0x47 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x38
    )
      return ext === "gif";
    // RIFF....WEBP
    if (
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    )
      return ext === "webp";
  }
  if (ext === "gif") {
    return (
      buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38
    );
  }
  if (ext === "webm") {
    // EBML header
    return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  }
  if (ext === "mp4") {
    // ftyp box somewhere in first 12+ bytes
    const head = buf.subarray(0, Math.min(buf.length, 64)).toString("ascii");
    return head.includes("ftyp");
  }
  return false;
}

/**
 * Authenticated citizen upload → StorageProvider → /uploads/{id}.{ext}
 * See ADR-0001. Default provider is local disk; SeaweedFS via env switch.
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
  const key = `${id}.${mapped.ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (!matchesMagic(buf, mapped.mediaType, mapped.ext)) {
    return NextResponse.json(
      { error: "File content does not match its type" },
      { status: 400 },
    );
  }

  try {
    const stored = await getStorageProvider().putObject({
      key,
      body: buf,
      contentType: mime,
    });
    return NextResponse.json({
      ok: true,
      url: stored.publicUrl,
      mediaType: mapped.mediaType,
      size: stored.size,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    console.error("[upload]", msg);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
