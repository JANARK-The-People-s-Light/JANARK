const VOTES_KEY = "janark_votes";
const NOTICES_KEY = "janark_notices";
const SIGNATURES_KEY = "janark_signatures";

export type StoredVote = {
  proposalId: string;
  choice: string | string[];
  at: string;
};

export type StoredNotice = {
  id: string;
  title: string;
  description: string;
  target: string;
  targetDetail?: string;
  signatures: number;
  author: string;
  createdAt: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredVotes(): StoredVote[] {
  return readJson<StoredVote[]>(VOTES_KEY, []);
}

export function getVoteForProposal(proposalId: string): StoredVote | undefined {
  return getStoredVotes().find((v) => v.proposalId === proposalId);
}

export function saveVote(proposalId: string, choice: string | string[]) {
  const votes = getStoredVotes().filter((v) => v.proposalId !== proposalId);
  votes.push({ proposalId, choice, at: new Date().toISOString() });
  writeJson(VOTES_KEY, votes);
}

export function getStoredNotices(): StoredNotice[] {
  return readJson<StoredNotice[]>(NOTICES_KEY, []);
}

export function saveNotice(notice: Omit<StoredNotice, "id" | "signatures" | "createdAt">) {
  const notices = getStoredNotices();
  const entry: StoredNotice = {
    ...notice,
    id: `local-${Date.now()}`,
    signatures: 1,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  notices.unshift(entry);
  writeJson(NOTICES_KEY, notices);
  const sigs = getSignedNoticeIds();
  sigs.push(entry.id);
  writeJson(SIGNATURES_KEY, sigs);
  return entry;
}

export function getSignedNoticeIds(): string[] {
  return readJson<string[]>(SIGNATURES_KEY, []);
}

export function hasSignedNotice(id: string): boolean {
  return getSignedNoticeIds().includes(id);
}

export function signNotice(id: string) {
  const sigs = getSignedNoticeIds();
  if (sigs.includes(id)) return false;
  sigs.push(id);
  writeJson(SIGNATURES_KEY, sigs);

  const local = getStoredNotices();
  const idx = local.findIndex((n) => n.id === id);
  if (idx >= 0) {
    local[idx] = { ...local[idx], signatures: local[idx].signatures + 1 };
    writeJson(NOTICES_KEY, local);
  }
  return true;
}

export function getLocalNotice(id: string): StoredNotice | undefined {
  return getStoredNotices().find((n) => n.id === id);
}
