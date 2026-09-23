/**
 * Demo fixtures — India's top 20 civic trending issues + dummy engagement
 * from seeded anonymous citizens (votes, reactions, comments, supports).
 *
 *   npm run db:clear && npm run db:demo
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../apps/web/src/generated/prisma/client";
import { connectMongo } from "../apps/web/src/lib/mongo";
import {
  Activity,
  Discussion,
  FeedPost,
  PlatformStats,
  Trend,
} from "../apps/web/src/lib/mongo-models";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const filePath = dbUrl.startsWith("file:") ? dbUrl.replace(/^file:/, "") : dbUrl;
const resolved = path.isAbsolute(filePath)
  ? filePath
  : path.join(process.cwd(), filePath);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: resolved }),
});

const SALT = process.env.PHONE_HASH_SALT || "janark-dev-salt-change-me";

function hashPhone(digits: string) {
  return createHash("sha256").update(`${SALT}:${digits}`).digest("hex");
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

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
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return out;
}

/** Demo public ids: jnk-yymmdd-abc-0001 */
async function nextPublicId(): Promise<string> {
  const day = yymmdd();
  const row = await prisma.publicIdCounter.upsert({
    where: { day },
    create: { day, count: 1 },
    update: { count: { increment: 1 } },
  });
  return `jnk-${day}-${randomLetters(3)}-${String(row.count).padStart(4, "0")}`;
}

