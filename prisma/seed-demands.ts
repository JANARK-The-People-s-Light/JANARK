import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const filePath = dbUrl.startsWith("file:") ? dbUrl.replace(/^file:/, "") : dbUrl;
const resolved = path.isAbsolute(filePath)
  ? filePath
  : path.join(process.cwd(), filePath);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: resolved }),
});

async function main() {
  const samples = [
    {
      title: "Publish a national exam-security & re-exam calendar",
      ask: "Publish fixed exam-security protocols and any re-exam calendar within a stated deadline.",
      body: "Students need certainty after repeated entrance-test controversies. Process credibility — not party politics.",
      target: "government",
      targetDetail: "Ministry of Education / NTA",
      category: "education",
      status: "gathering",
      locationLevel: "national",
      country: "India",
      authorLabel: "Anonymous citizen",
      supportCount: 0,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    },
    {
      title: "Weekly PHC medicine stock on a public dashboard",
      ask: "Every district to post essential-medicine availability for primary clinics every Monday.",
      body: "Primary care fails when shelves are empty. A live stock board lets citizens verify delivery.",
      target: "state",
      targetDetail: "State health department",
      category: "healthcare",
      status: "gathering",
      locationLevel: "state",
      state: "Maharashtra",
      country: "India",
      authorLabel: "Anonymous citizen",
      supportCount: 0,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    },
    {
      title: "Scientific processing for legacy dump sites",
      ask: "Publish a time-bound plan to process legacy waste — not only cover it.",
      body: "Collection rose, but dump mountains and leachate remain a health hazard under updated solid-waste rules.",
      target: "district",
      targetDetail: "Municipal corporation",
      category: "environment",
      status: "gathering",
      locationLevel: "city",
      city: "Delhi",
      district: "East Delhi",
      state: "Delhi",
      country: "India",
      authorLabel: "Anonymous citizen",
      supportCount: 0,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    },
  ];

  for (const s of samples) {
    const exists = await prisma.publicDemand.findFirst({
      where: { title: s.title },
    });
    if (!exists) await prisma.publicDemand.create({ data: s });
  }
  console.log("Public demands seeded (0 supports)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
