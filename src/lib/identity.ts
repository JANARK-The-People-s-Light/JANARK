import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

const ANON_RE = /^jn-[a-z0-9]{8}$/;

/** Public anonymity ID format: jn-a7k2m9xq */
export function generateAnonId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return `jn-${out}`;
}

export function isValidAnonId(id: string): boolean {
  return ANON_RE.test(id);
}

export function displayAnonLabel(anonId: string): string {
  return `Anon ${anonId}`;
}

export async function ensureAnonIdForHash(
  phoneHash: string,
  phoneHint?: string,
): Promise<{ anonId: string; phoneHint: string }> {
  const existing = await prisma.phoneIdentity.findUnique({
    where: { phoneHash },
  });
  if (existing?.anonId) {
    return { anonId: existing.anonId, phoneHint: existing.phoneHint };
  }

  // Race-safe: try a few unique IDs
  for (let attempt = 0; attempt < 5; attempt++) {
    const anonId = generateAnonId();
    try {
      if (existing) {
        const updated = await prisma.phoneIdentity.update({
          where: { phoneHash },
          data: { anonId, lastSeenAt: new Date() },
        });
        return { anonId: updated.anonId, phoneHint: updated.phoneHint };
      }
      const created = await prisma.phoneIdentity.create({
        data: {
          phoneHash,
          anonId,
          phoneHint: phoneHint ?? "••••",
        },
      });
      return { anonId: created.anonId, phoneHint: created.phoneHint };
    } catch {
      // unique collision — retry
    }
  }
  throw new Error("Could not allocate anonymity ID");
}

/** Resolve public author fields from phone voterKey (hash) */
export async function publicAuthorFromVoterKey(voterKey: string): Promise<{
  authorLabel: string;
  authorAnonId: string;
} | null> {
  const identity = await prisma.phoneIdentity.findUnique({
    where: { phoneHash: voterKey },
  });
  if (!identity) return null;
  let anonId = identity.anonId;
  if (!anonId) {
    const ensured = await ensureAnonIdForHash(voterKey, identity.phoneHint);
    anonId = ensured.anonId;
  }
  return {
    authorAnonId: anonId,
    authorLabel: displayAnonLabel(anonId),
  };
}

export async function identityByAnonId(anonId: string) {
  if (!isValidAnonId(anonId)) return null;
  return prisma.phoneIdentity.findUnique({ where: { anonId } });
}
