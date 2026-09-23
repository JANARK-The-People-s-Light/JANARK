/**
 * Client-side hints for report compose — keyword cues, not ML.
 */

export const REPORT_CATEGORIES = [
  { id: "infrastructure", label: "Infrastructure", type: "problem" },
  { id: "crime", label: "Crime", type: "crime" },
  { id: "utilities", label: "Utilities", type: "problem" },
  { id: "sanitation", label: "Sanitation", type: "problem" },
  { id: "traffic", label: "Traffic", type: "problem" },
  { id: "health", label: "Health", type: "problem" },
  { id: "environment", label: "Environment", type: "problem" },
  { id: "government", label: "Government", type: "issue" },
  { id: "education", label: "Education", type: "problem" },
] as const;

export const MORE_REPORT_CATEGORIES = [
  { id: "corruption", label: "Corruption", type: "issue" },
  { id: "safety", label: "Safety", type: "problem" },
  { id: "housing", label: "Housing", type: "problem" },
  { id: "other", label: "Other", type: "other" },
] as const;

export type ReportPriority = "low" | "medium" | "high" | "emergency";

export type PlaceHierarchy = {
  label: string;
  village?: string;
  town?: string;
  city?: string;
  block?: string;
  district?: string;
  state?: string;
  country: string;
  locationLevel: string;
};

/** Known localities → fill hierarchy so the user only picks one place. */
const PLACE_INDEX: {
  match: string;
  place: Omit<PlaceHierarchy, "locationLevel" | "country"> & {
    country?: string;
  };
}[] = [
  {
    match: "koramangala",
    place: {
      label: "Koramangala",
      village: "Koramangala",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
  },
  {
    match: "church street",
    place: {
      label: "Church Street",
      village: "Church Street",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
  },
  {
    match: "mg road",
    place: {
      label: "MG Road",
      village: "MG Road",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
  },
  {
    match: "bellandur",
    place: {
      label: "Bellandur",
      village: "Bellandur",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
  },
  {
    match: "indiranagar",
    place: {
      label: "Indiranagar",
      village: "Indiranagar",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
  },
  {
    match: "whitefield",
    place: {
      label: "Whitefield",
      village: "Whitefield",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
  },
  {
    match: "bengaluru",
    place: {
      label: "Bengaluru",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
  },
  {
    match: "bangalore",
    place: {
      label: "Bengaluru",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
  },
  {
    match: "mumbai",
    place: {
      label: "Mumbai",
      city: "Mumbai",
      district: "Mumbai",
      state: "Maharashtra",
    },
  },
  {
    match: "delhi",
    place: {
      label: "Delhi",
      city: "Delhi",
      state: "Delhi",
    },
  },
  {
    match: "chennai",
    place: {
      label: "Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
    },
  },
  {
    match: "hyderabad",
    place: {
      label: "Hyderabad",
      city: "Hyderabad",
      state: "Telangana",
    },
  },
];

const CATEGORY_CUES: {
  id: string;
  topics: string[];
  priority?: ReportPriority;
  words: string[];
}[] = [
  {
    id: "sanitation",
    topics: ["sanitation", "garbage"],
    priority: "medium",
    words: ["garbage", "waste", "dump", "sewage", "litter", "overflow"],
  },
  {
    id: "infrastructure",
    topics: ["roads", "safety"],
    priority: "medium",
    words: ["pothole", "road", "streetlight", "bridge", "footpath", "construction waste"],
  },
  {
    id: "utilities",
    topics: ["water", "electricity"],
    priority: "high",
    words: ["leak", "water", "pipe", "power cut", "outage", "electricity"],
  },
  {
    id: "crime",
    topics: ["crime", "safety"],
    priority: "high",
    words: ["theft", "robbery", "assault", "harassment", "crime", "stolen"],
  },
  {
    id: "traffic",
    topics: ["traffic"],
    priority: "medium",
    words: ["traffic", "signal", "jam", "parking", "accident"],
  },
  {
    id: "health",
    topics: ["health"],
    priority: "high",
    words: ["hospital", "ambulance", "clinic", "disease"],
  },
  {
    id: "environment",
    topics: ["environment", "waste"],
    priority: "medium",
    words: ["lake", "pollution", "smoke", "tree", "wetland"],
  },
  {
    id: "government",
    topics: ["government"],
    words: ["bribe", "corruption", "officer", "municipal"],
  },
  {
    id: "education",
    topics: ["education"],
    words: ["school", "college", "teacher"],
  },
];

const EMERGENCY_WORDS = [
  "emergency",
  "urgent",
  "fire",
  "flooding",
  "collapsed",
  "bleeding",
  "danger",
];

function levelFromPlace(p: {
  village?: string;
  town?: string;
  city?: string;
  block?: string;
  district?: string;
  state?: string;
}): string {
  if (p.village) return "village";
  if (p.town) return "town";
  if (p.city) return "city";
  if (p.block) return "block";
  if (p.district) return "district";
  if (p.state) return "state";
  return "national";
}

export function resolvePlace(query: string): PlaceHierarchy | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const row of PLACE_INDEX) {
    if (q.includes(row.match) || row.match.includes(q)) {
      const country = row.place.country ?? "India";
      return {
        ...row.place,
        country,
        locationLevel: levelFromPlace(row.place),
        label: row.place.label,
      };
    }
  }
  // Free-text locality — assume city-level until we know more
  return {
    label: query.trim(),
    village: query.trim(),
    city: undefined,
    state: undefined,
    country: "India",
    locationLevel: "village",
  };
}

export function placeFromGeocode(parts: {
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
}): PlaceHierarchy {
  const locality =
    parts.neighbourhood || parts.suburb || parts.village || parts.town || "";
  const city = parts.city || parts.town || "";
  const state = parts.state || "";
  const country = parts.country || "India";
  const label =
    [locality, city || state].filter(Boolean).join(", ") ||
    city ||
    state ||
    country;
  const base = {
    village: locality || undefined,
    city: city || undefined,
    district: parts.county || undefined,
    state: state || undefined,
    country,
  };
  return {
    ...base,
    label,
    locationLevel: levelFromPlace(base),
  };
}

export type ReportHints = {
  categoryId: string | null;
  categoryLabel: string | null;
  topics: string[];
  priority: ReportPriority | null;
  place: PlaceHierarchy | null;
};

export function detectReportHints(text: string): ReportHints {
  const lower = text.toLowerCase();
  let categoryId: string | null = null;
  const topics = new Set<string>();
  let priority: ReportPriority | null = null;

  for (const cue of CATEGORY_CUES) {
    if (cue.words.some((w) => lower.includes(w))) {
      if (!categoryId) categoryId = cue.id;
      for (const t of cue.topics) topics.add(t);
      if (cue.priority && !priority) priority = cue.priority;
    }
  }

  if (EMERGENCY_WORDS.some((w) => lower.includes(w))) {
    priority = "emergency";
  }

  let place: PlaceHierarchy | null = null;
  for (const row of PLACE_INDEX) {
    if (lower.includes(row.match)) {
      place = resolvePlace(row.match);
      break;
    }
  }

  const cat =
    REPORT_CATEGORIES.find((c) => c.id === categoryId) ||
    MORE_REPORT_CATEGORIES.find((c) => c.id === categoryId);

  return {
    categoryId,
    categoryLabel: cat?.label ?? null,
    topics: [...topics].slice(0, 5),
    priority,
    place,
  };
}

export function categoryToApiType(categoryId: string): string {
  const all = [...REPORT_CATEGORIES, ...MORE_REPORT_CATEGORIES];
  return all.find((c) => c.id === categoryId)?.type ?? "problem";
}
