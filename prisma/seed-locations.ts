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
      title: "Flooded underpass every monsoon",
      body: "City underpass near station floods within 20 minutes of rain. Traffic and safety risk.",
      locationLevel: "city",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
      country: "India",
      authorLabel: "Anonymous citizen",
      upvotes: 340,
    },
    {
      type: "issue",
      title: "Town market waste not collected",
      body: "Weekly market leaves rotting waste for days. Need fixed collection schedule.",
      locationLevel: "town",
      town: "Chikmagalur",
      district: "Chikkamagaluru",
      state: "Karnataka",
      country: "India",
      authorLabel: "Shopkeepers association",
      upvotes: 89,
    },
    {
      type: "crime",
      title: "Eve-teasing near city college gate",
      body: "Repeated harassment reports after evening classes. Request dedicated patrol.",
      locationLevel: "city",
      city: "Pune",
      district: "Pune",
      state: "Maharashtra",
      country: "India",
      authorLabel: "Anonymous citizen",
      upvotes: 156,
    },
  ];

  for (const s of extras) {
    const exists = await prisma.citizenReport.findFirst({
      where: { title: s.title },
    });
    if (!exists) await prisma.citizenReport.create({ data: s });
  }

  // Tag existing national proposals
  await prisma.proposal.updateMany({
    where: { locationLevel: null },
    data: { locationLevel: "national", country: "India" },
  });

  // One state-scoped vote example
  const stateVote = await prisma.proposal.findFirst({
    where: { id: "neet-security-overhaul" },
  });
  if (stateVote) {
    await prisma.proposal.update({
      where: { id: "neet-security-overhaul" },
      data: {
        locationLevel: "national",
        country: "India",
      },
    });
  }

  console.log("Location browse seed ready");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
