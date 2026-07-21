/**
 * Demo fixtures — India's top 20 civic trending issues (zero engagement).
 *
 *   npm run db:clear && npm run db:demo
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { connectMongo } from "../src/lib/mongo";
import {
  Activity,
  Discussion,
  FeedPost,
  PlatformStats,
  Trend,
} from "../src/lib/mongo-models";

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

const SAMPLE_MEDIA = [
  { url: "https://picsum.photos/seed/janark-edu/900/600", type: "image" as const },
  { url: "https://picsum.photos/seed/janark-jobs/900/600", type: "image" as const },
  { url: "https://picsum.photos/seed/janark-gov/900/600", type: "image" as const },
  { url: "https://picsum.photos/seed/janark-health/900/600", type: "image" as const },
  { url: "https://picsum.photos/seed/janark-env/900/600", type: "image" as const },
];

const MEME_IMAGES = [
  "https://picsum.photos/seed/janark-meme1/800/600",
  "https://picsum.photos/seed/janark-meme2/800/600",
  "https://picsum.photos/seed/janark-meme3/800/600",
  "https://picsum.photos/seed/janark-meme4/800/600",
  "https://picsum.photos/seed/janark-meme5/800/600",
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
  console.log("Seeding top-20 India civic issues (zero engagement)…");

  const citizens: {
    phoneHash: string;
    anonId: string;
    phoneHint: string;
    label: string;
  }[] = [];
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
    await prisma.issue.upsert({
      where: { slug: iss.slug },
      update: {
        title: iss.title,
        summary: iss.summary,
        whyItMatters: iss.why,
        currentSituation: iss.summary,
        pros: JSON.stringify(iss.pros),
        cons: JSON.stringify(iss.cons),
        category: iss.category,
        voteCount: 0,
        rating: 0,
        trendingRank: idx + 1,
      },
      create: {
        slug: iss.slug,
        title: iss.title,
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
    title: `Citizen vote: priorities for ${iss.title}`,
    description: `${iss.summary}\n\nShould public institutions publish a time-bound action plan on this issue with measurable milestones?`,
    issueSlug: iss.slug,
    voteType: idx % 5 === 0 ? ("preference" as const) : ("likert" as const),
    options:
      idx % 5 === 0
        ? ["Urgent national plan", "State-led pilots first", "More evidence before mandates"]
        : undefined,
  }));

  for (const p of proposalSpecs) {
    await prisma.proposal.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        description: p.description,
        totalVotes: 0,
        results: null,
      },
      create: {
        id: p.id,
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
        totalVotes: 0,
      },
    });
  }
  console.log(`  ${proposalSpecs.length} proposals (0 votes)`);

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
    const media = SAMPLE_MEDIA[ri % SAMPLE_MEDIA.length]!;
    const created = await prisma.citizenReport.create({
      data: {
        type: r.type,
        title: r.title,
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
  console.log(`  ${reportIds.length} reports (0 reactions)`);

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
    },
  ];

  const demandIds: string[] = [];
  for (const [di, d] of demandDefs.entries()) {
    const author = pick(citizens);
    const media = SAMPLE_MEDIA[(di + 1) % SAMPLE_MEDIA.length]!;
    const created = await prisma.publicDemand.create({
      data: {
        title: d.title,
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
  console.log(`  ${demandIds.length} demands (0 supports)`);

  const memeDefs = [
    {
      title: "When the exam paper ‘leaks’ before the hall ticket",
      caption: "Merit needs process credibility — publish the audit.",
      tags: ["exams", "education", "janark", "nta"],
    },
    {
      title: "Graduate with degree, waiting for notification",
      caption: "Jobs need calendars, not vibes.",
      tags: ["jobs", "employment", "janark"],
    },
    {
      title: "PHC shelf: out of stock (again)",
      caption: "Primary care starts with medicines on the shelf.",
      tags: ["healthcare", "phc", "janark"],
    },
    {
      title: "When the AQI app turns purple again",
      caption: "Air is a public service, not a personal problem.",
      tags: ["climate", "airquality", "janark"],
    },
    {
      title: "Counseling waitlist longer than the semester",
      caption: "Youth mental health needs staffed clinics.",
      tags: ["mentalhealth", "youth", "janark"],
    },
    {
      title: "Procurement: ‘trust us’ vs open bids",
      caption: "Sunshine is the best disinfectant.",
      tags: ["corruption", "procurement", "janark"],
    },
  ];

  const memeIds: string[] = [];
  for (const [i, m] of memeDefs.entries()) {
    const author = pick(citizens);
    const imageUrl = MEME_IMAGES[i % MEME_IMAGES.length]!;
    const created = await prisma.meme.create({
      data: {
        title: m.title,
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
  console.log(`  ${memeIds.length} memes (0 votes)`);

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
        title: n.title,
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
  console.log(`  ${noticeDefs.length} notices (0 signatures)`);

  await prisma.engagementVote.deleteMany();
  await prisma.engagementComment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.reportVote.deleteMany();
  await prisma.reportReaction.deleteMany();
  await prisma.demandSupport.deleteMany();
  await prisma.memeVote.deleteMany();
  await prisma.signature.deleteMany();
  console.log("  engagement tables cleared (0 likes / comments / votes)");

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

  for (const [idx, iss] of ISSUE_DEFS.entries()) {
    const a = pick(citizens);
    feedItems.push({
      type: "issue",
      title: `#${idx + 1} ${iss.title}`,
      excerpt: iss.summary,
      href: `/issues/${iss.slug}`,
      meta: `Trending #${idx + 1} · ${iss.category} · India`,
      votes: 0,
      hot: idx < 5,
      tags: ["issue", ...iss.tags, "india", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: iss.slug,
      country: "India",
      createdAt: daysAgo(idx + 1),
    });
  }

  for (const [idx, p] of proposalSpecs.entries()) {
    const a = pick(citizens);
    feedItems.push({
      type: "proposal",
      title: p.title,
      excerpt: p.description.slice(0, 280),
      href: `/vote/${p.id}`,
      meta: "Open vote · 0 ballots",
      votes: 0,
      hot: false,
      tags: ["vote", "proposal", "india", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: p.id,
      country: "India",
      createdAt: daysAgo(idx + 2),
    });
  }

  for (let i = 0; i < reportIds.length; i++) {
    const r = reportDefs[i]!;
    const id = reportIds[i]!;
    const a = pick(citizens);
    const media = SAMPLE_MEDIA[i % SAMPLE_MEDIA.length]!;
    feedItems.push({
      type: "discussion",
      title: `[${r.type}] ${r.title}`,
      excerpt: r.body,
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
    feedItems.push({
      type: "discussion",
      title: `[demand] ${d.title}`,
      excerpt: d.ask,
      href: `/demands/${id}`,
      meta: `${d.locationLevel} · public demand`,
      votes: 0,
      hot: i < 3,
      tags: ["demand", ...d.tags, "india", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: id,
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
    feedItems.push({
      type: "meme",
      title: m.title,
      excerpt: m.caption,
      href: `/memes/${id}`,
      meta: m.tags.map((t) => `#${t}`).join(" "),
      votes: 0,
      hot: false,
      tags: ["meme", ...m.tags],
      author: a.label,
      authorAnonId: a.anonId,
      refId: id,
      mediaUrl: MEME_IMAGES[i % MEME_IMAGES.length],
      mediaType: "image",
      country: "India",
      createdAt: daysAgo(i % 7),
    });
  }

  for (const [ni, noticeId] of noticeIds.entries()) {
    const n = noticeDefs[ni]!;
    const a = pick(citizens);
    feedItems.push({
      type: "notice",
      title: n.title,
      excerpt: n.description.slice(0, 200),
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
      locationLevel: "city",
      city: "Delhi",
      district: "New Delhi",
      state: "Delhi",
      country: "India",
    },
  ];

  for (const [fi, f] of freeTalk.entries()) {
    const a = pick(citizens);
    const media = SAMPLE_MEDIA[fi % SAMPLE_MEDIA.length]!;
    const post = await FeedPost.create({
      type: "discussion",
      title: f.title,
      excerpt: f.body.slice(0, 220),
      body: f.body,
      href: "/feed",
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
    post.href = `/feed?post=${post._id}`;
    await post.save();
    await Discussion.create({
      feedPostId: String(post._id),
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

  // Trend scores mirror ranking priority (unique terms; not fake engagement)
  const seenTerms = new Set<string>();
  const trendTerms: { term: string; score: number; category: string }[] = [];
  for (const [idx, iss] of ISSUE_DEFS.entries()) {
    const term = `#${iss.tags[0]}`;
    if (seenTerms.has(term)) continue;
    seenTerms.add(term);
    trendTerms.push({
      term,
      score: 22 - idx,
      category: iss.category.toLowerCase(),
    });
  }
  for (const extra of [
    { term: "India", score: 25, category: "country" },
    { term: "#janark", score: 18, category: "platform" },
    { term: "#trending20", score: 16, category: "civic" },
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
      kind: "issue",
      summary: "Top 20 India civic issues seeded — exams, jobs, governance, climate…",
      href: "/issues",
    },
    {
      kind: "proposal",
      summary: "Open citizen votes posted for each trending issue — zero ballots yet",
      href: "/vote/vote-education-exam-integrity",
    },
    {
      kind: "discussion",
      summary: "Public demands on exams, jobs, healthcare, safety, procurement, courts…",
      href: "/demands",
    },
  ]);

  const [citizenCount, proposalCount, noticeCount] = await Promise.all([
    prisma.phoneIdentity.count(),
    prisma.proposal.count(),
    prisma.notice.count(),
  ]);
  await PlatformStats.create({
    key: "global",
    citizens: citizenCount,
    activeProposals: proposalCount,
    votes: 0,
    notices: noticeCount,
  });

  console.log(`  ${feedItems.length + freeTalk.length} feed posts (0 votes)`);
  console.log(`  ${trendTerms.length} topic trends`);
  console.log("Demo seed complete — top 20 India issues, zero engagement.");
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
