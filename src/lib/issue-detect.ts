/**
 * Lightweight client-side hints while composing an issue.
 * Not ML — keyword cues so the form feels helpful without friction.
 */

export const PRIMARY_CATEGORIES = [
  { id: "Infrastructure", label: "Roads" },
  { id: "Water", label: "Water" },
  { id: "Healthcare", label: "Health" },
  { id: "Education", label: "Education" },
  { id: "Transport", label: "Transport" },
  { id: "Electricity", label: "Electricity" },
  { id: "Sanitation", label: "Sanitation" },
  { id: "Environment", label: "Environment" },
] as const;

export const MORE_CATEGORIES = [
  "Employment",
  "Corruption",
  "Judiciary",
  "Women",
  "Agriculture",
  "Police",
  "Cybersecurity",
  "Voting Reform",
  "Infrastructure",
] as const;

const CATEGORY_CUES: { category: string; topics: string[]; words: string[] }[] =
  [
    {
      category: "Infrastructure",
      topics: ["roads", "safety"],
      words: [
        "pothole",
        "road",
        "streetlight",
        "street light",
        "footpath",
        "bridge",
        "highway",
        "flyover",
      ],
    },
    {
      category: "Sanitation",
      topics: ["sanitation", "garbage"],
      words: ["garbage", "trash", "waste", "sewage", "drain", "litter", "dump"],
    },
    {
      category: "Water",
      topics: ["water"],
      words: ["water", "leak", "pipe", "borewell", "flood", "drainage"],
    },
    {
      category: "Electricity",
      topics: ["electricity", "power"],
      words: ["electricity", "power cut", "outage", "transformer", "wire"],
    },
    {
      category: "Transport",
      topics: ["transport", "traffic"],
      words: ["bus", "metro", "traffic", "auto", "parking", "signal"],
    },
    {
      category: "Healthcare",
      topics: ["health"],
      words: ["hospital", "clinic", "doctor", "medicine", "ambulance"],
    },
    {
      category: "Education",
      topics: ["education", "schools"],
      words: ["school", "college", "teacher", "classroom"],
    },
    {
      category: "Environment",
      topics: ["environment", "pollution"],
      words: ["pollution", "tree", "smoke", "plastic", "air quality"],
    },
    {
      category: "Corruption",
      topics: ["corruption"],
      words: ["bribe", "corruption", "scam", "extortion"],
    },
    {
      category: "Police",
      topics: ["police", "safety"],
      words: ["police", "crime", "theft", "harassment"],
    },
  ];

const CITY_CUES = [
  "Bengaluru",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Hyderabad",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
  "Kochi",
  "Goa",
];

export type IssueHints = {
  category: string | null;
  location: string | null;
  topics: string[];
};

export function detectIssueHints(text: string): IssueHints {
  const lower = text.toLowerCase();
  let category: string | null = null;
  const topics = new Set<string>();

  for (const cue of CATEGORY_CUES) {
    if (cue.words.some((w) => lower.includes(w))) {
      if (!category) category = cue.category;
      for (const t of cue.topics) topics.add(t);
    }
  }

  let location: string | null = null;
  for (const city of CITY_CUES) {
    if (lower.includes(city.toLowerCase())) {
      location = city === "Bangalore" ? "Bengaluru" : city;
      break;
    }
  }

  // Common street cue without city
  if (!location && /\bmg road\b/i.test(text)) {
    location = "MG Road";
  }

  return {
    category,
    location,
    topics: [...topics].slice(0, 4),
  };
}
