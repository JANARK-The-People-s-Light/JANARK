/**
 * Demo fixtures for UI validation — phone identities, issues, votes,
 * reports, demands, memes, notices, discussions, feed, trends.
 *
 *   npm run db:demo
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

function anonId() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i]! % alphabet.length];
  return `jn-${out}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const MEME_IMAGES = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWdqeGhxZ3Z0Z2Z0/3o7aCTPPm4OHfRLSH6/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif",
  "https://picsum.photos/seed/janark1/800/600",
  "https://picsum.photos/seed/janark2/800/600",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
];

const SAMPLE_MEDIA = [
  {
    url: "https://picsum.photos/seed/report1/900/600",
    type: "image" as const,
  },
  {
    url: "https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif",
    type: "gif" as const,
  },
  {
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    type: "video" as const,
  },
  {
    url: "https://picsum.photos/seed/demand1/900/600",
    type: "image" as const,
  },
];

async function main() {
  console.log("Seeding demo data…");

  // --- Anonymous citizens ---
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

  // --- Issues ---
  const issueDefs = [
    {
      slug: "school-midday-meals",
      title: "Strengthen midday meals in government schools",
      category: "Education",
      summary:
        "Parents report irregular quality and delayed supply of midday meals across several districts.",
      why: "Nutrition affects attendance and learning outcomes for millions of children.",
      pros: ["Better attendance", "Local kitchen employment", "Health outcomes"],
      cons: ["Budget pressure", "Supply chain complexity"],
    },
    {
      slug: "local-job-portals",
      title: "District-level transparent job portals",
      category: "Employment",
      summary:
        "Citizens want a single public board for local vacancies with skill filters — not only metro apps.",
      why: "Youth migration and under-employment remain high outside metros.",
      pros: ["Local matching", "Less broker dependence"],
      cons: ["Needs verification", "Employer adoption"],
    },
    {
      slug: "water-tankers-accountability",
      title: "Public tracking for water tankers",
      category: "Infrastructure",
      summary:
        "Summer shortages lead to opaque tanker pricing. Citizens demand GPS + rate boards.",
      why: "Water access is a daily dignity issue in growing towns.",
      pros: ["Price transparency", "Fewer queues"],
      cons: ["Enforcement cost"],
    },
    {
      slug: "women-night-transport",
      title: "Safe night transport corridors for women",
      category: "Women",
      summary:
        "Workers and students ask for well-lit routes, tracked buses, and emergency response.",
      why: "Mobility after dark still limits opportunity.",
      pros: ["Workforce participation", "Safety perception"],
      cons: ["Fleet cost", "Coordination across agencies"],
    },
  ];

  for (const [idx, iss] of issueDefs.entries()) {
    await prisma.issue.upsert({
      where: { slug: iss.slug },
      update: {
        title: iss.title,
        voteCount: 40 + idx * 17,
        rating: 3.5 + (idx % 3) * 0.4,
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
        voteCount: 40 + idx * 17,
        rating: 3.5 + (idx % 3) * 0.4,
        trendingRank: idx + 1,
      },
    });
  }
  console.log(`  ${issueDefs.length} issues`);

  // --- Proposals + votes ---
  const proposals = [
    {
      id: "midday-meal-audit",
      title: "Independent midday meal quality audits",
      description:
        "Should every district publish monthly independent kitchen audits?",
      issueSlug: "school-midday-meals",
      voteType: "likert",
    },
    {
      id: "night-bus-pilot",
      title: "Night bus pilot on two city corridors",
      description:
        "Fund a 6-month tracked night bus pilot with women marshals.",
      issueSlug: "women-night-transport",
      voteType: "likert",
    },
    {
      id: "tanker-rate-board",
      title: "Mandatory public rate board for tankers",
      description:
        "Display maximum tanker rates at ward offices and on a public page.",
      issueSlug: "water-tankers-accountability",
      voteType: "preference",
      options: ["Ward boards only", "App + boards", "App only"],
    },
  ];

  for (const p of proposals) {
    await prisma.proposal.upsert({
      where: { id: p.id },
      update: { title: p.title, totalVotes: 0 },
      create: {
        id: p.id,
        title: p.title,
        description: p.description,
        benefits: JSON.stringify(["Citizen mandate", "Public visibility"]),
        argumentsFor: JSON.stringify(["Open civic participation"]),
        argumentsAgainst: JSON.stringify(["Needs verification at scale"]),
        voteType: p.voteType,
        options: p.options ? JSON.stringify(p.options) : null,
        issueSlug: p.issueSlug,
        locationLevel: "district",
        state: "Maharashtra",
        country: "India",
        totalVotes: 0,
      },
    });

    const choices =
      p.voteType === "preference" && p.options
        ? p.options
        : [
            "strongly_support",
            "support",
            "neutral",
            "oppose",
            "strongly_oppose",
          ];
    let votes = 0;
    for (const c of citizens) {
      if (Math.random() < 0.35) continue;
      const choice = pick(choices);
      await prisma.vote.upsert({
        where: {
          proposalId_voterKey: { proposalId: p.id, voterKey: c.phoneHash },
        },
        update: { choice: JSON.stringify(choice) },
        create: {
          proposalId: p.id,
          voterKey: c.phoneHash,
          choice: JSON.stringify(choice),
        },
      });
      votes++;
    }
    await prisma.proposal.update({
      where: { id: p.id },
      data: { totalVotes: votes },
    });
  }
  console.log(`  ${proposals.length} proposals with votes`);

  // --- Comments on issues ---
  for (const iss of issueDefs) {
    for (let i = 0; i < 3; i++) {
      const c = pick(citizens);
      await prisma.comment.create({
        data: {
          issueSlug: iss.slug,
          author: c.label,
          authorAnonId: c.anonId,
          body: pick([
            "We need ground verification, not only announcements.",
            "This matches what teachers told us last month.",
            "Support — but publish the data weekly.",
            "Concerned about implementation capacity at ward level.",
          ]),
          kind: pick(["opinion", "evidence", "news"]),
          upvotes: Math.floor(Math.random() * 12),
        },
      });
    }
  }

  // --- Reports ---
  const reportDefs = [
    {
      type: "problem",
      title: "Streetlights dark for three weeks near school gate",
      body: "Children walk home in the dark. Ward office ticket is open with no update.",
      locationLevel: "city",
      city: "Pune",
      district: "Pune",
      state: "Maharashtra",
    },
    {
      type: "crime",
      title: "Repeated phone snatching on evening bus stop",
      body: "Citizens request better lighting and patrol timing between 7–9 pm.",
      locationLevel: "city",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
    },
    {
      type: "issue",
      title: "Clinic pharmacy closed mid-day without notice",
      body: "Patients travel far for free medicines; staff shortage suspected.",
      locationLevel: "district",
      district: "Nashik",
      state: "Maharashtra",
    },
    {
      type: "problem",
      title: "Overflowing drain after every rainfall",
      body: "Mosquito breeding and flooding at the junction. Photos shared in local groups.",
      locationLevel: "town",
      town: "Karad",
      district: "Satara",
      state: "Maharashtra",
    },
    {
      type: "other",
      title: "School boundary wall cracked after monsoon",
      body: "Parents fear collapse near the playground. Need engineer visit.",
      locationLevel: "village",
      village: "Vadgaon",
      district: "Kolhapur",
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
        village: r.village ?? null,
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
        upvotes: Math.floor(Math.random() * 40) + 3,
        createdAt: daysAgo(Math.floor(Math.random() * 12)),
      },
    });
    reportIds.push(created.id);

    for (const c of citizens.slice(0, 4)) {
      if (Math.random() < 0.4) continue;
      await prisma.reportVote.upsert({
        where: {
          reportId_voterKey: { reportId: created.id, voterKey: c.phoneHash },
        },
        update: { choice: "upvote" },
        create: {
          reportId: created.id,
          voterKey: c.phoneHash,
          choice: pick(["upvote", "endorse", "dispute"]),
        },
      });
      await prisma.reportReaction.create({
        data: {
          reportId: created.id,
          voterKey: c.phoneHash,
          reaction: pick([
            "support",
            "concerned",
            "angry",
            "sad",
            "important",
          ]),
        },
      }).catch(() => {});
    }
  }
  console.log(`  ${reportIds.length} reports`);

  // --- Demands ---
  const demandDefs = [
    {
      title: "Publish weekly water tanker rates",
      ask: "District office must post max tanker rates every Monday.",
      body: "Citizens face opaque pricing each summer. A public board reduces exploitation.",
      target: "district",
      locationLevel: "district",
      district: "Pune",
      state: "Maharashtra",
      category: "infrastructure",
    },
    {
      title: "Night bus on IT corridor",
      ask: "Run tracked buses until midnight on two corridors for six months.",
      body: "Women workers and students need reliable last-mile options after dark.",
      target: "state",
      locationLevel: "city",
      city: "Bengaluru",
      state: "Karnataka",
      category: "transport",
    },
    {
      title: "Open job board for district skills",
      ask: "Launch a verified local vacancy board with skill filters.",
      body: "Metro-only apps miss factory, farm, and service openings nearby.",
      target: "government",
      locationLevel: "state",
      state: "Maharashtra",
      category: "employment",
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
        category: d.category,
        status: "gathering",
        locationLevel: d.locationLevel,
        city: d.city ?? null,
        district: d.district ?? null,
        state: d.state,
        country: "India",
        authorLabel: author.label,
        authorAnonId: author.anonId,
        authorHash: author.phoneHash,
        mediaUrl: media.url,
        mediaType: media.type,
        supportCount: 1,
        upvotes: 1,
        supports: { create: { voterKey: author.phoneHash } },
        createdAt: daysAgo(Math.floor(Math.random() * 10)),
      },
    });
    demandIds.push(created.id);
    let supports = 1;
    for (const c of citizens) {
      if (c.phoneHash === author.phoneHash) continue;
      if (Math.random() < 0.35) continue;
      await prisma.demandSupport.create({
        data: { demandId: created.id, voterKey: c.phoneHash },
      });
      supports++;
    }
    await prisma.publicDemand.update({
      where: { id: created.id },
      data: { supportCount: supports },
    });
  }
  console.log(`  ${demandIds.length} demands`);

  // --- Memes + hashtags ---
  const memeDefs = [
    {
      title: "When the tender finally opens",
      caption: "Citizens have entered the chat.",
      tags: ["janark", "accountability", "humour"],
    },
    {
      title: "Waiting for the tanker rate board",
      caption: "Summer starter pack.",
      tags: ["water", "janark", "infrastructure"],
    },
    {
      title: "Night shift, no night bus",
      caption: "Safety is not a luxury feature.",
      tags: ["women", "transport", "janark"],
    },
    {
      title: "Midday meal plot twist",
      caption: "Quality audits > vibes.",
      tags: ["education", "schools", "janark"],
    },
    {
      title: "Job portal outside the metro",
      caption: "Local skills, local openings.",
      tags: ["jobs", "employment", "janark"],
    },
  ];

  const memeIds: string[] = [];
  for (const [i, m] of memeDefs.entries()) {
    const author = pick(citizens);
    const imageUrl = MEME_IMAGES[i % MEME_IMAGES.length]!;
    const mediaType = imageUrl.endsWith(".mp4")
      ? "video"
      : imageUrl.includes("giphy")
        ? "gif"
        : "image";
    const created = await prisma.meme.create({
      data: {
        title: m.title,
        caption: m.caption,
        imageUrl,
        mediaType,
        authorLabel: author.label,
        authorAnonId: author.anonId,
        authorHash: author.phoneHash,
        upvotes: Math.floor(Math.random() * 50) + 5,
        downvotes: Math.floor(Math.random() * 8),
        shareCount: Math.floor(Math.random() * 15),
        createdAt: daysAgo(Math.floor(Math.random() * 8)),
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
    for (const c of citizens.slice(0, 5)) {
      if (Math.random() < 0.3) continue;
      await prisma.memeVote.upsert({
        where: {
          memeId_voterKey: { memeId: created.id, voterKey: c.phoneHash },
        },
        update: { value: Math.random() < 0.8 ? 1 : -1 },
        create: {
          memeId: created.id,
          voterKey: c.phoneHash,
          value: Math.random() < 0.8 ? 1 : -1,
        },
      });
    }
  }
  console.log(`  ${memeIds.length} memes`);

  // --- Notices ---
  const noticeDefs = [
    {
      title: "Call for public hearing on tanker rates",
      description:
        "Citizens request an open hearing before summer. Bring rate evidence from last season.",
      target: "district",
      targetDetail: "District collector",
    },
    {
      title: "School meal quality: submit kitchen photos",
      description:
        "Anonymous evidence window for two weeks. Label facts vs opinions.",
      target: "state",
      targetDetail: "Education department",
    },
  ];

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
        signatures: 1,
        signatureRecords: { create: { signerKey: author.phoneHash } },
        createdAt: daysAgo(Math.floor(Math.random() * 6)),
      },
    });
    let sigs = 1;
    for (const c of citizens) {
      if (c.phoneHash === author.phoneHash) continue;
      if (Math.random() < 0.4) continue;
      await prisma.signature.create({
        data: { noticeId: notice.id, signerKey: c.phoneHash },
      });
      sigs++;
    }
    await prisma.notice.update({
      where: { id: notice.id },
      data: { signatures: sigs },
    });
  }
  console.log(`  ${noticeDefs.length} notices`);

  // --- Unified engagement: votes + threaded comments ---
  const commentBodies = [
    "Agree — publish the numbers weekly.",
    "Needs ground verification before we amplify.",
    "Same issue in our ward.",
    "Reply: ward office opened a ticket yesterday.",
    "Can someone share the RTI reply?",
    "Support from anonymity — keep pressure polite.",
  ];

  async function seedThread(
    targetType: string,
    targetId: string,
    count = 3,
  ) {
    let top = 0;
    for (let i = 0; i < count; i++) {
      const author = pick(citizens);
      const parent = await prisma.engagementComment.create({
        data: {
          targetType,
          targetId,
          body: pick(commentBodies),
          authorLabel: author.label,
          authorAnonId: author.anonId,
          authorHash: author.phoneHash,
          upvotes: Math.floor(Math.random() * 8),
          downvotes: Math.floor(Math.random() * 2),
        },
      });
      top++;
      // one reply sometimes
      if (Math.random() < 0.55) {
        const replier = pick(citizens);
        await prisma.engagementComment.create({
          data: {
            targetType,
            targetId,
            parentId: parent.id,
            body: pick([
              `Replying to ${author.anonId}: noted.`,
              "Thanks — adding this to our local group.",
              "Disagree lightly; capacity is the real bottleneck.",
            ]),
            authorLabel: replier.label,
            authorAnonId: replier.anonId,
            authorHash: replier.phoneHash,
            upvotes: Math.floor(Math.random() * 4),
          },
        });
      }
      for (const c of citizens.slice(0, 4)) {
        if (Math.random() < 0.35) continue;
        await prisma.engagementVote.upsert({
          where: {
            targetType_targetId_voterKey: {
              targetType: "comment",
              targetId: parent.id,
              voterKey: c.phoneHash,
            },
          },
          update: { value: 1 },
          create: {
            targetType: "comment",
            targetId: parent.id,
            voterKey: c.phoneHash,
            value: Math.random() < 0.85 ? 1 : -1,
          },
        });
      }
    }
    return top;
  }

  for (const memeId of memeIds) {
    const n = await seedThread("meme", memeId, 2 + Math.floor(Math.random() * 2));
    await prisma.meme.update({
      where: { id: memeId },
      data: { commentCount: n },
    });
    for (const c of citizens.slice(0, 6)) {
      await prisma.engagementVote.upsert({
        where: {
          targetType_targetId_voterKey: {
            targetType: "meme",
            targetId: memeId,
            voterKey: c.phoneHash,
          },
        },
        update: {},
        create: {
          targetType: "meme",
          targetId: memeId,
          voterKey: c.phoneHash,
          value: Math.random() < 0.8 ? 1 : -1,
        },
      });
    }
  }

  const allReports = await prisma.citizenReport.findMany({ select: { id: true } });
  for (const r of allReports) {
    const n = await seedThread("report", r.id, 2);
    const ups = Math.floor(Math.random() * 20) + 2;
    const downs = Math.floor(Math.random() * 4);
    await prisma.citizenReport.update({
      where: { id: r.id },
      data: { commentCount: n, upvotes: ups, downvotes: downs },
    });
    for (const c of citizens.slice(0, 5)) {
      await prisma.engagementVote.upsert({
        where: {
          targetType_targetId_voterKey: {
            targetType: "report",
            targetId: r.id,
            voterKey: c.phoneHash,
          },
        },
        update: {},
        create: {
          targetType: "report",
          targetId: r.id,
          voterKey: c.phoneHash,
          value: Math.random() < 0.75 ? 1 : -1,
        },
      });
    }
  }

  const allDemands = await prisma.publicDemand.findMany();
  for (const d of allDemands) {
    const n = await seedThread("demand", d.id, 2);
    await prisma.publicDemand.update({
      where: { id: d.id },
      data: {
        commentCount: n,
        upvotes: d.supportCount,
        downvotes: Math.floor(Math.random() * 3),
      },
    });
  }

  for (const iss of issueDefs) {
    await seedThread("issue", iss.slug, 3);
  }

  const allNotices = await prisma.notice.findMany();
  for (const n of allNotices) {
    const comments = await seedThread("notice", n.id, 2);
    await prisma.notice.update({
      where: { id: n.id },
      data: {
        commentCount: comments,
        upvotes: Math.max(0, n.signatures - 1),
      },
    });
  }

  const allProposals = await prisma.proposal.findMany({ select: { id: true } });
  for (const p of allProposals) {
    await seedThread("proposal", p.id, 2);
  }

  const ec = await prisma.engagementComment.count();
  const ev = await prisma.engagementVote.count();
  console.log(`  ${ec} engagement comments, ${ev} engagement votes`);

  // --- Mongo feed / trends / discussions ---
  await connectMongo();
  await Promise.all([
    FeedPost.deleteMany({}),
    Discussion.deleteMany({}),
    Trend.deleteMany({}),
    Activity.deleteMany({}),
    PlatformStats.deleteMany({}),
  ]);

  const feedItems: {
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
    village?: string;
    town?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  }[] = [];

  for (const iss of issueDefs) {
    const a = pick(citizens);
    feedItems.push({
      type: "issue",
      title: iss.title,
      excerpt: iss.summary,
      href: `/issues/${iss.slug}`,
      meta: `${iss.category} · trending`,
      votes: 20 + Math.floor(Math.random() * 80),
      hot: true,
      tags: ["issue", iss.category.toLowerCase(), "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: iss.slug,
    });
  }
  for (const p of proposals) {
    const a = pick(citizens);
    feedItems.push({
      type: "proposal",
      title: p.title,
      excerpt: p.description,
      href: `/vote/${p.id}`,
      meta: "Open vote · live",
      votes: 15 + Math.floor(Math.random() * 60),
      hot: Math.random() > 0.3,
      tags: ["vote", "proposal", "janark"],
      author: a.label,
      authorAnonId: a.anonId,
      refId: p.id,
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
      votes: 8 + Math.floor(Math.random() * 40),
      hot: Math.random() > 0.4,
      tags: [r.type, r.locationLevel, "janark", r.state.toLowerCase()],
      author: a.label,
      authorAnonId: a.anonId,
      refId: id,
      mediaUrl: media.url,
      mediaType: media.type,
      locationLevel: r.locationLevel,
      village: r.village,
      town: r.town,
      city: r.city,
      district: r.district,
      state: r.state,
      country: "India",
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
      votes: 25 + Math.floor(Math.random() * 70),
      hot: true,
      tags: ["demand", d.category, "janark", d.state.toLowerCase()],
      author: a.label,
      authorAnonId: a.anonId,
      refId: id,
      locationLevel: d.locationLevel,
      city: d.city,
      district: d.district,
      state: d.state,
      country: "India",
    });
  }
  for (let i = 0; i < memeIds.length; i++) {
    const m = memeDefs[i]!;
    const id = memeIds[i]!;
    const a = pick(citizens);
    const imageUrl = MEME_IMAGES[i % MEME_IMAGES.length]!;
    const mediaType = imageUrl.endsWith(".mp4")
      ? "video"
      : imageUrl.includes("giphy")
        ? "gif"
        : "image";
    feedItems.push({
      type: "meme",
      title: m.title,
      excerpt: m.caption,
      href: `/memes/${id}`,
      meta: m.tags.map((t) => `#${t}`).join(" "),
      votes: 10 + Math.floor(Math.random() * 90),
      hot: true,
      tags: ["meme", ...m.tags],
      author: a.label,
      authorAnonId: a.anonId,
      refId: id,
      mediaUrl: imageUrl,
      mediaType,
    });
  }

  // Free-form discussions on the square
  const freeTalk = [
    {
      title: "What should be on the national signal this week?",
      body: "Water, jobs, school meals — vote with your feet (and hashtags).",
      tags: ["discussion", "janark", "signal"],
      locationLevel: "state",
      state: "Maharashtra",
      country: "India",
    },
    {
      title: "Share one local win from your ward",
      body: "Small fixes count. Evidence posts welcome.",
      tags: ["discussion", "local", "janark"],
      locationLevel: "city",
      city: "Pune",
      district: "Pune",
      state: "Maharashtra",
      country: "India",
    },
    {
      title: "Hashtag etiquette for reports",
      body: "Use place + topic tags so others can find you. Stay anonymous.",
      tags: ["discussion", "howto", "janark"],
      locationLevel: "city",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
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
      meta: "Open discussion · demo",
      votes: 5 + Math.floor(Math.random() * 30),
      hot: true,
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
      upvotes: Math.floor(Math.random() * 10),
      voters: [],
      mediaUrl: media.url,
      mediaType: media.type,
    });
  }

  for (const item of feedItems) {
    await FeedPost.create({
      ...item,
      createdAt: daysAgo(Math.floor(Math.random() * 14)),
    });
  }

  for (const iss of issueDefs) {
    for (let i = 0; i < 2; i++) {
      const a = pick(citizens);
      await Discussion.create({
        issueSlug: iss.slug,
        author: a.label,
        authorAnonId: a.anonId,
        authorHash: a.phoneHash,
        body: pick([
          "Adding a field note from our block.",
          "Neutral on timeline; support the transparency ask.",
          "News: similar demand raised in the neighbouring district.",
        ]),
        kind: pick(["opinion", "evidence", "news"]),
        upvotes: Math.floor(Math.random() * 8),
        voters: [],
      });
    }
  }

  const trendTerms = [
    { term: "#janark", score: 42, category: "platform" },
    { term: "#water", score: 28, category: "infrastructure" },
    { term: "#education", score: 24, category: "education" },
    { term: "#women", score: 21, category: "women" },
    { term: "#jobs", score: 19, category: "employment" },
    { term: "Maharashtra", score: 33, category: "state" },
    { term: "Public demand", score: 27, category: "demand" },
    { term: "#transport", score: 16, category: "transport" },
  ];
  for (const t of trendTerms) {
    await Trend.create(t);
  }

  await Activity.create([
    {
      kind: "meme",
      summary: "Demo memes posted for UI validation",
      href: "/memes",
    },
    {
      kind: "proposal",
      summary: "Demo votes opened on midday meals & night buses",
      href: "/vote/midday-meal-audit",
    },
    {
      kind: "issue",
      summary: "Demo reports and demands seeded across states",
      href: "/explore",
    },
  ]);

  const stats = await getLiveRoughCounts();
  await PlatformStats.create({
    key: "global",
    citizens: stats.citizens,
    activeProposals: stats.proposals,
    votes: stats.votes,
    notices: stats.notices,
  });

  console.log(`  ${feedItems.length + freeTalk.length} feed posts`);
  console.log(`  ${trendTerms.length} trends`);
  console.log("Demo seed complete.");
  console.log("Open http://localhost:3000 — trending, memes, demands, reports, votes, profiles.");
}

async function getLiveRoughCounts() {
  const [citizens, proposals, votes, notices] = await Promise.all([
    prisma.phoneIdentity.count(),
    prisma.proposal.count(),
    prisma.vote.count(),
    prisma.notice.count(),
  ]);
  return { citizens, proposals, votes, notices };
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