/** Topic-matched Unsplash covers (civic / India-relevant themes). */
function u(id: string, w = 900) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=600&q=80`;
}

const TOPIC_IMAGES: Record<string, string> = {
  "education-exam-integrity": u("photo-1434030216411-0b793f4b4173"), // studying / writing exams
  "employment-job-creation": u("photo-1521737711867-e3b97375f902"), // workplace / hiring
  "government-accountability": u("photo-1587474260584-136574528ed5"), // India Gate / national civic
  "corruption-governance": u("photo-1454165804606-c3d57bc86b40"), // desk work / paperwork trail
  "judicial-legal-reforms": u("photo-1589829545856-d10d557cf95f"), // gavel / courts
  "healthcare-access": u("photo-1538108149393-fbbd81895907"), // hospital ward beds
  "womens-safety-equality": u("photo-1551836022-d5d88e9218df"), // women in workplace leadership
  "inflation-cost-of-living": u("photo-1542838132-92c53300491e"), // grocery / market prices
  "taxation-public-spending": u("photo-1554224155-6726b3ff858f"), // finance / accounts
  "agriculture-farmers": u("photo-1625204151313-875e0ed3b6f3"), // rice field / Indian farming
  "infrastructure-urban-planning": u("photo-1477959858617-67f85cf4f1df"), // city skyline / urban
  "environment-climate": u("photo-1611273426858-450d8e3c9fce"), // industrial air pollution
  "digital-rights-privacy": u("photo-1550751827-4bd374c3f58b"), // circuits / digital security
  "police-criminal-justice": u("photo-1605806616949-1e87b487fc2f"), // crime / public safety
  "election-political-reforms": u("photo-1540910419892-4a36d2c3266c"), // ballot / voting
  "science-innovation-ai": u("photo-1677442136019-21780ecad995"), // AI / tech
  "entrepreneurship-msmes": u("photo-1555529669-e69e7aa0ba9a"), // retail / small business
  "youth-mental-health": u("photo-1584515933487-779824d29309"), // care / emotional support
  "federalism-local-governance": u("photo-1529107386315-e1a2ed48a620"), // civic / government building
  "media-misinformation-foi": u("photo-1585829365295-ab7cd400c167"), // journalism / news typing
};

function mediaFor(slug: string) {
  const url = TOPIC_IMAGES[slug] ?? u("photo-1529107386315-e1a2ed48a620");
  return { url, type: "image" as const };
}

/** Mark all demo content titles so they are obviously fixtures. */
function asDummy(title: string) {
  const t = title.trim();
  return /\(dummy\)\s*$/i.test(t) ? t : `${t} (dummy)`;
}

type Citizen = {
  phoneHash: string;
  anonId: string;
  phoneHint: string;
  label: string;
};

/** Deterministic sample of n distinct citizens (wraps if n > pool). */
function pickN(pool: Citizen[], n: number, salt: number): Citizen[] {
  if (pool.length === 0 || n <= 0) return [];
  const out: Citizen[] = [];
  const used = new Set<string>();
  for (let i = 0; out.length < n && i < n * 3; i++) {
    const c = pool[(salt + i * 7) % pool.length]!;
    if (used.has(c.phoneHash) && used.size < pool.length) continue;
    used.add(c.phoneHash);
    out.push(c);
  }
  return out;
}

const LIKERT = [
  "strongly_support",
  "support",
  "support",
  "neutral",
  "oppose",
  "strongly_oppose",
] as const;

const REPORT_REACTIONS = [
  "support",
  "concerned",
  "important",
  "angry",
  "sad",
] as const;

const COMMENT_BODIES = [
  "Agree — publish the timeline with dates citizens can verify.",
  "Sharing district-level evidence would strengthen this ask.",
  "Non-partisan framing helps more people engage productively.",
  "Has anyone filed an RTI / grievance ticket on this yet?",
  "Local ward photos + ticket IDs beat screenshots of rumour posts.",
  "Support with caveats: capacity and staffing need to be funded.",
  "This matches what aspirants and families are saying offline.",
  "Please keep party logos out — focus on process and outcomes.",
  "A public dashboard would reduce panic and speculation.",
  "Neutral for now — need clearer metrics before endorsing.",
  "Youth voices matter here; counseling waitlists are real.",
  "Farmers need advance calendars, not last-minute SMS surprises.",
  "Procurement transparency is the minimum for trust.",
  "Air quality enforcement should list ward actions, not slogans.",
  "Exam integrity needs independent audits people can read.",
];

/** Top 20 trending civic issues — ranking matches public discourse priority */
const ISSUE_DEFS = [
  {
    slug: "education-exam-integrity",
    title: "Education & Exam Integrity",
    category: "Education",
    why: "NEET, paper leaks, recruitment exams, transparency, accountability. This is currently the largest youth-driven issue.",
    summary:
      "Citizens are demanding secure, transparent, and merit-based examination systems. Key concerns include paper leaks, delayed recruitment, accountability of examination bodies, and restoring trust in competitive exams.",
    pros: [
      "Restores trust in merit",
      "Clear timelines reduce aspirant anxiety",
      "Independent audits deter malpractice",
    ],
    cons: [
      "National logistics are complex",
      "Re-exams disrupt academic calendars",
    ],
    tags: ["exams", "education", "nta", "neet"],
  },
  {
    slug: "employment-job-creation",
    title: "Employment & Job Creation",
    category: "Employment",
    why: "Graduate unemployment, hiring quality, AI replacing entry-level jobs, skill mismatch.",
    summary:
      "Focuses on creating quality jobs, improving employability, accelerating government recruitment, supporting startups, and preparing the workforce for AI-driven changes.",
    pros: [
      "Quality jobs reduce underemployment",
      "Skills aligned to industry demand",
      "Transparent public recruitment",
    ],
    cons: [
      "Structural reforms take time",
      "AI disruption needs continuous reskilling",
    ],
    tags: ["jobs", "employment", "skills", "ai"],
  },
  {
    slug: "government-accountability",
    title: "Government Accountability",
    category: "Governance",
    why: "Ministerial responsibility, resignations, institutional transparency, public trust.",
    summary:
      "Emphasizes transparent governance, timely responses to failures, stronger institutional accountability, public disclosures, and measurable government performance.",
    pros: [
      "Builds public trust",
      "Measurable delivery dashboards",
      "Faster redress of failures",
    ],
    cons: [
      "Political incentives may resist disclosure",
      "Metrics can be gamed without audits",
    ],
    tags: ["accountability", "governance", "transparency"],
  },
  {
    slug: "corruption-governance",
    title: "Corruption & Governance",
    category: "Governance",
    why: "Public corruption, exam scams, procurement, misuse of power.",
    summary:
      "Aims to reduce corruption through transparent procurement, stronger anti-corruption laws, whistleblower protection, digital governance, and independent oversight.",
    pros: [
      "Transparent procurement saves public money",
      "Whistleblower protection enables reporting",
      "Digital trails reduce discretion abuse",
    ],
    cons: [
      "Enforcement capacity varies by state",
      "Laws alone fail without independent probes",
    ],
    tags: ["corruption", "procurement", "whistleblower"],
  },
  {
    slug: "judicial-legal-reforms",
    title: "Judicial & Legal Reforms",
    category: "Justice",
    why: "Court delays, judicial independence, police accountability, legal accessibility.",
    summary:
      "Seeks faster justice, judicial transparency, police reforms, reduced case backlogs, improved legal aid, and stronger independence of constitutional institutions.",
    pros: [
      "Faster case disposal",
      "Accessible legal aid for citizens",
      "Stronger institutional independence",
    ],
    cons: [
      "Backlog reduction needs sustained funding",
      "Reforms must protect due process",
    ],
    tags: ["judiciary", "legal", "courts", "justice"],
  },
  {
    slug: "healthcare-access",
    title: "Healthcare",
    category: "Healthcare",
    why: "Public hospitals, insurance, medical education, rural healthcare access.",
    summary:
      "Focuses on improving affordability, strengthening public healthcare infrastructure, expanding medical education, and ensuring equitable healthcare access across India.",
    pros: [
      "Lower out-of-pocket spending",
      "Stronger primary and rural care",
      "More medical seats with quality training",
    ],
    cons: [
      "Needs sustained public finance",
      "Staffing gaps take years to close",
    ],
    tags: ["healthcare", "hospitals", "insurance"],
  },
  {
    slug: "womens-safety-equality",
    title: "Women's Safety & Equality",
    category: "Equality",
    why: "Crimes against women, workplace safety, representation, gender equality.",
    summary:
      "Promotes safer public spaces, faster justice for crimes against women, equal opportunities, political representation, workplace safety, and gender-inclusive policies.",
    pros: [
      "Safer streets and transit",
      "Faster, sensitive investigations",
      "Equal opportunity at work and in politics",
    ],
    cons: [
      "Needs coordinated policing and courts",
      "Cultural change accompanies legal reform",
    ],
    tags: ["womensafety", "equality", "workplace"],
  },
  {
    slug: "inflation-cost-of-living",
    title: "Inflation & Cost of Living",
    category: "Economy",
    why: "Food prices, fuel, housing, middle-class affordability.",
    summary:
      "Addresses rising living costs through better inflation management, affordable housing, stable fuel prices, food security, and improved purchasing power.",
    pros: [
      "Protects household budgets",
      "Food security for the vulnerable",
      "Affordable housing expands opportunity",
    ],
    cons: [
      "Global commodity shocks are hard to fully offset",
      "Subsidies must stay targeted",
    ],
    tags: ["inflation", "prices", "housing", "fuel"],
  },
  {
    slug: "taxation-public-spending",
    title: "Taxation & Public Spending",
    category: "Economy",
    why: "Income tax, GST, public expenditure transparency.",
    summary:
      "Encourages simplified taxation, transparent government spending, efficient use of taxpayer money, and easier compliance for citizens and businesses.",
    pros: [
      "Simpler compliance",
      "Public spending dashboards",
      "Better value for taxpayer money",
    ],
    cons: [
      "Tax redesign has winners and losers",
      "Transparency needs interoperable data systems",
    ],
    tags: ["tax", "gst", "spending", "budget"],
  },
  {
    slug: "agriculture-farmers",
    title: "Agriculture & Farmers",
    category: "Agriculture",
    why: "MSP, farm income, irrigation, climate resilience, agri-tech.",
    summary:
      "Focuses on improving farmer incomes, modernizing agriculture, expanding irrigation, adopting technology, and increasing resilience to climate change.",
    pros: [
      "Higher and stabler farm incomes",
      "Climate-resilient practices",
      "Agri-tech improves yields and markets",
    ],
    cons: [
      "Market reforms need careful transition support",
      "Irrigation expansion is capital intensive",
    ],
    tags: ["farmers", "msp", "agriculture", "irrigation"],
  },
  {
    slug: "infrastructure-urban-planning",
    title: "Infrastructure & Urban Planning",
    category: "Infrastructure",
    why: "Roads, railways, traffic, public transport, smart cities.",
    summary:
      "Prioritizes sustainable infrastructure, efficient public transport, better urban planning, smart cities, and improved connectivity across regions.",
    pros: [
      "Faster, safer mobility",
      "Less congestion and pollution",
      "Inclusive last-mile access",
    ],
    cons: [
      "Land acquisition and coordination delays",
      "Capex must pair with maintenance funding",
    ],
    tags: ["infrastructure", "transit", "cities", "roads"],
  },
  {
    slug: "environment-climate",
    title: "Environment & Climate",
    category: "Environment",
    why: "Air pollution, water scarcity, floods, waste management, renewable energy.",
    summary:
      "Promotes environmental protection through pollution control, water conservation, climate adaptation, renewable energy, biodiversity conservation, and sustainable waste management.",
    pros: [
      "Healthier air and water",
      "Climate adaptation saves lives",
      "Green jobs in renewables and waste",
    ],
    cons: [
      "Multi-agency coordination is hard",
      "Short-term costs vs long-term gains",
    ],
    tags: ["climate", "pollution", "renewables", "waste"],
  },
  {
    slug: "digital-rights-privacy",
    title: "Digital Rights & Privacy",
    category: "Digital",
    why: "Data protection, surveillance, cybersecurity, AI governance.",
    summary:
      "Focuses on protecting personal data, ensuring digital privacy, strengthening cybersecurity, promoting responsible AI, and safeguarding digital rights.",
    pros: [
      "Stronger personal data protection",
      "Clear AI accountability rules",
      "Better cybersecurity for citizens and firms",
    ],
    cons: [
      "Balancing security and privacy is contested",
      "Tech capacity gaps in enforcement",
    ],
    tags: ["privacy", "data", "cybersecurity", "ai"],
  },
  {
    slug: "police-criminal-justice",
    title: "Police & Criminal Justice",
    category: "Justice",
    why: "Law enforcement reforms, custodial issues, investigation quality.",
    summary:
      "Advocates for modern policing, transparent investigations, accountability, protection of civil rights, and improved public trust in law enforcement.",
    pros: [
      "Better investigation quality",
      "Civil-rights safeguards",
      "Public trust in policing",
    ],
    cons: [
      "Training and culture change take time",
      "Needs independent oversight mechanisms",
    ],
    tags: ["police", "criminaljustice", "accountability"],
  },
  {
    slug: "election-political-reforms",
    title: "Election & Political Reforms",
    category: "Democracy",
    why: "Electoral funding, criminal cases, transparency, anti-defection.",
    summary:
      "Explores reforms to improve electoral transparency, campaign finance, candidate disclosure, political accountability, and public trust in democratic institutions.",
    pros: [
      "Cleaner campaign finance",
      "Better candidate disclosures",
      "Stronger democratic trust",
    ],
    cons: [
      "Political consensus is difficult",
      "Implementation must stay non-partisan",
    ],
    tags: ["elections", "funding", "democracy"],
  },
  {
    slug: "science-innovation-ai",
    title: "Science, Innovation & AI",
    category: "Science",
    why: "Research funding, semiconductor policy, AI adoption, startups.",
    summary:
      "Encourages investment in research, emerging technologies, AI, semiconductors, scientific innovation, and technology-driven economic growth.",
    pros: [
      "Long-term competitiveness",
      "High-skill jobs",
      "Domestic semiconductor and AI capacity",
    ],
    cons: [
      "R&D returns are long-horizon",
      "Needs patient public and private capital",
    ],
    tags: ["science", "ai", "semiconductors", "innovation"],
  },
  {
    slug: "entrepreneurship-msmes",
    title: "Entrepreneurship & MSMEs",
    category: "Economy",
    why: "Ease of doing business, startup ecosystem, access to capital.",
    summary:
      "Supports startups and MSMEs through simplified regulations, better financing, innovation incentives, digital transformation, and entrepreneurship development.",
    pros: [
      "Job creation at scale",
      "Easier compliance for small firms",
      "Broader access to capital",
    ],
    cons: [
      "Credit risk for lenders",
      "Regulatory simplification must stay consistent",
    ],
    tags: ["msme", "startups", "business"],
  },
  {
    slug: "youth-mental-health",
    title: "Youth & Mental Health",
    category: "Health",
    why: "Student stress, exam pressure, counseling, suicide prevention.",
    summary:
      "Promotes mental health awareness, accessible counseling, stress reduction initiatives, suicide prevention, and holistic support for young people.",
    pros: [
      "Accessible counseling in schools and colleges",
      "Suicide prevention networks",
      "Reduced stigma around seeking help",
    ],
    cons: [
      "Shortage of trained counselors",
      "Needs sustained funding beyond campaigns",
    ],
    tags: ["mentalhealth", "youth", "students"],
  },
  {
    slug: "federalism-local-governance",
    title: "Federalism & Local Governance",
    category: "Governance",
    why: "State–Centre relations, municipal performance, decentralization.",
    summary:
      "Focuses on strengthening cooperative federalism, empowering local governments, improving municipal services, and decentralizing decision-making.",
    pros: [
      "Services closer to citizens",
      "Stronger municipalities",
      "Cooperative Centre–state delivery",
    ],
    cons: [
      "Capacity varies widely across ULBs",
      "Fiscal devolution must match mandates",
    ],
    tags: ["federalism", "municipal", "localgov"],
  },
  {
    slug: "media-misinformation-foi",
    title: "Media, Misinformation & Freedom of Information",
    category: "Media",
    why: "Trust in media, fact-checking, platform accountability, information literacy.",
    summary:
      "Addresses misinformation, promotes media literacy, encourages responsible journalism, strengthens transparency, and supports citizens' access to reliable information.",
    pros: [
      "Higher information literacy",
      "Platform accountability",
      "Stronger RTI / FOI culture",
    ],
    cons: [
      "Free speech vs harm is contested",
      "Fact-checking must stay independent",
    ],
    tags: ["media", "misinformation", "rti", "literacy"],
  },
] as const;

async function main() {
  console.log("Seeding top-20 India civic issues + demo engagement…");
  await prisma.publicIdCounter.deleteMany();

  const citizens: Citizen[] = [];
  for (let i = 0; i < 12; i++) {
    const mobile = `9198765400${String(i).padStart(2, "0")}`;
    const id = `jn-demo${String(i).padStart(4, "0")}`;
    const phoneHash = hashPhone(mobile);
    await prisma.phoneIdentity.upsert({
      where: { phoneHash },
      update: {
        lastSeenAt: new Date(),
        anonId: id,
        phoneHint: `••${mobile.slice(-2)}`,
      },
      create: {
        phoneHash,
        anonId: id,
        phoneHint: `••${mobile.slice(-2)}`,
      },
    });
    citizens.push({
      phoneHash,
      anonId: id,
      phoneHint: `••${mobile.slice(-2)}`,
      label: `Anon ${id}`,
    });
  }
  console.log(`  ${citizens.length} phone identities`);

  for (const [idx, iss] of ISSUE_DEFS.entries()) {
    const cover = mediaFor(iss.slug);
    const publicId = await nextPublicId();
    await prisma.issue.upsert({
      where: { slug: iss.slug },
      update: {
        publicId,
        title: asDummy(iss.title),
        summary: iss.summary,
        whyItMatters: iss.why,
        currentSituation: iss.summary,
        pros: JSON.stringify(iss.pros),
        cons: JSON.stringify(iss.cons),
        category: iss.category,
        mediaUrl: cover.url,
        mediaType: cover.type,
        voteCount: 0,
        rating: 0,
        trendingRank: idx + 1,
      },
      create: {
        publicId,
        slug: iss.slug,
        title: asDummy(iss.title),
        category: iss.category,
        summary: iss.summary,
        whyItMatters: iss.why,
        currentSituation: iss.summary,
        pros: JSON.stringify(iss.pros),
        cons: JSON.stringify(iss.cons),
        sources: JSON.stringify([{ label: "Citizen signals", url: "/feed" }]),
        relatedSlugs: JSON.stringify(
          ISSUE_DEFS.filter((_, j) => Math.abs(j - idx) === 1).map((x) => x.slug),
        ),
        mediaUrl: cover.url,
        mediaType: cover.type,
        voteCount: 0,
        rating: 0,
        trendingRank: idx + 1,
      },
    });
  }
  console.log(`  ${ISSUE_DEFS.length} issues`);

  // One open proposal / vote per top issue (zero ballots)
  const proposalSpecs = ISSUE_DEFS.map((iss, idx) => ({
    id: `vote-${iss.slug}`,
    title: asDummy(`Citizen vote: priorities for ${iss.title}`),
    description: `${iss.summary}\n\nShould public institutions publish a time-bound action plan on this issue with measurable milestones?`,
    issueSlug: iss.slug,
    voteType: idx % 5 === 0 ? ("preference" as const) : ("likert" as const),
    options:
      idx % 5 === 0
        ? ["Urgent national plan", "State-led pilots first", "More evidence before mandates"]
        : undefined,
  }));

  for (const p of proposalSpecs) {
    const cover = mediaFor(p.issueSlug);
    const publicId = await nextPublicId();
    await prisma.proposal.upsert({
      where: { id: p.id },
      update: {
        publicId,
        title: p.title,
        description: p.description,
        mediaUrl: cover.url,
        mediaType: cover.type,
        totalVotes: 0,
        results: null,
      },
      create: {
        id: p.id,
        publicId,
        title: p.title,
        description: p.description,
        benefits: JSON.stringify([
          "Public accountability",
          "Clear milestones citizens can track",
        ]),
        argumentsFor: JSON.stringify([
          "Transparency builds trust",
          "Measurable plans reduce rumour-driven panic",
        ]),
        argumentsAgainst: JSON.stringify([
          "Needs administrative capacity",
          "Must stay non-partisan in presentation",
        ]),
        voteType: p.voteType,
        options: p.options ? JSON.stringify(p.options) : null,
        issueSlug: p.issueSlug,
        locationLevel: "national",
        country: "India",
        mediaUrl: cover.url,
        mediaType: cover.type,
        totalVotes: 0,
      },
    });
  }
  console.log(`  ${proposalSpecs.length} proposals`);

  // Ground reports tied to trending themes
  const reportDefs = [
    {
      type: "issue",
      title: "Exam centre — no published grievance desk after glitch rumour",
      body: "Aspirants waited hours without a clear escalation path. Request on-site grievance protocol and SMS updates for every major exam cycle.",
      locationLevel: "city",
      city: "Patna",
      district: "Patna",
      state: "Bihar",
      issueSlug: "education-exam-integrity",
    },
    {
      type: "problem",
      title: "Campus placement board lists unpaid ‘internships’ as jobs",
      body: "Students report inflated placement stats. Ask colleges to publish verified salary bands and unpaid vs paid roles separately.",
      locationLevel: "city",
      city: "Hyderabad",
      district: "Hyderabad",
      state: "Telangana",
      issueSlug: "employment-job-creation",
    },
    {
      type: "problem",
      title: "Primary health centre out of essential medicines for a week",
      body: "Patients redirected to private chemists for basic antibiotics and ORS. Request public stock update and refill timeline.",
      locationLevel: "district",
      district: "Nashik",
      state: "Maharashtra",
      issueSlug: "healthcare-access",
    },
    {
      type: "crime",
      title: "Evening snatching on unlit footpath near college gate",
      body: "Repeated phone snatching after classes. Incomplete footpath; streetlights dark. Request lighting + patrol window 7–9 pm.",
      locationLevel: "city",
      city: "Pune",
      district: "Pune",
      state: "Maharashtra",
      issueSlug: "womens-safety-equality",
    },
    {
      type: "problem",
      title: "AQI stays hazardous — construction dust unenforced at site",
      body: "Residents near an active corridor report uncovered debris and no night watering. Request municipal enforcement under air-quality directions.",
      locationLevel: "city",
      city: "Delhi",
      district: "South Delhi",
      state: "Delhi",
      issueSlug: "environment-climate",
    },
    {
      type: "problem",
      title: "Vegetable wholesale prices spike — no ward price board",
      body: "Middle-class households face opaque daily rates. Request public wholesale and retail boards at major mandis.",
      locationLevel: "city",
      city: "Lucknow",
      district: "Lucknow",
      state: "Uttar Pradesh",
      issueSlug: "inflation-cost-of-living",
    },
    {
      type: "issue",
      title: "Court listing delays — no SMS when hearing adjourned",
      body: "Litigants travel overnight only to find adjournment at the gate. Request digital listing alerts for all cases.",
      locationLevel: "city",
      city: "Jaipur",
      district: "Jaipur",
      state: "Rajasthan",
      issueSlug: "judicial-legal-reforms",
    },
    {
      type: "problem",
      title: "Municipal grievance app marks tickets resolved without visit",
      body: "Citizens report auto-closure of pothole tickets. Ask for photo-verified closure and public SLA dashboard.",
      locationLevel: "city",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
      issueSlug: "federalism-local-governance",
    },
    {
      type: "issue",
      title: "Student counseling waitlist exceeds one semester",
      body: "Campus mental-health clinic has a multi-month queue. Request funded counselor posts and 24×7 helpline linkage.",
      locationLevel: "city",
      city: "Chennai",
      district: "Chennai",
      state: "Tamil Nadu",
      issueSlug: "youth-mental-health",
    },
    {
      type: "problem",
      title: "Canal irrigation schedule unpublished before sowing",
      body: "Farmers planted without knowing water turns. Request advance public irrigation calendar and SMS alerts.",
      locationLevel: "district",
      district: "Nashik",
      state: "Maharashtra",
      issueSlug: "agriculture-farmers",
    },
  ];

  const reportIds: string[] = [];
  for (const [ri, r] of reportDefs.entries()) {
    const author = pick(citizens);
    const media = mediaFor(r.issueSlug);
    const created = await prisma.citizenReport.create({
      data: {
        publicId: await nextPublicId(),
        type: r.type,
        title: asDummy(r.title),
        body: r.body,
        locationLevel: r.locationLevel,
        city: r.city ?? null,
        district: r.district ?? null,
        state: r.state,
        country: "India",
        authorLabel: author.label,
        authorAnonId: author.anonId,
        authorHash: author.phoneHash,
        mediaUrl: media.url,
        mediaType: media.type,
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        createdAt: daysAgo(1 + (ri % 12)),
      },
    });
    reportIds.push(created.id);
  }
  console.log(`  ${reportIds.length} reports`);

  // Public demands — one clear ask per major theme cluster
  const demandDefs = [
    {
      title: "Publish national exam-security & re-exam calendar",
      ask: "Examination bodies should publish fixed security protocols and any re-exam calendar within a stated deadline — public and non-partisan.",
      body: "Students need certainty. Opaque delays destroy a year of preparation. This demand is about process credibility.",
      target: "government",
      targetDetail: "Ministry of Education / examination bodies",
      locationLevel: "national",
      category: "education",
      state: null as string | null,
      city: null as string | null,
      district: null as string | null,
      tags: ["exams", "education"],
      issueSlug: "education-exam-integrity",
    },
    {
      title: "Accelerate transparent government recruitment calendars",
      ask: "Publish fixed recruitment timelines and vacancy dashboards for major public exams and hiring cycles.",
      body: "Graduate unemployment worsens when notifications slip without explanation. Calendars restore predictability.",
      target: "government",
      targetDetail: "DoPT / state public service commissions",
      locationLevel: "national",
      category: "employment",
      state: null,
      city: null,
      district: null,
      tags: ["jobs", "recruitment"],
      issueSlug: "employment-job-creation",
    },
    {
      title: "Weekly PHC medicine stock on a public dashboard",
      ask: "Every district to post essential-medicine availability for primary clinics every Monday.",
      body: "Primary care fails when shelves are empty. A live stock board lets citizens verify delivery.",
      target: "state",
      targetDetail: "State health department",
      locationLevel: "state",
      state: "Maharashtra",
      category: "healthcare",
      city: null,
      district: null,
      tags: ["healthcare", "phc"],
      issueSlug: "healthcare-access",
    },
    {
      title: "Street lighting + safe last-mile near campuses",
      ask: "Cities must publish lighting and patrol SLAs for college corridors after dark.",
      body: "Women's safety requires lit paths and responsive policing — not only awareness campaigns.",
      target: "district",
      targetDetail: "Municipal corporation / police",
      locationLevel: "city",
      city: "Pune",
      district: "Pune",
      state: "Maharashtra",
      category: "equality",
      tags: ["womensafety", "cities"],
      issueSlug: "womens-safety-equality",
    },
    {
      title: "Transparent e-procurement for all major civic contracts",
      ask: "Mandate open e-procurement with public bid documents above a clear value threshold.",
      body: "Procurement opacity feeds corruption narratives. Open bids build trust and competition.",
      target: "government",
      targetDetail: "Finance / vigilance departments",
      locationLevel: "national",
      category: "governance",
      state: null,
      city: null,
      district: null,
      tags: ["corruption", "procurement"],
      issueSlug: "corruption-governance",
    },
    {
      title: "Public case-age dashboards for district courts",
      ask: "Publish anonymised case pendency and adjournment rates by court complex.",
      body: "Citizens cannot fix what they cannot see. Dashboards support backlog reduction without naming parties.",
      target: "institution",
      targetDetail: "High Courts / e-Courts",
      locationLevel: "national",
      category: "justice",
      state: null,
      city: null,
      district: null,
      tags: ["judiciary", "courts"],
      issueSlug: "judicial-legal-reforms",
    },
    {
      title: "Ward-level air quality & construction dust enforcement board",
      ask: "Publish daily AQI and open construction-dust enforcement tickets for each ward.",
      body: "Air is a public service. Visible enforcement reduces toxic seasons.",
      target: "district",
      targetDetail: "Municipal corporation / pollution board",
      locationLevel: "city",
      city: "Delhi",
      district: "South Delhi",
      state: "Delhi",
      category: "environment",
      tags: ["climate", "airquality"],
      issueSlug: "environment-climate",
    },
    {
      title: "Campus counseling capacity matching student strength",
      ask: "Fund counselor posts so waitlists stay under two weeks; link 24×7 helplines.",
      body: "Exam pressure and youth mental health need staffed clinics — not only posters.",
      target: "state",
      targetDetail: "Higher education / health departments",
      locationLevel: "state",
      state: "Tamil Nadu",
      category: "health",
      city: null,
      district: null,
      tags: ["mentalhealth", "youth"],
      issueSlug: "youth-mental-health",
    },
    {
      title: "Simplify MSME compliance into a single annual return where possible",
      ask: "Map overlapping filings and publish a reduction plan with timelines.",
      body: "Small firms lose days to paperwork. Simplification unlocks growth and formal jobs.",
      target: "government",
      targetDetail: "MSME / finance ministries",
      locationLevel: "national",
      category: "economy",
      state: null,
      city: null,
      district: null,
      tags: ["msme", "business"],
      issueSlug: "entrepreneurship-msmes",
    },
    {
      title: "Advance irrigation calendars via SMS before sowing",
      ask: "Water departments to publish and SMS canal turns at least 21 days before sowing windows.",
      body: "Farmers plan crops around water. Surprise closures destroy income.",
      target: "state",
      targetDetail: "Irrigation department",
      locationLevel: "state",
      state: "Maharashtra",
      category: "agriculture",
      city: null,
      district: null,
      tags: ["farmers", "irrigation"],
      issueSlug: "agriculture-farmers",
    },
  ];

  const demandIds: string[] = [];
  for (const [di, d] of demandDefs.entries()) {
    const author = pick(citizens);
    const media = mediaFor(d.issueSlug);
    const created = await prisma.publicDemand.create({
      data: {
        publicId: await nextPublicId(),
        title: asDummy(d.title),
        body: d.body,
        ask: d.ask,
        target: d.target,
        targetDetail: d.targetDetail,
        category: d.category,
        status: "gathering",
        locationLevel: d.locationLevel,
        city: d.city,
        district: d.district,
        state: d.state,
        country: "India",
        authorLabel: author.label,
        authorAnonId: author.anonId,
        authorHash: author.phoneHash,
        mediaUrl: media.url,
        mediaType: media.type,
        supportCount: 0,
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        createdAt: daysAgo(1 + (di % 10)),
      },
    });
    demandIds.push(created.id);
  }
  console.log(`  ${demandIds.length} demands`);

  const memeDefs = [
    {
      title: "When the exam paper ‘leaks’ before the hall ticket",
      caption: "Merit needs process credibility — publish the audit.",
      tags: ["exams", "education", "janark", "nta"],
      issueSlug: "education-exam-integrity",
    },
    {
      title: "Graduate with degree, waiting for notification",
      caption: "Jobs need calendars, not vibes.",
      tags: ["jobs", "employment", "janark"],
      issueSlug: "employment-job-creation",
    },
    {
      title: "PHC shelf: out of stock (again)",
      caption: "Primary care starts with medicines on the shelf.",
      tags: ["healthcare", "phc", "janark"],
      issueSlug: "healthcare-access",
    },
    {
      title: "When the AQI app turns purple again",
      caption: "Air is a public service, not a personal problem.",
      tags: ["climate", "airquality", "janark"],
      issueSlug: "environment-climate",
    },
    {
      title: "Counseling waitlist longer than the semester",
      caption: "Youth mental health needs staffed clinics.",
      tags: ["mentalhealth", "youth", "janark"],
      issueSlug: "youth-mental-health",
    },
    {
      title: "Procurement: ‘trust us’ vs open bids",
      caption: "Sunshine is the best disinfectant.",
      tags: ["corruption", "procurement", "janark"],
      issueSlug: "corruption-governance",
    },
  ];

  const memeIds: string[] = [];
  for (const [i, m] of memeDefs.entries()) {
    const author = pick(citizens);
    const imageUrl = mediaFor(m.issueSlug).url;
    const created = await prisma.meme.create({
      data: {
        publicId: await nextPublicId(),
        title: asDummy(m.title),
        caption: m.caption,
        imageUrl,
        mediaType: "image",
        authorLabel: author.label,
        authorAnonId: author.anonId,
        authorHash: author.phoneHash,
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        shareCount: 0,
        createdAt: daysAgo(i % 7),
      },
    });
    memeIds.push(created.id);
    for (const tag of m.tags) {
      const hashtag = await prisma.hashtag.upsert({
        where: { tag },
        create: { tag },
        update: {},
      });
      await prisma.memeTag.create({
        data: { memeId: created.id, hashtagId: hashtag.id },
      });
    }
  }
  console.log(`  ${memeIds.length} memes`);

  const noticeDefs = [
    {
      title: "Evidence window: exam-centre process failures",
      description:
        "Anonymous window to report missing grievance desks, delayed results, or opaque re-exam notices — facts over rumour. Label date, centre, and exam name.",
      target: "government",
      targetDetail: "Examination bodies",
    },
    {
      title: "Public hearing ask: city air & dust enforcement",
      description:
        "Citizens request an open hearing on construction-dust enforcement and ward AQI boards. Keep it non-partisan; bring local evidence.",
      target: "district",
      targetDetail: "Municipal commissioner",
    },
    {
      title: "Evidence window: PHC stock-outs this month",
      description:
        "Report medicine names, dates, and clinic location — not personal attacks. The ask is public stock transparency.",
      target: "state",
      targetDetail: "State health department",
    },
  ];

  const noticeIds: string[] = [];
  for (const n of noticeDefs) {
    const author = pick(citizens);
    const notice = await prisma.notice.create({
      data: {
        publicId: await nextPublicId(),
        title: asDummy(n.title),
        description: n.description,
        target: n.target,
        targetDetail: n.targetDetail,
        author: author.label,
        authorAnonId: author.anonId,
        signatures: 0,
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
        createdAt: daysAgo(2),
      },
    });
    noticeIds.push(notice.id);
  }
  console.log(`  ${noticeDefs.length} notices`);

  await prisma.engagementVote.deleteMany();
  await prisma.engagementComment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.reportVote.deleteMany();
  await prisma.reportReaction.deleteMany();
  await prisma.demandSupport.deleteMany();
  await prisma.memeVote.deleteMany();
  await prisma.signature.deleteMany();
  console.log("  engagement tables cleared (will reseed reactions)");

  await connectMongo();
  await Promise.all([
    FeedPost.deleteMany({}),
    Discussion.deleteMany({}),
    Trend.deleteMany({}),
    Activity.deleteMany({}),
    PlatformStats.deleteMany({}),
  ]);

  type FeedItem = {
    type: string;
    title: string;
    excerpt: string;
    publicId: string;
    href: string;
    meta: string;
    votes: number;
    hot: boolean;
    tags: string[];
    author: string;
    authorAnonId: string;
    refId?: string;
    mediaUrl?: string;
    mediaType?: string;
    locationLevel?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    createdAt: Date;
  };

  const feedItems: FeedItem[] = [];

  const issuePid = new Map(
    (
      await prisma.issue.findMany({ select: { slug: true, publicId: true } })
    ).map((r) => [r.slug, r.publicId!]),
  );
  const proposalPid = new Map(
    (
      await prisma.proposal.findMany({ select: { id: true, publicId: true } })
    ).map((r) => [r.id, r.publicId!]),
  );
  const reportPid = new Map(
    (
      await prisma.citizenReport.findMany({
        select: { id: true, publicId: true },
      })
    ).map((r) => [r.id, r.publicId!]),
  );
  const demandPid = new Map(
    (
      await prisma.publicDemand.findMany({
        select: { id: true, publicId: true },
      })
    ).map((r) => [r.id, r.publicId!]),
  );
  const memePid = new Map(
    (
      await prisma.meme.findMany({ select: { id: true, publicId: true } })
    ).map((r) => [r.id, r.publicId!]),
  );
  const noticePid = new Map(
    (
      await prisma.notice.findMany({ select: { id: true, publicId: true } })
    ).map((r) => [r.id, r.publicId!]),
  );

  for (const [idx, iss] of ISSUE_DEFS.entries()) {
    const a = pick(citizens);
    const cover = mediaFor(iss.slug);
    feedItems.push({
      type: "issue",
      title: asDummy(`#${idx + 1} ${iss.title}`),
      excerpt: iss.summary,
      publicId: issuePid.get(iss.slug)!,
      href: `/issues/${iss.slug}`,
      meta: `Trending #${idx + 1} · ${iss.category} · India`,
      votes: 0,
      hot: idx < 5,
      tags: ["issue", ...iss.tags, "india", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: iss.slug,
      mediaUrl: cover.url,
      mediaType: cover.type,
      country: "India",
      createdAt: daysAgo(idx + 1),
    });
  }

  for (const [idx, p] of proposalSpecs.entries()) {
    const a = pick(citizens);
    const cover = mediaFor(p.issueSlug);
    feedItems.push({
      type: "proposal",
      title: p.title,
      excerpt: p.description.slice(0, 280),
      publicId: proposalPid.get(p.id)!,
      href: `/vote/${p.id}`,
      meta: "Open vote · 0 ballots",
      votes: 0,
      hot: false,
      tags: ["vote", "proposal", "india", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: p.id,
      mediaUrl: cover.url,
      mediaType: cover.type,
      country: "India",
      createdAt: daysAgo(idx + 2),
    });
  }

  for (let i = 0; i < reportIds.length; i++) {
    const r = reportDefs[i]!;
    const id = reportIds[i]!;
    const a = pick(citizens);
    const media = mediaFor(r.issueSlug);
    feedItems.push({
      type: "discussion",
      title: asDummy(`[${r.type}] ${r.title}`),
      excerpt: r.body,
      publicId: reportPid.get(id)!,
      href: `/reports/${id}`,
      meta: `${r.locationLevel} · ${r.state}`,
      votes: 0,
      hot: false,
      tags: [r.type, r.locationLevel, "india", r.state.toLowerCase().replace(/\s+/g, "")],
      author: a.label,
      authorAnonId: a.anonId,
      refId: id,
      mediaUrl: media.url,
      mediaType: media.type,
      locationLevel: r.locationLevel,
      city: r.city,
      district: r.district,
      state: r.state,
      country: "India",
      createdAt: daysAgo(1 + (i % 12)),
    });
  }

  for (let i = 0; i < demandIds.length; i++) {
    const d = demandDefs[i]!;
    const id = demandIds[i]!;
    const a = pick(citizens);
    const media = mediaFor(d.issueSlug);
    feedItems.push({
      type: "discussion",
      title: asDummy(`[petition] ${d.title}`),
      excerpt: d.ask,
      publicId: demandPid.get(id)!,
      href: `/petitions/${id}`,
      meta: `${d.locationLevel} · petition`,
      votes: 0,
      hot: i < 3,
      tags: ["petition", "demand", ...d.tags, "india", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: id,
      mediaUrl: media.url,
      mediaType: media.type,
      locationLevel: d.locationLevel,
      city: d.city ?? undefined,
      district: d.district ?? undefined,
      state: d.state ?? undefined,
      country: "India",
      createdAt: daysAgo(1 + (i % 10)),
    });
  }

  for (let i = 0; i < memeIds.length; i++) {
    const m = memeDefs[i]!;
    const id = memeIds[i]!;
    const a = pick(citizens);
    const media = mediaFor(m.issueSlug);
    feedItems.push({
      type: "meme",
      title: asDummy(m.title),
      excerpt: m.caption,
      publicId: memePid.get(id)!,
      href: `/memes/${id}`,
      meta: m.tags.map((t) => `#${t}`).join(" "),
      votes: 0,
      hot: false,
      tags: ["meme", ...m.tags],
      author: a.label,
      authorAnonId: a.anonId,
      refId: id,
      mediaUrl: media.url,
      mediaType: media.type,
      country: "India",
      createdAt: daysAgo(i % 7),
    });
  }

  for (const [ni, noticeId] of noticeIds.entries()) {
    const n = noticeDefs[ni]!;
    const a = pick(citizens);
    feedItems.push({
      type: "notice",
      title: asDummy(n.title),
      excerpt: n.description.slice(0, 200),
      publicId: noticePid.get(noticeId)!,
      href: `/notice/${noticeId}`,
      meta: "Notice · 0 signatures",
      votes: 0,
      hot: false,
      tags: ["notice", "india", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: noticeId,
      country: "India",
      createdAt: daysAgo(2),
    });
  }

  const freeTalk = [
    {
      title: "India's civic square — top 20 issues this season",
      body: "From exam integrity and jobs to climate, privacy, and local governance — pick a rank, add place + hashtags, keep it non-partisan. Browse /issues for the full list.",
      tags: ["discussion", "india", "janark", "civic", "trending"],
      issueSlug: "government-accountability",
      locationLevel: "national",
      state: undefined as string | undefined,
      city: undefined as string | undefined,
      district: undefined as string | undefined,
      country: "India",
    },
    {
      title: "How do we verify exam-process claims without rumour?",
      body: "Share centre codes, dates, and official ticket numbers. Label facts vs opinions. No party branding.",
      tags: ["discussion", "exams", "education", "janark"],
      issueSlug: "education-exam-integrity",
      locationLevel: "national",
      state: undefined,
      city: undefined,
      district: undefined,
      country: "India",
    },
    {
      title: "Documenting air quality and dust enforcement locally",
      body: "Ward photos, dates, and municipal ticket IDs help more than screenshots of party posts.",
      tags: ["discussion", "climate", "airquality", "janark"],
      issueSlug: "environment-climate",
      locationLevel: "city",
      city: "Delhi",
      district: "New Delhi",
      state: "Delhi",
      country: "India",
    },
  ];

  const freeTalkPostIds: string[] = [];
  for (const [fi, f] of freeTalk.entries()) {
    const a = pick(citizens);
    const media = mediaFor(f.issueSlug);
    const publicId = await nextPublicId();
    const post = await FeedPost.create({
      type: "discussion",
      title: asDummy(f.title),
      excerpt: f.body.slice(0, 220),
      body: f.body,
      publicId,
      href: `/p/${publicId}`,
      meta: "Open discussion · India",
      votes: 0,
      hot: fi === 0,
      tags: f.tags,
      author: a.label,
      authorAnonId: a.anonId,
      mediaUrl: media.url,
      mediaType: media.type,
      locationLevel: f.locationLevel,
      city: f.city,
      district: f.district,
      state: f.state,
      country: f.country,
      createdAt: daysAgo(fi + 1),
    });
    const postId = String(post._id);
    freeTalkPostIds.push(postId);
    await Discussion.create({
      feedPostId: postId,
      author: a.label,
      authorAnonId: a.anonId,
      authorHash: a.phoneHash,
      body: f.body,
      kind: "opinion",
      upvotes: 0,
      voters: [],
      mediaUrl: media.url,
      mediaType: media.type,
    });
  }

  for (const item of feedItems) {
    await FeedPost.create(item);
  }

  // ——— Dummy engagement from seeded citizens ———
  console.log("  seeding reactions, votes, comments…");
  let engageVotes = 0;
  let engageComments = 0;
  let ballotVotes = 0;
  let signatures = 0;
  let supports = 0;
  let reactions = 0;

  async function addEngageVotes(
    targetType: string,
    targetId: string,
    ups: number,
    downs: number,
    salt: number,
  ) {
    const upCitizens = pickN(citizens, ups, salt);
    const downPool = citizens.filter(
      (c) => !upCitizens.some((u) => u.phoneHash === c.phoneHash),
    );
    const downCitizens = pickN(downPool.length ? downPool : citizens, downs, salt + 3);
    for (const c of upCitizens) {
      await prisma.engagementVote.create({
        data: { targetType, targetId, voterKey: c.phoneHash, value: 1 },
      });
      engageVotes++;
    }
    for (const c of downCitizens) {
      await prisma.engagementVote.create({
        data: { targetType, targetId, voterKey: c.phoneHash, value: -1 },
      });
      engageVotes++;
    }
    return { ups: upCitizens.length, downs: downCitizens.length, net: upCitizens.length - downCitizens.length };
  }

  async function addComments(
    targetType: string,
    targetId: string,
    count: number,
    salt: number,
  ) {
    const authors = pickN(citizens, count, salt + 11);
    for (const [i, c] of authors.entries()) {
      await prisma.engagementComment.create({
        data: {
          targetType,
          targetId,
          authorLabel: c.label,
          authorAnonId: c.anonId,
          authorHash: c.phoneHash,
          body: COMMENT_BODIES[(salt + i) % COMMENT_BODIES.length]!,
          upvotes: (salt + i) % 4,
          downvotes: (salt + i) % 5 === 0 ? 1 : 0,
        },
      });
      engageComments++;
    }
    return authors.length;
  }

  async function bumpFeed(refId: string, votes: number, meta?: string, hot?: boolean) {
    const $set: Record<string, unknown> = {};
    if (meta) $set.meta = meta;
    if (hot != null) $set.hot = hot;
    await FeedPost.updateOne(
      { refId },
      { $set: { votes, ...$set } },
    );
  }

  // Issues — likes + discussion comments + legacy Comment rows
  for (const [idx, iss] of ISSUE_DEFS.entries()) {
    const ups = 4 + ((idx * 3) % 6);
    const downs = idx % 4 === 0 ? 1 : 0;
    const { net } = await addEngageVotes("issue", iss.slug, ups, downs, idx + 1);
    const nComments = 2 + (idx % 3);
    await addComments("issue", iss.slug, nComments, idx + 20);
    for (const [ci, c] of pickN(citizens, Math.min(2, nComments), idx + 40).entries()) {
      await prisma.comment.create({
        data: {
          issueSlug: iss.slug,
          author: c.label,
          authorAnonId: c.anonId,
          body: COMMENT_BODIES[(idx + ci) % COMMENT_BODIES.length]!,
          upvotes: 1 + (ci % 3),
          kind: ci % 2 === 0 ? "opinion" : "evidence",
        },
      });
    }
    await Discussion.create({
      issueSlug: iss.slug,
      author: pickN(citizens, 1, idx)[0]!.label,
      authorAnonId: pickN(citizens, 1, idx)[0]!.anonId,
      authorHash: pickN(citizens, 1, idx)[0]!.phoneHash,
      body: COMMENT_BODIES[idx % COMMENT_BODIES.length]!,
      kind: "opinion",
      upvotes: ups,
      voters: pickN(citizens, ups, idx + 1).map((c) => c.phoneHash),
    });
    await bumpFeed(iss.slug, Math.max(0, net + nComments), undefined, idx < 8 || net >= 5);
  }

  // Proposals — ballots + social engage + comments
  for (const [idx, p] of proposalSpecs.entries()) {
    const voters = pickN(citizens, 5 + (idx % 5), idx + 50);
    const counts: Record<string, number> = {};
    for (const [vi, c] of voters.entries()) {
      let choice: string;
      if (p.voteType === "preference" && p.options?.length) {
        choice = p.options[vi % p.options.length]!;
      } else {
        choice = LIKERT[vi % LIKERT.length]!;
      }
      await prisma.vote.create({
        data: {
          proposalId: p.id,
          voterKey: c.phoneHash,
          choice: JSON.stringify(choice),
        },
      });
      counts[choice] = (counts[choice] ?? 0) + 1;
      ballotVotes++;
    }
    const totalForPct = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const results: Record<string, number> = {};
    for (const [key, n] of Object.entries(counts)) {
      results[key] = Math.round((n / totalForPct) * 100);
    }
    const social = await addEngageVotes("proposal", p.id, 3 + (idx % 4), idx % 5 === 0 ? 1 : 0, idx + 60);
    const nComments = 1 + (idx % 3);
    await addComments("proposal", p.id, nComments, idx + 70);
    await prisma.proposal.update({
      where: { id: p.id },
      data: {
        totalVotes: voters.length,
        results: JSON.stringify(results),
      },
    });
    await bumpFeed(
      p.id,
      voters.length + social.net,
      `Open vote · ${voters.length} ballots`,
      voters.length >= 6,
    );
  }

  // Reports — votes, emoji reactions, comments
  for (let i = 0; i < reportIds.length; i++) {
    const id = reportIds[i]!;
    const ups = 3 + (i % 5);
    const downs = i % 3 === 0 ? 1 : 0;
    const social = await addEngageVotes("report", id, ups, downs, i + 80);
    const nComments = 1 + (i % 3);
    await addComments("report", id, nComments, i + 90);

    for (const [ri, c] of pickN(citizens, 2 + (i % 3), i + 100).entries()) {
      const reaction = REPORT_REACTIONS[(i + ri) % REPORT_REACTIONS.length]!;
      await prisma.reportReaction.create({
        data: { reportId: id, voterKey: c.phoneHash, reaction },
      });
      reactions++;
    }
    for (const [vi, c] of pickN(citizens, ups, i + 80).entries()) {
      const choice = vi === 0 && downs > 0 ? "dispute" : vi % 2 === 0 ? "upvote" : "endorse";
      try {
        await prisma.reportVote.create({
          data: { reportId: id, voterKey: c.phoneHash, choice },
        });
      } catch {
        /* unique voter */
      }
    }
    await prisma.citizenReport.update({
      where: { id },
      data: {
        upvotes: social.ups,
        downvotes: social.downs,
        commentCount: nComments,
        shareCount: 1 + (i % 4),
      },
    });
    await bumpFeed(id, Math.max(0, social.net), undefined, social.net >= 4);
  }

  // Demands — supports + engage + comments
  for (let i = 0; i < demandIds.length; i++) {
    const id = demandIds[i]!;
    const supporters = pickN(citizens, 4 + (i % 5), i + 110);
    for (const c of supporters) {
      await prisma.demandSupport.create({
        data: {
          demandId: id,
          voterKey: c.phoneHash,
          fullName: `Citizen ${c.anonId.slice(-4)} Demo`,
          postalCode: String(110001 + ((i * 17 + supports) % 90000)).padStart(6, "0"),
          phoneHash: c.phoneHash,
          phoneHint: c.phoneHint,
        },
      });
      supports++;
    }
    // Engagement ups from same supporters (unique voterKey per target)
    for (const c of supporters) {
      await prisma.engagementVote.create({
        data: {
          targetType: "demand",
          targetId: id,
          voterKey: c.phoneHash,
          value: 1,
        },
      });
      engageVotes++;
    }
    const downs = i % 4 === 0 ? 1 : 0;
    if (downs) {
      const downer = citizens.find(
        (c) => !supporters.some((s) => s.phoneHash === c.phoneHash),
      );
      if (downer) {
        await prisma.engagementVote.create({
          data: {
            targetType: "demand",
            targetId: id,
            voterKey: downer.phoneHash,
            value: -1,
          },
        });
        engageVotes++;
      }
    }
    const nComments = 1 + (i % 3);
    await addComments("demand", id, nComments, i + 120);
    await prisma.publicDemand.update({
      where: { id },
      data: {
        supportCount: supporters.length,
        upvotes: supporters.length,
        downvotes: downs,
        commentCount: nComments,
      },
    });
    await bumpFeed(id, supporters.length - downs, undefined, supporters.length >= 6);
  }

  // Memes — dual-write MemeVote + EngagementVote
  for (let i = 0; i < memeIds.length; i++) {
    const id = memeIds[i]!;
    const ups = 5 + (i % 4);
    const downs = i % 2;
    const upCitizens = pickN(citizens, ups, i + 130);
    const downCitizens = pickN(
      citizens.filter((c) => !upCitizens.some((u) => u.phoneHash === c.phoneHash)),
      downs,
      i + 131,
    );
    for (const c of upCitizens) {
      await prisma.engagementVote.create({
        data: { targetType: "meme", targetId: id, voterKey: c.phoneHash, value: 1 },
      });
      await prisma.memeVote.create({
        data: { memeId: id, voterKey: c.phoneHash, value: 1 },
      });
      engageVotes++;
    }
    for (const c of downCitizens) {
      await prisma.engagementVote.create({
        data: { targetType: "meme", targetId: id, voterKey: c.phoneHash, value: -1 },
      });
      await prisma.memeVote.create({
        data: { memeId: id, voterKey: c.phoneHash, value: -1 },
      });
      engageVotes++;
    }
    const nComments = 1 + (i % 2);
    await addComments("meme", id, nComments, i + 140);
    await prisma.meme.update({
      where: { id },
      data: {
        upvotes: upCitizens.length,
        downvotes: downCitizens.length,
        commentCount: nComments,
        shareCount: 2 + i,
      },
    });
    await bumpFeed(id, upCitizens.length - downCitizens.length, undefined, true);
  }

  // Notices — signatures + engage + comments
  for (let i = 0; i < noticeIds.length; i++) {
    const id = noticeIds[i]!;
    const signers = pickN(citizens, 6 + i * 2, i + 150);
    for (const c of signers) {
      await prisma.signature.create({
        data: { noticeId: id, signerKey: c.phoneHash },
      });
      await prisma.engagementVote.create({
        data: { targetType: "notice", targetId: id, voterKey: c.phoneHash, value: 1 },
      });
      signatures++;
      engageVotes++;
    }
    const nComments = 2;
    await addComments("notice", id, nComments, i + 160);
    await prisma.notice.update({
      where: { id },
      data: {
        signatures: signers.length,
        upvotes: signers.length,
        downvotes: 0,
        commentCount: nComments,
      },
    });
    await bumpFeed(
      id,
      signers.length,
      `Notice · ${signers.length} signatures`,
      true,
    );
  }

  // Free-talk feed posts — boosts + comments
  for (const [fi, postId] of freeTalkPostIds.entries()) {
    const ups = 4 + fi * 2;
    const social = await addEngageVotes("feed", postId, ups, fi === 2 ? 1 : 0, fi + 170);
    const nComments = 2 + fi;
    await addComments("feed", postId, nComments, fi + 180);
    const voters = pickN(citizens, social.ups, fi + 170).map((c) => c.phoneHash);
    await FeedPost.updateOne(
      { _id: postId },
      { $set: { votes: social.net, hot: social.net >= 4 } },
    );
    await Discussion.updateOne(
      { feedPostId: postId },
      { $set: { upvotes: social.ups, voters } },
    );
  }

  // Sync live issue metrics from ballots + engage
  for (const iss of ISSUE_DEFS) {
    const proposals = await prisma.proposal.findMany({
      where: { issueSlug: iss.slug },
      select: { id: true },
    });
    const proposalIds = proposals.map((p) => p.id);
    const [pollVotes, issueEngage, proposalEngage, issueComments, proposalComments] =
      await Promise.all([
        proposalIds.length
          ? prisma.vote.findMany({
              where: { proposalId: { in: proposalIds } },
              select: { choice: true },
            })
          : Promise.resolve([]),
        prisma.engagementVote.findMany({
          where: { targetType: "issue", targetId: iss.slug },
          select: { value: true },
        }),
        proposalIds.length
          ? prisma.engagementVote.findMany({
              where: { targetType: "proposal", targetId: { in: proposalIds } },
              select: { value: true },
            })
          : Promise.resolve([]),
        prisma.engagementComment.count({
          where: { targetType: "issue", targetId: iss.slug },
        }),
        proposalIds.length
          ? prisma.engagementComment.count({
              where: { targetType: "proposal", targetId: { in: proposalIds } },
            })
          : Promise.resolve(0),
      ]);

    const allEngage = [...issueEngage, ...proposalEngage];
    const ups = allEngage.filter((v) => v.value === 1).length;
    const downs = allEngage.filter((v) => v.value === -1).length;
    const comments = issueComments + proposalComments;
    let likertSum = 0;
    let likertN = 0;
    for (const v of pollVotes) {
      let parsed: string | string[] = v.choice;
      try {
        parsed = JSON.parse(v.choice) as string | string[];
      } catch {
        parsed = v.choice;
      }
      const choices = Array.isArray(parsed) ? parsed : [parsed];
      for (const c of choices) {
        const score =
          c === "strongly_support"
            ? 5
            : c === "support"
              ? 4
              : c === "neutral"
                ? 3
                : c === "oppose"
                  ? 2
                  : c === "strongly_oppose"
                    ? 1
                    : 3;
        likertSum += score;
        likertN++;
      }
    }
    const voteCount = pollVotes.length + ups + comments;
    const engageTotal = ups + downs;
    const engageStars =
      engageTotal === 0 ? null : Math.max(1, Math.min(5, (ups / engageTotal) * 5));
    const likertStars = likertN === 0 ? null : likertSum / likertN;
    let rating = 0;
    if (likertStars != null && engageStars != null) {
      rating = Math.round(((likertStars + engageStars) / 2) * 10) / 10;
    } else if (likertStars != null) {
      rating = Math.round(likertStars * 10) / 10;
    } else if (engageStars != null) {
      rating = Math.round(engageStars * 10) / 10;
    } else if (comments > 0) {
      rating = 3;
    }
    await prisma.issue.update({
      where: { slug: iss.slug },
      data: { voteCount, rating },
    });
  }

  // Trends — boost by engagement volume
  const seenTerms = new Set<string>();
  const trendTerms: { term: string; score: number; category: string }[] = [];
  for (const [idx, iss] of ISSUE_DEFS.entries()) {
    const term = `#${iss.tags[0]}`;
    if (seenTerms.has(term)) continue;
    seenTerms.add(term);
    trendTerms.push({
      term,
      score: 30 - idx + Math.floor(engageVotes / 40),
      category: iss.category.toLowerCase(),
    });
  }
  for (const extra of [
    { term: "India", score: 40, category: "country" },
    { term: "#janark", score: 28, category: "platform" },
    { term: "#trending20", score: 24, category: "civic" },
  ]) {
    if (seenTerms.has(extra.term)) continue;
    seenTerms.add(extra.term);
    trendTerms.push(extra);
  }
  for (const t of trendTerms) {
    await Trend.create(t);
  }

  await Activity.create([
    {
      kind: "vote",
      summary: `${ballotVotes} citizen ballots cast across open votes`,
      href: "/vote/vote-education-exam-integrity",
    },
    {
      kind: "discussion",
      summary: `${engageComments} comments and ${reactions} report reactions from demo citizens`,
      href: "/feed",
    },
    {
      kind: "notice",
      summary: `${signatures} signatures on evidence-window notices`,
      href: "/notice",
    },
    {
      kind: "meme",
      summary: "Demo citizens upvoted civic memes on exams, jobs, healthcare…",
      href: "/memes",
    },
    {
      kind: "issue",
      summary: "Top 20 India civic issues live with community reactions",
      href: "/issues",
    },
  ]);

  const [citizenCount, proposalCount, noticeCount, totalEngage] = await Promise.all([
    prisma.phoneIdentity.count(),
    prisma.proposal.count(),
    prisma.notice.count(),
    prisma.engagementVote.count(),
  ]);
  await PlatformStats.create({
    key: "global",
    citizens: citizenCount,
    activeProposals: proposalCount,
    votes: totalEngage + ballotVotes,
    notices: noticeCount,
  });

  console.log(
    `  engagement: ${engageVotes} likes, ${ballotVotes} ballots, ${engageComments} comments, ${supports} demand supports, ${signatures} signatures, ${reactions} report reactions`,
  );
  console.log(`  ${feedItems.length + freeTalk.length} feed posts`);
  console.log(`  ${trendTerms.length} topic trends`);
  console.log("Demo seed complete — top 20 India issues with dummy engagement.");
  console.log("Open http://localhost:3000");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
