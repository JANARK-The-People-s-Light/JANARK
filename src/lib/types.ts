export type IssueCategory =
  | "Education"
  | "Employment"
  | "Healthcare"
  | "Corruption"
  | "Judiciary"
  | "Women"
  | "Agriculture"
  | "Environment"
  | "Infrastructure"
  | "Police"
  | "Cybersecurity"
  | "Voting Reform";

export type VoteChoice =
  | "strongly_support"
  | "support"
  | "neutral"
  | "oppose"
  | "strongly_oppose";

export type NoticeTarget = "national" | "state" | "district" | "institution";

export type FeedItemType = "discussion" | "proposal" | "notice" | "vote";

export interface Issue {
  slug: string;
  title: string;
  category: IssueCategory;
  summary: string;
  whyItMatters: string;
  currentSituation: string;
  pros: string[];
  cons: string[];
  sources: { label: string; url: string }[];
  relatedSlugs: string[];
  voteCount: number;
  rating: number;
  trendingRank?: number;
}

export interface Comment {
  id: string;
  issueSlug: string;
  author: string;
  body: string;
  upvotes: number;
  kind: "opinion" | "evidence" | "news";
  createdAt: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  argumentsFor: string[];
  argumentsAgainst: string[];
  issueSlug?: string;
  voteType: "likert" | "checklist" | "preference";
  options?: string[];
  results?: Record<string, number>;
  totalVotes: number;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  target: NoticeTarget;
  targetDetail?: string;
  signatures: number;
  author: string;
  createdAt: string;
  category?: IssueCategory;
}

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  excerpt: string;
  meta: string;
  href: string;
  votes?: number;
  hot?: boolean;
}

export interface PlatformStats {
  citizens: number;
  activeProposals: number;
  votes: number;
  notices: number;
}
