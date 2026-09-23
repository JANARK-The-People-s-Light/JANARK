/**
 * Searchable “who should act” targets for petitions.
 */

export type PetitionActor = {
  name: string;
  /** Stored as PublicDemand.target */
  target: "government" | "state" | "district" | "institution" | "public";
  aliases?: string[];
  region?: string;
};

export const PETITION_ACTORS: PetitionActor[] = [
  {
    name: "BBMP",
    target: "institution",
    aliases: ["bruhat bengaluru mahanagara palike", "bmc bangalore", "corporation"],
    region: "Bengaluru",
  },
  {
    name: "BESCOM",
    target: "institution",
    aliases: ["bangalore electricity"],
    region: "Bengaluru",
  },
  {
    name: "Bangalore Water Supply and Sewerage Board",
    target: "institution",
    aliases: ["bwssb", "water board"],
    region: "Bengaluru",
  },
  {
    name: "Bangalore Traffic Police",
    target: "institution",
    aliases: ["btp", "traffic police"],
    region: "Bengaluru",
  },
  {
    name: "BMTC",
    target: "institution",
    aliases: ["bus", "transport"],
    region: "Bengaluru",
  },
  {
    name: "Namma Metro / BMRCL",
    target: "institution",
    aliases: ["bmrcl", "metro"],
    region: "Bengaluru",
  },
  {
    name: "Government of Karnataka",
    target: "state",
    aliases: ["karnataka government", "state government"],
    region: "Karnataka",
  },
  {
    name: "Ministry of Railways",
    target: "government",
    aliases: ["railways", "indian railways"],
  },
  {
    name: "Ministry of Road Transport and Highways",
    target: "government",
    aliases: ["morth", "highways"],
  },
  {
    name: "Ministry of Environment, Forest and Climate Change",
    target: "government",
    aliases: ["moefcc", "environment ministry"],
  },
  {
    name: "Ministry of Education",
    target: "government",
    aliases: ["education ministry"],
  },
  {
    name: "Ministry of Health and Family Welfare",
    target: "government",
    aliases: ["mohfw", "health ministry"],
  },
  {
    name: "Municipal Corporation",
    target: "institution",
    aliases: ["municipality", "nagara palike"],
  },
  {
    name: "District Collector / Magistrate",
    target: "district",
    aliases: ["collector", "dm", "magistrate"],
  },
  {
    name: "State Police",
    target: "state",
    aliases: ["police"],
  },
  {
    name: "Parliament of India",
    target: "government",
    aliases: ["lok sabha", "rajya sabha"],
  },
  {
    name: "Supreme Court of India",
    target: "institution",
    aliases: ["supreme court"],
  },
  {
    name: "Public / fellow citizens",
    target: "public",
    aliases: ["citizens", "people"],
  },
];

export function searchPetitionActors(q: string, limit = 8): PetitionActor[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return PETITION_ACTORS.slice(0, limit);
  const scored = PETITION_ACTORS.map((a) => {
    const hay = [a.name, ...(a.aliases ?? []), a.region ?? ""]
      .join(" ")
      .toLowerCase();
    let score = 0;
    if (a.name.toLowerCase().startsWith(needle)) score += 40;
    if (a.name.toLowerCase().includes(needle)) score += 20;
    if (hay.includes(needle)) score += 10;
    for (const part of needle.split(/\s+/)) {
      if (part && hay.includes(part)) score += 5;
    }
    return { a, score };
  })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score);
  return scored.slice(0, limit).map((x) => x.a);
}

export const PETITION_TOPIC_CHIPS = [
  "roads",
  "environment",
  "transport",
  "water",
  "education",
  "health",
  "sanitation",
  "safety",
] as const;

export const PETITION_CATEGORIES = [
  "Infrastructure",
  "Environment",
  "Transport",
  "Water",
  "Education",
  "Health",
  "Sanitation",
  "Governance",
  "Justice",
  "Other",
] as const;
