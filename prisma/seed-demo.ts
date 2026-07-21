/**
 * Demo fixtures for UI validation — current India civic topics only.
 * All posts start with zero likes, dislikes, comments, supports, and poll votes.
 *
 *   npm run db:clear && npm run db:demo
 */
import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
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
  {
    url: "https://picsum.photos/seed/janark-air/900/600",
    type: "image" as const,
  },
  {
    url: "https://picsum.photos/seed/janark-water/900/600",
    type: "image" as const,
  },
  {
    url: "https://picsum.photos/seed/janark-health/900/600",
    type: "image" as const,
  },
  {
    url: "https://picsum.photos/seed/janark-waste/900/600",
    type: "image" as const,
  },
];

const MEME_IMAGES = [
  "https://picsum.photos/seed/janark-meme1/800/600",
  "https://picsum.photos/seed/janark-meme2/800/600",
  "https://picsum.photos/seed/janark-meme3/800/600",
  "https://picsum.photos/seed/janark-meme4/800/600",
  "https://picsum.photos/seed/janark-meme5/800/600",
];

async function main() {
  console.log("Seeding demo data (India civic topics · zero engagement)…");

  // --- Anonymous citizens (for OTP demo only — no reactions seeded) ---
  const citizens: {
    phoneHash: string;
    anonId: string;
    phoneHint: string;
    label: string;
  }[] = [];
  for (let i = 0; i < 8; i++) {
    const mobile = `9198765400${i}`;
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

  // --- Issues (ongoing national civic debates, non-partisan) ---
  const issueDefs = [
    {
      slug: "exam-system-credibility",
      title: "Credible national entrance exams and NTA accountability",
      category: "Education",
      summary:
        "Students and families continue to demand leak-proof exams, faster grievance redress, and transparent audits after repeated entrance-test controversies.",
      why: "Exam credibility decides careers for millions of aspirants every year.",
      pros: [
        "Restores trust in merit",
        "Clear timelines reduce anxiety",
        "Independent audits deter malpractice",
      ],
      cons: [
        "Logistics at national scale are hard",
        "Re-exams disrupt academic calendars",
      ],
    },
    {
      slug: "primary-healthcare-access",
      title: "Strengthen public primary healthcare quality",
      category: "Healthcare",
      summary:
        "Access has expanded, but citizens still face uneven care quality, medicine stock-outs, and heavy out-of-pocket spend when primary clinics fail.",
      why: "Primary care is the front door of universal health coverage.",
      pros: [
        "Lower household medical debt",
        "Earlier detection of illness",
        "Less pressure on tertiary hospitals",
      ],
      cons: [
        "Needs sustained public finance",
        "Staffing and governance reforms take time",
      ],
    },
    {
      slug: "urban-air-and-waste",
      title: "Cleaner air and scientific solid-waste processing in cities",
      category: "Environment",
      summary:
        "Indian cities still struggle with toxic air, legacy dump sites, and incomplete waste segregation even as collection coverage improves.",
      why: "Air and waste determine daily health for urban households.",
      pros: [
        "Measurable public-health gains",
        "Aligns with updated waste rules",
        "Creates green jobs in processing",
      ],
      cons: [
        "Requires multi-agency coordination",
        "Capex and behaviour change are slow",
      ],
    },
    {
      slug: "urban-water-24x7",
      title: "Reliable urban drinking water — toward 24×7 supply",
      category: "Infrastructure",
      summary:
        "Tap connections have spread, yet few cities deliver continuous water; households pay a private tax on tanks, pumps, and purifiers.",
      why: "Water security is basic dignity in rapidly urbanising India.",
      pros: [
        "Cuts tanker dependence",
        "Improves hygiene and school attendance",
        "Transparent metering builds trust",
      ],
      cons: [
        "Network rehab is capital-intensive",
        "Non-revenue water must be fixed first",
      ],
    },
    {
      slug: "teacher-shortage-learning",
      title: "Fill teacher vacancies and reverse learning loss",
      category: "Education",
      summary:
        "Recruitment delays, uneven training, and commercialised schooling leave many classrooms without skilled teachers — smart boards cannot replace them.",
      why: "Learning outcomes decide India’s demographic dividend.",
      pros: [
        "Better foundational literacy",
        "Rural retention of educators",
        "Less coaching-market pressure",
      ],
      cons: [
        "State capacity for hiring varies",
        "Quality training pipelines take years",
      ],
    },
    {
      slug: "walkable-cities-jobs",
      title: "Walkable streets and local livelihood access",
      category: "Infrastructure",
      summary:
        "Cities prioritise vehicles over footpaths while youth outside metros still lack transparent local job matching beyond big-city apps.",
      why: "Daily mobility and nearby work shape who can participate in the economy.",
      pros: [
        "Safer last-mile trips",
        "Less broker dependence for jobs",
        "Supports women workers after dark",
      ],
      cons: [
        "Road redesign faces political pushback",
        "Employer verification needs systems",
      ],
    },
  ];

  for (const [idx, iss] of issueDefs.entries()) {
    await prisma.issue.upsert({
      where: { slug: iss.slug },
      update: {
        title: iss.title,
        summary: iss.summary,
        whyItMatters: iss.why,
        currentSituation: iss.summary,
        pros: JSON.stringify(iss.pros),
        cons: JSON.stringify(iss.cons),
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
        sources: JSON.stringify([
          { label: "Citizen signals", url: "/feed" },
        ]),
        relatedSlugs: JSON.stringify([]),
        voteCount: 0,
        rating: 0,
        trendingRank: idx + 1,
      },
    });
  }
  console.log(`  ${issueDefs.length} issues`);

  // --- Proposals (open polls — zero votes cast) ---
  const proposals = [
    {
      id: "exam-independent-audit",
      title: "Independent public audit of national entrance exam security",
      description:
        "Should an independent panel publish a time-bound audit of exam logistics, paper security, and grievance redress after each major cycle?",
      issueSlug: "exam-system-credibility",
      voteType: "likert" as const,
    },
    {
      id: "phc-medicine-stock-dashboard",
      title: "Live public stock dashboard for primary health centres",
      description:
        "Should every district publish weekly essential-medicine stock levels for public primary clinics?",
      issueSlug: "primary-healthcare-access",
      voteType: "likert" as const,
    },
    {
      id: "waste-four-stream-city-pilot",
      title: "City pilot for four-stream waste segregation & processing",
      description:
        "Fund a ward-scale pilot with doorstep segregation, digital tracking, and scientific processing instead of dump-and-forget.",
      issueSlug: "urban-air-and-waste",
      voteType: "preference" as const,
      options: [
        "Ward pilot first",
        "City-wide mandate now",
        "Incentives before penalties",
      ],
    },
    {
      id: "water-district-metering",
      title: "District metering & public NRW (loss) reports",
      description:
        "Publish monthly non-revenue water and tanker dependence figures for each urban local body.",
      issueSlug: "urban-water-24x7",
      voteType: "likert" as const,
    },
  ];

  for (const p of proposals) {
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
          "Evidence for budgets",
        ]),
        argumentsFor: JSON.stringify([
          "Citizens can track delivery",
          "Reduces rumour-driven panic",
        ]),
        argumentsAgainst: JSON.stringify([
          "Needs data capacity in ULBs",
          "Must avoid partisan misuse of dashboards",
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
  console.log(`  ${proposals.length} proposals (0 votes)`);

  // --- Reports ---
  const reportDefs = [
    {
      type: "problem",
      title: "AQI stays hazardous — construction dust unenforced at site",
      body: "Residents near an active metro/road corridor report uncovered debris and no night watering. Request municipal enforcement under air-quality directions.",
      locationLevel: "city",
      city: "Delhi",
      district: "South Delhi",
      state: "Delhi",
    },
    {
      type: "problem",
      title: "Primary health centre out of essential medicines for a week",
      body: "Patients redirected to private chemists for basic antibiotics and ORS. Request public stock update and refill timeline.",
      locationLevel: "district",
      district: "Nashik",
      state: "Maharashtra",
    },
    {
      type: "issue",
      title: "Entrance exam centre — no transparent grievance desk",
      body: "Aspirants waited hours without a published escalation path after a technical glitch rumour. Ask for on-site grievance protocol and SMS updates.",
      locationLevel: "city",
      city: "Patna",
      district: "Patna",
      state: "Bihar",
    },
    {
      type: "problem",
      title: "Legacy dump leachate after rains near housing colony",
      body: "Monsoon runoff from an old dump site floods lanes. Request scientific capping / processing under solid-waste rules — not temporary covering.",
      locationLevel: "city",
      city: "Mumbai",
      district: "Mumbai Suburban",
      state: "Maharashtra",
    },
    {
      type: "problem",
      title: "No continuous water — tanker rates opaque in summer",
      body: "Ward gets 20–30 minutes supply on alternate days. Tanker rates vary by middlemen with no public board.",
      locationLevel: "city",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
    {
      type: "issue",
      title: "Government school — long-pending teacher vacancy",
      body: "Two subject posts vacant for a full academic year. Students share teachers across grades; parents want recruitment timeline published.",
      locationLevel: "town",
      town: "Sitapur",
      district: "Sitapur",
      state: "Uttar Pradesh",
    },
    {
      type: "crime",
      title: "Evening snatching on unlit footpath near college gate",
      body: "Repeated phone snatching after classes. Footpath incomplete; streetlights dark. Request lighting + patrol window 7–9 pm.",
      locationLevel: "city",
      city: "Pune",
      district: "Pune",
      state: "Maharashtra",
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
        town: r.town ?? null,
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
        createdAt: daysAgo(2 + (ri % 10)),
      },
    });
    reportIds.push(created.id);
  }
  console.log(`  ${reportIds.length} reports (0 reactions)`);

  // --- Demands ---
  const demandDefs = [
    {
      title: "Publish a national exam-security & re-exam calendar",
      ask: "NTA / Education Ministry should publish fixed security protocols and any re-exam calendar within a stated deadline — non-partisan, public.",
      body: "Students need certainty. Opaque delays destroy a year of preparation. This demand is about process credibility, not party politics.",
      target: "government",
      targetDetail: "Ministry of Education / NTA",
      locationLevel: "national",
      category: "education",
      state: null as string | null,
      city: null as string | null,
      district: null as string | null,
    },
    {
      title: "Weekly PHC medicine stock on a public dashboard",
      ask: "Every district to post essential-medicine availability for primary clinics every Monday.",
      body: "Primary care fails when shelves are empty. A live stock board lets citizens verify delivery without visiting multiple counters.",
      target: "state",
      targetDetail: "State health department",
      locationLevel: "state",
      state: "Maharashtra",
      category: "healthcare",
      city: null,
      district: null,
    },
    {
      title: "Scientific processing for legacy dump sites",
      ask: "City must publish a time-bound plan to process legacy waste — not only cover it.",
      body: "Collection coverage rose, but mountains of legacy waste and leachate remain a health hazard. Align with updated solid-waste rules.",
      target: "district",
      targetDetail: "Municipal corporation",
      locationLevel: "city",
      city: "Delhi",
      district: "East Delhi",
      state: "Delhi",
      category: "environment",
    },
    {
      title: "Public tanker rate board + GPS for summer supply",
      ask: "Display maximum tanker rates at ward offices and track authorised tankers.",
      body: "Intermittent piped water forces households into opaque tanker markets. Rate boards cut exploitation.",
      target: "district",
      targetDetail: "Urban local body",
      locationLevel: "city",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
      category: "infrastructure",
    },
    {
      title: "Fill sanctioned teacher posts before next academic year",
      ask: "State education department to publish vacancy fill timelines school-wise.",
      body: "Vacancies and temporary arrangements deepen learning loss. Children need teachers more than devices alone.",
      target: "state",
      targetDetail: "Education department",
      locationLevel: "state",
      state: "Uttar Pradesh",
      category: "education",
      city: null,
      district: null,
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
        createdAt: daysAgo(1 + (di % 8)),
      },
    });
    demandIds.push(created.id);
  }
  console.log(`  ${demandIds.length} demands (0 supports)`);

  // --- Memes + hashtags (zero votes/comments) ---
  const memeDefs = [
    {
      title: "When the AQI app turns purple again",
      caption: "Air is a public service, not a personal problem.",
      tags: ["airquality", "cities", "janark", "environment"],
    },
    {
      title: "Exam centre plot twist: no grievance desk",
      caption: "Credibility > vibes. Publish the process.",
      tags: ["exams", "education", "janark", "nta"],
    },
    {
      title: "PHC shelf: out of stock (again)",
      caption: "Primary care starts with medicines on the shelf.",
      tags: ["healthcare", "phc", "janark"],
    },
    {
      title: "Waiting for continuous water like…",
      caption: "Taps connected ≠ 24×7 supply.",
      tags: ["water", "infrastructure", "janark"],
    },
    {
      title: "Smart board, empty teacher chair",
      caption: "Devices don’t teach. Teachers do.",
      tags: ["education", "teachers", "janark"],
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
        createdAt: daysAgo(i % 6),
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
  console.log(`  ${memeIds.length} memes (0 votes / comments)`);

  // --- Notices (zero signatures / engagement) ---
  const noticeDefs = [
    {
      title: "Public hearing ask: city waste processing plan",
      description:
        "Citizens request an open hearing on legacy dump remediation and four-stream segregation rollout. Bring local evidence; keep it non-partisan.",
      target: "district",
      targetDetail: "Municipal commissioner",
    },
    {
      title: "Evidence window: PHC stock-outs this month",
      description:
        "Anonymous window to report primary clinic medicine gaps — facts over rumour. Label date, place, and medicine name.",
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
        createdAt: daysAgo(3),
      },
    });
    noticeIds.push(notice.id);
  }
  console.log(`  ${noticeDefs.length} notices (0 signatures)`);

  // Explicitly ensure no engagement rows exist for demo content
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

  // --- Mongo feed / trends / discussions ---
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
    town?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    createdAt: Date;
  };

  const feedItems: FeedItem[] = [];

  for (const [idx, iss] of issueDefs.entries()) {
    const a = pick(citizens);
    feedItems.push({
      type: "issue",
      title: iss.title,
      excerpt: iss.summary,
      href: `/issues/${iss.slug}`,
      meta: `${iss.category} · India`,
      votes: 0,
      hot: false,
      tags: ["issue", iss.category.toLowerCase(), "india", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: iss.slug,
      country: "India",
      createdAt: daysAgo(idx + 1),
    });
  }

  for (const [idx, p] of proposals.entries()) {
    const a = pick(citizens);
    feedItems.push({
      type: "proposal",
      title: p.title,
      excerpt: p.description,
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
      town: r.town,
      city: r.city,
      district: r.district,
      state: r.state,
      country: "India",
      createdAt: daysAgo(2 + (i % 10)),
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
      hot: false,
      tags: ["demand", d.category, "india", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: id,
      locationLevel: d.locationLevel,
      city: d.city ?? undefined,
      district: d.district ?? undefined,
      state: d.state ?? undefined,
      country: "India",
      createdAt: daysAgo(1 + (i % 8)),
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
      createdAt: daysAgo(i % 6),
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
      createdAt: daysAgo(3),
    });
  }

  // Free-form discussions on ongoing national themes
  const freeTalk = [
    {
      title: "What should India’s civic square track this month?",
      body: "Exam credibility, primary healthcare stock-outs, urban air & waste, continuous water, teacher vacancies — add place + topic hashtags. Keep it non-partisan.",
      tags: ["discussion", "india", "janark", "civic"],
      locationLevel: "national",
      state: undefined as string | undefined,
      city: undefined as string | undefined,
      district: undefined as string | undefined,
      country: "India",
    },
    {
      title: "How do we verify local air and waste claims?",
      body: "Share ward-level photos, dates, and official ticket numbers. Label facts vs opinions. No party branding.",
      tags: ["discussion", "airquality", "waste", "janark"],
      locationLevel: "city",
      city: "Delhi",
      district: "New Delhi",
      state: "Delhi",
      country: "India",
    },
    {
      title: "Documenting PHC medicine gaps without doxxing staff",
      body: "Report medicine names, dates, and clinic location — not personal attacks. The ask is public stock transparency.",
      tags: ["discussion", "healthcare", "phc", "janark"],
      locationLevel: "state",
      state: "Maharashtra",
      city: undefined,
      district: undefined,
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
      hot: false,
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

  // Topic labels only — scores reflect topic presence, not fake likes
  const trendTerms = [
    { term: "#exams", score: 6, category: "education" },
    { term: "#healthcare", score: 5, category: "healthcare" },
    { term: "#airquality", score: 5, category: "environment" },
    { term: "#water", score: 4, category: "infrastructure" },
    { term: "#education", score: 5, category: "education" },
    { term: "#waste", score: 4, category: "environment" },
    { term: "Delhi", score: 3, category: "city" },
    { term: "India", score: 8, category: "country" },
  ];
  for (const t of trendTerms) {
    await Trend.create(t);
  }

  await Activity.create([
    {
      kind: "issue",
      summary: "Demo issues seeded: exams, healthcare, air/waste, water, teachers",
      href: "/issues",
    },
    {
      kind: "proposal",
      summary: "Open civic votes posted — zero ballots cast yet",
      href: "/vote/exam-independent-audit",
    },
    {
      kind: "discussion",
      summary: "Public demands on exam calendar, PHC stocks, dumps, water, teachers",
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
  console.log("Demo seed complete — India civic topics, zero engagement.");
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
