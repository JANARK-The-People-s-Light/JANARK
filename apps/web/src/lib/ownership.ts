/** Client-safe ownership helpers (no DB imports). */

export function ownsByHash(
  authorHash: string | null | undefined,
  phoneHash: string | null | undefined,
): boolean {
  if (!authorHash || !phoneHash) return false;
  return authorHash === phoneHash;
}

export function ownsByAnonId(
  authorAnonId: string | null | undefined,
  sessionAnonId: string | null | undefined,
): boolean {
  if (!authorAnonId || !sessionAnonId) return false;
  return authorAnonId.toLowerCase() === sessionAnonId.toLowerCase();
}
