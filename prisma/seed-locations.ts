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
  const extras = [
    {
      type: "problem",
      title: "Incomplete footpaths force pedestrians into traffic",
      body: "Major corridor near college has broken footpath stretches. Walkability is basic infrastructure.",
      locationLevel: "city",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
      country: "India",
      authorLabel: "Anonymous citizen",
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    },
    {
      type: "issue",
      title: "Weekly market waste left for days",
      body: "Segregation and collection schedule missing after market day. Align with updated waste rules.",
      locationLevel: "town",
      town: "Chikmagalur",
      district: "Chikkamagaluru",
      state: "Karnataka",
      country: "India",
      authorLabel: "Anonymous citizen",
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    },
    {
      type: "problem",
      title: "Government school — long-pending teacher vacancy",
      body: "Subject posts vacant for a full year. Publish recruitment timeline school-wise.",
      locationLevel: "town",
      town: "Sitapur",
      district: "Sitapur",
      state: "Uttar Pradesh",
      country: "India",
      authorLabel: "Anonymous citizen",
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    },
  ];

  for (const s of extras) {
    const exists = await prisma.citizenReport.findFirst({
      where: { title: s.title },
    });
    if (!exists) await prisma.citizenReport.create({ data: s });
  }

  await prisma.proposal.updateMany({
    where: { locationLevel: null },
    data: { locationLevel: "national", country: "India" },
  });

  console.log("Location browse seed ready (0 upvotes)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
