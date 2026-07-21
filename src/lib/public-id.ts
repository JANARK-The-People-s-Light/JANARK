import { randomInt } from "node:crypto";
import { prisma } from "@/lib/db";

/** Public post ID: jnk-yymmdd-abc-0001 (not the DB row id). */
export const PUBLIC_POST_ID_RE = /^jnk-\d{6}-[a-z]{3}-\d{4}$/;

function yymmdd(d = new Date()): string {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function randomLetters(n = 3): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < n; i++) {
    out += alphabet[randomInt(alphabet.length)]!;
  }
  return out;
}

/**
 * Allocate the next public post id for today.
 * Format: jnk-{yymmdd}-{3 random letters}-{0001+index}
 */
export async function allocatePublicPostId(now = new Date()): Promise<string> {
  const day = yymmdd(now);
  const row = await prisma.publicIdCounter.upsert({
    where: { day },
    create: { day, count: 1 },
    update: { count: { increment: 1 } },
  });
  const index = String(row.count).padStart(4, "0");
  return `jnk-${day}-${randomLetters(3)}-${index}`;
}

export function isPublicPostId(value: unknown): value is string {
  return typeof value === "string" && PUBLIC_POST_ID_RE.test(value);
}

/** Canonical portal path for a public post id. */
export function publicPostHref(publicId: string): string {
  return `/p/${publicId}`;
}
