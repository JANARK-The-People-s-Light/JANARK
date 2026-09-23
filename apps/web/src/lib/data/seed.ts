import type { Comment, FeedItem, Notice, PlatformStats } from "@/lib/types";

export const notices: Notice[] = [
  {
    id: "notice-coaching-fee-cap",
    title: "Cap predatory coaching fees near exam centres",
    description:
      "Bring into notice the explosion of last-minute 'guarantee' coaching packages sold to anxious NEET and UPSC aspirants, often with misleading claims and no refunds.",
    target: "national",
    targetDetail: "Ministry of Education / consumer affairs",
    signatures: 1842,
    author: "Ananya R.",
    createdAt: "2026-07-12",
    category: "Education",
  },
  {
    id: "notice-river-dumping",
    title: "Industrial dumping into local river — district alert",
    description:
      "Residents report untreated effluent after midnight near the bridge industrial cluster. Fish kill observed; request urgent inspection and public water test results.",
    target: "district",
    targetDetail: "District collector & pollution control board",
    signatures: 967,
    author: "Local citizens collective",
    createdAt: "2026-07-15",
    category: "Environment",
  },
  {
    id: "notice-hospital-drug-stock",
    title: "Essential medicines out of stock for 3 weeks",
    description:
      "District hospital pharmacy has been out of insulin and basic antibiotics intermittently for three weeks. Patients are forced into private purchase.",
    target: "state",
    targetDetail: "State health department",
    signatures: 2210,
    author: "Meera K.",
    createdAt: "2026-07-08",
    category: "Healthcare",
  },
];

export const comments: Comment[] = [
  {
    id: "c1",
    issueSlug: "neet-reform",
    author: "Rohit S.",
    body: "Paper leaks are increasing because the chain of custody is opaque. Publish who handled the paper at every hop.",
    upvotes: 421,
    kind: "opinion",
    createdAt: "2026-07-18",
  },
  {
    id: "c2",
    issueSlug: "neet-reform",
    author: "Priya M.",
    body: "Evidence: several FIRs in recent cycles name logistics contractors. We need contractor blacklists made public.",
    upvotes: 288,
    kind: "evidence",
    createdAt: "2026-07-17",
  },
  {
    id: "c3",
    issueSlug: "judicial-reforms",
    author: "Advocate N.",
    body: "Adjournment culture is the silent killer. Cap adjournments per party unless exceptional cause is recorded.",
    upvotes: 356,
    kind: "opinion",
    createdAt: "2026-07-16",
  },
  {
    id: "c4",
    issueSlug: "corruption-disclosure",
    author: "CitizenWatch",
    body: "Annual machine-readable disclosures would let journalists build change-over-term charts in hours, not months.",
    upvotes: 512,
    kind: "opinion",
    createdAt: "2026-07-14",
  },
  {
    id: "c5",
    issueSlug: "women-reservation",
    author: "Sana A.",
    body: "Implementation timeline matters more than the principle now. Delimitation-linked delay is the real fight.",
    upvotes: 190,
    kind: "news",
    createdAt: "2026-07-13",
  },
  {
    id: "c6",
    issueSlug: "employment-youth",
    author: "Karan D.",
    body: "Publish district-wise formal job creation, not only national aggregates. Local truth beats slogans.",
    upvotes: 274,
    kind: "opinion",
    createdAt: "2026-07-11",
  },
];

export const feedItems: FeedItem[] = [
  {
    id: "f1",
    type: "vote",
    title: "NEET Reform",
    excerpt: "Security overhaul and integrity audits for national entrance exams.",
    meta: "12,342 votes · Education",
    href: "/vote/neet-security-overhaul",
    votes: 12342,
    hot: true,
  },
  {
    id: "f2",
    type: "discussion",
    title: "Judicial Reforms",
    excerpt: "Citizens debating fast-track benches and adjournment caps.",
    meta: "9,231 votes · Judiciary",
    href: "/issues/judicial-reforms",
    votes: 9231,
    hot: true,
  },
  {
    id: "f3",
    type: "proposal",
    title: "Mandatory Asset Disclosure",
    excerpt: "Annual public asset statements for all elected representatives.",
    meta: "11,002 votes · Corruption",
    href: "/vote/asset-disclosure",
    votes: 11002,
    hot: true,
  },
  {
    id: "f4",
    type: "notice",
    title: "Essential medicines out of stock for 3 weeks",
    excerpt: "District hospital pharmacy failures brought into public notice.",
    meta: "2,210 signatures · Healthcare",
    href: "/notice/notice-hospital-drug-stock",
    votes: 2210,
  },
  {
    id: "f5",
    type: "discussion",
    title: "Women's Reservation",
    excerpt: "Timelines, rotation, and first-time candidate support.",
    meta: "6,231 votes · Women",
    href: "/issues/women-reservation",
    votes: 6231,
  },
  {
    id: "f6",
    type: "notice",
    title: "Industrial dumping into local river",
    excerpt: "District-level environmental notice gathering signatures.",
    meta: "967 signatures · Environment",
    href: "/notice/notice-river-dumping",
    votes: 967,
  },
  {
    id: "f7",
    type: "vote",
    title: "Candidate Qualification Standards",
    excerpt: "Which standards should candidates meet? Multi-select civic checklist.",
    meta: "8,421 votes · Open vote",
    href: "/vote/candidate-qualifications",
    votes: 8421,
  },
  {
    id: "f8",
    type: "vote",
    title: "Finance Minister Background",
    excerpt: "Preference map: economist, CA, IAS, entrepreneur, and more.",
    meta: "5,310 votes · Preference",
    href: "/vote/finance-minister-background",
    votes: 5310,
  },
];

export const platformStats: PlatformStats = {
  citizens: 25421,
  activeProposals: 312,
  votes: 4231882,
  notices: 1488,
};

export const liveTrends = [
  "NEET",
  "Election Reform",
  "UPSC",
  "Corruption",
  "Women Reservation",
  "Judiciary",
  "AI Jobs",
  "Pollution",
];

export const stateSignals = [
  { state: "Karnataka", topIssue: "Employment", rating: 4.2 },
  { state: "Delhi", topIssue: "Education", rating: 4.8 },
  { state: "Bihar", topIssue: "Paper Leaks", rating: 4.9 },
  { state: "Maharashtra", topIssue: "Pollution", rating: 4.1 },
  { state: "Tamil Nadu", topIssue: "Healthcare", rating: 4.3 },
  { state: "Uttar Pradesh", topIssue: "Employment", rating: 4.0 },
];

export function getNotice(id: string): Notice | undefined {
  return notices.find((n) => n.id === id);
}

export function getCommentsForIssue(slug: string): Comment[] {
  return comments.filter((c) => c.issueSlug === slug);
}
